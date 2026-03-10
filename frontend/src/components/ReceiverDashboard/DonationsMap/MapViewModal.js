import React, { useEffect, useMemo, useState } from 'react';
import { List, MapPin } from 'lucide-react';
import DonationMap from './DonationMap';
import './MapViewModal.css';

const MapViewModal = ({
  isOpen,
  onClose,
  donations = [],
  filters = {},
  accountLocation = null,
  onClaimClick,
  onMarkerSelect,
  selectedDonationId = null,
  onViewDonationDetails,
  isLoaded,
  formatBestBeforeDate,
  formatPickupTime,
  formatStatus,
  getStatusClass,
  t,
}) => {
  const [geocodedLocation, setGeocodedLocation] = useState(null);

  const normalizeCoords = coords => {
    if (!coords || typeof coords !== 'object') {
      return null;
    }

    const rawLat = coords.lat ?? coords.latitude;
    const rawLng = coords.lng ?? coords.longitude;
    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      latitude: lat,
      longitude: lng,
      address: coords.address || coords.formattedAddress || '',
    };
  };

  const userLocation = useMemo(() => {
    const activeFilterLocation = normalizeCoords(filters?.locationCoords);
    if (activeFilterLocation) {
      return {
        ...activeFilterLocation,
        address: activeFilterLocation.address || filters.location || '',
        source: filters.locationSource || 'filter',
      };
    }

    const fallbackAccountLocation = normalizeCoords(accountLocation);
    if (fallbackAccountLocation) {
      return {
        ...fallbackAccountLocation,
        source: 'account',
      };
    }

    return null;
  }, [filters, accountLocation]);

  useEffect(() => {
    let isActive = true;

    if (userLocation) {
      setGeocodedLocation(null);
      return () => {
        isActive = false;
      };
    }

    const addressFromFilters = (filters?.location || '').trim();
    const addressFromAccount = (
      accountLocation?.address ||
      accountLocation?.formattedAddress ||
      ''
    ).trim();
    const addressToGeocode = addressFromFilters || addressFromAccount;

    if (!isLoaded || !addressToGeocode || typeof window === 'undefined') {
      setGeocodedLocation(null);
      return () => {
        isActive = false;
      };
    }

    const resolveLocationFromAddress = async () => {
      // Prefer browser Geocoder.
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const geocoderResult = await new Promise(resolve => {
          geocoder.geocode({ address: addressToGeocode }, (results, status) => {
            const topResult =
              status === 'OK' && Array.isArray(results) && results.length > 0
                ? results[0]
                : null;
            const point = topResult?.geometry?.location;
            if (!point) {
              resolve(null);
              return;
            }
            resolve({
              latitude: point.lat(),
              longitude: point.lng(),
              address: topResult.formatted_address || addressToGeocode,
            });
          });
        });

        if (geocoderResult) {
          return geocoderResult;
        }
      }

      // Fallback: Places text search via Maps JS.
      if (window.google?.maps?.places?.PlacesService) {
        try {
          const placesResult = await new Promise(resolve => {
            const service = new window.google.maps.places.PlacesService(
              document.createElement('div')
            );
            service.findPlaceFromQuery(
              {
                query: addressToGeocode,
                fields: ['geometry', 'formatted_address', 'name'],
              },
              (results, status) => {
                const topResult =
                  status === window.google.maps.places.PlacesServiceStatus.OK &&
                  Array.isArray(results) &&
                  results.length > 0
                    ? results[0]
                    : null;
                const point = topResult?.geometry?.location;
                if (!point) {
                  resolve(null);
                  return;
                }
                resolve({
                  latitude: point.lat(),
                  longitude: point.lng(),
                  address:
                    topResult.formatted_address ||
                    topResult.name ||
                    addressToGeocode,
                });
              }
            );
          });

          if (placesResult) {
            return placesResult;
          }
        } catch {
          // continue to HTTP fallbacks
        }
      }

      // Fallback 1: Google Geocoding HTTP API.
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            addressToGeocode
          )}&key=${apiKey}`;
          const response = await fetch(url);
          const payload = await response.json();
          const topResult =
            payload?.status === 'OK' &&
            Array.isArray(payload.results) &&
            payload.results.length > 0
              ? payload.results[0]
              : null;
          const point = topResult?.geometry?.location;
          if (point) {
            return {
              latitude: point.lat,
              longitude: point.lng,
              address: topResult.formatted_address || addressToGeocode,
            };
          }
        } catch {
          // continue to Nominatim fallback
        }
      }

      // Fallback 2: OpenStreetMap Nominatim.
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          addressToGeocode
        )}`;
        const response = await fetch(nominatimUrl, {
          headers: {
            Accept: 'application/json',
          },
        });
        const payload = await response.json();
        const topResult =
          Array.isArray(payload) && payload.length > 0 ? payload[0] : null;
        const lat = Number(topResult?.lat);
        const lng = Number(topResult?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return {
          latitude: lat,
          longitude: lng,
          address: topResult.display_name || addressToGeocode,
        };
      } catch {
        return null;
      }
    };

    resolveLocationFromAddress().then(resolved => {
      if (!isActive) {
        return;
      }
      if (!resolved) {
        setGeocodedLocation(null);
        return;
      }
      setGeocodedLocation({
        ...resolved,
        source: filters?.locationSource || 'address',
      });
    });

    return () => {
      isActive = false;
    };
  }, [userLocation, filters, accountLocation, isLoaded]);

  const effectiveUserLocation = userLocation || geocodedLocation;

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
        {effectiveUserLocation
          ? `${donations.length} donation${donations.length === 1 ? '' : 's'} within ${filters?.distance || 10}km`
          : 'Set your location in filters to center the map'}
      </div>

      <div className="map-view-inline-content">
        <DonationMap
          donations={donations}
          userLocation={effectiveUserLocation}
          distanceRadius={filters?.distance || 10}
          onClaimClick={onClaimClick}
          onSelectedDonationChange={onMarkerSelect}
          selectedDonationId={selectedDonationId}
          onViewDetailsClick={onViewDonationDetails}
          isLoaded={isLoaded}
          formatBestBeforeDate={formatBestBeforeDate}
          formatPickupTime={formatPickupTime}
          formatStatus={formatStatus}
          getStatusClass={getStatusClass}
          t={t}
        />
      </div>
    </section>
  );
};

export default MapViewModal;
