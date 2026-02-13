import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapViewModal from '../DonationsMap/MapViewModal';

// Mock the Google Maps components
jest.mock('@react-google-maps/api', () => {
  const mockReact = require('react');
  return {
    GoogleMap: ({ children, onLoad }) => {
      mockReact.useEffect(() => {
        if (onLoad) {
          const mockMap = {
            fitBounds: jest.fn(),
            setZoom: jest.fn(),
            getZoom: jest.fn(() => 12),
          };
          onLoad(mockMap);
        }
      }, [onLoad]);
      return mockReact.createElement(
        'div',
        { 'data-testid': 'google-map' },
        children
      );
    },
    Marker: ({ onClick, position }) =>
      mockReact.createElement('div', {
        'data-testid': `marker-${position.lat}-${position.lng}`,
        onClick,
      }),
    InfoWindow: ({ children }) =>
      mockReact.createElement(
        'div',
        { 'data-testid': 'info-window' },
        children
      ),
    Circle: () => mockReact.createElement('div', { 'data-testid': 'circle' }),
  };
});

// Mock child components
jest.mock('../DonationsMap/DonationMap', () => {
  const mockReact = require('react');
  return function MockDonationMap({
    donations,
    userLocation,
    onClaimClick,
    distanceRadius,
  }) {
    return mockReact.createElement(
      'div',
      { 'data-testid': 'donation-map' },
      mockReact.createElement(
        'span',
        { 'data-testid': 'donations-count' },
        donations.length
      ),
      mockReact.createElement(
        'span',
        { 'data-testid': 'distance-radius' },
        `${distanceRadius}km`
      ),
      userLocation &&
        mockReact.createElement(
          'span',
          { 'data-testid': 'has-user-location' },
          'Located'
        ),

      donations.map(d =>
        mockReact.createElement(
          'button',
          {
            key: d.id,
            'data-testid': `map-donation-${d.id}`,
            onClick: () => onClaimClick(d),
          },
          `Claim ${d.title}`
        )
      )
    );
  };
});

jest.mock('../DonationsMap/LocationPermission', () => {
  const mockReact = require('react');
  return function MockLocationPermission({ onLocationReceived, onClose }) {
    return mockReact.createElement(
      'div',
      { 'data-testid': 'location-permission' },
      mockReact.createElement(
        'button',
        {
          'data-testid': 'grant-location-btn',
          onClick: () =>
            onLocationReceived({
              latitude: 45.5017,
              longitude: -73.5673,
              source: 'current',
              address: 'Montreal, QC',
            }),
        },
        'Grant Location'
      ),
      mockReact.createElement(
        'button',
        { 'data-testid': 'close-permission-btn', onClick: onClose },
        'Close'
      )
    );
  };
});

jest.mock('../DonationsMap/DistanceControl', () => {
  const mockReact = require('react');
  return function MockDistanceControl({ distance, onChange }) {
    return mockReact.createElement(
      'div',
      { 'data-testid': 'distance-control' },
      mockReact.createElement(
        'span',
        { 'data-testid': 'current-distance' },
        `${distance}km`
      ),
      mockReact.createElement(
        'button',
        { onClick: () => onChange(25) },
        'Change to 25km'
      ),
      mockReact.createElement(
        'button',
        { onClick: () => onChange(5) },
        'Change to 5km'
      )
    );
  };
});

