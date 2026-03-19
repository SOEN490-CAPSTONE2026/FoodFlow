import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
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
  imageFile: _imageFile,
  onReUpload,
  onCancel,
  onSubmitStart,
  onSubmitError,
}) {
  const navigate = useNavigate();
  const { userTimezone } = useTimezone();
  const autocompleteRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const stepMeta = [
    { id: 1, label: 'Product Information' },
    { id: 2, label: 'Quantity & Dates' },
    { id: 3, label: 'Pickup Information' },
    { id: 4, label: 'Description & Details' },
    { id: 5, label: 'Review & Submit' },
  ];

  /**
   * Map backend food categories to react-select format
   */
  function mapFoodCategories(categories) {
    if (!categories || categories.length === 0) {
      return [];
    }

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
    if (!score) {
      return null;
    }

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

      // Extract country from address components (full country name)
      const countryComponent = place.address_components?.find(component =>
        component.types.includes('country')
      );
      const country = countryComponent?.long_name || null;

      const location = {
        latitude: place.geometry?.location.lat() || '',
        longitude: place.geometry?.location.lng() || '',
        address: place.formatted_address || '',
        country: country,
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
    if (!date) {
      return '';
    }
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  const formatTime = date => {
    if (!date) {
      return '';
    }
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  const getOptionLabel = (options, value) => {
    if (!value) {
      return 'Not set';
    }
    return options.find(opt => opt.value === value)?.label || value;
  };

  const formatDateDisplay = date => {
    if (!date) {
      return 'Not set';
    }
    const dateObj = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return 'Not set';
    }
    return dateObj.toISOString().split('T')[0];
  };

  const formatTimeDisplay = date => {
    if (!date) {
      return '--:--';
    }
    const dateObj = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return '--:--';
    }
    return dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getPickupWindowHours = () => {
    const slot = pickupSlots[0];
    if (!slot?.startTime || !slot?.endTime) {
      return null;
    }
    const start = new Date(slot.startTime).getTime();
    const end = new Date(slot.endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return null;
    }
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  };

  const productComplete =
    Boolean(formData.title.trim()) &&
    formData.foodCategories.length > 0 &&
    Boolean(formData.temperatureCategory) &&
    Boolean(formData.packagingType);

  const quantityComplete =
    Boolean(formData.quantityValue) &&
    parseFloat(formData.quantityValue) > 0 &&
    Boolean(formData.quantityUnit) &&
    Boolean(formData.expiryDate || expirySuggestion.suggestedExpiryDate);

  const pickupComplete =
    Boolean(pickupSlots[0]?.pickupDate) &&
    Boolean(pickupSlots[0]?.startTime) &&
    Boolean(pickupSlots[0]?.endTime) &&
    Boolean(formData.pickupLocation.address?.trim());

  const detailsComplete = Boolean(formData.description.trim());

  const stepCompletion = {
    1: productComplete,
    2: quantityComplete,
    3: pickupComplete,
    4: detailsComplete,
    5: productComplete && quantityComplete && pickupComplete && detailsComplete,
  };

  const maxUnlockedStep = [1, 2, 3, 4, 5].reduce((unlocked, step) => {
    if (step === 1) {
      return unlocked;
    }
    const previousStepComplete = stepCompletion[step - 1];
    return previousStepComplete ? Math.max(unlocked, step) : unlocked;
  }, 1);

  const progressPercent = Math.min(currentStep * 20, 100);

  const goNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, maxUnlockedStep));
  };

  const goPrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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

    onSubmitStart?.();
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
      onSubmitError?.();
      toast.error(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ai-extraction-review ai-review-shell">
      <div className="ai-review-topbar">
        <div>
          <h3>Create Donation with AI</h3>
          <p>Upload a label photo to automatically extract product details</p>
        </div>
        <button
          className="ai-review-reupload"
          onClick={onReUpload}
          type="button"
        >
          Re-upload Image
        </button>
      </div>

      <div className="ai-review-progress-panel">
        <div className="ai-review-progress-header">
          <span>Step {currentStep} of 5</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="ai-review-progress-track">
          <div
            className="ai-review-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="ai-review-step-tabs">
          {stepMeta.map(step => {
            const isActive = currentStep === step.id;
            const isCompleted =
              step.id < currentStep || stepCompletion[step.id];
            const isClickable = step.id <= maxUnlockedStep;
            return (
              <button
                key={step.id}
                type="button"
                className={`ai-review-step-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => isClickable && setCurrentStep(step.id)}
                disabled={!isClickable}
              >
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="review-form ai-review-form">
        {currentStep === 1 && (
          <section className="ai-review-card">
            <div className="ai-review-card-head">
              <div>
                <h4>Product Information</h4>
                <p>Basic details about your food item</p>
              </div>
              <div className="ai-review-fields-pill">4 fields</div>
            </div>

            <div className="form-field">
              <label className="field-label">
                Product Name *
                {wasAIPopulated('foodName') && (
                  <>
                    <span className="ai-badge-inline">AI-Generated</span>
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
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Category *
                {wasAIPopulated('foodCategories') && (
                  <>
                    <span className="ai-badge-inline">AI-Generated</span>
                    {getConfidenceBadge('foodCategories')}
                  </>
                )}
              </label>
              <Select
                isMulti
                options={foodTypeOptions}
                value={formData.foodCategories}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    foodCategories: selected || [],
                  }))
                }
                classNamePrefix="react-select"
                placeholder="Select category"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field half-width">
                <label className="field-label">
                  Storage Temperature *
                  {wasAIPopulated('temperatureCategory') && (
                    <>
                      <span className="ai-badge-inline">AI-Generated</span>
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
                      temperatureCategory: selected?.value || '',
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
                      <span className="ai-badge-inline">AI-Generated</span>
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
                      packagingType: selected?.value || '',
                    }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select packaging"
                  required
                />
              </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="ai-review-card">
            <div className="ai-review-card-head">
              <div>
                <h4>Quantity & Dates</h4>
                <p>Specify amounts and important dates</p>
              </div>
              <div className="ai-review-fields-pill">5 fields</div>
            </div>

            <div className="form-row">
              <div className="form-field half-width">
                <label className="field-label">
                  Quantity *
                  {wasAIPopulated('quantity') && (
                    <>
                      <span className="ai-badge-inline">AI-Generated</span>
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
                <label className="field-label">Unit of Measurement *</label>
                <Select
                  options={unitOptions}
                  value={unitOptions.find(
                    opt => opt.value === formData.quantityUnit
                  )}
                  onChange={selected =>
                    setFormData(prev => ({
                      ...prev,
                      quantityUnit: selected?.value || '',
                    }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select unit"
                  required
                />
              </div>
            </div>

            <div className="ai-review-total-row">
              <span>Total Donation Amount</span>
              <strong>
                {formData.quantityValue || 0}{' '}
                {getOptionLabel(
                  unitOptions,
                  formData.quantityUnit
                ).toLowerCase()}
              </strong>
            </div>

            <div className="form-row">
              <div className="form-field half-width">
                <label className="field-label">
                  Manufacturing Date
                  {wasAIPopulated('fabricationDate') && (
                    <>
                      <span className="ai-badge-inline">AI-Generated</span>
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
                  placeholderText="Select manufacturing date"
                />
              </div>

              <div className="form-field half-width">
                <label className="field-label">
                  Expiration Date *
                  {wasAIPopulated('expiryDate') && (
                    <>
                      <span className="ai-badge-inline">AI-Generated</span>
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
                  placeholderText="Select expiration date"
                  required
                />
                {!expiryTouched && expirySuggestion.suggestedExpiryDate && (
                  <p className="field-help-text">
                    Suggested expiry date:{' '}
                    {expirySuggestion.suggestedExpiryDate}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="ai-review-card">
            <div className="ai-review-card-head">
              <div>
                <h4>Pickup Information</h4>
                <p>When and where to collect the donation</p>
              </div>
              <div className="ai-review-fields-pill">4 fields</div>
            </div>

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

            <div className="ai-review-window-row">
              <span>Pickup Window</span>
              <strong>
                {formatTimeDisplay(pickupSlots[0].startTime)} -{' '}
                {formatTimeDisplay(pickupSlots[0].endTime)}
                {getPickupWindowHours()
                  ? ` (${getPickupWindowHours()} hours)`
                  : ''}
              </strong>
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
              <p className="field-help-text">
                This address will be shared with the recipient organization.
              </p>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="ai-review-card">
            <div className="ai-review-card-head">
              <div>
                <h4>Description & Allergens</h4>
                <p>Additional product details and safety information</p>
              </div>
              <div className="ai-review-fields-pill">2 fields</div>
            </div>

            <div className="form-field">
              <label className="field-label">
                Product Description *
                {wasAIPopulated('description') && (
                  <>
                    <span className="ai-badge-inline">AI-Generated</span>
                    {getConfidenceBadge('description')}
                  </>
                )}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field textarea"
                placeholder="Provide a detailed description of the product"
                rows="5"
                required
              />
            </div>

            {data.allergens && data.allergens.length > 0 && (
              <div className="allergen-info ai-allergen-card">
                <h5>Allergen Information</h5>
                <p>Contains {data.allergens.length} allergens</p>
                <div className="allergen-tags">
                  {data.allergens.map((allergen, index) => (
                    <span key={index} className="allergen-tag">
                      {allergen}
                    </span>
                  ))}
                </div>
                <p className="allergen-note">
                  Important: Please verify all allergens are listed in the
                  description above.
                </p>
              </div>
            )}
          </section>
        )}

        {currentStep === 5 && (
          <section className="ai-review-card ai-review-final-card">
            <div className="ai-review-ready-banner">
              <span className="ai-review-ready-check">OK</span>
              <div>
                <h4>Ready to Submit!</h4>
                <p>
                  You have completed all sections. Please review the summary
                  below before submitting your donation.
                </p>
              </div>
            </div>

            <div className="ai-review-summary-grid">
              <article className="ai-review-summary-item">
                <header>
                  <h5>Product Information</h5>
                  <button type="button" onClick={() => setCurrentStep(1)}>
                    Edit
                  </button>
                </header>
                <p>Name: {formData.title || 'Not set'}</p>
                <p>
                  Category:{' '}
                  {formData.foodCategories.map(item => item.label).join(', ') ||
                    'Not set'}
                </p>
                <p>
                  Temperature:{' '}
                  {getOptionLabel(
                    temperatureCategoryOptions,
                    formData.temperatureCategory
                  )}
                </p>
                <p>
                  Packaging:{' '}
                  {getOptionLabel(packagingTypeOptions, formData.packagingType)}
                </p>
              </article>

              <article className="ai-review-summary-item">
                <header>
                  <h5>Quantity & Dates</h5>
                  <button type="button" onClick={() => setCurrentStep(2)}>
                    Edit
                  </button>
                </header>
                <p>
                  Amount: {formData.quantityValue || '0'}{' '}
                  {getOptionLabel(
                    unitOptions,
                    formData.quantityUnit
                  ).toLowerCase()}
                </p>
                <p>
                  Manufactured: {formatDateDisplay(formData.fabricationDate)}
                </p>
                <p>
                  Expires:{' '}
                  {formatDateDisplay(
                    formData.expiryDate || expirySuggestion.suggestedExpiryDate
                  )}
                </p>
              </article>

              <article className="ai-review-summary-item">
                <header>
                  <h5>Pickup Information</h5>
                  <button type="button" onClick={() => setCurrentStep(3)}>
                    Edit
                  </button>
                </header>
                <p>Date: {formatDateDisplay(pickupSlots[0]?.pickupDate)}</p>
                <p>
                  Time: {formatTimeDisplay(pickupSlots[0]?.startTime)} -{' '}
                  {formatTimeDisplay(pickupSlots[0]?.endTime)}
                </p>
                <p>Location: {formData.pickupLocation.address || 'Not set'}</p>
              </article>

              <article className="ai-review-summary-item">
                <header>
                  <h5>Details & Safety</h5>
                  <button type="button" onClick={() => setCurrentStep(4)}>
                    Edit
                  </button>
                </header>
                <p>{formData.description || 'No description provided.'}</p>
                {data.allergens?.length > 0 && (
                  <p>Allergens: {data.allergens.join(', ')}</p>
                )}
              </article>
            </div>
          </section>
        )}

        <div className="form-actions ai-review-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={currentStep === 1 ? onCancel : goPrevious}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              className="btn-submit"
              onClick={goNext}
              disabled={
                currentStep >= maxUnlockedStep && !stepCompletion[currentStep]
              }
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Donation...' : 'Submit Donation'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

AIExtractionReview.propTypes = {
  data: PropTypes.shape({
    foodName: PropTypes.string,
    quantityValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    quantityUnit: PropTypes.string,
    foodCategories: PropTypes.arrayOf(PropTypes.string),
    fabricationDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    expiryDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    description: PropTypes.string,
    temperatureCategory: PropTypes.string,
    packagingType: PropTypes.string,
    confidenceScores: PropTypes.objectOf(PropTypes.number),
    allergens: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  imageFile: PropTypes.any,
  onReUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmitStart: PropTypes.func,
  onSubmitError: PropTypes.func,
};
