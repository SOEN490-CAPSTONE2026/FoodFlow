import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from "react";
import { X, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { surplusAPI } from "../../services/api";
import { foodTypeOptions, unitOptions, temperatureCategoryOptions, packagingTypeOptions } from "../../constants/foodConstants";
import { useTimezone } from "../../contexts/TimezoneContext";
import "./Donor_Styles/SurplusFormModal.css";
import "react-datepicker/dist/react-datepicker.css";

const SurplusFormModal = ({ isOpen, onClose, editMode = false, postId = null }) => {
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const { userTimezone } = useTimezone();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    quantityValue: "",
    quantityUnit: "KILOGRAM",
    foodCategories: [],
    fabricationDate: "",
    expiryDate: "",
    calculatedExpiryDate: "",
    pickupLocation: { latitude: "", longitude: "", address: "" },
    description: "",
    temperatureCategory: "",
    packagingType: "",
  });

  const [pickupSlots, setPickupSlots] = useState([
    {
      pickupDate: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const autocompleteRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return "";
    try {
      // Handle both Date objects and date strings
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split("T")[0];
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return "";
    }
  };
  
  const formatTime = (date) => {
    if (!date) return "";
    try {
      // Handle both Date objects and date strings
      const dateObj = date instanceof Date ? date : new Date(date);
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', date, error);
      return "";
    }
  };

  // Calculate expiry date based on food category shelf life rules
  const calculateExpiryDate = (fabricationDate, foodCategories) => {
    if (!fabricationDate) return "";

    // Shelf-life mapping (in days) - matches backend rules
    const shelfLifeMap = {
      PREPARED_MEALS: 3,
      BAKERY_PASTRY: 3,
      FRUITS_VEGETABLES: 7,
      DAIRY_COLD: 10,
      FROZEN: 30,
      PACKAGED_PANTRY: 90,
    };

    // Get minimum shelf life from selected categories
    const minShelfLife = foodCategories.reduce((min, category) => {
      const days = shelfLifeMap[category.value] || 7;
      return Math.min(min, days);
    }, Infinity);

    const fabrication = new Date(fabricationDate);
    const expiry = new Date(fabrication);
    expiry.setDate(expiry.getDate() + (minShelfLife === Infinity ? 7 : minShelfLife));
    return expiry;
  };

  // Load existing post data in edit mode
  useEffect(() => {
    if (editMode && postId && isOpen) {
      setIsLoading(true);
      surplusAPI.getPost(postId)
        .then((response) => {
          const post = response.data;
          
          // Parse food categories
          const categories = post.foodCategories.map(cat => 
            foodTypeOptions.find(opt => opt.value === cat) || { value: cat, label: cat }
          );

          // Parse dates
          const fabricationDate = post.fabricationDate ? new Date(post.fabricationDate) : "";
          const expiryDate = post.expiryDate ? new Date(post.expiryDate) : "";

          // Parse pickup slots
          const slots = post.pickupSlots && post.pickupSlots.length > 0 
            ? post.pickupSlots.map(slot => ({
                pickupDate: slot.pickupDate ? new Date(slot.pickupDate) : "",
                startTime: slot.startTime ? parseTimeToDate(slot.startTime) : "",
                endTime: slot.endTime ? parseTimeToDate(slot.endTime) : "",
                notes: slot.notes || "",
              }))
            : [{
                pickupDate: post.pickupDate ? new Date(post.pickupDate) : "",
                startTime: post.pickupFrom ? parseTimeToDate(post.pickupFrom) : "",
                endTime: post.pickupTo ? parseTimeToDate(post.pickupTo) : "",
                notes: "",
              }];

          setFormData({
            title: post.title || "",
            quantityValue: post.quantity?.value?.toString() || "",
            quantityUnit: post.quantity?.unit || "KILOGRAM",
            foodCategories: categories,
            fabricationDate: fabricationDate,
            expiryDate: expiryDate,
            calculatedExpiryDate: "",
            pickupLocation: post.pickupLocation || { latitude: "", longitude: "", address: "" },
            description: post.description || "",
            temperatureCategory: post.temperatureCategory || "",
            packagingType: post.packagingType || "",
          });

          setPickupSlots(slots);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to load post data");
          setIsLoading(false);
        });
    }
  }, [editMode, postId, isOpen]);

  // Helper function to parse time string (HH:mm) to Date object for DatePicker
  const parseTimeToDate = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
  };

  // Auto-calculate expiry date when fabrication date or food categories change (only in create mode)
  useEffect(() => {
    if (!editMode && formData.fabricationDate && formData.foodCategories.length > 0) {
      const calculatedExpiry = calculateExpiryDate(
        formData.fabricationDate,
        formData.foodCategories
      );

      // Only update if the calculated date is different from current expiry
      const currentExpiryStr = formData.expiryDate ? formatDate(formData.expiryDate) : "";
      const calculatedExpiryStr = formatDate(calculatedExpiry);

      if (currentExpiryStr !== calculatedExpiryStr) {
        setFormData((prev) => ({
          ...prev,
          calculatedExpiryDate: calculatedExpiry,
          expiryDate: calculatedExpiry,
        }));
      }
    } else if (!editMode && (!formData.fabricationDate || formData.foodCategories.length === 0)) {
      // Clear calculated dates if fabrication date or categories are missing
      setFormData((prev) => ({
        ...prev,
        calculatedExpiryDate: "",
        expiryDate: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, formData.fabricationDate, formData.foodCategories.map(c => c.value).join(',')]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onLoadAutocomplete = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const location = {
        latitude: place.geometry?.location?.lat() || "",
        longitude: place.geometry?.location?.lng() || "",
        address: place.formatted_address || place.name || "",
      };
      setFormData((prev) => ({ ...prev, pickupLocation: location }));
    }
  };


  const addPickupSlot = () => {
    setPickupSlots([
      ...pickupSlots,
      {
        pickupDate: "",
        startTime: "",
        endTime: "",
        notes: "",
      },
    ]);
  };

  const removePickupSlot = (index) => {
    if (pickupSlots.length > 1) {
      setPickupSlots(pickupSlots.filter((_, i) => i !== index));
    }
  };

  const updatePickupSlot = (index, field, value) => {
    const updatedSlots = [...pickupSlots];
    updatedSlots[index][field] = value;
    setPickupSlots(updatedSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      // Format pickup slots for submission
      const formattedSlots = pickupSlots.map((slot) => ({
        pickupDate: formatDate(slot.pickupDate),
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
        notes: slot.notes || null,
      }));

      const submissionData = {
        title: formData.title,
        quantity: {
          value: parseFloat(formData.quantityValue),
          unit: formData.quantityUnit,
        },
        foodCategories: Array.isArray(formData.foodCategories) 
          ? formData.foodCategories.map((fc) => fc.value)
          : [],
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
        donorTimezone: userTimezone || "UTC", // Include donor's timezone
      };

      let response;
      if (editMode && postId) {
        // Update existing post
        response = await surplusAPI.update(postId, submissionData);
        setMessage(`Success! Donation updated successfully.`);
      } else {
        // Create new post
        response = await surplusAPI.create(submissionData);
        const createdPostId = response?.data?.id || 'unknown';
        setMessage(`Success! Post created with ID: ${createdPostId}`);
      }

      // Reset form only in create mode
      if (!editMode) {
        setFormData({
          title: "",
          quantityValue: "",
          quantityUnit: "KILOGRAM",
          foodCategories: [],
          fabricationDate: "",
          expiryDate: "",
          calculatedExpiryDate: "",
          pickupLocation: { latitude: "", longitude: "", address: "" },
          description: "",
          temperatureCategory: "",
          packagingType: "",
        });

        setPickupSlots([
          {
            pickupDate: "",
            startTime: "",
            endTime: "",
            notes: "",
          },
        ]);
      }

      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.message || "Failed to create surplus post");
    }
  };

  const handleCancel = () => {
    const confirmMessage = editMode ? "Cancel editing? Your changes will be lost." : "Cancel donation creation?";
    if (window.confirm(t('surplusForm.cancelConfirm'))) {
      setCurrentStep(1);
      setFormData({
        title: "",
        quantityValue: "",
        quantityUnit: "KILOGRAM",
        foodCategories: [],
        fabricationDate: "",
        expiryDate: "",
        calculatedExpiryDate: "",
        pickupLocation: { latitude: "", longitude: "", address: "" },
        description: "",
        temperatureCategory: "",
        packagingType: "",
      });
      setPickupSlots([
        {
          pickupDate: "",
          startTime: "",
          endTime: "",
          notes: "",
        },
      ]);
      onClose();
    }
  };

  // Validation for each step
  const validateStep = (step) => {
    switch (step) {
      case 1: // Food Details
        return (
          formData.title.trim() !== "" &&
          formData.foodCategories.length > 0 &&
          formData.temperatureCategory !== "" &&
          formData.packagingType !== ""
        );
      case 2: // Quantity & Dates
        return (
          formData.quantityValue !== "" &&
          parseFloat(formData.quantityValue) > 0 &&
          formData.fabricationDate !== "" &&
          formData.expiryDate !== ""
        );
      case 3: // Pickup Info
        return (
          pickupSlots.every(
            (slot) =>
              slot.pickupDate !== "" &&
              slot.startTime !== "" &&
              slot.endTime !== ""
          ) &&
          formData.pickupLocation.address.trim() !== ""
        );
      case 4: // Description
        return formData.description.trim() !== "";
      default:
        return false;
    }
  };

  const handleNext = (e) => {
    e.preventDefault(); // Prevent form submission
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setError("");
    } else {
      setError("Please complete all required fields before continuing.");
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault(); // Prevent form submission
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  // Prevent Enter key from submitting the form when not on last step
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep < totalSteps) {
      e.preventDefault();
      handleNext(e);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, label: "Food Details" },
    { number: 2, label: "Quantity & Dates" },
    { number: 3, label: "Pickup Info" },
    { number: 4, label: "Description" },
  ];

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="surplus-modal-header">
          <h2>{editMode ? "Edit Donation" : "Add New Donation"}</h2>
          <button className="close-button" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>
          
        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="step-item">
                <div className={`step-circle ${
                  currentStep > step.number ? 'completed' :
                  currentStep === step.number ? 'active' : ''
                }`}>
                  {step.number}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-line ${
                  currentStep > step.number ? 'completed' : ''
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="modal-form">
          {/* Loading State */}
          {isLoading && (
            <div className="form-step-content">
              <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading donation details...</p>
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
                <label className="input-label">{t('surplusForm.titleLabel')} *</label>
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

              {/* Categories */}
              <div className="form-section">
                <label className="input-label">{t('surplusForm.foodCategoriesLabel')} *</label>
                <Select
                  isMulti
                  options={foodTypeOptions}
                  value={formData.foodCategories}
                  onChange={(selected) =>
                    setFormData((prev) => ({ ...prev, foodCategories: selected }))
                  }
                  classNamePrefix="react-select"
                  placeholder={t('surplusForm.foodCategoriesPlaceholder')}
                  required
                />
              </div>

              {/* Food Safety Compliance */}
              <div className="form-section row-group">
                <div className="input-group half-width">
                  <label className="input-label">
                    Temperature Category *
                  </label>
                  <Select
                    name="temperatureCategory"
                    options={temperatureCategoryOptions}
                    value={temperatureCategoryOptions.find(
                      (opt) => opt.value === formData.temperatureCategory
                    )}
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        temperatureCategory: selected.value,
                      }))
                    }
                    classNamePrefix="react-select"
                    placeholder="Select temperature category"
                    required
                  />
                  <span className="input-help-text">
                    Select the storage temperature for food safety verification
                  </span>
                </div>

                <div className="input-group half-width">
                  <label className="input-label">
                    Packaging Type *
                  </label>
                  <Select
                    name="packagingType"
                    options={packagingTypeOptions}
                    value={packagingTypeOptions.find(
                      (opt) => opt.value === formData.packagingType
                    )}
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        packagingType: selected.value,
                      }))
                    }
                    classNamePrefix="react-select"
                    placeholder="Select packaging type"
                    required
                  />
                  <span className="input-help-text">
                    Specify how the food is packaged for safety compliance
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
                  <label className="input-label">{t('surplusForm.quantityLabel')} *</label>
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
                  <label className="input-label">{t('surplusForm.unitLabel')} *</label>
                  <Select
                    name="quantityUnit"
                    options={unitOptions}
                    value={unitOptions.find(
                      (opt) => opt.value === formData.quantityUnit
                    )}
                    onChange={(selected) =>
                      setFormData((prev) => ({
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
                    Fabrication/Production Date *
                  </label>
                  <DatePicker
                    selected={formData.fabricationDate}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, fabricationDate: date }))
                    }
                    maxDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    className="input-field"
                    placeholderText="When was it made?"
                    required
                  />
                  <span className="input-help-text">
                    System will auto-calculate expiry date based on food type
                  </span>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="form-section">
                <div className="input-group">
                  <label className="input-label">
                    {t('surplusForm.expiryDateLabel')} *
                    {formData.calculatedExpiryDate && (
                      <span className="input-help-text-inline"> (Auto-calculated, you can edit)</span>
                    )}
                  </label>
                  <DatePicker
                    selected={formData.expiryDate}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, expiryDate: date }))
                    }
                    minDate={formData.fabricationDate || new Date()}
                    dateFormat="yyyy-MM-dd"
                    className="input-field"
                    placeholderText={t('surplusForm.expiryDatePlaceholder')}
                    required
                  />
                  {formData.calculatedExpiryDate && formData.fabricationDate && (
                    <span className="input-help-text">
                      Suggested expiry: {formatDate(formData.calculatedExpiryDate)} (based on food category)
                    </span>
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
                  <label className="input-label">{t('surplusForm.pickupTimeSlotsLabel')} *</label>
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
                      <span className="slot-number">{t('surplusForm.slot')} {index + 1}</span>
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
                          <label className="input-label-small">{t('surplusForm.dateLabel')} *</label>
                          <DatePicker
                            selected={slot.pickupDate}
                            onChange={(date) =>
                              updatePickupSlot(index, "pickupDate", date)
                            }
                            minDate={new Date()}
                            dateFormat="yyyy-MM-dd"
                            className="input-field-small"
                            placeholderText={t('surplusForm.datePlaceholder')}
                            required
                          />
                        </div>

                        <div className="input-group third-width">
                          <label className="input-label-small">{t('surplusForm.startTimeLabel')} *</label>
                          <DatePicker
                            selected={slot.startTime}
                            onChange={(date) =>
                              updatePickupSlot(index, "startTime", date)
                            }
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            className="input-field-small"
                            placeholderText={t('surplusForm.startTimePlaceholder')}
                            required
                          />
                        </div>

                        <div className="input-group third-width">
                          <label className="input-label-small">{t('surplusForm.endTimeLabel')} *</label>
                          <DatePicker
                            selected={slot.endTime}
                            onChange={(date) =>
                              updatePickupSlot(index, "endTime", date)
                            }
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            className="input-field-small"
                            placeholderText={t('surplusForm.endTimePlaceholder')}
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
                            onChange={(e) =>
                              updatePickupSlot(index, "notes", e.target.value)
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
                <label className="input-label">{t('surplusForm.pickupLocationLabel')} *</label>
                <Autocomplete
                  onLoad={onLoadAutocomplete}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    name="address"
                    value={formData.pickupLocation.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
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

          {/* Step 4: Description */}
          {currentStep === 4 && (
            <div className="form-step-content">
              {/* Description */}
              <div className="form-section">
                <label className="input-label">{t('surplusForm.descriptionLabel')} *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field textarea"
                  placeholder={t('surplusForm.descriptionPlaceholder')}
                  rows="4"
                  required
                />
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
                Previous
              </button>
            )}
            {currentStep < totalSteps ? (
              <button
                type="button"
                className="btn btn-create"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-create">
                {editMode ? "Update Donation" : "Create Donation"}
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
