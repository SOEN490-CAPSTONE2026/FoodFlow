import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationPermission from '../DonationsMap/LocationPermission';

// Mock @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  Autocomplete: ({ children, onLoad }) => {
    // Call onLoad immediately with mock autocomplete
    if (onLoad) {
      const mockAutocomplete = {
        getPlace: jest.fn(() => ({
          geometry: {
            location: {
              lat: () => 45.5017,
              lng: () => -73.5673,
            },
          },
          formatted_address: '123 Test St',
        })),
      };
      onLoad(mockAutocomplete);
    }
    return <div data-testid="autocomplete">{children}</div>;
  },
}));

describe('LocationPermission', () => {
  const mockOnLocationReceived = jest.fn();
  const mockOnLocationDenied = jest.fn();
  const mockOnClose = jest.fn();

  // Mock geolocation
  const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.navigator.geolocation = mockGeolocation;

    // Mock permissions API
    global.navigator.permissions = {
      query: jest.fn(() => Promise.resolve({ state: 'prompt' })),
    };
  });

  afterEach(() => {
    delete global.navigator.geolocation;
    delete global.navigator.permissions;
  });

  describe('Basic Rendering', () => {
    it('renders dialog title', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(screen.getByText('Choose Your Location')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        screen.getByText(/show you nearby donations/i)
      ).toBeInTheDocument();
    });

    it('renders use current location button', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(screen.getByText('Use Current Location')).toBeInTheDocument();
    });

    it('renders manual location input', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        screen.getByPlaceholderText(/search for a location/i)
      ).toBeInTheDocument();
    });

    it('shows disabled input when Google Maps not loaded', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={false}
        />
      );
      const input = screen.getByPlaceholderText(/loading google maps/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Close Button', () => {
    it('calls onClose when close button clicked', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      const closeButton = screen.getAllByRole('button')[0];
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Current Location Request', () => {
    it('shows loading state when requesting location', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {});

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText('Getting location...')).toBeInTheDocument();
      });
    });

    it('calls onLocationReceived on successful geolocation', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(success => {
        success({
          coords: {
            latitude: 45.5017,
            longitude: -73.5673,
            accuracy: 10,
          },
        });
      });

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(mockOnLocationReceived).toHaveBeenCalledWith({
          latitude: 45.5017,
          longitude: -73.5673,
          source: 'current',
          accuracy: 10,
        });
      });
    });

    it('handles geolocation error - PERMISSION_DENIED', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 1 });
        }
      );

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
        expect(mockOnLocationDenied).toHaveBeenCalled();
      });
    });

    it('handles geolocation error - POSITION_UNAVAILABLE', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 2 });
        }
      );

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
      });
    });

    it('handles geolocation error - TIMEOUT', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 3 });
        }
      );

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/timed out/i)).toBeInTheDocument();
      });
    });

    it('handles unknown geolocation error', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 999 });
        }
      );

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/unknown error/i)).toBeInTheDocument();
      });
    });

    it('shows error when geolocation not supported', async () => {
      delete global.navigator.geolocation;

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(screen.getByText(/not supported/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saved Location', () => {
    it('renders saved location button when provided', () => {
      const savedLocation = {
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St',
      };

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          savedLocation={savedLocation}
          isLoaded={true}
        />
      );

      expect(screen.getByText('Use Saved Location')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('shows coordinates when no address', () => {
      const savedLocation = {
        latitude: 45.5017,
        longitude: -73.5673,
      };

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          savedLocation={savedLocation}
          isLoaded={true}
        />
      );

      expect(screen.getByText(/45.5017, -73.5673/)).toBeInTheDocument();
    });

    it('calls onLocationReceived when saved location clicked', () => {
      const savedLocation = {
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St',
      };

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          savedLocation={savedLocation}
          isLoaded={true}
        />
      );

      const savedButton = screen
        .getByText('Use Saved Location')
        .closest('button');
      fireEvent.click(savedButton);

      expect(mockOnLocationReceived).toHaveBeenCalledWith({
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St',
        source: 'saved',
      });
    });

    it('does not render without savedLocation', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      expect(screen.queryByText('Use Saved Location')).not.toBeInTheDocument();
    });

    it('does not render when savedLocation missing coordinates', () => {
      const incompleteSaved = { address: '123 Main St' };

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          savedLocation={incompleteSaved}
          isLoaded={true}
        />
      );

      expect(screen.queryByText('Use Saved Location')).not.toBeInTheDocument();
    });
  });

  describe('Manual Location Input', () => {
    it('updates input value on change', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const input = screen.getByPlaceholderText(/search for a location/i);
      fireEvent.change(input, { target: { value: 'Montreal' } });
      expect(input).toHaveValue('Montreal');
    });
  });

  describe('Permission State Help', () => {
    it('shows help text when permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 1 });
        }
      );

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(
          screen.getByText(/How to enable location:/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('CSS Classes', () => {
    it('has overlay class', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        container.querySelector('.location-permission-overlay')
      ).toBeInTheDocument();
    });

    it('has permission options', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        container.querySelector('.permission-options')
      ).toBeInTheDocument();
    });

    it('has primary option class', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        container.querySelector('.permission-option.primary')
      ).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    it('disables current location button while loading', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {});

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(locationButton).toBeDisabled();
      });
    });

    it('disables saved location button while loading', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {});

      const savedLocation = {
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St',
      };

      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          savedLocation={savedLocation}
          isLoaded={true}
        />
      );

      const locationButton = screen
        .getByText('Use Current Location')
        .closest('button');
      fireEvent.click(locationButton);

      await waitFor(() => {
        const savedButton = screen
          .getByText('Use Saved Location')
          .closest('button');
        expect(savedButton).toBeDisabled();
      });
    });
  });
});
