import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmPickupModal from '../components/DonorDashboard/ConfirmPickupModal';
import { surplusAPI } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  surplusAPI: {
    confirmPickup: jest.fn(),
  },
}));

describe('ConfirmPickupModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const donationItem = { id: 123 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      <ConfirmPickupModal
        isOpen={false}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders correctly when open', () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: /Confirm Pickup/i })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  test('shows error if confirm clicked with incomplete code', async () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm Pickup/i });
    fireEvent.click(confirmButton);

    expect(await screen.findByText(/Please enter the complete 6-digit code/i)).toBeInTheDocument();
  });

  test('calls API and closes modal on success', async () => {
    surplusAPI.confirmPickup.mockResolvedValueOnce({ data: { success: true } });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: `${i + 1}` } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Pickup/i }));

    await waitFor(() => expect(surplusAPI.confirmPickup).toHaveBeenCalledWith(123, '123456'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });

  test('shows error on invalid code response', async () => {
    surplusAPI.confirmPickup.mockResolvedValueOnce({
      data: { success: false, message: 'Invalid pickup code' },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: `${i}` } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Pickup/i }));

    expect(await screen.findByText(/Invalid pickup code/i)).toBeInTheDocument();
  });

  test('shows server error on API failure', async () => {
    surplusAPI.confirmPickup.mockRejectedValueOnce({
      response: { data: { message: 'Server error. Please try again.' } },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: `${i + 1}` } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Pickup/i }));

    expect(await screen.findByText(/Server error. Please try again./i)).toBeInTheDocument();
  });

  test('calls onClose when clicking Cancel', () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
      />
    );

    fireEvent.click(screen.getByText(/Cancel/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('typing a non-digit value does not change input', () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={donationItem}
      />
    );

    const firstInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(firstInput, { target: { value: 'a' } });
    expect(firstInput.value).toBe('');
  });
});