describe('MapViewModal', () => {
  const mockDonations = [
    {
      id: 1,
      title: 'Fresh Vegetables',
      pickupLocation: {
        latitude: 45.5017,
        longitude: -73.5673,
        address: '123 Main St, Montreal',
      },
    },
    {
      id: 2,
      title: 'Bakery Items',
      pickupLocation: {
        latitude: 45.5087,
        longitude: -73.554,
        address: '456 Oak Ave, Montreal',
      },
    },
    {
      id: 3,
      title: 'Canned Goods',
      pickupLocation: {
        latitude: 45.495,
        longitude: -73.58,
        address: '789 Elm Rd, Montreal',
      },
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    donations: mockDonations,
    filters: { distance: 10, locationCoords: null },
    onFiltersChange: jest.fn(),
    onClaimClick: jest.fn(),
    isLoaded: true,
    savedLocation: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should render modal when isOpen is true', () => {
      render(<MapViewModal {...defaultProps} />);
      expect(screen.getByText('Nearby Donations')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<MapViewModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Nearby Donations')).not.toBeInTheDocument();
    });

    it('should close modal when X button is clicked', () => {
      const onClose = jest.fn();
      render(<MapViewModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when Cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<MapViewModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Location Synchronization', () => {
    it('should prioritize saved location over saved location', () => {
      const propsWithBoth = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
          location: 'Filter Location',
        },
        savedLocation: {
          latitude: 45.6,
          longitude: -73.6,
          address: 'Saved Location',
        },
      };

      render(<MapViewModal {...propsWithBoth} />);

      // Should not show location permission
      expect(
        screen.queryByTestId('location-permission')
      ).not.toBeInTheDocument();
      // Should show map with location
      expect(screen.getByTestId('donation-map')).toBeInTheDocument();
      // Should display "Search location" (filter source)
      expect(screen.getByText('Saved location')).toBeInTheDocument();
    });

    it('should use saved location when filter location is not available', () => {
      const propsWithSaved = {
        ...defaultProps,
        savedLocation: {
          latitude: 45.5017,
          longitude: -73.5673,
          address: 'Saved Address',
        },
      };

      render(<MapViewModal {...propsWithSaved} />);

      expect(
        screen.queryByTestId('location-permission')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('donation-map')).toBeInTheDocument();
      expect(screen.getByText('Saved location')).toBeInTheDocument();
    });

    it('should show location permission when no location available', () => {
      render(<MapViewModal {...defaultProps} />);
      expect(screen.getByTestId('location-permission')).toBeInTheDocument();
    });

    it('should update filters immediately when location is granted', async () => {
      const onFiltersChange = jest.fn();
      render(
        <MapViewModal {...defaultProps} onFiltersChange={onFiltersChange} />
      );

      const grantButton = screen.getByTestId('grant-location-btn');
      fireEvent.click(grantButton);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith('locationCoords', {
          lat: 45.5017,
          lng: -73.5673,
          address: 'Montreal, QC',
        });
      });
    });
  });

  describe('View Toggle (Map vs List)', () => {
    it('should start in map view by default', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);
      expect(screen.getByTestId('donation-map')).toBeInTheDocument();
    });

    it('should toggle to list view when List button is clicked', async () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);

      const listButton = screen.getByText('List');
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.queryByTestId('donation-map')).not.toBeInTheDocument();
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Bakery Items')).toBeInTheDocument();
      });
    });

    it('should toggle back to map view', async () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);

      // Go to list view
      fireEvent.click(screen.getByText('List'));

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      });

      // Go back to map view
      fireEvent.click(screen.getByText('Map'));

      await waitFor(() => {
        expect(screen.getByTestId('donation-map')).toBeInTheDocument();
      });
    });

    it('should show "Set Location" message in list view when no location', () => {
      render(<MapViewModal {...defaultProps} />);

      // Close permission dialog
      const closeButton = screen.getByTestId('close-permission-btn');
      fireEvent.click(closeButton);

      // Switch to list view
      const listButton = screen.getByText('List');
      fireEvent.click(listButton);

      expect(
        screen.getByText('Please set your location to see donations')
      ).toBeInTheDocument();
    });
  });

  describe('Distance Control', () => {
    it('should display current distance', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);
      expect(screen.getByTestId('current-distance')).toHaveTextContent('10km');
    });

    it('should update local distance when changed', async () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      const { rerender } = render(<MapViewModal {...propsWithLocation} />);

      const changeButton = screen.getByText('Change to 25km');
      fireEvent.click(changeButton);

      // Need to check if header subtitle updates
      await waitFor(() => {
        expect(screen.getByText(/within 25km/)).toBeInTheDocument();
      });
    });

    it('should apply distance to filters when Apply is clicked', async () => {
      const onFiltersChange = jest.fn();
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
        onFiltersChange,
      };

      render(<MapViewModal {...propsWithLocation} />);

      // Change distance
      fireEvent.click(screen.getByText('Change to 25km'));

      // Click Apply
      const applyButton = screen.getByText('Apply to Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith('distance', 25);
      });
    });
  });

  describe('Claim Functionality', () => {
    it('should call onClaimClick when claim is clicked in map view', async () => {
      const onClaimClick = jest.fn();
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
        onClaimClick,
      };

      render(<MapViewModal {...propsWithLocation} />);

      const claimButton = screen.getByTestId('map-donation-1');
      fireEvent.click(claimButton);

      await waitFor(() => {
        expect(onClaimClick).toHaveBeenCalledWith(
          expect.objectContaining({ id: 1, title: 'Fresh Vegetables' })
        );
      });
    });

    it('should call onClaimClick when claim is clicked in list view', async () => {
      const onClaimClick = jest.fn();
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
        onClaimClick,
      };

      render(<MapViewModal {...propsWithLocation} />);

      // Switch to list view
      fireEvent.click(screen.getByText('List'));

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      });

      // Click first claim button
      const claimButtons = screen.getAllByText('Claim Donation');
      fireEvent.click(claimButtons[0]);

      await waitFor(() => {
        expect(onClaimClick).toHaveBeenCalled();
      });
    });

    it('should NOT close modal when claim button is clicked', async () => {
      const onClose = jest.fn();
      const onClaimClick = jest.fn();
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
        onClose,
        onClaimClick,
      };

      render(<MapViewModal {...propsWithLocation} />);

      const claimButton = screen.getByTestId('map-donation-1');
      fireEvent.click(claimButton);

      await waitFor(() => {
        expect(onClaimClick).toHaveBeenCalled();
      });

      // Modal should still be open
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText('Nearby Donations')).toBeInTheDocument();
    });
  });

  describe('Donation Count Display', () => {
    it('should show correct plural "donations" for multiple items', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);
      expect(screen.getByText(/3 donations within 10km/)).toBeInTheDocument();
    });

    it('should show singular "donation" for one item', () => {
      const propsWithOneDonation = {
        ...defaultProps,
        donations: [mockDonations[0]],
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithOneDonation} />);
      expect(screen.getByText(/1 donation within 10km/)).toBeInTheDocument();
    });

    it('should show placeholder text when no location', () => {
      render(<MapViewModal {...defaultProps} />);
      expect(
        screen.getByText('Select your location to see nearby donations')
      ).toBeInTheDocument();
    });
  });

  describe('Location Info Display', () => {
    it('should display "Search location" for filter source', () => {
      const propsWithFilter = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithFilter} />);
      expect(screen.getByText('Search location')).toBeInTheDocument();
    });

    it('should display "Saved location" for saved source', () => {
      const propsWithSaved = {
        ...defaultProps,
        savedLocation: {
          latitude: 45.5,
          longitude: -73.5,
          address: 'Saved Address',
        },
      };

      render(<MapViewModal {...propsWithSaved} />);
      expect(screen.getByText('Saved location')).toBeInTheDocument();
    });

    it('should display "Current location" when granted', async () => {
      render(<MapViewModal {...defaultProps} />);

      const grantButton = screen.getByTestId('grant-location-btn');
      fireEvent.click(grantButton);

      await waitFor(() => {
        expect(screen.getByText('Current location')).toBeInTheDocument();
      });
    });

    it('should show Change button when location is set', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);
      expect(screen.getByText('Change')).toBeInTheDocument();
    });

    it('should show Set Location button when no location', () => {
      render(<MapViewModal {...defaultProps} />);

      const closeButton = screen.getByTestId('close-permission-btn');
      fireEvent.click(closeButton);

      expect(screen.getByText('Set Location')).toBeInTheDocument();
    });

    it('should reopen permission dialog when Change is clicked', async () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);

      // Permission should not be visible
      expect(
        screen.queryByTestId('location-permission')
      ).not.toBeInTheDocument();

      // Click Change
      const changeButton = screen.getByText('Change');
      fireEvent.click(changeButton);

      // Permission should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('location-permission')).toBeInTheDocument();
      });
    });
  });

  describe('Apply to Filters', () => {
    it('should apply both distance and location when Apply is clicked', async () => {
      const onClose = jest.fn();
      const onFiltersChange = jest.fn();
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
        onClose,
        onFiltersChange,
      };

      render(<MapViewModal {...propsWithLocation} />);

      // Change distance
      fireEvent.click(screen.getByText('Change to 5km'));

      // Click Apply
      const applyButton = screen.getByText('Apply to Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith('distance', 5);
        expect(onFiltersChange).toHaveBeenCalledWith('locationCoords', {
          lat: 45.5,
          lng: -73.5,
        });
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Distance Filtering', () => {
    it('should filter donations passed to DonationMap', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);

      // All 3 donations should be shown (within 10km)
      expect(screen.getByTestId('donations-count')).toHaveTextContent('3');
    });

    it('should show distance radius in map', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          distance: 15,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithLocation} />);
      expect(screen.getByTestId('distance-radius')).toHaveTextContent('15km');
    });
  });

  describe('No Donations State', () => {
    it('should show "no donations" message in list view when filtered', () => {
      const propsWithNoResults = {
        ...defaultProps,
        donations: [],
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithNoResults} />);

      // Switch to list view
      fireEvent.click(screen.getByText('List'));

      expect(
        screen.getByText('No donations found within 10km')
      ).toBeInTheDocument();
    });

    it('should show expand radius button when no donations', () => {
      const propsWithNoResults = {
        ...defaultProps,
        donations: [],
        filters: {
          distance: 10,
          locationCoords: { lat: 45.5, lng: -73.5 },
        },
      };

      render(<MapViewModal {...propsWithNoResults} />);

      fireEvent.click(screen.getByText('List'));

      expect(screen.getByText('Expand to 20km')).toBeInTheDocument();
    });
  });
});
