import React, { useState, useRef } from "react";
import axios from "axios";
import { X, Calendar, Clock } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "./Donor_Styles/SurplusFormModal.css";
import "react-datepicker/dist/react-datepicker.css";

const SurplusFormModal = ({ isOpen, onClose }) => {
  const foodTypeOptions = [
    { value: "PREPARED_MEALS", label: "Prepared Meals" },
    { value: "BAKED_GOODS", label: "Bakery & Pastry" },
    { value: "FRUITS_VEGETABLES", label: "Fruits & Vegetables" },
    { value: "PACKAGED", label: "Packaged / Pantry Items" },
    { value: "DAIRY", label: "Dairy & Cold Items" },
    { value: "FROZEN", label: "Frozen Food" },
  ];

  const unitOptions = [
    { value: "KILOGRAM", label: "kg" },
    { value: "ITEM", label: "items" },
    { value: "LITER", label: "liters" },
    { value: "POUND", label: "lbs" },
    { value: "BOX", label: "boxes" },
  ];

  const [formData, setFormData] = useState({
    title: "",
    quantityValue: "",
    quantityUnit: "KILOGRAM",
    foodCategories: [],
    expiryDate: "",
    pickupDate: "",
    pickupFrom: "",
    pickupTo: "",
    pickupLocation: { latitude: "", longitude: "", address: "" },
    description: "",
  });

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
    const seconds = "00";
    return `${hours}:${minutes}:${seconds}`;
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");
  setError("");

  const submissionData = {
    title: formData.title,
    quantity: {
      value: parseFloat(formData.quantityValue),
      unit: formData.quantityUnit.toUpperCase(),
    },
    foodCategories: formData.foodCategories.map((fc) => fc.value),
    expiryDate: formatDate(formData.expiryDate),
    pickupDate: formatDate(formData.pickupDate),
    pickupFrom: formatTime(formData.pickupFrom),
    pickupTo: formatTime(formData.pickupTo),
    pickupLocation: formData.pickupLocation,
    description: formData.description,
  };

  try {
    const token = localStorage.getItem("jwtToken");

    const payload = {
      ...submissionData,
      quantity: {
        value: Number(formData.quantityValue),
        unit: formData.quantityUnit.toUpperCase(),
      },
    };

    const response = await axios.post("http://localhost:8080/api/surplus", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    setFormData({
      title: "",
      quantityValue: "",
      quantityUnit: "KILOGRAM",
      foodCategories: [],
      expiryDate: "",
      pickupDate: "",
      pickupFrom: "",
      pickupTo: "",
      pickupLocation: { latitude: "", longitude: "", address: "" },
      description: "",
    });

    setTimeout(() => onClose(), 2000);
  } catch (err) {
    setError(err.response?.data?.message || "Failed to create surplus post");
  }
};


  const handleCancel = () => {
    if (window.confirm("Cancel donation creation?")) {
      setFormData({
        title: "",
        quantityValue: "",
        quantityUnit: "KILOGRAM",
        foodCategories: [],
        expiryDate: "",
        pickupDate: "",
        pickupFrom: "",
        pickupTo: "",
        pickupLocation: { latitude: "", longitude: "", address: "" },
        description: "",
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Donation</h2>
          <button className="close-button" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-section">
            <label className="input-label">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Vegetable Lasagna"
              required
            />
          </div>

          {/* Categories & Expiry */}
          <div className="form-section row-group">
            <div className="input-group half-width">
              <label className="input-label">Food Categories</label>
              <Select
                isMulti
                options={foodTypeOptions}
                value={formData.foodCategories}
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, foodCategories: selected }))
                }
                classNamePrefix="react-select"
                placeholder="Select categories"
                required
              />
            </div>

            <div className="input-group half-width">
              <label className="input-label">Expiry Date</label>
              <DatePicker
                selected={formData.expiryDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, expiryDate: date }))
                }
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText="Select expiry date"
                required
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="form-section row-group">
            <div className="input-group half-width">
              <label className="input-label">Quantity</label>
              <input
                type="number"
                name="quantityValue"
                value={formData.quantityValue}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="input-group half-width">
              <label className="input-label">Unit</label>
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
                placeholder="Select unit"
                required
              />
            </div>
          </div>

          {/* Pickup Date and Time */}
          <div className="form-section row-group">
            <div className="input-group third-width">
              <label className="input-label">Pickup Date</label>
              <DatePicker
                selected={formData.pickupDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, pickupDate: date }))
                }
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input-field"
                placeholderText="Select date"
                required
              />
            </div>
            <div className="input-group third-width">
              <label className="input-label">From</label>
              <DatePicker
                selected={formData.pickupFrom}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, pickupFrom: date }))
                }
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
            <div className="input-group third-width">
              <label className="input-label">To</label>
              <DatePicker
                selected={formData.pickupTo}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, pickupTo: date }))
                }
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

          {/* Location */}
          <div className="form-section">
            <label className="input-label">Pickup Location</label>
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
                placeholder="Start typing address..."
                required
              />
            </Autocomplete>
          </div>

          {/* Description */}
          <div className="form-section">
            <label className="input-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field textarea"
              placeholder="Describe the food (ingredients, freshness, etc.)"
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
              Cancel
            </button>
            <button type="submit" className="btn btn-create">
              Create Donation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurplusFormModal;
