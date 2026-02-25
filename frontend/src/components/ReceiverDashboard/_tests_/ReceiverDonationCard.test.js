import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverDonationCard from '../ReceiverDonationCard';

const item = {
  id: 42,
  title: 'Motor City Pizza',
  status: 'AVAILABLE',
  foodCategories: ['BAKERY_PASTRY'],
  pickupLocation: { address: '100 Test Ave' },
  expiryDate: '2026-03-24',
  pickupDate: '2026-03-23',
  pickupFrom: '08:00:00',
  pickupTo: '09:00:00',
  quantity: { value: 4, unit: 'PORTION' },
  donorName: 'Cafe',
  description: 'Note',
  createdAt: '2026-03-22T10:00:00Z',
  dietaryTags: ['VEGETARIAN'],
  pickupSlots: [
    {
      pickupDate: '2026-03-23',
      startTime: '08:00:00',
      endTime: '09:00:00',
      notes: 'Slot note',
    },
  ],
  temperatureCategory: 'ROOM_TEMP',
  packagingType: 'SEALED_CONTAINER',
};

const t = (key, fallbackOrVars) => {
  if (typeof fallbackOrVars === 'string') {
    return fallbackOrVars;
  }
  if (key === 'receiverBrowse.expires') {
    return 'Expires';
  }
  if (key === 'receiverBrowse.pickupTime') {
    return 'Pickup Time';
  }
  if (key === 'receiverBrowse.quantity') {
    return 'Quantity';
  }
  if (key === 'receiverBrowse.items') {
    return 'items';
  }
  if (key === 'receiverBrowse.more') {
    return 'More';
  }
  if (key === 'receiverBrowse.less') {
    return 'Less';
  }
  if (key === 'receiverBrowse.claimDonation') {
    return 'Claim Donation';
  }
  if (key === 'receiverBrowse.claiming') {
    return 'Claiming...';
  }
  if (key === 'receiverBrowse.donorsNote') {
    return "Donor's Note";
  }
  if (key === 'receiverBrowse.posted') {
    return 'Posted';
  }
  if (key === 'receiverBrowse.localBusiness') {
    return 'Local Business';
  }
  if (key === 'receiverBrowse.locationNotSpecified') {
    return 'Location not specified';
  }
  if (key === 'receiverBrowse.donatedBy') {
    return `Donated by ${fallbackOrVars?.donorName || ''}`;
  }
  if (key.startsWith('surplusForm.')) {
    return key;
  }
  if (key.startsWith('receiverBrowse.status.')) {
    return 'Available';
  }
  return key;
};

describe('ReceiverDonationCard', () => {
  test('renders and triggers callbacks', () => {
    const onToggleMore = jest.fn();
    const onClaim = jest.fn();
    const onBookmark = jest.fn();

    render(
      <ReceiverDonationCard
        item={item}
        t={t}
        expanded={false}
        onToggleMore={onToggleMore}
        onClaim={onClaim}
        onBookmark={onBookmark}
        isBookmarked={true}
        isBookmarking={false}
        claiming={false}
        isClaimTarget={false}
        formatBestBeforeDate={() => 'Mar 24, 2026'}
        formatPickupTime={() => 'Mar 23, 2026 8:00 AM-9:00 AM'}
        formatPostedTime={() => '1 day ago'}
        formatStatus={() => 'Available'}
        getStatusClass={() => 'status-available'}
        getRecommendationData={() => ({ score: 92, reasons: ['match'] })}
        hoveredRecommended={42}
        setHoveredRecommended={jest.fn()}
      />
    );

    expect(screen.getByText('Motor City Pizza')).toBeInTheDocument();
    expect(screen.getByText('Claim Donation')).toBeInTheDocument();
    expect(screen.getByText('Match Score')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Bookmark'));
    expect(onBookmark).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Claim Donation'));
    expect(onClaim).toHaveBeenCalledWith(item);

    fireEvent.click(screen.getByText('More'));
    expect(onToggleMore).toHaveBeenCalledWith(item);
  });

  test('renders expanded details', () => {
    render(
      <ReceiverDonationCard
        item={item}
        t={t}
        expanded={true}
        onToggleMore={jest.fn()}
        onClaim={jest.fn()}
        onBookmark={jest.fn()}
        isBookmarked={false}
        isBookmarking={false}
        claiming={true}
        isClaimTarget={true}
        formatBestBeforeDate={() => 'Mar 24, 2026'}
        formatPickupTime={() => 'Mar 23, 2026 8:00 AM-9:00 AM'}
        formatPostedTime={() => '1 day ago'}
        formatStatus={() => 'Available'}
        getStatusClass={() => 'status-available'}
        hoveredRecommended={null}
        setHoveredRecommended={jest.fn()}
      />
    );

    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText("Donor's Note")).toBeInTheDocument();
    expect(screen.getByText('Claiming...')).toBeInTheDocument();
    expect(screen.getByText('Less')).toBeInTheDocument();
  });
});
