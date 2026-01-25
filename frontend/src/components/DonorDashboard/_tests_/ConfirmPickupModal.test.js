import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ConfirmPickupModal from '../ConfirmPickupModal';

import { surplusAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  surplusAPI: {
    completeSurplusPost: jest.fn(),
  },
}));

// Mock the CSS
jest.mock('../Donor_Styles/ConfirmPickupModal.css', () => ({}), {
  virtual: true,
});

describe('ConfirmPickupModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockDonationItem = {
    id: 123,
    name: 'Test Donation',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmPickupModal
        isOpen={false}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );
    expect(
      screen.getByRole('heading', { name: /confirm pickup/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter the 6-digit code shown by the receiver/i)
    ).toBeInTheDocument();
  });

  test('renders 6 code input fields', () => {
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  test('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const overlay = container.querySelector('.confirm-pickup-overlay');
    await user.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not close modal when modal content is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const modalContent = container.querySelector('.confirm-pickup-modal');
    await user.click(modalContent);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('allows entering digits in code inputs', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    expect(inputs[0]).toHaveValue('1');
  });

  test('auto-focuses next input after entering digit', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');

    // Check if second input is focused
    expect(inputs[1]).toHaveFocus();
  });

  test('does not allow non-numeric characters', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('');
  });

  test('does not allow more than one digit per input', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '12');
    expect(inputs[0]).toHaveValue('1');
  });

  test('handles backspace to focus previous input', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');

    // Now backspace on empty input[1] - but it has '2', so let's clear it first
    await user.clear(inputs[1]);
    await user.type(inputs[1], '{Backspace}');

    expect(inputs[0]).toHaveFocus();
  });

  test('handles paste of 6-digit code', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[0]);
    await user.paste('123456');

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
    expect(inputs[4]).toHaveValue('5');
    expect(inputs[5]).toHaveValue('6');
  });

  test('handles paste with non-numeric characters', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[0]);
    await user.paste('1a2b3c');

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
  });

  test('shows error when submitting incomplete code', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    expect(
      await screen.findByText(/please enter the complete 6-digit code/i)
    ).toBeInTheDocument();
  });

  test('shows error when donationItem is invalid', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={null}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    expect(
      await screen.findByText(/invalid donation item/i)
    ).toBeInTheDocument();
  });

  test('successfully confirms pickup with valid code', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    await waitFor(() => {
      expect(surplusAPI.completeSurplusPost).toHaveBeenCalledWith(
        123,
        '123456'
      );
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('shows error message on API failure', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockRejectedValueOnce({
      response: { data: { message: 'Invalid code' } },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    expect(await screen.findByText(/invalid code/i)).toBeInTheDocument();
  });

  test('handles API error without response data', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  test('handles API error with no message', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockRejectedValueOnce({
      response: { data: {} },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    expect(
      await screen.findByText(/failed to verify code/i)
    ).toBeInTheDocument();
  });

  test('disables buttons while submitting', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    const confirmButton = screen.getByRole('button', {
      name: /confirm pickup/i,
    });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    await user.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText(/verifying\.\.\./i)).toBeInTheDocument();
  });

  test('logs to console when My Claims link is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: /my claims/i }));

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to My Claims');

    consoleSpy.mockRestore();
  });

  test('successfully confirms pickup without onSuccess callback', async () => {
    const user = userEvent.setup();
    surplusAPI.completeSurplusPost.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <ConfirmPickupModal
        isOpen={true}
        onClose={mockOnClose}
        donationItem={mockDonationItem}
        onSuccess={null}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await user.click(screen.getByRole('button', { name: /confirm pickup/i }));

    await waitFor(() => {
      expect(surplusAPI.completeSurplusPost).toHaveBeenCalledWith(
        123,
        '123456'
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==================== Tests for Pickup Timing Tolerance Window ====================

  describe('Pickup Timing Tolerance', () => {
    const createDonationItemWithPickupSlot = (pickupDate, startTime, endTime) => ({
      id: 123,
      name: 'Test Donation',
      confirmedPickupSlot: {
        pickupDate,
        startTime,
        endTime,
      },
    });

    // Helper to format date as YYYY-MM-DD
    const formatDateForTest = (date) => {
      return date.toISOString().split('T')[0];
    };

    // Helper to format time as HH:MM:SS
    const formatTimeForTest = (date) => {
      return date.toISOString().split('T')[1].split('.')[0];
    };

    test('shows no warning when within scheduled pickup window', () => {
      // Create a pickup window that spans the current time
      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
      const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now

      const donationItem = createDonationItemWithPickupSlot(
        formatDateForTest(now),
        formatTimeForTest(startTime),
        formatTimeForTest(endTime)
      );

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should not show any timing warning
      expect(screen.queryByText(/minutes before/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/minutes after/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/too early/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/too late/i)).not.toBeInTheDocument();
    });

    test('shows warning when confirming early but within tolerance', () => {
      // Create a pickup window starting 10 minutes from now (within 15 min early tolerance)
      const now = new Date();
      const startTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 min from now
      const endTime = new Date(now.getTime() + 120 * 60 * 1000); // 2 hours from now

      const donationItem = createDonationItemWithPickupSlot(
        formatDateForTest(startTime),
        formatTimeForTest(startTime),
        formatTimeForTest(endTime)
      );

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should show warning about being early
      expect(screen.getByText(/minutes before the scheduled pickup time/i)).toBeInTheDocument();
      // Button should still be enabled (within tolerance)
      expect(screen.getByRole('button', { name: /confirm pickup/i })).not.toBeDisabled();
    });

    test('shows error and disables button when too early (outside tolerance)', () => {
      // Create a pickup window starting 30 minutes from now (outside 15 min tolerance)
      const now = new Date();
      const startTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
      const endTime = new Date(now.getTime() + 120 * 60 * 1000); // 2 hours from now

      const donationItem = createDonationItemWithPickupSlot(
        formatDateForTest(startTime),
        formatTimeForTest(startTime),
        formatTimeForTest(endTime)
      );

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should show error about being too early
      expect(screen.getByText(/you can confirm up to 15 minutes early/i)).toBeInTheDocument();
      // Button should be disabled
      expect(screen.getByRole('button', { name: /confirm pickup/i })).toBeDisabled();
    });

    test('shows warning when confirming late but within tolerance', () => {
      // Create a pickup window that ended 20 minutes ago (within 30 min late tolerance)
      const now = new Date();
      const endTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 min ago
      const startTime = new Date(endTime.getTime() - 120 * 60 * 1000); // 2h20min ago

      const donationItem = createDonationItemWithPickupSlot(
        formatDateForTest(endTime),
        formatTimeForTest(startTime),
        formatTimeForTest(endTime)
      );

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should show warning about being late
      expect(screen.getByText(/minutes after the scheduled pickup window/i)).toBeInTheDocument();
      // Button should still be enabled (within tolerance)
      expect(screen.getByRole('button', { name: /confirm pickup/i })).not.toBeDisabled();
    });

    test('shows error and disables button when too late (outside tolerance)', () => {
      // Create a pickup window that ended 45 minutes ago (outside 30 min tolerance)
      const now = new Date();
      const endTime = new Date(now.getTime() - 45 * 60 * 1000); // 45 min ago
      const startTime = new Date(endTime.getTime() - 120 * 60 * 1000); // 2h45min ago

      const donationItem = createDonationItemWithPickupSlot(
        formatDateForTest(endTime),
        formatTimeForTest(startTime),
        formatTimeForTest(endTime)
      );

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should show error about being too late (matches "Maximum allowed is 30 minutes late")
      expect(screen.getByText(/maximum allowed is 30 minutes late/i)).toBeInTheDocument();
      // Button should be disabled
      expect(screen.getByRole('button', { name: /confirm pickup/i })).toBeDisabled();
    });

    test('shows no warning when no pickup slot is provided', () => {
      const donationItem = {
        id: 123,
        name: 'Test Donation',
        // No confirmedPickupSlot
      };

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should not show any timing warning
      expect(screen.queryByText(/minutes before/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/minutes after/i)).not.toBeInTheDocument();
      // Button should be enabled
      expect(screen.getByRole('button', { name: /confirm pickup/i })).not.toBeDisabled();
    });

    test('uses fallback pickup times when confirmedPickupSlot is not available', () => {
      // Create donation item with pickup times in direct properties (fallback)
      const now = new Date();
      const startTime = new Date(now.getTime() - 30 * 60 * 1000);
      const endTime = new Date(now.getTime() + 30 * 60 * 1000);

      const donationItem = {
        id: 123,
        name: 'Test Donation',
        pickupDate: formatDateForTest(now),
        pickupFrom: formatTimeForTest(startTime),
        pickupTo: formatTimeForTest(endTime),
      };

      render(
        <ConfirmPickupModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={donationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should not show any timing warning (within window)
      expect(screen.queryByText(/minutes before/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/minutes after/i)).not.toBeInTheDocument();
    });
  });
});
