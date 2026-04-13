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
});
