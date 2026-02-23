import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverSavedDonations from '../ReceiverSavedDonations';
import { savedDonationAPI, surplusAPI } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  savedDonationAPI: {
    getSavedDonations: jest.fn(),
    unsave: jest.fn(),
  },
  surplusAPI: {
    claim: jest.fn(),
  },
}));

const mockDonation = {
  id: 1,
  title: 'Fresh Bread',
  status: 'AVAILABLE',
  foodCategories: ['BAKERY_PASTRY'],
  pickupLocation: { address: '123 Main St' },
  expiryDate: '2026-03-24',
  pickupDate: '2026-03-23',
  pickupFrom: '08:15:00',
  pickupTo: '11:45:00',
  quantity: { value: 8, unit: 'PORTION' },
  donorName: 'Columbus Cafe',
  description: 'Same-day pickup preferred',
  createdAt: '2026-03-22T10:00:00Z',
  dietaryTags: ['VEGETARIAN'],
};

describe('ReceiverSavedDonations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  test('renders loading state', () => {
    savedDonationAPI.getSavedDonations.mockReturnValue(new Promise(() => {}));

    render(<ReceiverSavedDonations />);

    expect(screen.getByText('Loading donations...')).toBeInTheDocument();
  });

  test('renders error state when fetch fails', async () => {
    savedDonationAPI.getSavedDonations.mockRejectedValue(new Error('boom'));

    render(<ReceiverSavedDonations />);

    expect(
      await screen.findByText('Failed to load saved donations')
    ).toBeInTheDocument();
  });

  test('renders empty state when no saved donations', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({ data: [] });

    render(<ReceiverSavedDonations />);

    expect(
      await screen.findByText('No saved donations yet.')
    ).toBeInTheDocument();
  });

  test('renders saved donation card and unsaves on bookmark click', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });
    savedDonationAPI.unsave.mockResolvedValue({});

    render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    const bookmarkButton = screen.getByLabelText('Bookmark');
    fireEvent.click(bookmarkButton);

    await waitFor(() => {
      expect(savedDonationAPI.unsave).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Fresh Bread')).not.toBeInTheDocument();
    });
  });

  test('restores donation when unsave fails', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });
    savedDonationAPI.unsave.mockRejectedValue(new Error('cannot unsave'));

    render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Bookmark'));

    await waitFor(() => {
      expect(savedDonationAPI.unsave).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();
  });

  test('claims donation with legacy slot when confirmed', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });
    savedDonationAPI.unsave.mockResolvedValue({});
    surplusAPI.claim.mockResolvedValue({});
    global.confirm = jest.fn(() => true);

    render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Claim Donation'));

    await waitFor(() => {
      expect(surplusAPI.claim).toHaveBeenCalledWith(1, {
        pickupDate: '2026-03-23',
        startTime: '08:15:00',
        endTime: '11:45:00',
      });
    });
  });

  test('does not claim donation when confirmation is cancelled', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });
    global.confirm = jest.fn(() => false);

    render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Claim Donation'));

    await waitFor(() => {
      expect(surplusAPI.claim).not.toHaveBeenCalled();
    });
  });

  test('claims donation through pickup slot modal', async () => {
    const slotDonation = {
      ...mockDonation,
      id: 5,
      title: 'Prepared Meals',
      pickupSlots: [
        {
          id: 11,
          pickupDate: '2026-03-23',
          startTime: '09:00:00',
          endTime: '10:00:00',
          notes: 'Morning slot',
        },
      ],
    };

    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [slotDonation],
    });
    surplusAPI.claim.mockResolvedValue({});
    savedDonationAPI.unsave.mockResolvedValue({});

    render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Prepared Meals')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Claim Donation'));

    expect(await screen.findByText('Choose a pickup slot')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Confirm & Claim'));
    });

    await waitFor(() => {
      expect(surplusAPI.claim).toHaveBeenCalledWith(5, {
        pickupDate: '2026-03-23',
        startTime: '09:00:00',
        endTime: '10:00:00',
        notes: 'Morning slot',
        id: 11,
      });
    });
  });

  test('filters out non-available donations and sorts newest first', async () => {
    const newerAvailable = {
      ...mockDonation,
      id: 8,
      title: 'Newest Available',
      createdAt: '2026-03-23T10:00:00Z',
    };
    const olderAvailable = {
      ...mockDonation,
      id: 9,
      title: 'Older Available',
      createdAt: '2026-03-20T10:00:00Z',
    };
    const nonAvailable = {
      ...mockDonation,
      id: 10,
      title: 'Claimed Donation',
      status: 'CLAIMED',
    };

    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [olderAvailable, nonAvailable, newerAvailable],
    });

    const { container } = render(<ReceiverSavedDonations />);

    expect(await screen.findByText('Newest Available')).toBeInTheDocument();
    expect(screen.getByText('Older Available')).toBeInTheDocument();
    expect(screen.queryByText('Claimed Donation')).not.toBeInTheDocument();

    const titles = [...container.querySelectorAll('.receiver-donation-title')];
    expect(titles[0]).toHaveTextContent('Newest Available');
    expect(titles[1]).toHaveTextContent('Older Available');

    fireEvent.click(screen.getByRole('button', { name: /date posted/i }));
  });

  test('supports expanding and collapsing card details', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });

    render(<ReceiverSavedDonations />);
    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    expect(await screen.findByText('Less')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /less/i }));
    expect(await screen.findByText('More')).toBeInTheDocument();
  });

  test('handles malformed saved donations response as empty list', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({ data: null });

    render(<ReceiverSavedDonations />);

    expect(
      await screen.findByText('No saved donations yet.')
    ).toBeInTheDocument();
  });

  test('alerts API message when claim fails', async () => {
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [mockDonation],
    });
    surplusAPI.claim.mockRejectedValue({
      response: { data: { message: 'Unable to claim this donation' } },
    });
    global.confirm = jest.fn(() => true);

    render(<ReceiverSavedDonations />);
    expect(await screen.findByText('Fresh Bread')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Claim Donation'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Unable to claim this donation');
    });
  });

  test('allows choosing another pickup slot and closing modal', async () => {
    const multiSlotDonation = {
      ...mockDonation,
      id: 12,
      title: 'Two Slots',
      pickupSlots: [
        {
          id: 20,
          pickupDate: '2026-03-23',
          startTime: '08:00:00',
          endTime: '09:00:00',
          notes: 'First',
        },
        {
          id: 21,
          date: '2026-03-24',
          pickupFrom: '10:00:00',
          pickupTo: '11:00:00',
          notes: 'Second',
        },
      ],
    };

    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [multiSlotDonation],
    });
    surplusAPI.claim.mockResolvedValue({});
    savedDonationAPI.unsave.mockResolvedValue({});

    render(<ReceiverSavedDonations />);
    expect(await screen.findByText('Two Slots')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Claim Donation'));
    expect(await screen.findByText('Choose a pickup slot')).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Choose a pickup slot')
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Claim Donation'));
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Confirm & Claim'));

    await waitFor(() => {
      expect(surplusAPI.claim).toHaveBeenCalledWith(12, {
        pickupDate: '2026-03-24',
        startTime: '10:00:00',
        endTime: '11:00:00',
        notes: 'Second',
        id: 21,
      });
    });
  });
});
