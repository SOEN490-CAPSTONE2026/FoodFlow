import React, { useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { surplusAPI } from "../../services/api";
import { foodTypeOptions, unitOptions } from "../../constants/foodConstants";
import "./Donor_Styles/SurplusFormModal.css";
import "react-datepicker/dist/react-datepicker.css";

const SurplusFormModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  const foodTypeOptions = [
    { value: "PREPARED_MEALS", label: t('surplusForm.foodTypes.preparedMeals') },
    { value: "BAKERY_PASTRY", label: t('surplusForm.foodTypes.bakeryPastry') },
    { value: "FRUITS_VEGETABLES", label: t('surplusForm.foodTypes.fruitsVegetables') },
    { value: "PACKAGED_PANTRY", label: t('surplusForm.foodTypes.packagedPantry') },
    { value: "DAIRY_COLD", label: t('surplusForm.foodTypes.dairyCold') },
    { value: "FROZEN", label: t('surplusForm.foodTypes.frozen') },
  ];

  const unitOptions = [
    { value: "KILOGRAM", label: t('surplusForm.units.kilogram') },
    { value: "ITEM", label: t('surplusForm.units.item') },
    { value: "LITER", label: t('surplusForm.units.liter') },
    { value: "POUND", label: t('surplusForm.units.pound') },
    { value: "BOX", label: t('surplusForm.units.box') },
  ];

  const [formData, setFormData] = useState({
    title: "",
    quantityValue: "",
    quantityUnit: "KILOGRAM",
    foodCategories: [],
    expiryDate: "",
    pickupLocation: { latitude: "", longitude: "", address: "" },
    description: "",
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

  const formatDate = (date) => (date ? date.toISOString().split("T")[0] : "");
  const formatTime = (date) => {
    if (!date) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
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
      foodCategories: formData.foodCategories.map((fc) => fc.value),
      expiryDate: formatDate(formData.expiryDate),
      pickupSlots: formattedSlots,
      // Keep legacy fields for backward compatibility (backend will use first slot)
      pickupDate: formattedSlots[0].pickupDate,
      pickupFrom: formattedSlots[0].startTime,
      pickupTo: formattedSlots[0].endTime,
      pickupLocation: formData.pickupLocation,
      description: formData.description,
    };

    try {
      const response = await surplusAPI.create(submissionData);

      setMessage(t('surplusForm.success', { id: response.data.id }));
      setFormData({
        title: "",
        quantityValue: "",
        quantityUnit: "KILOGRAM",
        foodCategories: [],
        expiryDate: "",
        pickupLocation: { latitude: "", longitude: "", address: "" },
        description: "",
      });

      setPickupSlots([
        {
          pickupDate: "",
          startTime: "",
          endTime: "",
          notes: "",
        },
      ]);

      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || t('surplusForm.failed'));
    }
  };

  const handleCancel = () => {
    if (window.confirm(t('surplusForm.cancelConfirm'))) {
      setFormData({
        title: "",
        quantityValue: "",
        quantityUnit: "KILOGRAM",
        foodCategories: [],
        expiryDate: "",
        pickupLocation: { latitude: "", longitude: "", address: "" },
        description: "",
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="surplus-modal-header">
          <h2>{t('surplusForm.title')}</h2>
          <button className="close-button" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-section">
            <label className="input-label">{t('surplusForm.titleLabel')}</label>
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

          {/* Categories & Expiry */}
          <div className="form-section row-group">
            <div className="input-group half-width">
              <label className="input-label">{t('surplusForm.foodCategoriesLabel')}</label>
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

            <div className="input-group half-width">
              <label className="input-label">{t('surplusForm.expiryDateLabel')}</label>
              <DatePicker
                selected={formData.expiryDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, expiryDate: date }))
                }
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText={t('surplusForm.expiryDatePlaceholder')}
                required
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="form-section row-group">
            <div className="input-group half-width">
              <label className="input-label">{t('surplusForm.quantityLabel')}</label>
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
              <label className="input-label">{t('surplusForm.unitLabel')}</label>
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

          {/* Pickup Time Slots */}
          <div className="form-section">
            <div className="pickup-slots-header">
              <label className="input-label">{t('surplusForm.pickupTimeSlotsLabel')}</label>
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
                      <label className="input-label-small">{t('surplusForm.dateLabel')}</label>
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
                      <label className="input-label-small">{t('surplusForm.startTimeLabel')}</label>
                      <DatePicker
                        selected={slot.startTime}
                        onChange={(date) =>
                          updatePickupSlot(index, "startTime", date)
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption={t('common.time', 'Time')}
                        dateFormat="HH:mm"
                        className="input-field-small"
                        placeholderText={t('surplusForm.startTimePlaceholder')}
                        required
                      />
                    </div>

                    <div className="input-group third-width">
                      <label className="input-label-small">{t('surplusForm.endTimeLabel')}</label>
                      <DatePicker
                        selected={slot.endTime}
                        onChange={(date) =>
                          updatePickupSlot(index, "endTime", date)
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption={t('common.time', 'Time')}
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
                        {t('surplusForm.notesLabel')}
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
            <label className="input-label">{t('surplusForm.pickupLocationLabel')}</label>
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

          {/* Description */}
          <div className="form-section">
            <label className="input-label">{t('surplusForm.descriptionLabel')}</label>
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

          {/* Feedback */}
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
            >
              {t('surplusForm.cancel')}
            </button>
            <button type="submit" className="btn btn-create">
              {t('surplusForm.createDonation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurplusFormModal;
