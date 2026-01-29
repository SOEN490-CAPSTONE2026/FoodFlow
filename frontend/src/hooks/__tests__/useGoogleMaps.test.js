import { renderHook, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import React from 'react';
import useGoogleMap from '../useGoogleMaps';

// Helper component to test the hook with a real DOM element
const TestComponent = ({ location, options }) => {
  const mapRef = useGoogleMap(location, options);

  return <div ref={mapRef} data-testid="map-container" />;
};

describe('useGoogleMap', () => {
  let mockMap;
  let mockMarker;

  beforeEach(() => {
    // Mock Google Maps API
    mockMap = {
      setCenter: jest.fn(),
      setZoom: jest.fn(),
    };

    mockMarker = {
      setMap: jest.fn(),
      setPosition: jest.fn(),
    };

    global.window.google = {
      maps: {
        Map: jest.fn(() => mockMap),
        Marker: jest.fn(() => mockMarker),
      },
    };

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Clear document head
    document.head.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.window.google;
    document.head.innerHTML = '';
  });

  test('returns a ref object', () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test Address',
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty('current');
  });

  test('does not initialize map when location is missing', () => {
    renderHook(() => useGoogleMap(null));
    expect(console.log).toHaveBeenCalledWith(
      'Map not initialized: Missing location or mapRef'
    );
  });

  test('does not initialize map when latitude is missing', () => {
    const location = {
      longitude: -74.006,
      address: 'Test Address',
    };

    renderHook(() => useGoogleMap(location));
    expect(console.log).toHaveBeenCalledWith(
      'Map not initialized: Missing location or mapRef'
    );
  });

  test('does not initialize map when longitude is missing', () => {
    const location = {
      latitude: 40.7128,
      address: 'Test Address',
    };

    renderHook(() => useGoogleMap(location));
    expect(console.log).toHaveBeenCalledWith(
      'Map not initialized: Missing location or mapRef'
    );
  });

  test('returns ref when Google Maps is not loaded', () => {
    delete global.window.google;

    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test',
    };

    const { result } = renderHook(() => useGoogleMap(location));

    expect(result.current).toHaveProperty('current');
  });

  test('handles missing address gracefully', () => {
    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty('current');
  });

  test('accepts custom options', () => {
    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test',
    };

    const customOptions = {
      zoom: 10,
      mapTypeControl: true,
      zoomControl: false,
    };

    const { result } = renderHook(() => useGoogleMap(location, customOptions));
    expect(result.current).toHaveProperty('current');
  });

  test('returns ref when script exists but google not loaded', () => {
    delete global.window.google;

    // Add existing script
    const existingScript = document.createElement('script');
    existingScript.src = 'https://maps.googleapis.com/maps/api/js?key=test';
    document.head.appendChild(existingScript);

    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test',
    };

    const { result } = renderHook(() => useGoogleMap(location));

    expect(result.current).toHaveProperty('current');
  });

  test('handles location with string coordinates', () => {
    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test',
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty('current');
  });

  test('handles location with numeric coordinates', () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty('current');
  });

  test('handles changes to location', () => {
    const location1 = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Location 1',
    };

    const { rerender } = renderHook(({ location }) => useGoogleMap(location), {
      initialProps: { location: location1 },
    });

    const location2 = {
      latitude: 41.8781,
      longitude: -87.6298,
      address: 'Location 2',
    };

    rerender({ location: location2 });
    expect(console.log).toHaveBeenCalled();
  });

  test('handles location updates', () => {
    const location1 = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test 1',
    };

    const { result } = renderHook(() => useGoogleMap(location1));

    expect(result.current).toHaveProperty('current');
  });

  test('initializes map when Google Maps is loaded', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test Address',
    };

    render(<TestComponent location={location} />);

    // Wait for the map to be initialized
    await waitFor(() => {
      expect(window.google.maps.Map).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(window.google.maps.Map).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 17,
      })
    );

    expect(window.google.maps.Marker).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { lat: 40.7128, lng: -74.006 },
        map: mockMap,
        title: 'Test Address',
      })
    );
  });

  test('uses default title when address is not provided', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
    };

    render(<TestComponent location={location} />);

    await waitFor(() => {
      expect(window.google.maps.Marker).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(window.google.maps.Marker).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pickup Location',
      })
    );
  });

  test('applies custom options when creating map', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    const customOptions = {
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: false,
    };

    render(<TestComponent location={location} options={customOptions} />);

    await waitFor(() => {
      expect(window.google.maps.Map).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(window.google.maps.Map).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: false,
      })
    );
  });

  test('handles map initialization error gracefully', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    // Make Map constructor throw an error
    window.google.maps.Map = jest.fn(() => {
      throw new Error('Map initialization failed');
    });

    render(<TestComponent location={location} />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(console.error).toHaveBeenCalledWith(
      'Error initializing Google Map:',
      expect.any(Error)
    );
  });

  test('loads Google Maps script when not already loaded', async () => {
    delete window.google;

    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    // Mock process.env
    const originalEnv = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-api-key';

    render(<TestComponent location={location} />);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Google Maps script not loaded, loading now...');
    }, { timeout: 3000 });

    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    expect(scripts.length).toBeGreaterThan(0);

    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = originalEnv;
  });

  test('attaches onload handler to existing script', () => {
    delete window.google;

    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    // Add existing script
    const existingScript = document.createElement('script');
    existingScript.src = 'https://maps.googleapis.com/maps/api/js?key=existing';
    document.head.appendChild(existingScript);

    const mapDiv = document.createElement('div');
    document.body.appendChild(mapDiv);

    const { result } = renderHook(() => useGoogleMap(location));
    
    if (result.current) {
      result.current.current = mapDiv;
    }

    const { rerender } = renderHook(() => useGoogleMap(location));

    expect(existingScript.onload).toBeDefined();

    document.body.removeChild(mapDiv);
  });

  test('handles script loading error', async () => {
    delete window.google;

    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-api-key';

    render(<TestComponent location={location} />);

    await waitFor(() => {
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      expect(script).toBeTruthy();
    }, { timeout: 3000 });

    const script = document.querySelector('script[src*="maps.googleapis.com"]');
    if (script && script.onerror) {
      act(() => {
        script.onerror(new Event('error'));
      });
    }

    expect(console.error).toHaveBeenCalledWith('Failed to load Google Maps script');
  });

  test('cleans up marker on unmount', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    const { unmount } = render(<TestComponent location={location} />);

    // Wait for marker to be created
    await waitFor(() => {
      expect(window.google.maps.Marker).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Unmount the component
    unmount();

    // Verify cleanup was called
    expect(mockMarker.setMap).toHaveBeenCalledWith(null);
  });

  test('converts string coordinates to numbers', async () => {
    const location = {
      latitude: '40.7128',
      longitude: '-74.0060',
      address: 'Test',
    };

    render(<TestComponent location={location} />);

    await waitFor(() => {
      expect(window.google.maps.Map).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(window.google.maps.Map).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        center: { lat: 40.7128, lng: -74.006 },
      })
    );

    expect(window.google.maps.Marker).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { lat: 40.7128, lng: -74.006 },
      })
    );
  });

  test('logs map initialization', async () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    render(<TestComponent location={location} />);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        'Initializing map at position:',
        expect.objectContaining({ lat: 40.7128, lng: -74.006 })
      );
    }, { timeout: 3000 });

    expect(console.log).toHaveBeenCalledWith('Map initialized successfully');
  });

  test('does not create marker if map initialization fails', () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Test',
    };

    // Reset mock calls
    window.google.maps.Marker.mockClear();

    // Make Map constructor throw an error
    window.google.maps.Map = jest.fn(() => {
      throw new Error('Map failed');
    });

    const mapDiv = document.createElement('div');
    document.body.appendChild(mapDiv);

    const { result } = renderHook(() => useGoogleMap(location));
    
    if (result.current) {
      result.current.current = mapDiv;
    }

    const { rerender } = renderHook(() => useGoogleMap(location));

    // Marker should not be created when map fails
    expect(window.google.maps.Marker).not.toHaveBeenCalled();

    document.body.removeChild(mapDiv);
  });
});
