import React, { useMemo } from 'react';
import { List, MapPin } from 'lucide-react';
import DonationMap from './DonationMap';
import './MapViewModal.css';

const MapViewModal = ({
  isOpen,
  onClose,
  donations = [],
  filters = {},
  onClaimClick,
  isLoaded,
}) => {
  const userLocation = useMemo(() => {
    if (!filters?.locationCoords) {
      return null;
    }

    return {
      latitude: filters.locationCoords.lat,
      longitude: filters.locationCoords.lng,
      address: filters.locationCoords.address || filters.location || '',
      source: filters.locationSource || 'filter',
    };
  }, [filters]);

  if (!isOpen) {
    return null;
  }

  return (
    <section className="map-view-inline" aria-label="Map browse view">
      <div className="map-view-inline-header">
        <div className="map-view-inline-title">
          <MapPin size={20} />
          <h2>Browse on map</h2>
        </div>
        <button
          type="button"
          className="map-view-inline-list-button"
          onClick={onClose}
        >
          <List size={16} />
          Back to list
        </button>
      </div>

      <div className="map-view-inline-subtitle">
        {userLocation
          ? `${donations.length} donation${donations.length === 1 ? '' : 's'} within ${filters?.distance || 10}km`
          : 'Set your location in filters to center the map'}
      </div>

      <div className="map-view-inline-content">
        <DonationMap
          donations={donations}
          userLocation={userLocation}
          distanceRadius={filters?.distance || 10}
          onClaimClick={onClaimClick}
          isLoaded={isLoaded}
        />
      </div>
    </section>
  );
};

export default MapViewModal;
