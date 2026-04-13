import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window.google
global.window.google = {
  maps: {
    SymbolPath: {
      CIRCLE: 0,
    },
    LatLngBounds: jest.fn(() => ({
      extend: jest.fn(),
    })),
  },
};

// Mock @react-google-maps/api completely
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: ({ position }) => (
    <div data-testid={`marker-${position.lat}-${position.lng}`} />
  ),
  Circle: ({ radius }) => <div data-testid="circle" data-radius={radius} />,
  InfoWindow: ({ children }) => <div data-testid="info-window">{children}</div>,
}));

// Mock DonationMapCard
jest.mock(
  '../components/ReceiverDashboard/DonationsMap/DonationMapCard',
  () => {
    return function DonationMapCard() {
      return <div data-testid="donation-card">Card</div>;
    };
  }
);

// Import component AFTER mocks
const DonationMap =
  require('../components/ReceiverDashboard/DonationsMap/DonationMap').default;

describe('DonationMap', () => {
  const mockDonations = [
    {
      id: 1,
      title: 'Fresh Vegetables',
      pickupLocation: {
        latitude: 45.5018,
        longitude: -73.5673,
      },
    },
    {
      id: 2,
      title: 'Bakery Items',
      pickupLocation: {
        latitude: 45.5087,
        longitude: -73.554,
      },
    },
  ];

  const mockUserLocation = {
    latitude: 45.5017,
    longitude: -73.5673,
  };

  describe('Loading State', () => {
    it('renders loading message when not loaded', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={false}
          distanceRadius={10}
        />
      );
      expect(screen.getByText('Loading Google Maps...')).toBeInTheDocument();
    });

    it('renders map when loaded', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  describe('Markers', () => {
    it('renders markers for donations with locations', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(
        screen.getAllByTestId('marker-45.5017--73.5673').length
      ).toBeGreaterThan(0);
      expect(screen.getByTestId('marker-45.5087--73.554')).toBeInTheDocument();
    });

    it('renders user location marker when location exists', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      // User marker at same location as user
      const markers = screen.getAllByTestId(/^marker-/);
      expect(markers.length).toBeGreaterThan(0);
    });

    it('does not crash without user location', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={null}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });

    it('skips donations without pickupLocation', () => {
      const donationsWithNull = [
        ...mockDonations,
        { id: 3, title: 'No Location', pickupLocation: null },
      ];
      render(
        <DonationMap
          donations={donationsWithNull}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      // One user marker + two donation markers
      const markers = screen.getAllByTestId(/^marker-/);
      expect(markers).toHaveLength(3);
    });
  });

  describe('Circle', () => {
    it('renders distance circle when user location exists', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={15}
        />
      );
      const circles = screen.getAllByTestId('circle');
      expect(circles.length).toBeGreaterThan(0);
      expect(circles[0]).toHaveAttribute('data-radius', '15000'); // km to meters
    });

    it('does not render circle without user location', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={null}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('shows user location in legend when available', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByText('Your location')).toBeInTheDocument();
    });

    it('shows donation marker in legend', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByText('Available donation')).toBeInTheDocument();
    });

    it('shows selected donation marker in legend', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByText('Selected donation')).toBeInTheDocument();
    });

    it('does not show user location in legend without location', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={null}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.queryByText('Your location')).not.toBeInTheDocument();
    });
  });

  describe('Overlay Message', () => {
    it('shows overlay message when no user location', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={null}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(
        screen.getByText(/Set your location to see the distance circle/)
      ).toBeInTheDocument();
    });

    it('does not show overlay when user location exists', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(
        screen.queryByText(/Set your location to see the distance circle/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders with empty donations array', () => {
      render(
        <DonationMap
          donations={[]}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });

    it('renders with no donations and no user location', () => {
      render(
        <DonationMap
          donations={[]}
          userLocation={null}
          isLoaded={true}
          distanceRadius={10}
        />
      );
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  describe('Distance Radius Updates', () => {
    it('updates circle radius when distanceRadius prop changes', () => {
      const { rerender } = render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      let circles = screen.getAllByTestId('circle');
      expect(circles[0]).toHaveAttribute('data-radius', '10000');

      rerender(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={20}
        />
      );

      circles = screen.getAllByTestId('circle');
      expect(circles[0]).toHaveAttribute('data-radius', '20000');
    });
  });

  describe('Donation Updates', () => {
    it('updates markers when donations change', () => {
      const { rerender } = render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      let markers = screen.getAllByTestId(/^marker-/);
      const initialMarkerCount = markers.length;

      const additionalDonations = [
        ...mockDonations,
        {
          id: 3,
          title: 'Dairy Products',
          pickupLocation: {
            latitude: 45.5,
            longitude: -73.55,
          },
        },
      ];

      rerender(
        <DonationMap
          donations={additionalDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      markers = screen.getAllByTestId(/^marker-/);
      expect(markers.length).toBeGreaterThan(initialMarkerCount);
    });
  });

  describe('Loading States', () => {
    it('transitions from loading to loaded', () => {
      const { rerender } = render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={false}
          distanceRadius={10}
        />
      );

      expect(screen.getByText('Loading Google Maps...')).toBeInTheDocument();

      rerender(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      expect(
        screen.queryByText('Loading Google Maps...')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  describe('Card Rendering', () => {
    it('renders map container with controls', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      // Verify map container is rendered
      expect(screen.getByTestId('google-map')).toBeInTheDocument();

      // Verify recenter button exists
      const recenterButton = screen.getByRole('button', { name: /recenter/i });
      expect(recenterButton).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('handles donations with same coordinates as user', () => {
      const donationsAtUserLocation = [
        {
          id: 1,
          title: 'Donation Same Location',
          pickupLocation: {
            latitude: 45.5017,
            longitude: -73.5673,
          },
        },
      ];

      render(
        <DonationMap
          donations={donationsAtUserLocation}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      const markers = screen.getAllByTestId(/^marker-/);
      expect(markers.length).toBeGreaterThan(0);
    });

    it('handles very large distance radius', () => {
      render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={100}
        />
      );

      const circles = screen.getAllByTestId('circle');
      expect(circles[0]).toHaveAttribute('data-radius', '100000');
    });

    it('handles multiple resets and updates', () => {
      const { rerender } = render(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={10}
        />
      );

      // First update
      rerender(
        <DonationMap
          donations={[]}
          userLocation={mockUserLocation}
          isLoaded={true}
          distanceRadius={15}
        />
      );

      // Second update
      rerender(
        <DonationMap
          donations={mockDonations}
          userLocation={null}
          isLoaded={true}
          distanceRadius={20}
        />
      );

      // Third update
      rerender(
        <DonationMap
          donations={mockDonations}
          userLocation={mockUserLocation}
          isLoaded={false}
          distanceRadius={10}
        />
      );

      expect(screen.getByText('Loading Google Maps...')).toBeInTheDocument();
    });
  });
});
