import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapViewBanner from '../DonationsMap/MapViewBanner';

describe('MapViewBanner', () => {
  const defaultProps = {
    onOpenMap: jest.fn(),
    nearbyCount: 5,
    distanceRadius: 10,
    hasLocation: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('With Location', () => {
    it('should render banner with nearby count when location is available', () => {
      render(<MapViewBanner {...defaultProps} />);

      expect(screen.getByText(/5 donations within 10km/)).toBeInTheDocument();
    });

    it('should show singular "donation" for count of 1', () => {
      render(<MapViewBanner {...defaultProps} nearbyCount={1} />);

      expect(screen.getByText(/1 donation within 10km/)).toBeInTheDocument();
    });

    it('should show plural "donations" for count > 1', () => {
      render(<MapViewBanner {...defaultProps} nearbyCount={3} />);

      expect(screen.getByText(/3 donations within 10km/)).toBeInTheDocument();
    });

    it('should show correct subtitle with location', () => {
      render(<MapViewBanner {...defaultProps} />);

      expect(
        screen.getByText('Click to see donations near you on the map')
      ).toBeInTheDocument();
    });
  });

  describe('Without Location', () => {
    const propsWithoutLocation = {
      ...defaultProps,
      hasLocation: false,
    };

    it('should show generic message when no location', () => {
      render(<MapViewBanner {...propsWithoutLocation} />);

      expect(screen.getByText('View donations on map')).toBeInTheDocument();
    });

    it('should show enable location subtitle', () => {
      render(<MapViewBanner {...propsWithoutLocation} />);

      expect(
        screen.getByText('Enable location to see nearby donations')
      ).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onOpenMap when banner is clicked', () => {
      const onOpenMap = jest.fn();
      render(<MapViewBanner {...defaultProps} onOpenMap={onOpenMap} />);

      const banner = screen.getByText(/5 donations within 10km/).closest('div');
      fireEvent.click(banner);

      expect(onOpenMap).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenMap when banner without location is clicked', () => {
      const onOpenMap = jest.fn();
      render(
        <MapViewBanner
          {...defaultProps}
          hasLocation={false}
          onOpenMap={onOpenMap}
        />
      );

      const banner = screen.getByText('View donations on map').closest('div');
      fireEvent.click(banner);

      expect(onOpenMap).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Props', () => {
    it('should handle default prop values', () => {
      render(<MapViewBanner onOpenMap={jest.fn()} />);

      // Should render with defaults: nearbyCount=0, distanceRadius=10, hasLocation=false
      expect(screen.getByText('View donations on map')).toBeInTheDocument();
    });
  });

  describe('Distance Radius Display', () => {
    it('should display correct distance radius', () => {
      render(<MapViewBanner {...defaultProps} distanceRadius={25} />);

      expect(screen.getByText(/within 25km/)).toBeInTheDocument();
    });

    it('should display different distance values', () => {
      const { rerender } = render(
        <MapViewBanner {...defaultProps} distanceRadius={5} />
      );

      expect(screen.getByText(/within 5km/)).toBeInTheDocument();

      rerender(<MapViewBanner {...defaultProps} distanceRadius={50} />);

      expect(screen.getByText(/within 50km/)).toBeInTheDocument();
    });
  });

  describe('Zero Donations', () => {
    it('should display correctly with zero donations', () => {
      render(<MapViewBanner {...defaultProps} nearbyCount={0} />);

      expect(screen.getByText(/0 donations within 10km/)).toBeInTheDocument();
    });
  });
});
