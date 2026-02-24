import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertCircle, X, Search } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import './LocationPermission.css';

/**
 * Component that handles location permission requests and provides fallback options.
 *
 * @param {Object} props
 * @param {Function} props.onLocationReceived - Callback when location is obtained (lat, lng, source)
 * @param {Function} props.onLocationDenied - Callback when location is denied
 * @param {Object} props.savedLocation - Saved profile location {latitude, longitude, address}
 * @param {Function} props.onClose - Close the permission dialog
 * @param {boolean} props.isLoaded - Whether Google Maps is loaded
 */
const LocationPermission = ({
  onLocationReceived,
  onLocationDenied,
  savedLocation,
  onClose,
  isLoaded = true,
}) => {
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Check current permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then(result => {
          setPermissionState(result.state);
        })
        .catch(err => console.log('Permission query not supported'));
    }
  }, []);

  const requestCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPermissionState('denied');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        onLocationReceived({
          latitude,
          longitude,
          source: 'current',
          accuracy: position.coords.accuracy,
        });
        setPermissionState('granted');
        setLoading(false);
      },
      error => {
        console.error('Geolocation error:', error);
        setError(getErrorMessage(error.code));
        setPermissionState('denied');
        setLoading(false);
        if (onLocationDenied) {
          onLocationDenied();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Don't use cached location
      }
    );
  };

  const useSavedLocation = () => {
    if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
      onLocationReceived({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        address: savedLocation.address,
        source: 'saved',
      });
    }
  };

  const handlePlaceSelect = () => {
    const autocomplete = autocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const address = place.formatted_address || place.name || '';
        const location = place.geometry.location;

        onLocationReceived({
          latitude: location.lat(),
          longitude: location.lng(),
          address: address,
          source: 'manual',
        });
      }
    }
  };

  const getErrorMessage = code => {
    switch (code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission denied. Please enable location access in your browser settings.';
      case 2: // POSITION_UNAVAILABLE
        return 'Location information is unavailable. Please try again.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while accessing your location.';
    }
  };

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-dialog">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="permission-icon">
          <MapPin size={48} />
        </div>

        <h2>Choose Your Location</h2>
        <p className="permission-description">
          To show you nearby donations, please select your location.
        </p>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="permission-options">
          {/* Current Location Option */}
          <button
            className="permission-option primary"
            onClick={requestCurrentLocation}
            disabled={loading}
          >
            <Navigation size={20} />
            <div className="option-content">
              <span className="option-title">
                {loading ? 'Getting location...' : 'Use Current Location'}
              </span>
              <span className="option-subtitle">
                Most accurate, updates automatically
              </span>
            </div>
          </button>

          {/* Manual Location Option */}
          <div className="permission-option secondary manual-option">
            <Search size={20} />
            <div className="option-content full-width">
              <span className="option-title">Enter Location Manually</span>
              <div className="manual-location-input">
                {isLoaded ? (
                  <Autocomplete
                    onLoad={autocomplete =>
                      (autocompleteRef.current = autocomplete)
                    }
                    onPlaceChanged={handlePlaceSelect}
                    types={['geocode', 'establishment']}
                    componentRestrictions={{ country: ['us', 'ca'] }}
                  >
                    <input
                      type="text"
                      className="location-search-input"
                      placeholder="Search for a location..."
                      value={manualLocation}
                      onChange={e => setManualLocation(e.target.value)}
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    className="location-search-input"
                    placeholder="Loading Google Maps..."
                    disabled
                  />
                )}
              </div>
            </div>
          </div>

          {/* Saved Location Option */}
          {savedLocation && savedLocation.latitude && (
            <button
              className="permission-option secondary"
              onClick={useSavedLocation}
              disabled={loading}
            >
              <MapPin size={20} />
              <div className="option-content">
                <span className="option-title">Use Saved Location</span>
                <span className="option-subtitle">
                  {savedLocation.address ||
                    `${savedLocation.latitude}, ${savedLocation.longitude}`}
                </span>
              </div>
            </button>
          )}
        </div>

        {permissionState === 'denied' && (
          <div className="permission-help">
            <p className="help-title">How to enable location:</p>
            <ol>
              <li>Click the lock icon in your browser's address bar</li>
              <li>Look for Location permissions</li>
              <li>Select "Allow" or "Ask every time"</li>
              <li>Refresh the page and try again</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPermission;
