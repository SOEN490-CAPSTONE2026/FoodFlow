import React, { useState, useRef } from 'react';
import axios from 'axios';
import { X, Calendar, Clock } from 'lucide-react';
import { Autocomplete } from "@react-google-maps/api";
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "../style/SurplusFormModal.css";
import "react-datepicker/dist/react-datepicker.css";

const SurplusFormModal = ({ isOpen, onClose }) => {
  const foodTypeOptions = [
    { value: 'Bakery & Pastry', label: 'Bakery & Pastry' },
    { value: 'Fruits', label: 'Fruits & Vegetables' },
    { value: 'Packaged', label: 'Packaged / Pantry Items' },
    { value: 'Dairy', label: 'Dairy & Cold Items' },
    { value: 'Frozen Food', label: 'Frozen Food' },
    { value: 'Prepared Meals', label: 'Prepared Meals' }
  ];

  const unitOptions = [
    { value: 'kg', label: 'kg' },
    { value: 'items', label: 'items' },
    { value: 'liters', label: 'liters' },
    { value: 'lbs', label: 'lbs' },
    { value: 'boxes', label: 'boxes' }
  ];

  const [formData, setFormData] = useState({
    foodName: '',
    foodType: '',
    expiryDate: '',
    quantity: '',
    unit: 'kg',
    pickupFrom: '',
    pickupTo: '',
    location: '',
    notes: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Reference for the autocomplete instance
  const autocompleteRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle when autocomplete loads
  const onLoadAutocomplete = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  // Handle when user selects a place from autocomplete
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place.formatted_address) {
        setFormData(prev => ({
          ...prev,
          location: place.formatted_address
        }));
      } else if (place.name) {
        setFormData(prev => ({
          ...prev,
          location: place.name
        }));
      }
    }
  };

  // Format date for API submission
  const formatDateForAPI = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateTimeForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Prepare data for API submission
    const submissionData = {
      ...formData,
      expiryDate: formatDateForAPI(formData.expiryDate),
      pickupFrom: formatDateTimeForAPI(formData.pickupFrom),
      pickupTo: formData.pickupTo ? formData.pickupTo.toTimeString().slice(0, 5) : ''
    };
    // DEBUG LINES
    console.log('SUBMISSION DATA:', submissionData);
    console.log('expiryDate:', submissionData.expiryDate, 'Type:', typeof submissionData.expiryDate);
    console.log('pickupFrom:', submissionData.pickupFrom, 'Type:', typeof submissionData.pickupFrom);
    console.log(' pickupTo:', submissionData.pickupTo, 'Type:', typeof submissionData.pickupTo);

    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token); //DEBUG
      const response = await axios.post(
        'http://localhost:8080/api/surplus',
        submissionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage(`Success! Post created with ID: ${response.data.id}`);
      // Reset form
      setFormData({
        foodName: '',
        foodType: '',
        expiryDate: '',
        quantity: '',
        unit: 'kg',
        pickupFrom: '',
        pickupTo: '',
        location: '',
        notes: ''
      });

      // Modal closes after successful submission
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      // DEBUG
      console.log('FULL ERROR OBJECT:', err);
      console.log('ERROR RESPONSE:', err.response);
      console.log('ERROR DATA:', err.response?.data);
      console.log('ERROR STATUS:', err.response?.status);
      setError(err.response?.data?.message || 'Failed to create surplus post');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      setFormData({
        foodName: '',
        foodType: '',
        expiryDate: '',
        quantity: '',
        unit: 'kg',
        pickupFrom: '',
        pickupTo: '',
        location: '',
        notes: ''
      });
      onClose();
    }
  };

  const handleClose = () => {
    handleCancel();
  };

  if (!isOpen) return null;

  // Custom input components for DatePicker
  const CustomDateInput = ({ value, onClick, placeholder }) => (
    <div className="custom-date-input" onClick={onClick}>
      <Calendar size={18} className="datepicker-icon" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly
        className="input-field"
        required
      />
    </div>
  );

  const CustomTimeInput = ({ value, onClick, placeholder }) => (
    <div className="custom-date-input" onClick={onClick}>
      <Clock size={18} className="datepicker-icon" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly
        className="input-field"
        required
      />
    </div>
  );

  const CustomDateTimeInput = ({ value, onClick, placeholder }) => (
    <div className="custom-date-input" onClick={onClick}>
      <Calendar size={18} className="datepicker-icon" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly
        className="input-field"
        required
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Donation</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Food Title Section */}
          <div className="form-section">
            <div className="input-group">
              <label className="input-label">Food name</label>
              <input
                type="text"
                name="foodName"
                value={formData.foodName}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Vegetable Lasagna"
                required
              />
            </div>
          </div>

          {/* Food Type & Expiry Date Section */}
          <div className="form-section">
            <div className="row-group">
              <div className="input-group half-width">
                <label className="input-label" htmlFor="foodType">Food Type</label>
                <Select
                  name="foodType"
                  options={foodTypeOptions}
                  value={foodTypeOptions.find(option => option.value === formData.foodType)}
                  onChange={(selectedOption) =>
                    setFormData(prev => ({ ...prev, foodType: selectedOption.value }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select food type"
                  required
                />
              </div>

              <div className="input-group half-width">
                <label className="input-label">Expiry Date</label>
                <DatePicker
                  selected={formData.expiryDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, expiryDate: date }))}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select expiry date"
                  customInput={<CustomDateInput placeholder="Select expiry date" />}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantity Section */}
          <div className="form-section">
            <div className="row-group">
              <div className="input-group half-width">
                <label className="input-label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
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
                  name="unit"
                  options={unitOptions}
                  value={unitOptions.find(option => option.value === formData.unit)}
                  onChange={(selectedOption) =>
                    setFormData(prev => ({ ...prev, unit: selectedOption.value }))
                  }
                  classNamePrefix="react-select"
                  placeholder="Select unit"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pickup Time Section */}
          <div className="form-section">
            <div className="row-group">
              <div className="input-group half-width">
                <label className="input-label">From</label>
                <DatePicker
                  selected={formData.pickupFrom}
                  onChange={(date) => setFormData(prev => ({ ...prev, pickupFrom: date }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  placeholderText="Select date and time"
                  customInput={<CustomDateTimeInput placeholder="Select date and time" />}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group half-width">
                <label className="input-label">To</label>
                <DatePicker
                  selected={formData.pickupTo}
                  onChange={(date) => setFormData(prev => ({ ...prev, pickupTo: date }))}
                  showTimeSelect
                  showTimeSelectOnly
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  placeholderText="Select end time"
                  customInput={<CustomTimeInput placeholder="Select end time" />}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pickup Location Section */}
          <div className="form-section">
            <div className="input-group">
              <label className="input-label">Pickup location</label>
              <Autocomplete
                onLoad={onLoadAutocomplete}
                onPlaceChanged={onPlaceChanged}
                options={{
                  types: ['geocode', 'establishment'],
                  fields: ['formatted_address', 'name', 'geometry']
                }}
              >
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Start typing to search the location"
                  required
                />
              </Autocomplete>
            </div>
          </div>

          {/* Notes Section */}
          <div className="form-section">
            <div className="input-group">
              <label className="input-label">Food description</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field textarea"
                placeholder='e.g.,Vegetarian lasagna made with tomato sauce, spinach, and ricotta cheese.'
                rows="4"
                required
              />
            </div>
          </div>

          {/* Messages */}
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Footer Buttons */}
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={handleCancel}>
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