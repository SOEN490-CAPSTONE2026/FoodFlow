import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Autocomplete } from '@react-google-maps/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { surplusAPI } from '../../services/api';
import {
  getTranslatedFoodTypeOptions,
  getTranslatedPackagingTypeOptions,
  getTranslatedTemperatureCategoryOptions,
  getTranslatedUnitOptions,
  mapFoodTypeToLegacyCategory,
  mapLegacyCategoryToFoodType,
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
  const { t } = useTranslation();
  const { userTimezone } = useTimezone();
  const autocompleteRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const translatedFoodTypeOptions = useMemo(
    () => getTranslatedFoodTypeOptions(t),
    [t]
  );
  const translatedUnitOptions = useMemo(() => getTranslatedUnitOptions(t), [t]);
  const translatedTemperatureCategoryOptions = useMemo(
    () => getTranslatedTemperatureCategoryOptions(t),
    [t]
  );
  const translatedPackagingTypeOptions = useMemo(
    () => getTranslatedPackagingTypeOptions(t),
    [t]
  );

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
      const option = translatedFoodTypeOptions.find(
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
      level = t('aiExtractionReview.confidence.high', {
        defaultValue: 'HIGH',
      });
      color = '#10b981';
      icon = '✓';
    } else if (score >= 0.5) {
      level = t('aiExtractionReview.confidence.medium', {
        defaultValue: 'MEDIUM',
      });
      color = '#f59e0b';
      icon = '⚠';
    } else {
      level = t('aiExtractionReview.confidence.low', {
        defaultValue: 'LOW',
      });
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
      toast.error(
        t('aiExtractionReview.validation.foodTitleRequired', {
          defaultValue: 'Please enter a food name/title',
        })
      );
      return false;
    }

    if (formData.foodCategories.length === 0) {
      toast.error(
        t('aiExtractionReview.validation.foodCategoryRequired', {
          defaultValue: 'Please select at least one food category',
        })
      );
      return false;
    }

    if (!formData.temperatureCategory) {
      toast.error(
        t('aiExtractionReview.validation.temperatureCategoryRequired', {
          defaultValue: 'Please select a temperature category',
        })
      );
      return false;
    }

    if (!formData.packagingType) {
      toast.error(
        t('aiExtractionReview.validation.packagingTypeRequired', {
          defaultValue: 'Please select a packaging type',
        })
      );
      return false;
    }

    if (!formData.quantityValue || parseFloat(formData.quantityValue) <= 0) {
      toast.error(
        t('aiExtractionReview.validation.quantityRequired', {
          defaultValue: 'Please enter a valid quantity',
        })
      );
      return false;
    }

    if (!formData.expiryDate && !expirySuggestion.suggestedExpiryDate) {
      toast.error(
        t('aiExtractionReview.validation.expiryDateRequired', {
          defaultValue: 'Please enter an expiry date',
        })
      );
      return false;
    }

    if (
      !pickupSlots[0].pickupDate ||
      !pickupSlots[0].startTime ||
      !pickupSlots[0].endTime
    ) {
      toast.error(
        t('aiExtractionReview.validation.pickupDateTimeRequired', {
          defaultValue: 'Please fill in pickup date and time',
        })
      );
      return false;
    }

    if (!formData.pickupLocation.address.trim()) {
      toast.error(
        t('aiExtractionReview.validation.pickupLocationRequired', {
          defaultValue: 'Please enter a pickup location',
        })
      );
      return false;
    }

    if (!formData.description.trim()) {
      toast.error(
        t('aiExtractionReview.validation.descriptionRequired', {
          defaultValue: 'Please enter a description',
        })
      );
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
      const createdPostId =
        response?.data?.id ||
        t('aiExtractionReview.unknownId', {
          defaultValue: 'unknown',
        });

      toast.success(
        t('aiExtractionReview.successCreated', {
          defaultValue: 'Donation created successfully! ID: {{id}}',
          id: createdPostId,
        })
      );

      setTimeout(() => {
        navigate('/donor/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error creating donation:', err);
      toast.error(
        err.response?.data?.message ||
          t('aiExtractionReview.failedToCreate', {
            defaultValue: 'Failed to create donation',
          })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ai-extraction-review">
      {/* Header with image preview */}
      <div className="review-header">
        <div className="header-content">
          <h3>
            {t('aiExtractionReview.title', {
              defaultValue: 'Review AI-Extracted Information',
            })}
          </h3>
          <p className="header-subtitle">
            {t('aiExtractionReview.subtitle', {
              defaultValue:
                'Please verify and complete the fields below. Fields marked with',
            })}{' '}
            <span className="ai-badge-inline">AI</span>{' '}
            {t('aiExtractionReview.autoFilled', {
              defaultValue: 'were auto-filled.',
            })}
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-reupload" onClick={onReUpload} type="button">
            {t('aiExtractionReview.reUploadImage', {
              defaultValue: '📸 Re-upload Image',
            })}
          </button>
        </div>
      </div>

      {/* Image preview thumbnail */}
      {imageFile && (
        <div className="image-thumbnail">
          <img
            src={URL.createObjectURL(imageFile)}
            alt={t('aiExtractionReview.uploadedLabelAlt', {
              defaultValue: 'Uploaded label',
            })}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="review-form">
        {/* Basic Information */}
        <div className="form-section">
          <h4 className="section-title">
            {t('aiExtractionReview.sections.basicInformation', {
              defaultValue: '📝 Basic Information',
            })}
          </h4>

          <div className="form-field">
            <label className="field-label">
              {t('aiExtractionReview.foodName', { defaultValue: 'Food Name' })}{' '}
              *
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
              placeholder={t('aiExtractionReview.enterFoodName', {
                defaultValue: 'Enter food name',
              })}
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('surplusForm.foodCategoriesLabel', {
                defaultValue: 'Food Categories',
              })}{' '}
              *
              {wasAIPopulated('foodCategories') && (
                <>
                  <span className="ai-badge-inline">AI</span>
                  {getConfidenceBadge('foodCategories')}
                </>
              )}
            </label>
            <Select
              isMulti
              options={translatedFoodTypeOptions}
              value={formData.foodCategories}
              onChange={selected =>
                setFormData(prev => ({ ...prev, foodCategories: selected }))
              }
              classNamePrefix="react-select"
              placeholder={t('surplusForm.foodCategoriesPlaceholder', {
                defaultValue: 'Select food categories',
              })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.temperatureCategoryLabel', {
                  defaultValue: 'Temperature Category',
                })}{' '}
                *
                {wasAIPopulated('temperatureCategory') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('temperatureCategory')}
                  </>
                )}
              </label>
              <Select
                options={translatedTemperatureCategoryOptions}
                value={translatedTemperatureCategoryOptions.find(
                  opt => opt.value === formData.temperatureCategory
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    temperatureCategory: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder={t('aiExtractionReview.selectTemperature', {
                  defaultValue: 'Select temperature',
                })}
                required
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.packagingTypeLabel', {
                  defaultValue: 'Packaging Type',
                })}{' '}
                *
                {wasAIPopulated('packagingType') && (
                  <>
                    <span className="ai-badge-inline">AI</span>
                    {getConfidenceBadge('packagingType')}
                  </>
                )}
              </label>
              <Select
                options={translatedPackagingTypeOptions}
                value={translatedPackagingTypeOptions.find(
                  opt => opt.value === formData.packagingType
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    packagingType: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder={t('aiExtractionReview.selectPackaging', {
                  defaultValue: 'Select packaging',
                })}
                required
              />
            </div>
          </div>
        </div>

        {/* Quantity & Dates */}
        <div className="form-section">
          <h4 className="section-title">
            {t('aiExtractionReview.sections.quantityDates', {
              defaultValue: '📊 Quantity & Dates',
            })}
          </h4>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.quantityLabel', { defaultValue: 'Quantity' })} *
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
                placeholder={t('aiExtractionReview.enterQuantity', {
                  defaultValue: 'Enter quantity',
                })}
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.unitLabel', { defaultValue: 'Unit' })} *
              </label>
              <Select
                options={translatedUnitOptions}
                value={translatedUnitOptions.find(
                  opt => opt.value === formData.quantityUnit
                )}
                onChange={selected =>
                  setFormData(prev => ({
                    ...prev,
                    quantityUnit: selected.value,
                  }))
                }
                classNamePrefix="react-select"
                placeholder={t('surplusForm.unitPlaceholder', {
                  defaultValue: 'Select unit',
                })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.fabricationDateLabel', {
                  defaultValue: 'Fabrication Date',
                })}
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
                placeholderText={t('surplusForm.fabricationDatePlaceholder', {
                  defaultValue: 'Select fabrication date',
                })}
              />
            </div>

            <div className="form-field half-width">
              <label className="field-label">
                {t('surplusForm.expiryDateLabel', {
                  defaultValue: 'Expiry Date',
                })}{' '}
                *
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
                placeholderText={t('surplusForm.expiryDatePlaceholder', {
                  defaultValue: 'Select expiry date',
                })}
                required
              />
              {!expiryTouched && expirySuggestion.suggestedExpiryDate && (
                <p className="field-help-text">
                  {t('surplusForm.expiryDateSuggestion', {
                    defaultValue:
                      'Suggested expiry: {{date}} (based on food category)',
                    date: expirySuggestion.suggestedExpiryDate,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="form-section">
          <h4 className="section-title">
            {t('aiExtractionReview.sections.pickupInformation', {
              defaultValue: '📍 Pickup Information',
            })}
          </h4>

          <div className="form-row">
            <div className="form-field third-width">
              <label className="field-label">
                {t('aiExtractionReview.pickupDate', {
                  defaultValue: 'Pickup Date',
                })}{' '}
                *
              </label>
              <DatePicker
                selected={pickupSlots[0].pickupDate}
                onChange={date => updatePickupSlot(0, 'pickupDate', date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText={t('surplusForm.datePlaceholder', {
                  defaultValue: 'Select date',
                })}
                required
              />
            </div>

            <div className="form-field third-width">
              <label className="field-label">
                {t('surplusForm.startTimeLabel', {
                  defaultValue: 'Start Time',
                })}{' '}
                *
              </label>
              <DatePicker
                selected={pickupSlots[0].startTime}
                onChange={date => updatePickupSlot(0, 'startTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption={t('common.time', { defaultValue: 'Time' })}
                dateFormat="HH:mm"
                className="input-field"
                placeholderText={t('surplusForm.startTimePlaceholder', {
                  defaultValue: 'Start',
                })}
                required
              />
            </div>

            <div className="form-field third-width">
              <label className="field-label">
                {t('surplusForm.endTimeLabel', { defaultValue: 'End Time' })} *
              </label>
              <DatePicker
                selected={pickupSlots[0].endTime}
                onChange={date => updatePickupSlot(0, 'endTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption={t('common.time', { defaultValue: 'Time' })}
                dateFormat="HH:mm"
                className="input-field"
                placeholderText={t('surplusForm.endTimePlaceholder', {
                  defaultValue: 'End',
                })}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('surplusForm.pickupLocationLabel', {
                defaultValue: 'Pickup Location',
              })}{' '}
              *
            </label>
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
                placeholder={t('aiExtractionReview.enterPickupAddress', {
                  defaultValue: 'Enter pickup address',
                })}
                required
              />
            </Autocomplete>
          </div>
        </div>

        {/* Description & Additional Info */}
        <div className="form-section">
          <h4 className="section-title">
            {t('aiExtractionReview.sections.description', {
              defaultValue: '📄 Description',
            })}
          </h4>

          <div className="form-field">
            <label className="field-label">
              {t('surplusForm.descriptionLabel', {
                defaultValue: 'Description',
              })}{' '}
              *
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
              placeholder={t('aiExtractionReview.descriptionPlaceholder', {
                defaultValue: 'Provide additional details about the food',
              })}
              rows="4"
              required
            />
          </div>

          {/* Show allergens if detected */}
          {data.allergens && data.allergens.length > 0 && (
            <div className="allergen-info">
              <h5>
                {t('aiExtractionReview.detectedAllergens', {
                  defaultValue: '⚠️ Detected Allergens:',
                })}
              </h5>
              <div className="allergen-tags">
                {data.allergens.map((allergen, index) => (
                  <span key={index} className="allergen-tag">
                    {allergen}
                  </span>
                ))}
              </div>
              <p className="allergen-note">
                {t('aiExtractionReview.allergenNote', {
                  defaultValue:
                    'Please verify and include allergen information in the description',
                })}
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
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('aiExtractionReview.creatingDonation', {
                  defaultValue: 'Creating Donation...',
                })
              : t('surplusForm.createDonation', {
                  defaultValue: 'Create Donation',
                })}
          </button>
        </div>
      </form>
    </div>
  );
}
