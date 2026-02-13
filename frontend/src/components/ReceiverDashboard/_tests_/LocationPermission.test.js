import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationPermission from '../DonationsMap/LocationPermission';

// Mock @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  Autocomplete: ({ children }) => <div>{children}</div>,
}));

describe('LocationPermission', () => {
  const mockOnLocationReceived = jest.fn();
  const mockOnLocationDenied = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
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

    it('renders description text', () => {
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

    it('renders manual location option', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(screen.getByText('Enter Location Manually')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toHaveClass('close-btn');
    });

    it('renders location search input when Google Maps is loaded', () => {
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

    it('shows disabled input when Google Maps is not loaded', () => {
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

  describe('Saved Location', () => {
    it('renders saved location button when savedLocation is provided', () => {
      const savedLocation = {
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St, Montreal',
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
      expect(screen.getByText('123 Main St, Montreal')).toBeInTheDocument();
    });

    it('does not render saved location button without savedLocation', () => {
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

    it('shows coordinates when savedLocation has no address', () => {
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
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      const closeButton = screen.getAllByRole('button')[0]; // First button is close
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
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

    it('has dialog class', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      expect(
        container.querySelector('.location-permission-dialog')
      ).toBeInTheDocument();
    });

    it('has permission options class', () => {
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
  });

  describe('Option Styling', () => {
    it('primary option has correct class', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      const primaryOption = container.querySelector(
        '.permission-option.primary'
      );
      expect(primaryOption).toBeInTheDocument();
    });

    it('secondary options have correct class', () => {
      const { container } = render(
        <LocationPermission
          onLocationReceived={mockOnLocationReceived}
          onLocationDenied={mockOnLocationDenied}
          onClose={mockOnClose}
          isLoaded={true}
        />
      );
      const secondaryOptions = container.querySelectorAll(
        '.permission-option.secondary'
      );
      expect(secondaryOptions.length).toBeGreaterThan(0);
    });
  });
});
