import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
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
  isLoaded,
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

  const handleMarkerClick = donation => {
    setSelectedDonation(donation);
    if (onMarkerClick) {
      onMarkerClick(donation);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedDonation(null);
  };

  const onDonationClaimClick = donation => {
    onClaimClick(donation);
    setSelectedDonation(null);
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

  // Custom marker icon for donations
  const getDonationMarkerIcon = (donation, isHovered) => {
    const isSelected = selectedDonation?.id === donation.id;

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: isSelected || isHovered ? '#1B4965' : '#62B6CB',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: isSelected || isHovered ? 10 : 8,
    };
  };

  // User location marker icon
  const userMarkerIcon = {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#4CAF50',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 3,
    scale: 8,
  };

  // Distance circle options
  const circleOptions = {
    strokeColor: '#1B4965',
    strokeOpacity: 0.4,
    strokeWeight: 2,
    fillColor: '#62B6CB',
    fillOpacity: 0.1,
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
              icon={userMarkerIcon}
              title="Your location"
              zIndex={1000}
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
          </>
        )}

        {/* Donation markers */}
        {donations.map(donation => {
          if (!donation.pickupLocation) return null;

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
              onClick={() => handleMarkerClick(donation)}
              onMouseOver={() => setHoveredMarkerId(donation.id)}
              onMouseOut={() => setHoveredMarkerId(null)}
              title={donation.title}
              zIndex={selectedDonation?.id === donation.id ? 999 : 1}
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
            />
          </InfoWindow>
        )}
      </GoogleMap>

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
