import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Autocomplete } from '@react-google-maps/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { surplusAPI } from '../../services/api';
import {
  foodTypeOptions,
  mapFoodTypeToLegacyCategory,
  mapLegacyCategoryToFoodType,
  unitOptions,
  temperatureCategoryOptions,
  packagingTypeOptions,
} from '../../constants/foodConstants';
import { computeSuggestedExpiry } from '../../utils/expiryRules';
import { useTimezone } from '../../contexts/TimezoneContext';
import './Donor_Styles/AIDonation.css';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * Component to review and edit AI-extracted donation data before submission
 */
export default function AIExtractionReview({
  data,
  imageFile,
  onReUpload,
  onCancel,
}) {
  const navigate = useNavigate();
  const { userTimezone } = useTimezone();
  const autocompleteRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);

  // Parse AI-extracted data into form state
  const [formData, setFormData] = useState({
    title: data.foodName || '',
    quantityValue: data.quantityValue?.toString() || '',
    quantityUnit: data.quantityUnit || 'KILOGRAM',
    foodCategories: mapFoodCategories(data.foodCategories),
    fabricationDate: data.fabricationDate ? new Date(data.fabricationDate) : '',
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : '',
    pickupLocation: { latitude: '', longitude: '', address: '' },
    description: data.description || '',
    temperatureCategory: data.temperatureCategory || '',
    packagingType: data.packagingType || '',
  });

  const selectedFoodType = formData.foodCategories?.[0]?.value || '';
  const expirySuggestion = useMemo(
    () =>
      computeSuggestedExpiry({
        foodType: selectedFoodType,
        temperatureCategory: formData.temperatureCategory,
        packagingType: formData.packagingType,
        fabricationDate: formData.fabricationDate,
      }),
    [
      selectedFoodType,
      formData.temperatureCategory,
      formData.packagingType,
      formData.fabricationDate,
    ]
  );

  useEffect(() => {
    if (
      expiryTouched ||
      formData.expiryDate ||
      !expirySuggestion.suggestedExpiryDate
    ) {
      return;
    }
    const suggestedDate = new Date(expirySuggestion.suggestedExpiryDate);
    if (!Number.isNaN(suggestedDate.getTime())) {
      setFormData(prev => ({ ...prev, expiryDate: suggestedDate }));
    }
  }, [
    expirySuggestion.suggestedExpiryDate,
    expiryTouched,
    formData.expiryDate,
  ]);

  const [pickupSlots, setPickupSlots] = useState([
    {
      pickupDate: '',
      startTime: '',
      endTime: '',
      notes: '',
    },
  ]);

  /**
   * Map backend food categories to react-select format
   */
  function mapFoodCategories(categories) {
    if (!categories || categories.length === 0) return [];

    return categories.map(cat => {
      const option = foodTypeOptions.find(
        opt => opt.value === mapLegacyCategoryToFoodType(cat)
      );
      return option || { value: cat, label: cat };
    });
  }

  /**
   * Get confidence level badge
   */
  const getConfidenceBadge = fieldName => {
    const score = data.confidenceScores?.[fieldName];
    if (!score) return null;

    let level, color, icon;
    if (score >= 0.8) {
      level = 'HIGH';
      color = '#10b981';
      icon = '✓';
    } else if (score >= 0.5) {
      level = 'MEDIUM';
      color = '#f59e0b';
      icon = '⚠';
    } else {
      level = 'LOW';
      color = '#ef4444';
      icon = '!';
    }

    return (
      <span className="confidence-badge" style={{ backgroundColor: color }}>
        <span className="confidence-icon">{icon}</span>
        {level} ({Math.round(score * 100)}%)
      </span>
    );
  };

  /**
   * Check if field was AI-populated
   */
  const wasAIPopulated = fieldName => {
    return (
      data.confidenceScores &&
      Object.prototype.hasOwnProperty.call(data.confidenceScores, fieldName)
    );
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onLoadAutocomplete = autocomplete => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const location = {
        latitude: place.geometry?.location?.lat() || '',
        longitude: place.geometry?.location?.lng() || '',
        address: place.formatted_address || place.name || '',
      };
      setFormData(prev => ({ ...prev, pickupLocation: location }));
    }
  };

  const updatePickupSlot = (index, field, value) => {
    const updatedSlots = [...pickupSlots];
    updatedSlots[index][field] = value;
    setPickupSlots(updatedSlots);
  };

  const formatDate = date => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return '';
    }
  };

  const formatTime = date => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', date, error);
      return '';
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a food name/title');
      return false;
    }

    if (formData.foodCategories.length === 0) {
      toast.error('Please select at least one food category');
      return false;
    }

    if (!formData.temperatureCategory) {
      toast.error('Please select a temperature category');
      return false;
    }

    if (!formData.packagingType) {
      toast.error('Please select a packaging type');
      return false;
    }

    if (!formData.quantityValue || parseFloat(formData.quantityValue) <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }

    if (!formData.expiryDate && !expirySuggestion.suggestedExpiryDate) {
      toast.error('Please enter an expiry date');
      return false;
    }

    if (
      !pickupSlots[0].pickupDate ||
      !pickupSlots[0].startTime ||
      !pickupSlots[0].endTime
    ) {
      toast.error('Please fill in pickup date and time');
      return false;
    }

    if (!formData.pickupLocation.address.trim()) {
      toast.error('Please enter a pickup location');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedSlots = pickupSlots.map(slot => ({
        pickupDate: formatDate(slot.pickupDate),
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
        notes: slot.notes || null,
      }));

      const expiryDateToSubmit = formData.expiryDate
        ? formatDate(formData.expiryDate)
        : expirySuggestion.suggestedExpiryDate;

      const submissionData = {
        title: formData.title,
        quantity: {
          value: parseFloat(formData.quantityValue),
          unit: formData.quantityUnit,
        },
        foodCategories: formData.foodCategories.map(fc =>
          mapFoodTypeToLegacyCategory(fc.value)
        ),
        foodType: formData.foodCategories[0]?.value || null,
        dietaryTags: [],
        fabricationDate: formatDate(formData.fabricationDate) || null,
        expiryDate: expiryDateToSubmit,
        pickupSlots: formattedSlots,
        pickupDate: formattedSlots[0].pickupDate,
        pickupFrom: formattedSlots[0].startTime,
        pickupTo: formattedSlots[0].endTime,
        pickupLocation: formData.pickupLocation,
        description: formData.description,
        temperatureCategory: formData.temperatureCategory,
        packagingType: formData.packagingType,
        donorTimezone: userTimezone || 'UTC',
        isAiAssisted: true, // Flag to track AI-created donations
      };

      const response = await surplusAPI.create(submissionData);
      const createdPostId = response?.data?.id || 'unknown';

      toast.success(`Donation created successfully! ID: ${createdPostId}`);

      setTimeout(() => {
        navigate('/donor/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error creating donation:', err);
      toast.error(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ai-extraction-review">
      {/* Header with image preview */}
      <div className="review-header">
        <div className="header-content">
          <h3>Review AI-Extracted Information</h3>
          <p className="header-subtitle">
            Please verify and complete the fields below. Fields marked with{' '}
            <span className="ai-badge-inline">AI</span> were auto-filled.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-reupload" onClick={onReUpload} type="button">
            📸 Re-upload Image
          </button>
        </div>
      </div>

      {/* Image preview thumbnail */}
      {imageFile && (
        <div className="image-thumbnail">
          <img src={URL.createObjectURL(imageFile)} alt="Uploaded label" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="review-form">
        {/* Basic Information */}
        <div className="form-section">
          <h4 className="section-title">📝 Basic Information</h4>

          <div className="form-field">
            <label className="field-label">
              Food Name *
              {wasAIPopulated('foodName') && (
                <>
                  <span className="ai-badge-inline">AI</span>
                  {getConfidenceBadge('foodName')}
                </>
              )}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter food name"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              Food Categories *
              {wasAIPopulated('foodCategories') && (
                <>
                  <span className="ai-badge-inline">AI</span>
                  {getConfidenceBadge('foodCategories')}
                </>
              )}
            </label>
            <Select
              isMulti
              options={foodTypeOptions}
              value={formData.foodCategories}
              onChange={selected =>
                setFormData(prev => ({ ...prev, foodCategories: selected }))
              }
              classNamePrefix="react-select"
              placeholder="Select food categories"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                Temperature Category *
                {wasAIPopulated('temperatureCategory') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('temperatureCategory')}
                  </>
                )}
              </label>
              <Select
                options={temperatureCategoryOptions}
                value={temperatureCategoryOptions.find(
                  opt => opt.value === formData.temperatureCategory
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    temperatureCategory: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder="Select temperature"
                required
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">
                Packaging Type *
                {wasAIPopulated('packagingType') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('packagingType')}
                  </>
                )}
              </label>
              <Select
                options={packagingTypeOptions}
                value={packagingTypeOptions.find(
                  opt => opt.value === formData.packagingType
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    packagingType: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder="Select packaging"
                required
              />
            </div>
          </div>
        </div>

        {/* Quantity & Dates */}
        <div className="form-section">
          <h4 className="section-title">📊 Quantity & Dates</h4>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                Quantity *
                {wasAIPopulated('quantity') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('quantity')}
                  </>
                )}
              </label>
              <input
                type="number"
                name="quantityValue"
                value={formData.quantityValue}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter quantity"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">Unit *</label>
              <Select
                options={unitOptions}
                value={unitOptions.find(
                  opt => opt.value === formData.quantityUnit
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    quantityUnit: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder="Select unit"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                Fabrication Date
                {wasAIPopulated('fabricationDate') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('fabricationDate')}
                  </>
                )}
              </label>
              <DatePicker
                selected={formData.fabricationDate}
                onChange={date =>
                  setFormData(prev => ({ ...prev, fabricationDate: date }))
                }
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText="Select fabrication date"
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">
                Expiry Date *
                {wasAIPopulated('expiryDate') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('expiryDate')}
                  </>
                )}
              </label>
              <DatePicker
                selected={formData.expiryDate}
                onChange={date => {
                  setExpiryTouched(true);
                  setFormData(prev => ({ ...prev, expiryDate: date }));
                }}
                minDate={formData.fabricationDate || new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText="Select expiry date"
                required
              />
              {!expiryTouched && expirySuggestion.suggestedExpiryDate && (
                <p className="field-help-text">
                  Suggested expiry: {expirySuggestion.suggestedExpiryDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="form-section">
          <h4 className="section-title">📍 Pickup Information</h4>

          <div className="form-row">
            <div className="form-field third-width">
              <label className="field-label">Pickup Date *</label>
              <DatePicker
                selected={pickupSlots[0].pickupDate}
                onChange={date => updatePickupSlot(0, 'pickupDate', date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText="Select date"
                required
              />
            </div>

            <div className="form-field third-width">
              <label className="field-label">Start Time *</label>
              <DatePicker
                selected={pickupSlots[0].startTime}
                onChange={date => updatePickupSlot(0, 'startTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="input-field"
                placeholderText="Start time"
                required
              />
            </div>

            <div className="form-field third-width">
              <label className="field-label">End Time *</label>
              <DatePicker
                selected={pickupSlots[0].endTime}
                onChange={date => updatePickupSlot(0, 'endTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="input-field"
                placeholderText="End time"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Pickup Location *</label>
            <Autocomplete
              onLoad={onLoadAutocomplete}
              onPlaceChanged={onPlaceChanged}
            >
              <input
                type="text"
                value={formData.pickupLocation.address}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    pickupLocation: {
                      ...prev.pickupLocation,
                      address: e.target.value,
                    },
                  }))
                }
                className="input-field"
                placeholder="Enter pickup address"
                required
              />
            </Autocomplete>
          </div>
        </div>

        {/* Description & Additional Info */}
        <div className="form-section">
          <h4 className="section-title">📄 Description</h4>

          <div className="form-field">
            <label className="field-label">
              Description *
              {wasAIPopulated('description') && (
                <>
                  <span className="ai-badge-inline">AI</span>
                  {getConfidenceBadge('description')}
                </>
              )}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field textarea"
              placeholder="Provide additional details about the food"
              rows="4"
              required
            />
          </div>

          {/* Show allergens if detected */}
          {data.allergens && data.allergens.length > 0 && (
            <div className="allergen-info">
              <h5>⚠️ Detected Allergens:</h5>
              <div className="allergen-tags">
                {data.allergens.map((allergen, index) => (
                  <span key={index} className="allergen-tag">
                    {allergen}
                  </span>
                ))}
              </div>
              <p className="allergen-note">
                Please verify and include allergen information in the
                description
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Donation...' : 'Create Donation →'}
          </button>
        </div>
      </form>
    </div>
  );
}
