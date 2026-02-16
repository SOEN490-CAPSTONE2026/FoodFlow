import React from 'react';
import { Map, MapPin, Navigation } from 'lucide-react';
import PropTypes from 'prop-types';
import './MapViewBanner.css';

/**
 * Banner component that appears at the top of the receiver browse page.
 * When clicked, it opens the map view modal.
 * @param {Object} props
 * @param {Function} props.onOpenMap - Callback when banner is clicked
 * @param {number} props.nearbyCount - Number of nearby donations
 * @param {number} props.distanceRadius - Current distance filter radius in km
 * @param {boolean} props.hasLocation - Whether user location is available
 */
const MapViewBanner = ({
  onOpenMap,
  nearbyCount = 0,
  distanceRadius = 10,
  hasLocation = false,
}) => {
  return (
    <div className="map-view-banner" onClick={onOpenMap}>
      <div className="banner-icon">
        <Map size={24} />
      </div>
      <div className="banner-content">
        <h3 className="banner-title">
          {hasLocation ? (
            <>
              <MapPin size={16} className="inline-icon" />
              {nearbyCount} {nearbyCount === 1 ? 'donation' : 'donations'}{' '}
              within {distanceRadius}km
            </>
          ) : (
            <>
              <Navigation size={16} className="inline-icon" />
              View donations on map
            </>
          )}
        </h3>
        <p className="banner-subtitle">
          {hasLocation
            ? 'Click to see donations near you on the map'
            : 'Enable location to see nearby donations'}
        </p>
      </div>
      <div className="banner-arrow">
        <Map size={20} />
      </div>
    </div>
  );
};

MapViewBanner.propTypes = {
  onOpenMap: PropTypes.func,
  nearbyCount: PropTypes.number,
  distanceRadius: PropTypes.number,
  hasLocation: PropTypes.bool,
};

export default MapViewBanner;
