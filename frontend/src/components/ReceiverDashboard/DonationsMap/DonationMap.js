import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { LocateFixed, MapPin } from 'lucide-react';
import DonationMapCard from './DonationMapCard';
import './DonationMap.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultMapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

/**
 * Map component displaying donation locations with markers.
 *
 * @param {Object} props
 * @param {Array} props.donations - Array of donation objects with location data
 * @param {Object} props.userLocation - User's location {latitude, longitude}
 * @param {number} props.distanceRadius - Distance radius in km
 * @param {Function} props.onMarkerClick - Callback when marker is clicked
 * @param {Function} props.onClaimClick - Callback when claim button is clicked
 * @param {boolean} props.isLoaded - Whether Google Maps is loaded
 */
const DonationMap = ({
  donations = [],
  userLocation,
  distanceRadius = 10,
  onMarkerClick,
  onClaimClick,
  onViewDetailsClick,
  selectedDonationId = null,
  onSelectedDonationChange,
  isLoaded,
  formatBestBeforeDate,
  formatPickupTime,
  formatStatus,
  getStatusClass,
  t,
}) => {
  const [map, setMap] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);

  // Calculate map center and zoom
  const mapCenter = useMemo(() => {
    if (userLocation) {
      return {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      };
    }
    // If no user location, center on first donation or default to Montreal
    if (donations.length > 0 && donations[0].pickupLocation) {
      return {
        lat: donations[0].pickupLocation.latitude,
        lng: donations[0].pickupLocation.longitude,
      };
    }
    return { lat: 45.5017, lng: -73.5673 }; // Montreal default
  }, [userLocation, donations]);

  const onLoad = useCallback(
    map => {
      setMap(map);

      // Fit bounds to show all markers + user location
      if (
        typeof window !== 'undefined' &&
        window.google &&
        window.google.maps
      ) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        if (userLocation) {
          bounds.extend({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          });
          hasPoints = true;
        }

        donations.forEach(donation => {
          if (donation.pickupLocation) {
            bounds.extend({
              lat: donation.pickupLocation.latitude,
              lng: donation.pickupLocation.longitude,
            });
            hasPoints = true;
          }
        });

        if (hasPoints) {
          map.fitBounds(bounds);

          // Add padding and limit max zoom
          setTimeout(() => {
            if (map.getZoom() > 15) {
              map.setZoom(15);
            }
          }, 100);
        }
      }
    },
    [donations, userLocation]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (selectedDonationId == null) {
      return;
    }
    const matched = donations.find(
      donation => Number(donation.id) === Number(selectedDonationId)
    );
    if (matched) {
      setSelectedDonation(matched);
    }
  }, [selectedDonationId, donations]);

  useEffect(() => {
    if (!selectedDonation) {
      return;
    }
    const stillVisible = donations.some(
      donation => Number(donation.id) === Number(selectedDonation.id)
    );
    if (!stillVisible) {
      setSelectedDonation(null);
      if (onSelectedDonationChange) {
        onSelectedDonationChange(null);
      }
    }
  }, [donations, selectedDonation, onSelectedDonationChange]);

  const getMarkerQuantityLabel = donation => {
    const value = donation?.quantity?.value;
    if (value == null) {
      return '';
    }
    const compact = `${value}`.trim();
    return compact.length <= 3 ? compact : `${compact.slice(0, 2)}+`;
  };

  const handleMarkerClick = donation => {
    setSelectedDonation(donation);
    if (onSelectedDonationChange) {
      onSelectedDonationChange(donation);
    }
    if (onMarkerClick) {
      onMarkerClick(donation);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedDonation(null);
    if (onSelectedDonationChange) {
      onSelectedDonationChange(null);
    }
  };

  const onDonationClaimClick = donation => {
    onClaimClick(donation);
    setSelectedDonation(null);
  };

  const handleRecenter = () => {
    if (!map || !userLocation) {
      return;
    }

    map.panTo({
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    });
    map.setZoom(12);
  };

  // Check if Google Maps is available
  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  // Check if window.google exists
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Google Maps...</p>
      </div>
    );
  }

  const createPinIcon = ({
    fill = '#1B4965',
    stroke = '#ffffff',
    center = '#ffffff',
    width = 36,
    height = 48,
  }) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 36 48">
        <path d="M18 46c0 0 14-15.04 14-26C32 8.4 25.73 2 18 2S4 8.4 4 20c0 10.96 14 26 14 26z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="18" cy="19" r="6.5" fill="${center}"/>
      </svg>
    `;

    const makeSize = (w, h) =>
      typeof window.google?.maps?.Size === 'function'
        ? new window.google.maps.Size(w, h)
        : { width: w, height: h };
    const makePoint = (x, y) =>
      typeof window.google?.maps?.Point === 'function'
        ? new window.google.maps.Point(x, y)
        : { x, y };

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: makeSize(width, height),
      anchor: makePoint(width / 2, height - 1),
      labelOrigin: makePoint(width / 2, 20),
    };
  };

  const createUserPinIcon = () => {
    const width = 56;
    const height = 66;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 56 66">
        <rect x="11" y="2" width="34" height="16" rx="8" fill="#0b644a" />
        <text x="28" y="13.2" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" font-weight="700" fill="#ffffff">YOU</text>
        <path d="M28 64c0 0 14-15.04 14-26C42 26.4 35.73 20 28 20S14 26.4 14 38c0 10.96 14 26 14 26z" fill="#0f9a72" stroke="#ffffff" stroke-width="2"/>
        <circle cx="28" cy="37" r="6.5" fill="#e7fff5"/>
      </svg>
    `;

    const makeSize = (w, h) =>
      typeof window.google?.maps?.Size === 'function'
        ? new window.google.maps.Size(w, h)
        : { width: w, height: h };
    const makePoint = (x, y) =>
      typeof window.google?.maps?.Point === 'function'
        ? new window.google.maps.Point(x, y)
        : { x, y };

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: makeSize(width, height),
      anchor: makePoint(width / 2, height - 1),
      labelOrigin: makePoint(width / 2, 37),
    };
  };

  // Custom marker icon for donations
  const getDonationMarkerIcon = (donation, isHovered) => {
    const isSelected = selectedDonation?.id === donation.id;
    if (isSelected) {
      return createPinIcon({
        fill: '#153b54',
        stroke: '#ffffff',
        center: '#dff2ff',
        width: 40,
        height: 54,
      });
    }
    if (isHovered) {
      return createPinIcon({
        fill: '#25688d',
        stroke: '#ffffff',
        center: '#eaf8ff',
        width: 38,
        height: 50,
      });
    }
    return createPinIcon({
      fill: '#62B6CB',
      stroke: '#ffffff',
      center: '#f4fcff',
      width: 36,
      height: 48,
    });
  };

  // User location marker icon
  const userMarkerIcon = createPinIcon({
    fill: '#0f9a72',
    stroke: '#ffffff',
    center: '#e7fff5',
    width: 42,
    height: 56,
  });
  const userMarkerIconWithBadge = createUserPinIcon();

  // Distance circle options
  const circleOptions = {
    strokeColor: '#1B4965',
    strokeOpacity: 0.28,
    strokeWeight: 2,
    fillColor: '#62B6CB',
    fillOpacity: 0.12,
  };

  const innerCircleOptions = {
    strokeColor: '#62B6CB',
    strokeOpacity: 0.18,
    strokeWeight: 1,
    fillColor: '#62B6CB',
    fillOpacity: 0.08,
  };

  return (
    <div className="donation-map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={userLocation ? 12 : 10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultMapOptions}
      >
        {/* User location marker - only show if location exists */}
        {userLocation && (
          <>
            <Marker
              position={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              }}
              icon={userMarkerIconWithBadge || userMarkerIcon}
              title="Your location"
              zIndex={1001}
            />

            {/* Distance radius circle */}
            <Circle
              center={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              }}
              radius={distanceRadius * 1000} // Convert km to meters
              options={circleOptions}
            />
            <Circle
              center={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              }}
              radius={distanceRadius * 650}
              options={innerCircleOptions}
            />
          </>
        )}

        {/* Donation markers */}
        {donations.map(donation => {
          if (!donation.pickupLocation) {
            return null;
          }

          return (
            <Marker
              key={donation.id}
              position={{
                lat: donation.pickupLocation.latitude,
                lng: donation.pickupLocation.longitude,
              }}
              icon={getDonationMarkerIcon(
                donation,
                hoveredMarkerId === donation.id
              )}
              label={{
                text: getMarkerQuantityLabel(donation),
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '10px',
              }}
              onClick={() => handleMarkerClick(donation)}
              onMouseOver={() => setHoveredMarkerId(donation.id)}
              onMouseOut={() => setHoveredMarkerId(null)}
              title={donation.title}
              zIndex={selectedDonation?.id === donation.id ? 1000 : 10}
            />
          );
        })}

        {/* Info window for selected donation */}
        {selectedDonation && selectedDonation.pickupLocation && (
          <InfoWindow
            position={{
              lat: selectedDonation.pickupLocation.latitude,
              lng: selectedDonation.pickupLocation.longitude,
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <DonationMapCard
              donation={selectedDonation}
              userLocation={userLocation}
              onClaimClick={onDonationClaimClick}
              onViewDetailsClick={onViewDetailsClick}
              formatBestBeforeDate={formatBestBeforeDate}
              formatPickupTime={formatPickupTime}
              formatStatus={formatStatus}
              getStatusClass={getStatusClass}
              t={t}
            />
          </InfoWindow>
        )}
      </GoogleMap>

      {userLocation && (
        <button
          type="button"
          className="map-recenter-button"
          onClick={handleRecenter}
          aria-label="Recenter map to your location"
          title="Recenter to your location"
        >
          <LocateFixed size={16} />
          Recenter
        </button>
      )}

      {/* Map legend */}
      <div className="map-legend">
        {userLocation && (
          <div className="legend-item">
            <div className="legend-marker user-marker"></div>
            <span>Your location</span>
          </div>
        )}
        <div className="legend-item">
          <div className="legend-marker donation-marker"></div>
          <span>Available donation</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker selected-marker"></div>
          <span>Selected donation</span>
        </div>
      </div>

      {/* Overlay message if no location */}
      {!userLocation && (
        <div className="map-overlay-message">
          <div className="overlay-content">
            <MapPin size={32} />
            <p>
              Set your location to see the distance circle and filter donations
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationMap;
