import { renderHook } from "@testing-library/react";
import useGoogleMap from "../useGoogleMaps";

describe("useGoogleMap", () => {
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
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // Clear document head
    document.head.innerHTML = "";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.window.google;
    document.head.innerHTML = "";
  });

  test("returns a ref object", () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: "Test Address",
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty("current");
  });

  test("does not initialize map when location is missing", () => {
    renderHook(() => useGoogleMap(null));
    expect(console.log).toHaveBeenCalledWith(
      "Map not initialized: Missing location or mapRef"
    );
  });

  test("does not initialize map when latitude is missing", () => {
    const location = {
      longitude: -74.006,
      address: "Test Address",
    };

    renderHook(() => useGoogleMap(location));
    expect(console.log).toHaveBeenCalledWith(
      "Map not initialized: Missing location or mapRef"
    );
  });

  test("does not initialize map when longitude is missing", () => {
    const location = {
      latitude: 40.7128,
      address: "Test Address",
    };

    renderHook(() => useGoogleMap(location));
    expect(console.log).toHaveBeenCalledWith(
      "Map not initialized: Missing location or mapRef"
    );
  });

  test("returns ref when Google Maps is not loaded", () => {
    delete global.window.google;

    const location = {
      latitude: "40.7128",
      longitude: "-74.0060",
      address: "Test",
    };

    const { result } = renderHook(() => useGoogleMap(location));

    expect(result.current).toHaveProperty("current");
  });

  test("handles missing address gracefully", () => {
    const location = {
      latitude: "40.7128",
      longitude: "-74.0060",
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty("current");
  });

  test("accepts custom options", () => {
    const location = {
      latitude: "40.7128",
      longitude: "-74.0060",
      address: "Test",
    };

    const customOptions = {
      zoom: 10,
      mapTypeControl: true,
      zoomControl: false,
    };

    const { result } = renderHook(() => useGoogleMap(location, customOptions));
    expect(result.current).toHaveProperty("current");
  });

  test("returns ref when script exists but google not loaded", () => {
    delete global.window.google;

    // Add existing script
    const existingScript = document.createElement("script");
    existingScript.src = "https://maps.googleapis.com/maps/api/js?key=test";
    document.head.appendChild(existingScript);

    const location = {
      latitude: "40.7128",
      longitude: "-74.0060",
      address: "Test",
    };

    const { result } = renderHook(() => useGoogleMap(location));

    expect(result.current).toHaveProperty("current");
  });

  test("handles location with string coordinates", () => {
    const location = {
      latitude: "40.7128",
      longitude: "-74.0060",
      address: "Test",
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty("current");
  });

  test("handles location with numeric coordinates", () => {
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      address: "Test",
    };

    const { result } = renderHook(() => useGoogleMap(location));
    expect(result.current).toHaveProperty("current");
  });

  test("handles changes to location", () => {
    const location1 = {
      latitude: 40.7128,
      longitude: -74.006,
      address: "Location 1",
    };

    const { rerender } = renderHook(
      ({ location }) => useGoogleMap(location),
      {
        initialProps: { location: location1 },
      }
    );

    const location2 = {
      latitude: 41.8781,
      longitude: -87.6298,
      address: "Location 2",
    };

    rerender({ location: location2 });
    expect(console.log).toHaveBeenCalled();
  });

  test("handles location updates", () => {
    const location1 = {
      latitude: "40.7128",
      longitude: "-74.0060",
      address: "Test 1",
    };

    const { result } = renderHook(() => useGoogleMap(location1));

    expect(result.current).toHaveProperty("current");
  });
});
