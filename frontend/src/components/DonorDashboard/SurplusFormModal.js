import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { surplusAPI } from '../../services/api';
import {
  dietaryTagOptions,
  foodTypeOptions,
  getFoodTypeLabel,
  getTemperatureCategoryLabel,
  mapFoodTypeToLegacyCategory,
  mapLegacyCategoryToFoodType,
  unitOptions,
  temperatureCategoryOptions,
  packagingTypeOptions,
} from '../../constants/foodConstants';
import { computeSuggestedExpiry } from '../../utils/expiryRules';
import { useTimezone } from '../../contexts/TimezoneContext';
import './Donor_Styles/SurplusFormModal.css';
import 'react-datepicker/dist/react-datepicker.css';

const SurplusFormModal = ({
  isOpen,
  onClose,
  editMode = false,
  postId = null,
}) => {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const { userTimezone } = useTimezone();
  const [isLoading, setIsLoading] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    quantityValue: '',
    quantityUnit: 'KILOGRAM',
    foodCategories: [],
    dietaryTags: [],
    fabricationDate: '',
    expiryDate: '',
    calculatedExpiryDate: '',
    pickupLocation: { latitude: '', longitude: '', address: '' },
    description: '',
    temperatureCategory: '',
    packagingType: '',
  });

  const [pickupSlots, setPickupSlots] = useState([
    {
      pickupDate: '',
      startTime: '',
      endTime: '',
      notes: '',
    },
  ]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const autocompleteRef = useRef(null);
  const translatedFoodTypeOptions = useMemo(
    () =>
      foodTypeOptions.map(option => ({
        ...option,
        label: t(`surplusForm.foodTypeValues.${option.value}`, option.label),
      })),
    [t]
  );
  const translatedDietaryTagOptions = useMemo(
    () =>
      dietaryTagOptions.map(option => ({
        ...option,
        label: t(`surplusForm.dietaryTagValues.${option.value}`, option.label),
      })),
    [t]
  );
  const translatedTemperatureCategoryOptions = useMemo(
    () =>
      temperatureCategoryOptions.map(option => ({
        ...option,
        label: t(
          `surplusForm.temperatureCategoryValues.${option.value}`,
          option.label
        ),
      })),
    [t]
  );
  const translatedPackagingTypeOptions = useMemo(
    () =>
      packagingTypeOptions.map(option => ({
        ...option,
        label: t(
          `surplusForm.packagingTypeValues.${option.value}`,
          option.label
        ),
      })),
    [t]
  );

  const formatDate = date => {
    if (!date) {
      return '';
    }
    try {
      // Handle both Date objects and date strings
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return '';
    }
  };

  const formatTime = date => {
    if (!date) {
      return '';
    }
    try {
      // Handle both Date objects and date strings
      const dateObj = date instanceof Date ? date : new Date(date);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', date, error);
      return '';
    }
  };
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

  // Load existing post data in edit mode
  useEffect(() => {
    if (editMode && postId && isOpen) {
      setIsLoading(true);
      surplusAPI
        .getPost(postId)
        .then(response => {
          const post = response.data;

          // Parse food categories
          const categories = post.foodCategories.map(cat => {
            const mappedValue = mapLegacyCategoryToFoodType(cat);
            return (
              translatedFoodTypeOptions.find(
                opt => opt.value === mappedValue
              ) || {
                value: mappedValue,
                label: mappedValue,
              }
            );
          });

          // Parse dates
          const fabricationDate = post.fabricationDate
            ? new Date(post.fabricationDate)
            : '';
          const expiryDate = post.expiryDate ? new Date(post.expiryDate) : '';

          // Parse pickup slots
          const slots =
            post.pickupSlots && post.pickupSlots.length > 0
              ? post.pickupSlots.map(slot => ({
                  pickupDate: slot.pickupDate ? new Date(slot.pickupDate) : '',
                  startTime: slot.startTime
                    ? parseTimeToDate(slot.startTime)
                    : '',
                  endTime: slot.endTime ? parseTimeToDate(slot.endTime) : '',
                  notes: slot.notes || '',
                }))
              : [
                  {
                    pickupDate: post.pickupDate
                      ? new Date(post.pickupDate)
                      : '',
                    startTime: post.pickupFrom
                      ? parseTimeToDate(post.pickupFrom)
                      : '',
                    endTime: post.pickupTo
                      ? parseTimeToDate(post.pickupTo)
                      : '',
                    notes: '',
                  },
                ];

          setFormData({
            title: post.title || '',
            quantityValue: post.quantity?.value?.toString() || '',
            quantityUnit: post.quantity?.unit || 'KILOGRAM',
            foodCategories: categories,
            dietaryTags: Array.isArray(post.dietaryTags)
              ? [...new Set(post.dietaryTags)].slice(0, 10)
              : [],
            fabricationDate: fabricationDate,
            expiryDate: expiryDate,
            calculatedExpiryDate: '',
            pickupLocation: post.pickupLocation || {
              latitude: '',
              longitude: '',
              address: '',
            },
            description: post.description || '',
            temperatureCategory: post.temperatureCategory || '',
            packagingType: post.packagingType || '',
          });

          setPickupSlots(slots);
          setExpiryTouched(true);
          setSafetyAcknowledged(false);
          setIsLoading(false);
        })
        .catch(err => {
          setError(
            err.response?.data?.message || t('surplusForm.failedToLoad')
          );
          setIsLoading(false);
        });
    }
  }, [editMode, postId, isOpen, translatedFoodTypeOptions, t]);

  // Helper function to parse time string (HH:mm) to Date object for DatePicker
  const parseTimeToDate = timeString => {
    if (!timeString) {
      return '';
    }
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
  };

  // Auto-fill expiry from suggestion until donor edits expiry manually.
  useEffect(() => {
    if (expiryTouched) {
      return;
    }

    if (!expirySuggestion.suggestedExpiryDate) {
      setFormData(prev => ({
        ...prev,
        calculatedExpiryDate: '',
      }));
      return;
    }

    const calculatedExpiry = new Date(expirySuggestion.suggestedExpiryDate);
    const currentExpiryStr = formData.expiryDate
      ? formatDate(formData.expiryDate)
      : '';
    if (currentExpiryStr !== expirySuggestion.suggestedExpiryDate) {
      setFormData(prev => ({
        ...prev,
        calculatedExpiryDate: calculatedExpiry,
        expiryDate: calculatedExpiry,
      }));
    }
  }, [
    expirySuggestion.suggestedExpiryDate,
    expiryTouched,
    formData.expiryDate,
  ]);

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

  const addPickupSlot = () => {
    setPickupSlots([
      ...pickupSlots,
      {
        pickupDate: '',
        startTime: '',
        endTime: '',
        notes: '',
      },
    ]);
  };

  const removePickupSlot = index => {
    if (pickupSlots.length > 1) {
      setPickupSlots(pickupSlots.filter((_, i) => i !== index));
    }
  };

  const updatePickupSlot = (index, field, value) => {
    const updatedSlots = [...pickupSlots];
    updatedSlots[index][field] = value;
    setPickupSlots(updatedSlots);
  };

  const toggleDietaryTag = tagValue => {
    setFormData(prev => {
      const current = Array.isArray(prev.dietaryTags) ? prev.dietaryTags : [];
      if (current.includes(tagValue)) {
        return {
          ...prev,
          dietaryTags: current.filter(tag => tag !== tagValue),
        };
      }
      if (current.length >= 10) {
        setError(t('surplusForm.maxDietaryTags'));
        return prev;
      }
      return {
        ...prev,
        dietaryTags: [...current, tagValue],
      };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // Format pickup slots for submission
      const formattedSlots = pickupSlots.map(slot => ({
        pickupDate: formatDate(slot.pickupDate),
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
        notes: slot.notes || null,
      }));

      const selectedFoodTypes = Array.isArray(formData.foodCategories)
        ? formData.foodCategories.map(fc => fc.value)
        : [];
      const dietaryTags = Array.isArray(formData.dietaryTags)
        ? [...new Set(formData.dietaryTags)].slice(0, 10)
        : [];

      const submissionData = {
        title: formData.title,
        quantity: {
          value: parseFloat(formData.quantityValue),
          unit: formData.quantityUnit,
        },
        foodType: selectedFoodTypes.length > 0 ? selectedFoodTypes[0] : null,
        foodCategories: selectedFoodTypes.map(mapFoodTypeToLegacyCategory),
        dietaryTags: dietaryTags,
        fabricationDate: formatDate(formData.fabricationDate),
        expiryDate: formatDate(formData.expiryDate),
        pickupSlots: formattedSlots,
        // Keep legacy fields for backward compatibility (backend will use first slot)
        pickupDate: formattedSlots[0].pickupDate,
        pickupFrom: formattedSlots[0].startTime,
        pickupTo: formattedSlots[0].endTime,
        pickupLocation: formData.pickupLocation,
        description: formData.description,
        temperatureCategory: formData.temperatureCategory,
        packagingType: formData.packagingType,
        donorTimezone: userTimezone || 'UTC', // Include donor's timezone
      };

      let response;
      if (editMode && postId) {
        // Update existing post
        response = await surplusAPI.update(postId, submissionData);
        setMessage(t('surplusForm.successUpdated'));
      } else {
        // Create new post
        response = await surplusAPI.create(submissionData);
        const createdPostId = response?.data?.id || 'unknown';
        setMessage(t('surplusForm.successCreated', { id: createdPostId }));
      }

      // Reset form only in create mode
      if (!editMode) {
        setFormData({
          title: '',
          quantityValue: '',
          quantityUnit: 'KILOGRAM',
          foodCategories: [],
          dietaryTags: [],
          fabricationDate: '',
          expiryDate: '',
          calculatedExpiryDate: '',
          pickupLocation: { latitude: '', longitude: '', address: '' },
          description: '',
          temperatureCategory: '',
          packagingType: '',
        });

        setPickupSlots([
          {
            pickupDate: '',
            startTime: '',
            endTime: '',
            notes: '',
          },
        ]);
        setExpiryTouched(false);
        setSafetyAcknowledged(false);
      }

      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.message || t('surplusForm.failed'));
    }
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setFormData({
      title: '',
      quantityValue: '',
      quantityUnit: 'KILOGRAM',
      foodCategories: [],
      dietaryTags: [],
      fabricationDate: '',
      expiryDate: '',
      calculatedExpiryDate: '',
      pickupLocation: { latitude: '', longitude: '', address: '' },
      description: '',
      temperatureCategory: '',
      packagingType: '',
    });
    setPickupSlots([
      {
        pickupDate: '',
        startTime: '',
        endTime: '',
        notes: '',
      },
    ]);
    setExpiryTouched(false);
    setSafetyAcknowledged(false);
    onClose();
  };

  // Validation for each step
  const validateStep = step => {
    switch (step) {
      case 1: // Food Details
        return (
          formData.title.trim() !== '' &&
          formData.description.trim() !== '' &&
          formData.foodCategories.length > 0 &&
          formData.temperatureCategory !== '' &&
          formData.packagingType !== ''
        );
      case 2: // Quantity & Dates
        return (
          formData.quantityValue !== '' &&
          parseFloat(formData.quantityValue) > 0 &&
          formData.fabricationDate !== '' &&
          formData.expiryDate !== '' &&
          (expirySuggestion.eligible || safetyAcknowledged)
        );
      case 3: // Pickup Info
        return (
          pickupSlots.every(
            slot =>
              slot.pickupDate !== '' &&
              slot.startTime !== '' &&
              slot.endTime !== ''
          ) && formData.pickupLocation.address.trim() !== ''
        );
      default:
        return false;
    }
  };

  const handleNext = e => {
    e.preventDefault(); // Prevent form submission
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    } else {
      setError(t('surplusForm.validationError'));
    }
  };

  const handlePrevious = e => {
    e.preventDefault(); // Prevent form submission
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // Prevent Enter key from submitting the form when not on last step
  const handleKeyDown = e => {
    if (e.key === 'Enter' && currentStep < totalSteps) {
      e.preventDefault();
      handleNext(e);
    }
  };

  if (!isOpen) {
    return null;
  }

  const steps = [
    { number: 1, label: t('surplusForm.steps.foodDetails') },
    { number: 2, label: t('surplusForm.steps.quantityDates') },
    { number: 3, label: t('surplusForm.steps.pickupInfo') },
  ];

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="surplus-modal-header">
          <h2>
            {editMode ? t('surplusForm.editTitle') : t('surplusForm.title')}
          </h2>
          <button className="close-button" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="step-item">
                <div
                  className={`step-circle ${
                    currentStep > step.number
                      ? 'completed'
                      : currentStep === step.number
                        ? 'active'
                        : ''
                  }`}
                >
                  {step.number}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`step-line ${
                    currentStep > step.number ? 'completed' : ''
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="modal-form"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="form-step-content">
              <div
                className="loading-state"
                style={{ textAlign: 'center', padding: '2rem' }}
              >
                <p>{t('surplusForm.loadingDetails')}</p>
              </div>
            </div>
          )}

          {/* Form Content - Only show when not loading */}
          {!isLoading && (
            <>
              {/* Step 1: Food Details */}
              {currentStep === 1 && (
                <div className="form-step-content">
                  {/* Title */}
                  <div className="form-section">
                    <label className="input-label">
                      {t('surplusForm.titleLabel')} *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="input-field"
                      placeholder={t('surplusForm.titlePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-section">
                    <label className="input-label">
                      {t('surplusForm.descriptionLabel')} *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="input-field textarea"
                      placeholder={t('surplusForm.descriptionPlaceholder')}
                      rows="3"
                      required
                    />
                  </div>

                  {/* Categories */}
                  <div className="form-section">
                    <label className="input-label">
                      {t('surplusForm.foodCategoriesLabel')} *
                    </label>
                    <Select
                      isMulti
                      options={translatedFoodTypeOptions}
                      value={formData.foodCategories}
                      onChange={selected =>
                        setFormData(prev => ({
                          ...prev,
                          foodCategories: selected,
                        }))
                      }
                      classNamePrefix="react-select"
                      placeholder={t('surplusForm.foodCategoriesPlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-section">
                    <label className="input-label">
                      {t('surplusForm.dietaryTagsLabel')}{' '}
                      {t('surplusForm.dietaryTagsOptional')}
                    </label>
                    <div className="dietary-chip-group">
                      {translatedDietaryTagOptions.map(tag => {
                        const active = formData.dietaryTags.includes(tag.value);
                        return (
                          <button
                            type="button"
                            key={tag.value}
                            className={`dietary-chip ${active ? 'active' : ''}`}
                            onClick={() => toggleDietaryTag(tag.value)}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Food Safety Compliance */}
                  <div className="form-section row-group">
                    <div className="input-group half-width">
                      <label className="input-label">
                        {t('surplusForm.temperatureCategoryLabel')} *
                      </label>
                      <Select
                        name="temperatureCategory"
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
                        placeholder={t(
                          'surplusForm.temperatureCategoryPlaceholder'
                        )}
                        required
                      />
                      <span className="input-help-text">
                        {t('surplusForm.temperatureCategoryHelp')}
                      </span>
                    </div>

                    <div className="input-group half-width">
                      <label className="input-label">
                        {t('surplusForm.packagingTypeLabel')} *
                      </label>
                      <Select
                        name="packagingType"
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
                        placeholder={t('surplusForm.packagingTypePlaceholder')}
                        required
                      />
                      <span className="input-help-text">
                        {t('surplusForm.packagingTypeHelp')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Quantity & Dates */}
              {currentStep === 2 && (
                <div className="form-step-content">
                  {/* Quantity */}
                  <div className="form-section row-group">
                    <div className="input-group half-width">
                      <label className="input-label">
                        {t('surplusForm.quantityLabel')} *
                      </label>
                      <input
                        type="number"
                        name="quantityValue"
                        value={formData.quantityValue}
                        onChange={handleChange}
                        className="input-field"
                        placeholder={t('surplusForm.quantityPlaceholder')}
                        min="0"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="input-group half-width">
                      <label className="input-label">
                        {t('surplusForm.unitLabel')} *
                      </label>
                      <Select
                        name="quantityUnit"
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
                        placeholder={t('surplusForm.unitPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  {/* Fabrication Date */}
                  <div className="form-section">
                    <div className="input-group">
                      <label className="input-label">
                        {t('surplusForm.fabricationDateLabel')} *
                      </label>
                      <DatePicker
                        selected={formData.fabricationDate}
                        onChange={date =>
                          setFormData(prev => ({
                            ...prev,
                            fabricationDate: date,
                          }))
                        }
                        maxDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        className="input-field"
                        placeholderText={t(
                          'surplusForm.fabricationDatePlaceholder'
                        )}
                        required
                      />
                      <span className="input-help-text">
                        {t('surplusForm.fabricationDateHelp')}
                      </span>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="form-section">
                    <div className="input-group">
                      <label className="input-label">
                        {t('surplusForm.expiryDateLabel')} *
                        {formData.calculatedExpiryDate && (
                          <span className="input-help-text-inline">
                            {' '}
                            {t('surplusForm.expiryDateAutoCalculated')}
                          </span>
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
                        placeholderText={t('surplusForm.expiryDatePlaceholder')}
                        required
                      />
                      {expirySuggestion.suggestedExpiryDate && (
                        <span className="input-help-text">
                          {t('surplusForm.expiryDateSuggestionRule', {
                            date: expirySuggestion.suggestedExpiryDate,
                            foodType: t(
                              `surplusForm.foodTypeValues.${selectedFoodType}`,
                              getFoodTypeLabel(selectedFoodType)
                            ),
                            temperature: t(
                              `surplusForm.temperatureCategoryValues.${formData.temperatureCategory}`,
                              getTemperatureCategoryLabel(
                                formData.temperatureCategory
                              )
                            ),
                          })}
                        </span>
                      )}
                      <div
                        className={`eligibility-badge ${
                          expirySuggestion.eligible
                            ? 'eligible'
                            : 'not-eligible'
                        }`}
                      >
                        {expirySuggestion.eligible
                          ? t('surplusForm.eligibilityEligible')
                          : t('surplusForm.eligibilityNotEligible')}
                      </div>
                      {expirySuggestion.warnings.length > 0 && (
                        <ul className="expiry-warning-list">
                          {expirySuggestion.warnings.map(warning => (
                            <li key={warning}>
                              {t(
                                `surplusForm.expiryWarnings.${warning}`,
                                warning
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!expirySuggestion.eligible && (
                        <label className="safety-acknowledgement">
                          <input
                            type="checkbox"
                            checked={safetyAcknowledged}
                            onChange={event =>
                              setSafetyAcknowledged(event.target.checked)
                            }
                          />
                          <span>{t('surplusForm.confirmSafetyOverride')}</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pickup Info */}
              {currentStep === 3 && (
                <div className="form-step-content">
                  {/* Pickup Time Slots */}
                  <div className="form-section">
                    <div className="pickup-slots-header">
                      <label className="input-label">
                        {t('surplusForm.pickupTimeSlotsLabel')} *
                      </label>
                      <button
                        type="button"
                        className="btn-add-slot"
                        onClick={addPickupSlot}
                      >
                        <Plus size={16} /> {t('surplusForm.addAnotherSlot')}
                      </button>
                    </div>

                    {pickupSlots.map((slot, index) => (
                      <div key={index} className="pickup-slot-card">
                        <div className="slot-header">
                          <span className="slot-number">
                            {t('surplusForm.slot')} {index + 1}
                          </span>
                          {pickupSlots.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-slot"
                              onClick={() => removePickupSlot(index)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="slot-content">
                          <div className="slot-row">
                            <div className="input-group third-width">
                              <label className="input-label-small">
                                {t('surplusForm.dateLabel')} *
                              </label>
                              <DatePicker
                                selected={slot.pickupDate}
                                onChange={date =>
                                  updatePickupSlot(index, 'pickupDate', date)
                                }
                                minDate={new Date()}
                                dateFormat="yyyy-MM-dd"
                                className="input-field-small"
                                placeholderText={t(
                                  'surplusForm.datePlaceholder'
                                )}
                                required
                              />
                            </div>

                            <div className="input-group third-width">
                              <label className="input-label-small">
                                {t('surplusForm.startTimeLabel')} *
                              </label>
                              <DatePicker
                                selected={slot.startTime}
                                onChange={date =>
                                  updatePickupSlot(index, 'startTime', date)
                                }
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="HH:mm"
                                className="input-field-small"
                                placeholderText={t(
                                  'surplusForm.startTimePlaceholder'
                                )}
                                required
                              />
                            </div>

                            <div className="input-group third-width">
                              <label className="input-label-small">
                                {t('surplusForm.endTimeLabel')} *
                              </label>
                              <DatePicker
                                selected={slot.endTime}
                                onChange={date =>
                                  updatePickupSlot(index, 'endTime', date)
                                }
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="HH:mm"
                                className="input-field-small"
                                placeholderText={t(
                                  'surplusForm.endTimePlaceholder'
                                )}
                                required
                              />
                            </div>
                          </div>

                          <div className="slot-row">
                            <div className="input-group full-width">
                              <label className="input-label-small">
                                {t('surplusForm.notesLabel')} (optional)
                              </label>
                              <input
                                type="text"
                                value={slot.notes}
                                onChange={e =>
                                  updatePickupSlot(
                                    index,
                                    'notes',
                                    e.target.value
                                  )
                                }
                                className="input-field-small"
                                placeholder={t('surplusForm.notesPlaceholder')}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Location */}
                  <div className="form-section">
                    <label className="input-label">
                      {t('surplusForm.pickupLocationLabel')} *
                    </label>
                    <Autocomplete
                      onLoad={onLoadAutocomplete}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <input
                        type="text"
                        name="address"
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
                        placeholder={t('surplusForm.pickupLocationPlaceholder')}
                        required
                      />
                    </Autocomplete>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}

              {/* Footer */}
              <div className="modal-footer">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={handlePrevious}
                  >
                    {t('surplusForm.previous')}
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    className="btn btn-create"
                    onClick={handleNext}
                  >
                    {t('surplusForm.next')}
                  </button>
                ) : (
                  <button type="submit" className="btn btn-create">
                    {editMode
                      ? t('surplusForm.updateDonation')
                      : t('surplusForm.createDonation')}
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default SurplusFormModal;
