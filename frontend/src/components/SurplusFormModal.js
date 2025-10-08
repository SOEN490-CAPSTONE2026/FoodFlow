import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import "../style/SurplusFormModal.css";

const SurplusFormModal = ({ isOpen, onClose }) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/api/surplus',
        formData,
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

      //Modal closes after successful submission
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
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
                <label className="input-label">Food Type</label>
                <select
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Select food type"
                  required
                >
                  <option value="Bakery & Pastry">Bakery & Pastry</option>
                  <option value="Fruits">Fruits & Vegetables</option>
                  <option value="Vegetables">Packaged / Pantry Items</option>
                  <option value="Dairy">Dairy & Cold Items</option>
                  <option value="Frozen Food">Frozen Food</option>
                  <option value="Prepared Meals">Prepared Meals</option>
                </select>
              </div>

              <div className="input-group half-width">
                <label className="input-label">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
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
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="kg">kg</option>
                  <option value="items">items</option>
                  <option value="liters">liters</option>
                  <option value="lbs">lbs</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pickup Time Section */}
          <div className="form-section">
            <div className="row-group">
              <div className="input-group half-width">
                <label className="input-label">From</label>
                <input
                  type="datetime-local"
                  name="pickupFrom"
                  value={formData.pickupFrom}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group half-width">
                <label className="input-label">To</label>
                <input
                  type="time"
                  name="pickupTo"
                  value={formData.pickupTo}
                  onChange={handleChange}
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
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="Start typing to search the location"
                required
              />
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
                placeholder='Example: "Vegetarian lasagna made with tomato sauce, spinach, and ricotta cheese."'
                rows="4"
                required
              />
              <p className="example-text">
                Example: "Vegetarian lasagna made with tomato sauce, spinach, and ricotta cheese."
              </p>
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