import { useEffect, useRef } from 'react';

const useGoogleMap = (location, options = {}) => {
  const mapRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !location?.latitude || !location?.longitude) {
      console.log('Map not initialized: Missing location or mapRef');
      return;
    }

    const initMap = () => {
      try {
        const position = {
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude)
        };

        console.log('Initializing map at position:', position);

        const defaultOptions = {
          center: position,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          ...options
        };

        // Create map
        googleMapInstanceRef.current = new window.google.maps.Map(
          mapRef.current,
          defaultOptions
        );

        // Create marker
        markerRef.current = new window.google.maps.Marker({
          position: position,
          map: googleMapInstanceRef.current,
          title: location.address || 'Pickup Location'
        });

        console.log('Map initialized successfully');

      } catch (error) {
        console.error('Error initializing Google Map:', error);
      }
    };

    // Load Google Maps script if not already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      console.log('Google Maps script not loaded, loading now...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => console.error('Failed to load Google Maps script');
      
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (!existingScript) {
        document.head.appendChild(script);
      } else {
        // Script exists but might not have loaded yet
        existingScript.onload = initMap;
      }
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [location?.latitude, location?.longitude, location?.address, options]);

  return mapRef;
};

export default useGoogleMap;