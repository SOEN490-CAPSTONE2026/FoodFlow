import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { foodTypeOptions } from '../../constants/foodConstants';
import api from '../../services/api';
import './Receiver_Styles/ReceiverPreferences.css';

const PICKUP_WINDOWS = ['MORNING', 'AFTERNOON', 'EVENING'];

const PICKUP_WINDOW_META = {
  MORNING: { label: 'Morning', time: '8:00 AM – 12:00 PM' },
  AFTERNOON: { label: 'Afternoon', time: '12:00 PM – 7:00 PM' },
  EVENING: { label: 'Evening', time: '7:00 PM – 12:00 AM' },
};

const DONATION_SIZES = ['SMALL', 'MEDIUM', 'LARGE', 'BULK'];

const DONATION_SIZE_META = {
  SMALL: { label: 'Small donations', tooltip: '1–5 small portions OR <3kg' },
  MEDIUM: { label: 'Medium donations', tooltip: '5–20 portions OR 3–10kg' },
  LARGE: { label: 'Large donations', tooltip: '20–50 portions OR 10–25kg' },
  BULK: { label: 'Bulk donations', tooltip: '50+ portions OR >25kg' },
};

// Custom Tooltip component
function Tooltip({ children, text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#222',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

const ReceiverPreferences = ({ isOpen, onClose, onSave }) => {
  const [preferences, setPreferences] = useState({
    preferredCategories: [],
    preferredDonationSizes: [],
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
          preferredDonationSizes: response.data.preferredDonationSizes || [],
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
      // If "No strict preferences" is checked, uncheck it when user manually selects/deselects
      let newNoStrict = prev.noStrictPreferences;
      let categories;
      if (prev.preferredCategories.find(c => c.value === category.value)) {
        categories = prev.preferredCategories.filter(c => c.value !== category.value);
      } else {
        categories = [...prev.preferredCategories, category];
      }
      if (prev.noStrictPreferences) {
        newNoStrict = false;
      }
      return { ...prev, preferredCategories: categories, noStrictPreferences: newNoStrict };
    });
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNoPreferencesToggle = () => {
    setPreferences(prev => {
      const newValue = !prev.noStrictPreferences;
      return {
        ...prev,
        noStrictPreferences: newValue,
        preferredCategories: newValue ? [...foodTypeOptions] : [],
      };
    });
  };

  const handlePickupAvailabilityChange = (time) => {
    setPreferences(prev => {
      const windows = prev.pickupAvailability.includes(time)
        ? prev.pickupAvailability.filter(w => w !== time)
        : [...prev.pickupAvailability, time];
      return { ...prev, pickupAvailability: windows };
    });
  };

  const handleDonationSizeChange = (size) => {
    setPreferences(prev => {
      const sizes = prev.preferredDonationSizes.includes(size)
        ? prev.preferredDonationSizes.filter(s => s !== size)
        : [...prev.preferredDonationSizes, size];
      return { ...prev, preferredDonationSizes: sizes };
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

      // Prepare data for backend
      const requestData = {
        preferredFoodTypes: preferences.noStrictPreferences ? [] : preferences.preferredCategories.map(c => c.value),
        preferredDonationSizes: preferences.preferredDonationSizes,
        preferredPickupWindows: preferences.pickupAvailability,
        acceptRefrigerated: preferences.acceptsRefrigerated,
        acceptFrozen: preferences.acceptsFrozen,
        notificationPreferencesEnabled: preferences.notificationPreferencesEnabled,
        // TODO: Remove these once backend makes them optional - they're legacy fields
        maxCapacity: 100,
        minQuantity: 0,
        maxQuantity: 1000
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
              setShowCategoryDropdown(!showCategoryDropdown);
            }}>
              <input
                type="text"
                readOnly
                value={preferences.noStrictPreferences
                  ? 'All food categories selected'
                  : preferences.preferredCategories.length > 0 
                    ? `${preferences.preferredCategories.length} categories selected`
                    : 'Select food categories...'}
                placeholder="Select food categories..."
              />
              <span className="dropdown-arrow">▼</span>
            </div>

            {/* No Strict Preferences Checkbox (moved here) */}
            <div className="checkbox-field" style={{marginTop: '8px'}}>
              <div className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.noStrictPreferences}
                  onChange={handleNoPreferencesToggle}
                />
                <span className="checkbox-text">
                  No strict preferences (allow all food types)
                </span>
              </div>
            </div>

            {showCategoryDropdown && !preferences.noStrictPreferences && (
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

            {preferences.preferredCategories.length > 0 && !preferences.noStrictPreferences && (
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

          {/* Preferred Donation Size */}
          <div className="preference-field">
            <label>Preferred Donation Size (choose all that apply)</label>
            <div className="donation-sizes">
              {DONATION_SIZES.map(size => {
                const meta = DONATION_SIZE_META[size];
                const isSelected = preferences.preferredDonationSizes.includes(size);
                return (
                  <Tooltip key={size} text={meta.tooltip}>
                    <button
                      type="button"
                      className={`size-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleDonationSizeChange(size)}
                    >
                      {meta.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Pickup Availability */}
          <div className="preference-field">
            <label>Pickup Availability (select multiple)</label>
            <div className="pickup-availability">
              {PICKUP_WINDOWS.map((window) => {
                const isActive = preferences.pickupAvailability.includes(window);
                const meta = PICKUP_WINDOW_META[window];

                return (
                  <button
                    key={window}
                    type="button"
                    className={`pickup-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handlePickupAvailabilityChange(window)}
                    title={meta.time}
                  >
                    {isActive ? meta.time : meta.label}
                  </button>
                );
              })}
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

          {/* ...removed No Strict Preferences from here... */}
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
