import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminReferrals from '../AdminReferrals';
import { referralAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  referralAPI: {
    getAll: jest.fn(),
  },
}));

const mockReferrals = [
  {
    id: 1,
    referralType: 'SUGGEST_BUSINESS',
    businessName: 'Green Valley Bakery',
    contactEmail: 'contact@bakery.com',
    contactPhone: '+1 555-123-4567',
    message: 'They have lots of surplus bread at end of day.',
    submittedByEmail: 'donor@example.com',
    createdAt: '2026-03-01T10:00:00',
  },
  {
    id: 2,
    referralType: 'INVITE_COMMUNITY',
    businessName: 'Community Food Pantry',
    contactEmail: 'info@pantry.org',
    contactPhone: null,
    message: null,
    submittedByEmail: 'receiver@example.com',
    createdAt: '2026-03-02T14:30:00',
  },
];

const renderWithRouter = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AdminReferrals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    referralAPI.getAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRouter(<AdminReferrals />);
    expect(
      screen.getByText(/loading referral submissions/i)
    ).toBeInTheDocument();
  });

  it('renders referrals table after successful fetch', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    expect(await screen.findByTestId('referrals-table')).toBeInTheDocument();
    expect(screen.getByText('Green Valley Bakery')).toBeInTheDocument();
    expect(screen.getByText('Community Food Pantry')).toBeInTheDocument();
    expect(screen.getByText('contact@bakery.com')).toBeInTheDocument();
    expect(screen.getByText('info@pantry.org')).toBeInTheDocument();
    expect(screen.getByText('donor@example.com')).toBeInTheDocument();
    expect(screen.getByText('receiver@example.com')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    referralAPI.getAll.mockRejectedValueOnce(new Error('Network error'));
    renderWithRouter(<AdminReferrals />);

    expect(
      await screen.findByText(/failed to load referral submissions/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no referrals exist', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: [] });
    renderWithRouter(<AdminReferrals />);

    expect(
      await screen.findByText(/no referral submissions yet/i)
    ).toBeInTheDocument();
  });

  it('displays submission count', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    await screen.findByTestId('referrals-table');
    expect(screen.getByText(/showing 2 of 2/i)).toBeInTheDocument();
  });

  it('filters by SUGGEST_BUSINESS type', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    await screen.findByTestId('referrals-table');

    fireEvent.click(screen.getByText('Suggest Business'));

    expect(screen.getByText('Green Valley Bakery')).toBeInTheDocument();
    expect(screen.queryByText('Community Food Pantry')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument();
  });

  it('filters by INVITE_COMMUNITY type', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    await screen.findByTestId('referrals-table');

    fireEvent.click(screen.getByText('Invite Community'));

    expect(screen.getByText('Community Food Pantry')).toBeInTheDocument();
    expect(screen.queryByText('Green Valley Bakery')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 2/i)).toBeInTheDocument();
  });

  it('shows all referrals when ALL filter is selected', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    await screen.findByTestId('referrals-table');

    fireEvent.click(screen.getByText('Suggest Business'));
    fireEvent.click(screen.getByText('All'));

    expect(screen.getByText('Green Valley Bakery')).toBeInTheDocument();
    expect(screen.getByText('Community Food Pantry')).toBeInTheDocument();
    expect(screen.getByText(/showing 2 of 2/i)).toBeInTheDocument();
  });

  it('refreshes data when Refresh button is clicked', async () => {
    referralAPI.getAll
      .mockResolvedValueOnce({ data: mockReferrals })
      .mockResolvedValueOnce({ data: mockReferrals });

    renderWithRouter(<AdminReferrals />);
    await screen.findByTestId('referrals-table');

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(referralAPI.getAll).toHaveBeenCalledTimes(2);
    });
  });

  it('renders dash for missing phone and message', async () => {
    referralAPI.getAll.mockResolvedValueOnce({ data: mockReferrals });
    renderWithRouter(<AdminReferrals />);

    await screen.findByTestId('referrals-table');

    // Community Food Pantry has no phone or message — expect em dashes
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
