import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DonationMapCard from '../DonationsMap/DonationMapCard';

// Mock the food constants module
jest.mock('../../../constants/foodConstants', () => ({
  getPrimaryFoodCategory: jest.fn(() => 'Vegetables'),
  getFoodImageClass: jest.fn(() => 'food-vegetables'),
}));

describe('DonationMapCard', () => {
  const mockDonation = {
    id: 1,
    title: 'Fresh Vegetables',
    quantity: { value: 10, unit: 'kg' },
    expiryDate: '2024-12-31',
    pickupLocation: {
      latitude: 45.5017,
      longitude: -73.5673,
      address: '123 Main St, Montreal',
    },
  };

  const mockUserLocation = {
    latitude: 45.5087,
    longitude: -73.554,
  };

  const mockOnClaimClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders donation title', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('renders quantity with value and unit', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/10 kg/i)).toBeInTheDocument();
    });

    it('renders expiry date', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/Exp:/i)).toBeInTheDocument();
    });

    it('renders pickup address', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/123 Main St, Montreal/i)).toBeInTheDocument();
    });

    it('renders claim button', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(
        screen.getByRole('button', { name: /claim/i })
      ).toBeInTheDocument();
    });
  });

  describe('Distance Calculation', () => {
    it('calculates and displays distance in kilometers', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          userLocation={mockUserLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/km/)).toBeInTheDocument();
    });

    it('calculates and displays distance in meters for very close locations', () => {
      const veryCloseLocation = {
        latitude: 45.5018,
        longitude: -73.5674,
      };
      render(
        <DonationMapCard
          donation={mockDonation}
          userLocation={veryCloseLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/\d+\s?(m)\b/i)).toBeInTheDocument();
    });

    it('does not show distance when userLocation is missing', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.queryByText(/\d+\s?(km|m)\b/i)).not.toBeInTheDocument();
    });

    it('does not show distance when pickupLocation is missing', () => {
      const donationNoLocation = { ...mockDonation, pickupLocation: null };
      render(
        <DonationMapCard
          donation={donationNoLocation}
          userLocation={mockUserLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.queryByText(/\d+\s?(km|m)\b/i)).not.toBeInTheDocument();
    });

    it('calculates correct distance for far locations', () => {
      const farLocation = {
        latitude: 46.0,
        longitude: -74.0,
      };
      render(
        <DonationMapCard
          donation={mockDonation}
          userLocation={farLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      const distanceBadge = screen.getByText(/km/);
      expect(distanceBadge).toBeInTheDocument();
    });
  });

  describe('Claim Button Functionality', () => {
    it('calls onClaimClick with donation when clicked', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      const button = screen.getByRole('button', { name: /claim/i });
      fireEvent.click(button);
      expect(mockOnClaimClick).toHaveBeenCalledTimes(1);
      expect(mockOnClaimClick).toHaveBeenCalledWith(mockDonation);
    });

    it('does not crash when onClaimClick is undefined', () => {
      render(<DonationMapCard donation={mockDonation} />);
      const button = screen.getByRole('button', { name: /claim/i });
      fireEvent.click(button);
      // Should not throw
    });

    it('handles multiple clicks', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      const button = screen.getByRole('button', { name: /claim/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockOnClaimClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases and Missing Data', () => {
    it('handles missing quantity', () => {
      const donationNoQuantity = { ...mockDonation, quantity: null };
      render(
        <DonationMapCard
          donation={donationNoQuantity}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('handles missing expiryDate', () => {
      const donationNoExpiry = { ...mockDonation, expiryDate: null };
      render(
        <DonationMapCard
          donation={donationNoExpiry}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.queryByText(/Exp:/i)).not.toBeInTheDocument();
    });

    it('handles missing pickupLocation address', () => {
      const donationNoAddress = {
        ...mockDonation,
        pickupLocation: {
          latitude: 45.5017,
          longitude: -73.5673,
          address: null,
        },
      };
      render(
        <DonationMapCard
          donation={donationNoAddress}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.queryByText(/123 Main St/)).not.toBeInTheDocument();
    });

    it('handles completely missing pickupLocation', () => {
      const donationNoPickup = { ...mockDonation, pickupLocation: null };
      render(
        <DonationMapCard
          donation={donationNoPickup}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('renders with minimal data', () => {
      const minimalDonation = {
        id: 2,
        title: 'Basic Item',
        quantity: { value: 1, unit: 'item' },
      };
      render(
        <DonationMapCard
          donation={minimalDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Basic Item')).toBeInTheDocument();
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats date correctly', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      //============= mhab: Might be subject to change ==============
      expect(screen.getByText(/Dec 30|Dec 31/i)).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      const donationDiffDate = { ...mockDonation, expiryDate: '2024-06-15' };
      render(
        <DonationMapCard
          donation={donationDiffDate}
          onClaimClick={mockOnClaimClick}
        />
      );
      //============= mhab: Might be subject to change ==============
      expect(screen.getByText(/Jun 14|Jun 15/i)).toBeInTheDocument();
    });

    it('handles empty string expiryDate', () => {
      const donationEmptyDate = { ...mockDonation, expiryDate: '' };
      render(
        <DonationMapCard
          donation={donationEmptyDate}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.queryByText(/Exp:/i)).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('has donation-map-card class', () => {
      const { container } = render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(container.querySelector('.donation-map-card')).toBeInTheDocument();
    });

    it('has map-card-claim-btn class', () => {
      const { container } = render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(
        container.querySelector('.map-card-claim-btn')
      ).toBeInTheDocument();
    });

    it('has map-card-header class', () => {
      const { container } = render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(container.querySelector('.map-card-header')).toBeInTheDocument();
    });

    it('has distance badge when location provided', () => {
      const { container } = render(
        <DonationMapCard
          donation={mockDonation}
          userLocation={mockUserLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(
        container.querySelector('.distance-badge-inline')
      ).toBeInTheDocument();
    });
  });
});
