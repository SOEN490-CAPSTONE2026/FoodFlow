import React, { useState } from 'react';
import { LoadScript } from "@react-google-maps/api";
import FiltersPanel from './FiltersPanel';
import './ReceiverBrowse.css';

// Google Maps libraries needed for Places API
const libraries = ['places'];

const ReceiverBrowse = () => {
  const [filters, setFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: ''
  });

  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  const handleFiltersChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    // TODO: Implement filter application logic
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      foodType: [],
      expiryBefore: null,
      distance: 10,
      location: ''
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const handleToggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const handleCloseFilters = () => {
    setIsFiltersVisible(false);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
      onError={(error) => console.error("Google Maps API failed to load:", error)}
    >
      <div className="receiver-browse">
        {/* Mobile Filter Toggle Button */}
        {!isFiltersVisible && (
          <button className="mobile-filter-toggle" onClick={handleToggleFilters}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
            </svg>
            <span>Filters</span>
          </button>
        )}
        
        <FiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          appliedFilters={appliedFilters}
          onClearFilters={handleClearFilters}
          isVisible={isFiltersVisible}
          onClose={handleCloseFilters}
        />
      </div>
    </LoadScript>
  );
};

export default ReceiverBrowse;