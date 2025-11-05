import React, { useState, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import DatePicker from "react-datepicker";
import { Filter, X, ChevronDown, MapPin, Check } from "lucide-react";
import "./FiltersPanel.css";

// Updated food categories to match backend enums exactly
const FOOD_CATEGORIES = [
  { value: "Fruits & Vegetables", label: "Fruits & Vegetables" },
  { value: "Bakery & Pastry", label: "Bakery & Pastry" },
  { value: "Packaged / Pantry Items", label: "Packaged / Pantry Items" },
  { value: "Dairy & Cold Items", label: "Dairy & Cold Items" },
  { value: "Frozen Food", label: "Frozen Food" },
  { value: "Prepared Meals", label: "Prepared Meals" },
];

// Custom Date Picker Component using react-datepicker
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  // Convert string date to Date object if value exists
  const dateValue = value ? new Date(value) : null;

  return (
    <div className="custom-date-picker">
      <DatePicker
        selected={dateValue}
        onChange={(date) => {
          // Convert Date object to YYYY-MM-DD string format
          if (date) {
            const formattedDate = date.toISOString().split("T")[0];
            onChange(formattedDate);
          } else {
            onChange("");
          }
        }}
        minDate={new Date()}
        dateFormat="MMM d, yyyy"
        placeholderText={placeholder || "Select date"}
        className="date-picker-input"
      />
    </div>
  );
};

// Custom Multi-Select Component
const CustomMultiSelect = ({
  options,
  selectedValues,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionToggle = (optionValue) => {
    const newSelected = selectedValues.includes(optionValue)
      ? selectedValues.filter((val) => val !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
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
        <ChevronDown
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className="multi-select-dropdown">
          {options.map((option) => (
            <label key={option.value} className="multi-select-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleOptionToggle(option.value)}
              />
              <span className="checkmark">
                {selectedValues.includes(option.value) && (
                  <Check size={12} strokeWidth={3} />
                )}
              </span>
              <span className="option-text">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const FiltersPanel = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  appliedFilters = {},
  onClearFilters,
  isVisible = true,
  onClose,
}) => {
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
    if (filterType === "foodType" && value && appliedFilters?.foodType) {
      const newFoodTypes = appliedFilters.foodType.filter(
        (type) => type !== value
      );
      onFiltersChange(filterType, newFoodTypes);
    } else if (filterType === "distance") {
      onFiltersChange(filterType, 10); // Reset to default
    } else if (filterType === "location") {
      // Clear both location string and coordinates
      onFiltersChange(filterType, "");
      onFiltersChange("locationCoords", null);
    } else {
      onFiltersChange(filterType, "");
    }
    // Auto-apply when removing filters
    setTimeout(() => onApplyFilters(), 100);
  };

  const handlePlaceSelect = () => {
    const autocomplete = autocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        // Get both address and coordinates
        const address = place.formatted_address || place.name || "";
        const location = place.geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng(),
          address: address,
        };

        // Store both the display address and coordinates
        handleFilterChange("location", address);
        handleFilterChange("locationCoords", coords);
      } else if (place && place.formatted_address) {
        handleFilterChange("location", place.formatted_address);
      } else if (place && place.name) {
        handleFilterChange("location", place.name);
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
          <Filter className="filter-icon" size={16} />
          <span className="filters-title">Filter Donations</span>
        </div>
        {onClose && (
          <button className="close-filters-btn" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="filters-content">
        <div className="filters-row">
          {/* Food Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Food Type</label>
            <CustomMultiSelect
              options={FOOD_CATEGORIES.filter(
                (category) => category.value !== ""
              )}
              selectedValues={filters.foodType || []}
              onChange={(selected) => handleFilterChange("foodType", selected)}
              placeholder="Select food types..."
            />
          </div>

          {/* Expiry Date Filter */}
          <div className="filter-group">
            <label className="filter-label">Best before</label>
            <CustomDatePicker
              value={filters.expiryBefore}
              onChange={(date) => handleFilterChange("expiryBefore", date)}
              placeholder="Select date"
            />
          </div>

          {/* Distance Filter */}
          <div className="filter-group">
            <div className="distance-label-row">
              <label className="filter-label">Distance:</label>
              <span className="distance-display">
                {filters.distance || 10} km
              </span>
            </div>
            <div className="distance-filter">
              <input
                type="range"
                className="distance-slider"
                min="1"
                max="50"
                value={filters.distance || 10}
                onChange={(e) =>
                  handleFilterChange("distance", parseInt(e.target.value))
                }
                style={{
                  background: `linear-gradient(to right, #1B4965 0%, #1B4965 ${(((filters.distance || 10) - 1) / 49) * 100
                    }%, #e9ecef ${(((filters.distance || 10) - 1) / 49) * 100
                    }%, #e9ecef 100%)`,
                }}
              />
            </div>
          </div>

          {/* Location Filter */}
          {/* Location Filter */}
          <div className="filter-group">
            <label className="filter-label">Location</label>
            <div className="location-input-container">
              <MapPin className="location-icon" size={16} color="#717182" />
              <Autocomplete
                onLoad={(autocomplete) =>
                  (autocompleteRef.current = autocomplete)
                }
                onPlaceChanged={handlePlaceSelect}
                types={["(regions)"].concat(["establishment"])}
                componentRestrictions={{ country: ["us", "ca"] }}
              >
                <input
                  type="text"
                  className="location-input"
                  placeholder="Enter location..."
                  value={filters.location || ""}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                />
              </Autocomplete>
            </div>
          </div>
        </div>

        {/* Applied Filters and Action Buttons */}
        <div className="filter-actions">
          <div className="left-section">
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear All
            </button>

            {/* Applied Filters Tags */}
            <div className="applied-tags">
              {/* Food Type Tags */}
              {(appliedFilters.foodType || []).map((foodType) => {
                const category = FOOD_CATEGORIES.find(
                  (cat) => cat.value === foodType
                );
                return (
                  <div key={`food-${foodType}`} className="filter-tag">
                    <span className="tag-text">
                      {category?.label || foodType}
                    </span>
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveFilter("foodType", foodType)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}

              {appliedFilters.expiryBefore && (
                <div className="filter-tag">
                  <span className="tag-text">
                    Before: {appliedFilters.expiryBefore}
                  </span>
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveFilter("expiryBefore")}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {appliedFilters.distance && appliedFilters.distance !== 10 && (
                <div className="filter-tag">
                  <span className="tag-text">
                    Within: {appliedFilters.distance}km
                  </span>
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveFilter("distance")}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {appliedFilters.location && (
                <div className="filter-tag">
                  <span className="tag-text">
                    Near: {appliedFilters.location}
                  </span>
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveFilter("location")}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="right-section">
            <button className="apply-filters-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
