import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { foodTypeOptions } from '../../constants/foodConstants';
import './Receiver_Styles/ReceiverPreferences.css';



const ReceiverPreferences = ({ isOpen, onClose, onSave }) => {
  const [preferences, setPreferences] = useState({
    preferredCategories: [],
    storageCapacity: '',
    quantityMin: '',
    quantityMax: '',
    pickupAvailability: 'Evening',
    acceptsRefrigerated: false,
    acceptsFrozen: false,
    noStrictPreferences: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const handleCategoryToggle = (category) => {
    setPreferences(prev => {
      const categories = prev.preferredCategories.find(c => c.value === category.value)
        ? prev.preferredCategories.filter(c => c.value !== category.value)
        : [...prev.preferredCategories, category];
      return { ...prev, preferredCategories: categories };
    });
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNoPreferencesToggle = () => {
    setPreferences(prev => ({ ...prev, noStrictPreferences: !prev.noStrictPreferences }));
  };

  const handlePickupAvailabilityChange = (time) => {
    setPreferences(prev => ({ ...prev, pickupAvailability: time }));
  };

  const handleFoodHandlingToggle = (field) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate quantity range
      if (preferences.quantityMin && preferences.quantityMax) {
        if (parseInt(preferences.quantityMin) > parseInt(preferences.quantityMax)) {
          setError('Minimum quantity cannot be greater than maximum quantity');
          setLoading(false);
          return;
        }
      }

      console.log('Saving preferences:', preferences);
      
      if (onSave) {
        onSave(preferences);
      }
      onClose();
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-overlay" onClick={handleCancel}>
      <div className="preferences-panel" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <div>
            <h2>Receiver Preferences</h2>
            <p>Set your organization's needs to improve food matching.</p>
          </div>
          <button className="close-btn" onClick={handleCancel} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="preferences-body">
          {error && <div className="error-message">{error}</div>}

          {/* Preferred Food Categories */}
          <div className="preference-field" ref={dropdownRef}>
            <label>Preferred Food Categories</label>
            <div className="category-select" onClick={() => {
              console.log('Toggling dropdown, current state:', showCategoryDropdown);
              setShowCategoryDropdown(!showCategoryDropdown);
            }}>
              <input
                type="text"
                readOnly
                value={preferences.preferredCategories.length > 0 
                  ? `${preferences.preferredCategories.length} categories selected`
                  : 'Select food categories...'}
                placeholder="Select food categories..."
              />
              <span className="dropdown-arrow">▼</span>
            </div>
            
            {showCategoryDropdown && (
              <div className="category-dropdown">
                {foodTypeOptions.map(category => (
                  <label key={category.value} className="category-option">
                    <input
                      type="checkbox"
                      checked={preferences.preferredCategories.some(c => c.value === category.value)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <span>{category.label}</span>
                  </label>
                ))}
              </div>
            )}
            
            {preferences.preferredCategories.length > 0 && (
              <div className="selected-categories">
                {preferences.preferredCategories.map(category => (
                  <span key={category.value} className="category-tag">
                    {category.label}
                    <button onClick={() => handleCategoryToggle(category)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Storage Capacity */}
          <div className="preference-field">
            <label>Storage Capacity (items)</label>
            <input
              type="number"
              placeholder="Enter storage capacity"
              value={preferences.storageCapacity}
              onChange={(e) => handleInputChange('storageCapacity', e.target.value)}
              min="0"
            />
          </div>

          {/* Quantity Range */}
          <div className="preference-field">
            <label>Quantity Range</label>
            <div className="quantity-range">
              <input
                type="number"
                placeholder="Min"
                value={preferences.quantityMin}
                onChange={(e) => handleInputChange('quantityMin', e.target.value)}
                min="0"
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                placeholder="Max"
                value={preferences.quantityMax}
                onChange={(e) => handleInputChange('quantityMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Pickup Availability */}
          <div className="preference-field">
            <label>Pickup Availability</label>
            <div className="pickup-availability">
              <button
                type="button"
                className={`pickup-btn ${preferences.pickupAvailability === 'Morning' ? 'active' : ''}`}
                onClick={() => handlePickupAvailabilityChange('Morning')}
              >
                Morning
              </button>
              <button
                type="button"
                className={`pickup-btn ${preferences.pickupAvailability === 'Afternoon' ? 'active' : ''}`}
                onClick={() => handlePickupAvailabilityChange('Afternoon')}
              >
                Afternoon
              </button>
              <button
                type="button"
                className={`pickup-btn ${preferences.pickupAvailability === 'Evening' ? 'active' : ''}`}
                onClick={() => handlePickupAvailabilityChange('Evening')}
              >
                Evening
              </button>
            </div>
          </div>

          {/* Food Handling Requirements */}
          <div className="preference-field">
            <label>Food Handling Requirements</label>
            <div className="food-handling">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.acceptsRefrigerated}
                  onChange={() => handleFoodHandlingToggle('acceptsRefrigerated')}
                />
                <span>Accepts Refrigerated Items</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.acceptsFrozen}
                  onChange={() => handleFoodHandlingToggle('acceptsFrozen')}
                />
                <span>Accepts Frozen Items</span>
              </label>
            </div>
          </div>

          {/* No Strict Preferences */}
          <div className="preference-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.noStrictPreferences}
                onChange={handleNoPreferencesToggle}
              />
              <span>No strict preferences (allow all food types)</span>
            </label>
          </div>
        </div>

        <div className="preferences-footer">
          <button 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiverPreferences;
