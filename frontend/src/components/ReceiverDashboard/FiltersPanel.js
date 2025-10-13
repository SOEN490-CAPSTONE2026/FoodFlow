import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import './FiltersPanel.css';

const FOOD_CATEGORIES = [
    { value: 'Bakery & Pastry', label: 'Bakery & Pastry' },
    { value: 'Fruits', label: 'Fruits & Vegetables' },
    { value: 'Packaged', label: 'Packaged / Pantry Items' },
    { value: 'Dairy', label: 'Dairy & Cold Items' },
    { value: 'Frozen Food', label: 'Frozen Food' },
    { value: 'Prepared Meals', label: 'Prepared Meals' }
];

// Custom Date Picker Component - Simple Version
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  return (
    <div className="custom-date-picker">
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="date-picker-input"
        placeholder={placeholder}
      />
    </div>
  );
};

// Custom Multi-Select Component
const CustomMultiSelect = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionToggle = (optionValue) => {
    const newSelected = selectedValues.includes(optionValue)
      ? selectedValues.filter(val => val !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="custom-multi-select">
      <button
        type="button"
        className="multi-select-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selected-text">{getDisplayText()}</span>
        <svg className={`dropdown-arrow ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="multi-select-dropdown">
          {options.map(option => (
            <label key={option.value} className="multi-select-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleOptionToggle(option.value)}
              />
              <span className="checkmark"></span>
              <span className="option-text">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const FiltersPanel = ({ filters, onFiltersChange, onApplyFilters, appliedFilters = {}, onClearFilters, isVisible = true, onClose }) => {
  const autocompleteRef = useRef(null);

  const handleFilterChange = (filterType, value) => {
    onFiltersChange(filterType, value);
  };

  const handleApplyFilters = () => {
    onApplyFilters();
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  const handleRemoveFilter = (filterType, value = null) => {
    if (filterType === 'foodType' && value && appliedFilters?.foodType) {
      const newFoodTypes = appliedFilters.foodType.filter(type => type !== value);
      onFiltersChange(filterType, newFoodTypes);
    } else if (filterType === 'distance') {
      onFiltersChange(filterType, 10); // Reset to default
    } else {
      onFiltersChange(filterType, '');
    }
    // Auto-apply when removing filters
    setTimeout(() => onApplyFilters(), 100);
  };

  const handlePlaceSelect = () => {
    const autocomplete = autocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        handleFilterChange('location', place.formatted_address);
      } else if (place && place.name) {
        handleFilterChange('location', place.name);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <div className="header-left">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
          </svg>
          <span className="filters-title">Filter Donations</span>
        </div>
        {onClose && (
          <button className="close-filters-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      <div className="filters-content">
        <div className="filters-row">
          {/* Food Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Food Type</label>
            <CustomMultiSelect
              options={FOOD_CATEGORIES.filter(category => category.value !== '')}
              selectedValues={filters.foodType || []}
              onChange={(selected) => handleFilterChange('foodType', selected)}
              placeholder="Select food types..."
            />
          </div>

          {/* Expiry Date Filter */}
          <div className="filter-group">
            <label className="filter-label">Best before</label>
            <CustomDatePicker
              value={filters.expiryBefore}
              onChange={(date) => handleFilterChange('expiryBefore', date)}
              placeholder="Select date"
            />
          </div>

          {/* Distance Filter */}
          <div className="filter-group">
            <label className="filter-label">Distance</label>
            <div className="distance-filter">
              <input
                type="range"
                className="distance-slider"
                min="1"
                max="50"
                value={filters.distance || 10}
                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #1B4965 0%, #1B4965 ${((filters.distance || 10) - 1) / 49 * 100}%, #e9ecef ${((filters.distance || 10) - 1) / 49 * 100}%, #e9ecef 100%)`
                }}
              />
              <div className="distance-display">
                {filters.distance || 10} km
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <label className="filter-label">Location</label>
            <div className="location-input-container">
              {typeof window !== 'undefined' && window.google ? (
                <Autocomplete
                  onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                  onPlaceChanged={handlePlaceSelect}
                  types={['(regions)'].concat(['establishment'])}
                  componentRestrictions={{ country: 'us' }}
                >
                  <input
                    type="text"
                    className="location-input"
                    placeholder="Enter location..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  className="location-input"
                  placeholder="Enter location..."
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              )}
              <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        </div>

        {/* Applied Filters and Action Buttons */}
        <div className="filter-actions">
          <div className="left-section">
            <button 
              className="clear-filters-btn"
              onClick={handleClearFilters}
            >
              Clear All
            </button>
            
            {/* Applied Filters Tags */}
            <div className="applied-tags">
              {/* Food Type Tags */}
              {(appliedFilters.foodType || []).map(foodType => {
                const category = FOOD_CATEGORIES.find(cat => cat.value === foodType);
                return (
                  <div key={`food-${foodType}`} className="filter-tag">
                    <span className="tag-text">{category?.label || foodType}</span>
                    <button 
                      className="tag-remove"
                      onClick={() => handleRemoveFilter('foodType', foodType)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                );
              })}
              
              {appliedFilters.expiryBefore && (
                <div className="filter-tag">
                  <span className="tag-text">Before: {appliedFilters.expiryBefore}</span>
                  <button 
                    className="tag-remove"
                    onClick={() => handleRemoveFilter('expiryBefore')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
              
              {appliedFilters.distance && appliedFilters.distance !== 10 && (
                <div className="filter-tag">
                  <span className="tag-text">Within: {appliedFilters.distance}km</span>
                  <button 
                    className="tag-remove"
                    onClick={() => handleRemoveFilter('distance')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
              
              {appliedFilters.location && (
                <div className="filter-tag">
                  <span className="tag-text">Near: {appliedFilters.location}</span>
                  <button 
                    className="tag-remove"
                    onClick={() => handleRemoveFilter('location')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="right-section">
            <button 
              className="apply-filters-btn"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;