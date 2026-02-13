import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DonationMapCard from '../DonationsMap/DonationMapCard';

describe('DonationMapCard', () => {
  const mockDonation = {
    id: 1,
    title: 'Fresh Vegetables',
    description: 'Surplus from local farm',
    foodCategory: 'Vegetables',
    quantity: '10 kg',
    expiryDate: '2024-12-31',
    pickupLocation: {
      address: '123 Main St, Montreal',
    },
    donor: {
      organizationName: 'Green Farm Co',
    },
  };

  const mockOnClaimClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders donation title', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    /*=========== Following test can be added later ===================
    it('renders donation description', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Surplus from local farm')).toBeInTheDocument();
    });
    */

    it('renders food category', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/Vegetables/i)).toBeInTheDocument();
    });

    /*=========== Following test can be added later ===================
    it('renders quantity', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/10 kg/i)).toBeInTheDocument();
    });
    */

    it('renders pickup address', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/123 Main St, Montreal/i)).toBeInTheDocument();
    });

    /*=========== Following test can be added later ===================
    it('renders donor organization name', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText(/Green Farm Co/i)).toBeInTheDocument();
    });
    */
  });

  describe('Claim Button', () => {
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

    it('calls onClaimClick when claim button is clicked', () => {
      render(
        <DonationMapCard
          donation={mockDonation}
          onClaimClick={mockOnClaimClick}
        />
      );
      const claimButton = screen.getByRole('button', { name: /claim/i });
      fireEvent.click(claimButton);
      expect(mockOnClaimClick).toHaveBeenCalledTimes(1);
      expect(mockOnClaimClick).toHaveBeenCalledWith(mockDonation);
    });

    it('does not crash when onClaimClick is not provided', () => {
      render(<DonationMapCard donation={mockDonation} />);
      const claimButton = screen.getByRole('button', { name: /claim/i });
      fireEvent.click(claimButton);
      // Should not throw error
    });
  });

  describe('Edge Cases', () => {
    it('handles missing description', () => {
      const donationNoDesc = { ...mockDonation, description: null };
      render(
        <DonationMapCard
          donation={donationNoDesc}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('handles missing donor organization', () => {
      const donationNoDonor = { ...mockDonation, donor: null };
      render(
        <DonationMapCard
          donation={donationNoDonor}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('handles missing pickup location', () => {
      const donationNoLocation = { ...mockDonation, pickupLocation: null };
      render(
        <DonationMapCard
          donation={donationNoLocation}
          onClaimClick={mockOnClaimClick}
        />
      );
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });
  });
});
