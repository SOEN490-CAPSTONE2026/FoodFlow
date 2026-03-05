import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InviteCommunity from '../components/ReceiverDashboard/InviteCommunity';
import SuggestBusiness from '../components/DonorDashboard/SuggestBusiness';
import { referralAPI } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  referralAPI: {
    submit: jest.fn(),
  },
}));

// Helper to render inside Router context
const renderWithRouter = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

// ─── InviteCommunity ──────────────────────────────────────────────────────────

describe('InviteCommunity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the invite community form', () => {
    renderWithRouter(<InviteCommunity />);
    expect(
      screen.getByText('Invite a Community Organization')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send invitation/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty on submit', async () => {
    renderWithRouter(<InviteCommunity />);
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(
      await screen.findByText('Organization name is required.')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Contact email is required.')
    ).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderWithRouter(<InviteCommunity />);

    await userEvent.type(
      screen.getByLabelText(/organization name/i),
      'Test Org'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'not-an-email'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(
      await screen.findByText('Please enter a valid email address.')
    ).toBeInTheDocument();
  });

  it('displays success message after successful submission', async () => {
    referralAPI.submit.mockResolvedValueOnce({ data: { id: 1 } });

    renderWithRouter(<InviteCommunity />);

    await userEvent.type(
      screen.getByLabelText(/organization name/i),
      'Community Pantry'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'info@pantry.org'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText(/invitation submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/info@pantry.org/)).toBeInTheDocument();
  });

  it('submits with INVITE_COMMUNITY referral type', async () => {
    referralAPI.submit.mockResolvedValueOnce({ data: { id: 1 } });

    renderWithRouter(<InviteCommunity />);
    await userEvent.type(
      screen.getByLabelText(/organization name/i),
      'Community Pantry'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'info@pantry.org'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(referralAPI.submit).toHaveBeenCalledWith(
        expect.objectContaining({ referralType: 'INVITE_COMMUNITY' })
      );
    });
  });

  it('shows error message when API call fails', async () => {
    referralAPI.submit.mockRejectedValueOnce({
      response: { data: 'Server error. Please try again.' },
    });

    renderWithRouter(<InviteCommunity />);
    await userEvent.type(
      screen.getByLabelText(/organization name/i),
      'Community Pantry'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'info@pantry.org'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(
      await screen.findByText('Server error. Please try again.')
    ).toBeInTheDocument();
  });

  it('allows submitting another invitation after success', async () => {
    referralAPI.submit.mockResolvedValueOnce({ data: { id: 1 } });

    renderWithRouter(<InviteCommunity />);
    await userEvent.type(
      screen.getByLabelText(/organization name/i),
      'Community Pantry'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'info@pantry.org'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    await screen.findByTestId('success-message');
    await userEvent.click(screen.getByText(/submit another invitation/i));

    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
  });
});

// ─── SuggestBusiness ─────────────────────────────────────────────────────────

describe('SuggestBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the suggest business form', () => {
    renderWithRouter(<SuggestBusiness />);
    expect(screen.getByText('Suggest a Business')).toBeInTheDocument();
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit suggestion/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty on submit', async () => {
    renderWithRouter(<SuggestBusiness />);
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(
      await screen.findByText('Business name is required.')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Contact email is required.')
    ).toBeInTheDocument();
  });

  it('displays success message after successful submission', async () => {
    referralAPI.submit.mockResolvedValueOnce({ data: { id: 2 } });

    renderWithRouter(<SuggestBusiness />);
    await userEvent.type(
      screen.getByLabelText(/business name/i),
      'Green Valley Bakery'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'contact@bakery.com'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText(/suggestion submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/contact@bakery.com/)).toBeInTheDocument();
  });

  it('submits with SUGGEST_BUSINESS referral type', async () => {
    referralAPI.submit.mockResolvedValueOnce({ data: { id: 2 } });

    renderWithRouter(<SuggestBusiness />);
    await userEvent.type(
      screen.getByLabelText(/business name/i),
      'Green Valley Bakery'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'contact@bakery.com'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(referralAPI.submit).toHaveBeenCalledWith(
        expect.objectContaining({ referralType: 'SUGGEST_BUSINESS' })
      );
    });
  });

  it('shows error message when API call fails', async () => {
    referralAPI.submit.mockRejectedValueOnce({
      response: { data: 'Network error.' },
    });

    renderWithRouter(<SuggestBusiness />);
    await userEvent.type(
      screen.getByLabelText(/business name/i),
      'Green Valley Bakery'
    );
    await userEvent.type(
      screen.getByLabelText(/contact email/i),
      'contact@bakery.com'
    );
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(await screen.findByText('Network error.')).toBeInTheDocument();
  });
});
