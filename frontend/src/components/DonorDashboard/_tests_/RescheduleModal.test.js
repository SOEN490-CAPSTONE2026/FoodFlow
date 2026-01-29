import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RescheduleModal from '../RescheduleModal';
import { surplusAPI } from '../../../services/api';
import { useTimezone } from '../../../contexts/TimezoneContext';

// Mock dependencies
jest.mock('../../../services/api');
jest.mock('../../../contexts/TimezoneContext');
jest.mock('react-datepicker', () => {
  const MockDatePicker = ({
    selected,
    onChange,
    placeholderText,
    ...props
  }) => (
    <input
      type="text"
      data-testid={placeholderText || 'datepicker'}
      value={selected ? selected.toISOString() : ''}
      onChange={e => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onChange(date);
      }}
      placeholder={placeholderText}
      {...props}
    />
  );
  return MockDatePicker;
});

describe('RescheduleModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockDonationItem = {
    id: '123',
    title: 'Fresh Vegetables',
    quantity: { value: 10, unit: 'KILOGRAM' },
    foodCategories: ['VEGETABLES'],
    fabricationDate: '2025-01-20',
    expiryDate: '2025-02-15',
    pickupLocation: 'Main Street Store',
    description: 'Fresh organic vegetables',
    temperatureCategory: 'REFRIGERATED',
    packagingType: 'BOXES',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTimezone.mockReturnValue({ userTimezone: 'America/New_York' });
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-27T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <RescheduleModal
          isOpen={false}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      expect(screen.getByText('Reschedule Pickup')).toBeInTheDocument();
      expect(
        screen.getByText(/Choose new pickup slots for/)
      ).toBeInTheDocument();
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    it('should display expiry date when available', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      expect(screen.getByText(/Expiry date: 2025-02-15/)).toBeInTheDocument();
    });

    it('should not display expiry date when not available', () => {
      const itemWithoutExpiry = { ...mockDonationItem, expiryDate: null };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithoutExpiry}
          onSuccess={mockOnSuccess}
        />
      );
      expect(screen.queryByText(/Expiry date:/)).not.toBeInTheDocument();
    });

    it('should render initial empty slot', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      expect(screen.getByText('Slot 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select date')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when clicking close button', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      const closeButton = screen
        .getAllByRole('button')
        .find(btn => btn.className.includes('reschedule-close'));
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when clicking overlay', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      const overlay = screen
        .getByText('Reschedule Pickup')
        .closest('.reschedule-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when clicking inside modal content', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      const modalContent = screen
        .getByText('Reschedule Pickup')
        .closest('.reschedule-modal');
      fireEvent.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close modal when clicking Cancel button', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pickup Slots Management', () => {
    it('should add a new pickup slot', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );
      expect(screen.getByText('Slot 1')).toBeInTheDocument();
      expect(screen.queryByText('Slot 2')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Add Another Slot'));

      expect(screen.getByText('Slot 2')).toBeInTheDocument();
    });

    it('should remove a pickup slot when there are multiple slots', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Add Another Slot'));
      expect(screen.getByText('Slot 2')).toBeInTheDocument();

      const removeButtons = screen
        .getAllByRole('button')
        .filter(
          btn =>
            btn.querySelector('svg') &&
            btn.className.includes('btn-remove-slot')
        );
      fireEvent.click(removeButtons[0]);

      expect(screen.queryByText('Slot 2')).not.toBeInTheDocument();
    });

    it('should not show remove button when there is only one slot', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const removeButtons = screen
        .queryAllByRole('button')
        .filter(btn => btn.className.includes('btn-remove-slot'));
      expect(removeButtons.length).toBe(0);
    });

    it('should update pickup date', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      expect(dateInput.value).toBe('2025-02-01T00:00:00.000Z');
    });

    it('should update start time', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      expect(startTimeInput.value).toBe('2025-01-27T09:00:00.000Z');
    });

    it('should update end time', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      expect(endTimeInput.value).toBe('2025-01-27T17:00:00.000Z');
    });

    it('should update notes field', () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const notesInput = screen.getByPlaceholderText(/Use back entrance/);
      fireEvent.change(notesInput, {
        target: { value: 'Call before arrival' },
      });

      expect(notesInput.value).toBe('Call before arrival');
    });
  });

  describe('Form Validation', () => {
    it('should show error when donation item is invalid', async () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={null}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid donation. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when expiry date is missing', async () => {
      const itemWithoutExpiry = { ...mockDonationItem, expiryDate: null };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithoutExpiry}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'This donation has no expiry date and cannot be rescheduled.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show error when expiry date is in the past', async () => {
      const itemWithPastExpiry = {
        ...mockDonationItem,
        expiryDate: '2025-01-15',
      };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithPastExpiry}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'This donation is expired and cannot be rescheduled.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show error when pickup slot fields are incomplete', async () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('Please fill out all pickup slot fields.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when pickup date is in the past', async () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-01-20T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('Pickup dates must be today or later.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when pickup date is after expiry date', async () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-20T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('Pickup dates must be on or before the expiry date.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when end time is before or equal to start time', async () => {
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('End time must be after start time.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when pickup end time is in the past for today', async () => {
      jest.setSystemTime(new Date('2025-01-27T15:00:00Z'));

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const today = new Date();
      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, { target: { value: today.toISOString() } });

      // Set start time to 2 hours ago and end time to 1 hour ago (both in the past)
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 2);

      const endTime = new Date();
      endTime.setHours(endTime.getHours() - 1);

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: startTime.toISOString() },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: endTime.toISOString() },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText(
            /Pickup dates must be today or later|Pickup end time must be in the future/
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should successfully submit valid form data', async () => {
      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00.000Z' },
      });

      // Create dates in local timezone for times (9 AM and 5 PM)
      const startTime = new Date(2025, 0, 27, 9, 0, 0);
      const endTime = new Date(2025, 0, 27, 17, 0, 0);

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: startTime.toISOString() },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: endTime.toISOString() },
      });

      const notesInput = screen.getByPlaceholderText(/Use back entrance/);
      fireEvent.change(notesInput, {
        target: { value: 'Call before arrival' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(surplusAPI.create).toHaveBeenCalledWith({
          title: 'Fresh Vegetables',
          quantity: { value: 10, unit: 'KILOGRAM' },
          foodCategories: ['VEGETABLES'],
          fabricationDate: '2025-01-20',
          expiryDate: '2025-02-15',
          pickupSlots: [
            {
              pickupDate: '2025-02-01',
              startTime: '09:00',
              endTime: '17:00',
              notes: 'Call before arrival',
            },
          ],
          pickupDate: '2025-02-01',
          pickupFrom: '09:00',
          pickupTo: '17:00',
          pickupLocation: 'Main Street Store',
          description: 'Fresh organic vegetables',
          temperatureCategory: 'REFRIGERATED',
          packagingType: 'BOXES',
          donorTimezone: 'America/New_York',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle submission with multiple slots', async () => {
      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Add second slot
      fireEvent.click(screen.getByText('Add Another Slot'));

      // Fill first slot
      const dateInputs = screen.getAllByPlaceholderText('Select date');
      fireEvent.change(dateInputs[0], {
        target: { value: '2025-02-01T00:00:00.000Z' },
      });

      // Create dates in local timezone for slot 1 (9 AM - 5 PM)
      const startTime1 = new Date(2025, 0, 27, 9, 0, 0);
      const endTime1 = new Date(2025, 0, 27, 17, 0, 0);

      const startTimeInputs = screen.getAllByPlaceholderText('Start');
      fireEvent.change(startTimeInputs[0], {
        target: { value: startTime1.toISOString() },
      });

      const endTimeInputs = screen.getAllByPlaceholderText('End');
      fireEvent.change(endTimeInputs[0], {
        target: { value: endTime1.toISOString() },
      });

      // Fill second slot
      fireEvent.change(dateInputs[1], {
        target: { value: '2025-02-02T00:00:00.000Z' },
      });

      // Create dates in local timezone for slot 2 (10 AM - 6 PM)
      const startTime2 = new Date(2025, 0, 27, 10, 0, 0);
      const endTime2 = new Date(2025, 0, 27, 18, 0, 0);

      fireEvent.change(startTimeInputs[1], {
        target: { value: startTime2.toISOString() },
      });
      fireEvent.change(endTimeInputs[1], {
        target: { value: endTime2.toISOString() },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(surplusAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            pickupSlots: [
              {
                pickupDate: '2025-02-01',
                startTime: '09:00',
                endTime: '17:00',
                notes: null,
              },
              {
                pickupDate: '2025-02-02',
                startTime: '10:00',
                endTime: '18:00',
                notes: null,
              },
            ],
          })
        );
      });
    });

    it('should handle submission with null notes', async () => {
      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(surplusAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            pickupSlots: [
              expect.objectContaining({
                notes: null,
              }),
            ],
          })
        );
      });
    });

    it('should handle API error with custom message', async () => {
      surplusAPI.create.mockRejectedValue({
        response: { data: { message: 'Server error occurred' } },
      });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle API error with generic error message', async () => {
      surplusAPI.create.mockRejectedValue({
        message: 'Network error',
      });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle API error with default message', async () => {
      surplusAPI.create.mockRejectedValue({});

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to reschedule donation.')
        ).toBeInTheDocument();
      });
    });

    it('should disable buttons while submitting', async () => {
      surplusAPI.create.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      expect(screen.getByText('Rescheduling...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Rescheduling...')).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle submission without onSuccess callback', async () => {
      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={null}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('State Reset on Modal Open', () => {
    it('should reset state when modal is reopened', () => {
      const { rerender } = render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Add a second slot
      fireEvent.click(screen.getByText('Add Another Slot'));
      expect(screen.getByText('Slot 2')).toBeInTheDocument();

      // Close modal
      rerender(
        <RescheduleModal
          isOpen={false}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Reopen modal
      rerender(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      // Should only have one slot
      expect(screen.getByText('Slot 1')).toBeInTheDocument();
      expect(screen.queryByText('Slot 2')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle donation item with missing optional fields', async () => {
      const minimalDonationItem = {
        id: '123',
        title: 'Test Item',
        quantity: { value: 5 },
        expiryDate: '2025-02-15',
        pickupLocation: 'Test Location',
      };

      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={minimalDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(surplusAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: { value: 5, unit: 'KILOGRAM' },
            foodCategories: [],
            fabricationDate: null,
            description: '',
            temperatureCategory: null,
            packagingType: null,
          })
        );
      });
    });

    it('should handle invalid date string in parseLocalDate', () => {
      const itemWithInvalidDate = {
        ...mockDonationItem,
        expiryDate: 'invalid-date',
      };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithInvalidDate}
          onSuccess={mockOnSuccess}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Reschedule Pickup')).toBeInTheDocument();
    });

    it('should handle null date in parseLocalDate', () => {
      const itemWithNullDate = { ...mockDonationItem, expiryDate: null };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithNullDate}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Reschedule Pickup')).toBeInTheDocument();
    });

    it('should handle incomplete date parts in parseLocalDate', () => {
      const itemWithBadDate = { ...mockDonationItem, expiryDate: '2025-02' };
      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={itemWithBadDate}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Reschedule Pickup')).toBeInTheDocument();
    });

    it('should handle UTC timezone when userTimezone is not available', async () => {
      useTimezone.mockReturnValue({ userTimezone: null });
      surplusAPI.create.mockResolvedValue({ data: { id: 'new-123' } });

      render(
        <RescheduleModal
          isOpen={true}
          onClose={mockOnClose}
          donationItem={mockDonationItem}
          onSuccess={mockOnSuccess}
        />
      );

      const dateInput = screen.getByPlaceholderText('Select date');
      fireEvent.change(dateInput, {
        target: { value: '2025-02-01T00:00:00Z' },
      });

      const startTimeInput = screen.getByPlaceholderText('Start');
      fireEvent.change(startTimeInput, {
        target: { value: '2025-01-27T09:00:00Z' },
      });

      const endTimeInput = screen.getByPlaceholderText('End');
      fireEvent.change(endTimeInput, {
        target: { value: '2025-01-27T17:00:00Z' },
      });

      fireEvent.click(screen.getByText('Create New Donation'));

      await waitFor(() => {
        expect(surplusAPI.create).toHaveBeenCalledWith(
          expect.objectContaining({
            donorTimezone: 'UTC',
          })
        );
      });
    });
  });
});
