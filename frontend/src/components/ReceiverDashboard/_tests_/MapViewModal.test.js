import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapViewModal from '../DonationsMap/MapViewModal';

jest.mock('../DonationsMap/DonationMap', () => {
  const mockReact = require('react');
  return function MockDonationMap({
    donations,
    userLocation,
    distanceRadius,
    onClaimClick,
  }) {
    return mockReact.createElement(
      'div',
      { 'data-testid': 'donation-map' },
      mockReact.createElement(
        'span',
        { 'data-testid': 'donations-count' },
        String(donations.length)
      ),
      mockReact.createElement(
        'span',
        { 'data-testid': 'distance-radius' },
        String(distanceRadius)
      ),
      mockReact.createElement(
        'span',
        { 'data-testid': 'location-lat' },
        userLocation ? String(userLocation.latitude) : 'none'
      ),
      mockReact.createElement(
        'span',
        { 'data-testid': 'location-lng' },
        userLocation ? String(userLocation.longitude) : 'none'
      ),
      mockReact.createElement(
        'span',
        { 'data-testid': 'location-source' },
        userLocation?.source || 'none'
      ),
      donations.map(donation =>
        mockReact.createElement(
          'button',
          {
            key: donation.id,
            type: 'button',
            onClick: () => onClaimClick?.(donation),
          },
          `Claim ${donation.title}`
        )
      )
    );
  };
});

describe('MapViewModal', () => {
  const mockDonations = [
    { id: 1, title: 'Fresh Vegetables' },
    { id: 2, title: 'Bakery Items' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    donations: mockDonations,
    filters: { distance: 10, locationCoords: null, location: '' },
    accountLocation: null,
    onClaimClick: jest.fn(),
    isLoaded: true,
  };

  const originalGoogle = global.window.google;

  beforeEach(() => {
    jest.clearAllMocks();
    delete global.window.google;
  });

  afterAll(() => {
    global.window.google = originalGoogle;
  });

  it('does not render when closed', () => {
    render(<MapViewModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByLabelText('Map browse view')).not.toBeInTheDocument();
  });

  it('renders inline map view and closes on Back to list', () => {
    const onClose = jest.fn();
    render(<MapViewModal {...defaultProps} onClose={onClose} />);

    expect(screen.getByText('Browse on map')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to list/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders set location subtitle when no usable location exists', () => {
    render(<MapViewModal {...defaultProps} />);

    expect(
      screen.getByText('Set your location in filters to center the map')
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-source')).toHaveTextContent('none');
  });

  it('uses filters.locationCoords as highest priority location', () => {
    render(
      <MapViewModal
        {...defaultProps}
        filters={{
          distance: 10,
          locationCoords: {
            lat: 45.5,
            lng: -73.5,
            address: 'Filter Address',
          },
          locationSource: 'filter',
        }}
        accountLocation={{ latitude: 46.0, longitude: -74.0 }}
      />
    );

    expect(screen.getByTestId('location-lat')).toHaveTextContent('45.5');
    expect(screen.getByTestId('location-lng')).toHaveTextContent('-73.5');
    expect(screen.getByTestId('location-source')).toHaveTextContent('filter');
    expect(screen.getByText('2 donations within 10km')).toBeInTheDocument();
  });

  it('falls back to accountLocation when filter coordinates are absent', () => {
    render(
      <MapViewModal
        {...defaultProps}
        accountLocation={{ latitude: 45.51, longitude: -73.56 }}
      />
    );

    expect(screen.getByTestId('location-lat')).toHaveTextContent('45.51');
    expect(screen.getByTestId('location-lng')).toHaveTextContent('-73.56');
    expect(screen.getByTestId('location-source')).toHaveTextContent('account');
    expect(screen.getByText('2 donations within 10km')).toBeInTheDocument();
  });

  it('uses default distance of 10km when filter distance is missing', () => {
    render(
      <MapViewModal
        {...defaultProps}
        filters={{ locationCoords: { lat: 45.5, lng: -73.5 } }}
      />
    );

    expect(screen.getByTestId('distance-radius')).toHaveTextContent('10');
    expect(screen.getByText('2 donations within 10km')).toBeInTheDocument();
  });

  it('passes donation click through to onClaimClick', () => {
    const onClaimClick = jest.fn();
    render(<MapViewModal {...defaultProps} onClaimClick={onClaimClick} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Claim Fresh Vegetables' })
    );
    expect(onClaimClick).toHaveBeenCalledWith(mockDonations[0]);
  });

  it('geocodes filters.location when coordinates are missing', async () => {
    const geocode = jest.fn((request, callback) => {
      callback(
        [
          {
            formatted_address: '4400 Avenue West Hill, Montreal',
            geometry: {
              location: {
                lat: () => 45.5017,
                lng: () => -73.5673,
              },
            },
          },
        ],
        'OK'
      );
    });

    global.window.google = {
      maps: {
        Geocoder: function Geocoder() {
          this.geocode = geocode;
        },
      },
    };

    render(
      <MapViewModal
        {...defaultProps}
        filters={{
          distance: 12,
          location: 'Montreal, QC',
          locationCoords: null,
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-lat')).toHaveTextContent('45.5017');
    });
    expect(geocode).toHaveBeenCalled();
    expect(screen.getByTestId('location-source')).toHaveTextContent('address');
    expect(screen.getByText('2 donations within 12km')).toBeInTheDocument();
  });

  it('keeps map uncentered when geocoding cannot resolve address', async () => {
    const geocode = jest.fn((request, callback) =>
      callback([], 'ZERO_RESULTS')
    );

    global.window.google = {
      maps: {
        Geocoder: function Geocoder() {
          this.geocode = geocode;
        },
      },
    };

    render(
      <MapViewModal
        {...defaultProps}
        filters={{
          distance: 10,
          location: 'Unknown place',
          locationCoords: null,
        }}
      />
    );

    await waitFor(() => {
      expect(geocode).toHaveBeenCalled();
    });

    expect(screen.getByTestId('location-source')).toHaveTextContent('none');
    expect(
      screen.getByText('Set your location in filters to center the map')
    ).toBeInTheDocument();
  });
});
