import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, List } from 'lucide-react';
import DonationMap from './DonationMap';
import LocationPermission from './LocationPermission';
import DistanceControl from './DistanceControl';
import './MapViewModal.css';

/**
 * Main modal component for map view.
 * Handles location permissions, filtering, and displays the map.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {Array} props.donations - All donations to display
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFiltersChange - Filter change callback
 * @param {Function} props.onClaimClick - Claim donation callback
 * @param {boolean} props.isLoaded - Whether Google Maps is loaded
 * @param {Object} props.savedLocation - Saved user location from profile
 */
const MapViewModal = ({
  isOpen,
  onClose,
  donations = [],
  filters,
  onFiltersChange,
  onClaimClick,
  isLoaded,
  savedLocation,
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [localDistance, setLocalDistance] = useState(filters?.distance || 10);

  // Helper functions - MUST be defined before useMemo
  const toRad = value => (value * Math.PI) / 180;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize location on mount
  useEffect(() => {
    if (isOpen) {
      // Try to use saved location or filter location first
      if (savedLocation?.latitude && savedLocation?.longitude) {
        setUserLocation({
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          source: 'saved',
        });
      } else if (filters?.locationCoords) {
        setUserLocation({
          latitude: filters.locationCoords.lat,
          longitude: filters.locationCoords.lng,
          source: 'filter',
        });
      } else if (!userLocation) {
        // Only show permission dialog if we don't have any location
        setShowLocationPermission(true);
      }
    }
  }, [isOpen]); // Only run when modal opens

  // Filter donations by distance
  const filteredDonations = useMemo(() => {
    if (!userLocation) return donations;

    return donations.filter(donation => {
      if (!donation.pickupLocation) return false;

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        donation.pickupLocation.latitude,
        donation.pickupLocation.longitude
      );

      return distance <= localDistance;
    });
  }, [donations, userLocation, localDistance]);

  const handleLocationReceived = location => {
    setUserLocation(location);
    setShowLocationPermission(false);

    // Update filters with new location
    if (onFiltersChange) {
      onFiltersChange('locationCoords', {
        lat: location.latitude,
        lng: location.longitude,
        address: location.address,
      });
    }
  };

  const handleLocationDenied = () => {
    // Keep permission dialog open for fallback options
  };

  const handleDistanceChange = newDistance => {
    setLocalDistance(newDistance);
    if (onFiltersChange) {
      onFiltersChange('distance', newDistance);
    }
  };

  const handleApplyToFilters = () => {
    if (onFiltersChange) {
      onFiltersChange('distance', localDistance);
      if (userLocation) {
        onFiltersChange('locationCoords', {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          address: userLocation.address,
        });

        onFiltersChange(
          'location',
          userLocation.address ||
            `${userLocation.latitude}, ${userLocation.longitude}`
        );
      }
    }
    onClose();
  };

  const handleClaimClick = donation => {
    // Call the claim handler but DON'T close the modal
    if (onClaimClick) {
      onClaimClick(donation);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="map-view-modal-overlay">
      <div className="map-view-modal">
        {/* Header */}
        <div className="map-view-header">
          <div className="header-left">
            <MapPin size={24} className="header-icon" />
            <div>
              <h2>Nearby Donations</h2>
              <p className="header-subtitle">
                {userLocation ? (
                  <>
                    {filteredDonations.length}{' '}
                    {filteredDonations.length === 1 ? 'donation' : 'donations'}{' '}
                    within {localDistance}km
                  </>
                ) : (
                  'Select your location to see nearby donations'
                )}
              </p>
            </div>
          </div>

          <button className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="map-view-controls">
          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <MapPin size={16} />
              Map
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
              List
            </button>
          </div>

          {/* Distance control */}
          <DistanceControl
            distance={localDistance}
            onChange={handleDistanceChange}
            min={1}
            max={50}
          />

          {/* Location info */}
          {userLocation ? (
            <div className="location-info">
              <MapPin size={16} />
              <span>
                {userLocation.source === 'current' && 'Current location'}
                {userLocation.source === 'saved' && 'Saved location'}
                {userLocation.source === 'filter' && 'Search location'}
                {userLocation.source === 'manual' && 'Manual location'}
              </span>
              <button
                className="change-location-btn"
                onClick={() => setShowLocationPermission(true)}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="location-info warning">
              <MapPin size={16} />
              <span>No location set</span>
              <button
                className="change-location-btn primary"
                onClick={() => setShowLocationPermission(true)}
              >
                Set Location
              </button>
            </div>
          )}
        </div>

        {/* Map or List View */}
        <div className="map-view-content">
          {viewMode === 'map' ? (
            <DonationMap
              donations={filteredDonations}
              userLocation={userLocation}
              distanceRadius={localDistance}
              onClaimClick={handleClaimClick}
              isLoaded={isLoaded}
            />
          ) : (
            <div className="donations-list-view">
              {!userLocation ? (
                <div className="no-donations">
                  <MapPin size={48} />
                  <p>Please set your location to see donations</p>
                  <button
                    className="expand-radius-btn"
                    onClick={() => setShowLocationPermission(true)}
                  >
                    Set Location
                  </button>
                </div>
              ) : filteredDonations.length === 0 ? (
                <div className="no-donations">
                  <MapPin size={48} />
                  <p>No donations found within {localDistance}km</p>
                  <button
                    className="expand-radius-btn"
                    onClick={() =>
                      handleDistanceChange(Math.min(50, localDistance + 10))
                    }
                  >
                    Expand to {Math.min(50, localDistance + 10)}km
                  </button>
                </div>
              ) : (
                <div className="donations-list">
                  {filteredDonations.map(donation => (
                    <div key={donation.id} className="list-donation-card">
                      <h4>{donation.title}</h4>
                      <p>{donation.pickupLocation?.address}</p>
                      <span className="distance-text">
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          donation.pickupLocation.latitude,
                          donation.pickupLocation.longitude
                        ).toFixed(1)}
                        km away
                      </span>
                      <button
                        className="list-card-claim-btn"
                        onClick={() => handleClaimClick(donation)}
                      >
                        Claim Donation
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="map-view-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="apply-btn" onClick={handleApplyToFilters}>
            Apply to Filters
          </button>
        </div>

        {/* Location Permission Dialog */}
        {showLocationPermission && (
          <LocationPermission
            onLocationReceived={handleLocationReceived}
            onLocationDenied={handleLocationDenied}
            savedLocation={savedLocation}
            onClose={() => setShowLocationPermission(false)}
            isLoaded={isLoaded}
          />
        )}
      </div>
    </div>
  );
};

export default MapViewModal;
