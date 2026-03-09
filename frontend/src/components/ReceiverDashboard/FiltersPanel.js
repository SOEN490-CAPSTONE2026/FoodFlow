import React, { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import DatePicker from 'react-datepicker';
import {
  Filter,
  X,
  ChevronDown,
  MapPin,
  Check,
  Navigation,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Receiver_Styles/FiltersPanel.css';

// Updated food categories to match backend enums exactly
const FOOD_CATEGORIES = [
  {
    value: 'Fruits & Vegetables',
    labelKey: 'filtersPanel.foodCategories.fruitsVegetables',
  },
  {
    value: 'Bakery & Pastry',
    labelKey: 'filtersPanel.foodCategories.bakeryPastry',
  },
  {
    value: 'Packaged / Pantry Items',
    labelKey: 'filtersPanel.foodCategories.packagedPantry',
  },
  {
    value: 'Dairy & Cold Items',
    labelKey: 'filtersPanel.foodCategories.dairyCold',
  },
  { value: 'Frozen Food', labelKey: 'filtersPanel.foodCategories.frozen' },
  {
    value: 'Prepared Meals',
    labelKey: 'filtersPanel.foodCategories.preparedMeals',
  },
];

// Custom Date Picker Component using react-datepicker
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  // Convert string date to Date object if value exists
  const dateValue = value ? new Date(value) : null;

  return (
    <div className="custom-date-picker">
      <DatePicker
        selected={dateValue}
        onChange={date => {
          // Convert Date object to YYYY-MM-DD string format
          if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            onChange(formattedDate);
          } else {
            onChange('');
          }
        }}
        minDate={new Date()}
        dateFormat="MMM d, yyyy"
        placeholderText={placeholder || 'Select date'}
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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionToggle = optionValue => {
    const newSelected = selectedValues.includes(optionValue)
      ? selectedValues.filter(val => val !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }
    return t('filtersPanel.selectedCount', { count: selectedValues.length });
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
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          size={16}
        />
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
  accountLocation = null,
  countryRestriction = '',
}) => {
  const { t } = useTranslation();
  const autocompleteRef = useRef(null);
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const autocompleteCountryRestriction = countryRestriction
    ? { country: countryRestriction }
    : undefined;

  // Translate food categories
  const translatedCategories = FOOD_CATEGORIES.map(cat => ({
    value: cat.value,
    label: t(cat.labelKey),
  }));

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
      const newFoodTypes = appliedFilters.foodType.filter(
        type => type !== value
      );
      onFiltersChange(filterType, newFoodTypes);
    } else if (filterType === 'distance') {
      onFiltersChange(filterType, 10); // Reset to default
    } else if (filterType === 'location') {
      if (accountLocation) {
        onFiltersChange('location', accountLocation.address || '');
        onFiltersChange('locationCoords', accountLocation);
        onFiltersChange('locationSource', 'account');
      } else {
        // Clear both location string and coordinates
        onFiltersChange(filterType, '');
        onFiltersChange('locationCoords', null);
        onFiltersChange('locationSource', 'manual');
      }
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
      if (place && place.geometry && place.geometry.location) {
        // Get both address and coordinates
        const address = place.formatted_address || place.name || '';
        const location = place.geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng(),
          address: address,
          formattedAddress: place.formatted_address || address,
          placeId: place.place_id || '',
          addressComponents: place.address_components || [],
        };

        // Store both the display address and coordinates
        handleFilterChange('location', address);
        handleFilterChange('locationCoords', coords);
        handleFilterChange('locationSource', 'manual');
        setLocationError('');
      } else if (place && place.formatted_address) {
        handleFilterChange('location', place.formatted_address);
        handleFilterChange('locationSource', 'manual');
      } else if (place && place.name) {
        handleFilterChange('location', place.name);
        handleFilterChange('locationSource', 'manual');
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        t(
          'filtersPanel.currentLocationUnsupported',
          'Current location is not supported in this browser.'
        )
      );
      return;
    }

    setLoadingCurrentLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const geocoder = window.google?.maps
          ? new window.google.maps.Geocoder()
          : null;

        if (!geocoder) {
          const fallbackAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          handleFilterChange('location', fallbackAddress);
          handleFilterChange('locationCoords', {
            lat: latitude,
            lng: longitude,
            address: fallbackAddress,
          });
          handleFilterChange('locationSource', 'current');
          setLoadingCurrentLocation(false);
          return;
        }

        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            const topResult =
              status === 'OK' && Array.isArray(results) && results[0]
                ? results[0]
                : null;
            const address =
              topResult?.formatted_address ||
              `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

            handleFilterChange('location', address);
            handleFilterChange('locationCoords', {
              lat: latitude,
              lng: longitude,
              address,
              formattedAddress: topResult?.formatted_address || address,
              placeId: topResult?.place_id || '',
              addressComponents: topResult?.address_components || [],
            });
            handleFilterChange('locationSource', 'current');
            setLoadingCurrentLocation(false);
          }
        );
      },
      () => {
        setLocationError(
          t(
            'filtersPanel.currentLocationFailed',
            'Unable to get current location. Please try another address.'
          )
        );
        setLoadingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleUseAccountAddress = () => {
    if (!accountLocation) {
      return;
    }
    handleFilterChange('location', accountLocation.address || '');
    handleFilterChange('locationCoords', accountLocation);
    handleFilterChange('locationSource', 'account');
    setLocationError('');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="filters-panel">
      <div className="filters-header">
        <div className="header-left">
          <Filter className="filter-icon" size={16} />
          <span className="filters-title">{t('filtersPanel.title')}</span>
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
            <label className="filter-label">
              {t('filtersPanel.foodTypeLabel')}
            </label>
            <CustomMultiSelect
              options={translatedCategories.filter(
                category => category.value !== ''
              )}
              selectedValues={filters.foodType || []}
              onChange={selected => handleFilterChange('foodType', selected)}
              placeholder={t('filtersPanel.selectFoodTypes')}
            />
          </div>

          {/* Expiry Date Filter */}
          <div className="filter-group">
            <label className="filter-label">
              {t('filtersPanel.bestBeforeLabel')}
            </label>
            <CustomDatePicker
              value={filters.expiryBefore}
              onChange={date => handleFilterChange('expiryBefore', date)}
              placeholder={t('filtersPanel.selectDate')}
            />
          </div>

          {/* Distance Filter */}
          <div className="filter-group">
            <div className="distance-label-row">
              <label className="filter-label">
                {t('filtersPanel.distanceLabel')}
              </label>
              <span className="distance-display">
                {filters.distance || 10} {t('filtersPanel.km')}
              </span>
            </div>
            <div className="distance-filter">
              <input
                type="range"
                className="distance-slider"
                min="1"
                max="50"
                value={filters.distance || 10}
                onChange={e =>
                  handleFilterChange('distance', parseInt(e.target.value))
                }
                style={{
                  background: `linear-gradient(to right, #1B4965 0%, #1B4965 ${
                    (((filters.distance || 10) - 1) / 49) * 100
                  }%, #e9ecef ${
                    (((filters.distance || 10) - 1) / 49) * 100
                  }%, #e9ecef 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="location-override-row">
          <div className="location-summary">
            <MapPin className="location-icon-inline" size={14} />
            <span className="location-summary-label">
              {t('filtersPanel.usingAddress', 'Using address')}:
            </span>
            <span className="location-summary-value">
              {filters.location ||
                t('filtersPanel.noAddressSelected', 'No address selected')}
            </span>
          </div>
          <div className="location-summary-actions">
            <button
              type="button"
              className="location-override-btn"
              onClick={() => setShowLocationEditor(true)}
            >
              {t('filtersPanel.useAnotherAddress', 'Use another address')}
            </button>
            {filters.locationSource !== 'account' && accountLocation && (
              <button
                type="button"
                className="location-override-btn location-override-btn--secondary"
                onClick={handleUseAccountAddress}
              >
                {t('filtersPanel.useAccountAddress', 'Use account address')}
              </button>
            )}
          </div>
        </div>

        {showLocationEditor && (
          <div
            className="location-editor-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowLocationEditor(false)}
          >
            <div
              className="location-editor-modal"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                className="location-editor-modal-close"
                onClick={() => setShowLocationEditor(false)}
              >
                <X size={16} />
              </button>

              <div className="location-editor-modal-hero">
                <div className="location-editor-modal-icon">
                  <MapPin size={24} />
                </div>
                <h3>
                  {t('filtersPanel.useAnotherAddress', 'Use another address')}
                </h3>
                <p>
                  {t(
                    'filtersPanel.chooseAddressHint',
                    'Choose your current location or search for another address.'
                  )}
                </p>
              </div>

              <div className="location-editor">
                <div className="location-editor-actions location-choice-actions">
                  <button
                    type="button"
                    className="location-choice-btn location-choice-btn--primary"
                    onClick={handleUseCurrentLocation}
                    disabled={loadingCurrentLocation}
                  >
                    <Navigation size={16} />
                    {loadingCurrentLocation
                      ? t(
                          'filtersPanel.gettingCurrentLocation',
                          'Getting location…'
                        )
                      : t(
                          'filtersPanel.useCurrentLocation',
                          'Use current location'
                        )}
                  </button>
                  {accountLocation && (
                    <button
                      type="button"
                      className="location-choice-btn location-choice-btn--secondary"
                      onClick={handleUseAccountAddress}
                    >
                      <MapPin size={16} />
                      {t(
                        'filtersPanel.useAccountAddress',
                        'Use account address'
                      )}
                    </button>
                  )}
                </div>

                <div className="location-search-card">
                  <div className="location-search-label">
                    <Search size={15} />
                    {t(
                      'filtersPanel.searchAnotherAddress',
                      'Search another address...'
                    )}
                  </div>
                  <div className="location-input-container">
                    <MapPin
                      className="location-icon"
                      size={16}
                      color="#717182"
                    />
                    <Autocomplete
                      onLoad={autocomplete =>
                        (autocompleteRef.current = autocomplete)
                      }
                      onPlaceChanged={handlePlaceSelect}
                      types={['address']}
                      componentRestrictions={autocompleteCountryRestriction}
                    >
                      <input
                        type="text"
                        className="location-input"
                        placeholder={t(
                          'filtersPanel.searchAnotherAddress',
                          'Search another address...'
                        )}
                        value={
                          filters.locationSource === 'manual'
                            ? filters.location || ''
                            : ''
                        }
                        onChange={e => {
                          handleFilterChange('locationSource', 'manual');
                          handleFilterChange('location', e.target.value);
                        }}
                      />
                    </Autocomplete>
                  </div>
                </div>
                {locationError && (
                  <p className="location-error">{locationError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applied Filters and Action Buttons */}
        <div className="filter-actions">
          <div className="left-section">
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              {t('filtersPanel.clearAll')}
            </button>

            {/* Applied Filters Tags */}
            <div className="applied-tags">
              {/* Food Type Tags */}
              {(appliedFilters.foodType || []).map(foodType => {
                const category = translatedCategories.find(
                  cat => cat.value === foodType
                );
                return (
                  <div key={`food-${foodType}`} className="filter-tag">
                    <span className="tag-text">
                      {category?.label || foodType}
                    </span>
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveFilter('foodType', foodType)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}

              {appliedFilters.expiryBefore && (
                <div className="filter-tag">
                  <span className="tag-text">
                    {t('filtersPanel.tagBefore')} {appliedFilters.expiryBefore}
                  </span>
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveFilter('expiryBefore')}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {appliedFilters.distance && appliedFilters.distance !== 10 && (
                <div className="filter-tag">
                  <span className="tag-text">
                    {t('filtersPanel.tagWithin')} {appliedFilters.distance}
                    {t('filtersPanel.km')}
                  </span>
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveFilter('distance')}
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {appliedFilters.location &&
                appliedFilters.locationSource !== 'account' && (
                  <div className="filter-tag">
                    <span className="tag-text">
                      {t('filtersPanel.tagNear')} {appliedFilters.location}
                    </span>
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveFilter('location')}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
            </div>
          </div>

          <div className="right-section">
            <button className="apply-filters-btn" onClick={handleApplyFilters}>
              {t('filtersPanel.applyFilters')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
