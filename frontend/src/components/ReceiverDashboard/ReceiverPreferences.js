import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { foodTypeOptions } from '../../constants/foodConstants';
import api from '../../services/api';
import './Receiver_Styles/ReceiverPreferences.css';

const PICKUP_WINDOWS = ['MORNING', 'AFTERNOON', 'EVENING'];

const ReceiverPreferences = ({ isOpen, onClose, onSave }) => {
  const [preferences, setPreferences] = useState({
    preferredCategories: [],
    storageCapacity: 50,
    quantityMin: 0,
    quantityMax: 100,
    pickupAvailability: ['EVENING'],
    acceptsRefrigerated: true,
    acceptsFrozen: true,
    notificationPreferencesEnabled: true,
    noStrictPreferences: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Load existing preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receiver/preferences');
      if (response.data) {
        setPreferences({
          preferredCategories: (response.data.preferredFoodTypes || []).map(type => 
            foodTypeOptions.find(cat => cat.value === type) || { value: type, label: type }
          ),
          storageCapacity: response.data.maxCapacity || 50,
          quantityMin: response.data.minQuantity || 0,
          quantityMax: response.data.maxQuantity || 100,
          pickupAvailability: response.data.preferredPickupWindows || ['EVENING'],
          acceptsRefrigerated: response.data.acceptRefrigerated !== undefined ? response.data.acceptRefrigerated : true,
          acceptsFrozen: response.data.acceptFrozen !== undefined ? response.data.acceptFrozen : true,
          notificationPreferencesEnabled: response.data.notificationPreferencesEnabled !== undefined ? response.data.notificationPreferencesEnabled : true,
          noStrictPreferences: (response.data.preferredFoodTypes || []).length === 0
        });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

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
    setPreferences(prev => {
      const windows = prev.pickupAvailability.includes(time)
        ? prev.pickupAvailability.filter(w => w !== time)
        : [...prev.pickupAvailability, time];
      return { ...prev, pickupAvailability: windows };
    });
  };

  const handleFoodHandlingToggle = (field) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // Validate quantity range
      const minQty = parseInt(preferences.quantityMin) || 0;
      const maxQty = parseInt(preferences.quantityMax) || 0;
      
      if (minQty > maxQty) {
        setError('Minimum quantity cannot be greater than maximum quantity');
        setLoading(false);
        return;
      }

      // Prepare data for backend
      const requestData = {
        preferredFoodTypes: preferences.noStrictPreferences ? [] : preferences.preferredCategories.map(c => c.value),
        maxCapacity: parseInt(preferences.storageCapacity) || 50,
        minQuantity: minQty,
        maxQuantity: maxQty,
        preferredPickupWindows: preferences.pickupAvailability,
        acceptRefrigerated: preferences.acceptsRefrigerated,
        acceptFrozen: preferences.acceptsFrozen,
        notificationPreferencesEnabled: preferences.notificationPreferencesEnabled
      };

      console.log('Saving preferences to backend:', requestData);
      
      // Try PUT first (update), if it fails try POST (create)
      try {
        await api.put('/receiver/preferences', requestData);
      } catch (putError) {
        if (putError.response?.status === 404 || putError.response?.status === 409) {
          await api.post('/receiver/preferences', requestData);
        } else {
          throw putError;
        }
      }
      
      setSuccess(true);
      
      if (onSave) {
        onSave(preferences);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.response?.data?.message || 'Failed to save preferences');
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
          {success && <div className="success-message">Preferences saved successfully!</div>}

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
            <label>Pickup Availability (select multiple)</label>
            <div className="pickup-availability">
              {PICKUP_WINDOWS.map(window => (
                <button
                  key={window}
                  type="button"
                  className={`pickup-btn ${preferences.pickupAvailability.includes(window) ? 'active' : ''}`}
                  onClick={() => handlePickupAvailabilityChange(window)}
                >
                  {window.charAt(0) + window.slice(1).toLowerCase()}
                </button>
              ))}
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

          {/* Smart Notifications */}
          <div className="preference-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.notificationPreferencesEnabled}
                onChange={() => handleInputChange('notificationPreferencesEnabled', !preferences.notificationPreferencesEnabled)}
              />
              <span>Smart Notifications - Only notify me about matching donations</span>
            </label>
            <small style={{marginLeft: '24px', color: '#666', display: 'block', marginTop: '4px'}}>
              When enabled, you'll only receive notifications for donations that match your preferences and fit within your capacity.
            </small>
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
