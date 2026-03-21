import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminDonations from '../AdminDonations';
import { adminDonationAPI, feedbackAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../../../services/api', () => ({
  adminDonationAPI: {
    getAllDonations: jest.fn(),
    getDonationById: jest.fn(),
    overrideStatus: jest.fn(),
  },
  feedbackAPI: {
    getFeedbackForClaim: jest.fn(),
  },
}));

jest.mock(
  'react-select',
  () =>
    ({ options, value, onChange, placeholder, styles }) => {
      // Execute style callbacks so those branches are covered.
      if (styles) {
        styles.control?.({});
        styles.option?.({}, { isSelected: true, isFocused: false });
        styles.menu?.({});
        styles.singleValue?.({});
      }

      return (
        <select
          data-testid="react-select"
          value={value?.value || ''}
          onChange={e =>
            onChange(options.find(opt => opt.value === e.target.value))
          }
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value || 'empty'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
);

jest.mock('lucide-react', () => ({
  ChevronRight: () => <span>ChevronRight</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  Search: () => <span>Search</span>,
  Gift: () => <span>Gift</span>,
  Users: () => <span>Users</span>,
  Flag: () => <span>Flag</span>,
  Eye: () => <span>Eye</span>,
  Sparkles: () => <span>Sparkles</span>,
  Calendar: () => <span>Calendar</span>,
  Clock: () => <span>Clock</span>,
  User: () => <span>User</span>,
  Building2: () => <span>Building2</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Info: () => <span>Info</span>,
  ShieldAlert: () => <span>ShieldAlert</span>,
  Star: () => <span>Star</span>,
}));

jest.mock('../Admin_Styles/AdminDonations.css', () => ({}));

describe('AdminDonations Component', () => {
  const mockDonations = {
    content: [
      {
        id: 1,
        title: 'Vegetable Lasagna',
        status: 'AVAILABLE',
        donorName: 'John Donor',
        receiverName: null,
        flagged: false,
        createdAt: '2026-01-08T08:01:51',
        updatedAt: '2026-01-12T18:42:01',
        foodCategories: ['PREPARED_MEALS'],
        quantity: { value: 10, unit: 'BOX' },
        expiryDate: '2026-01-11',
        pickupDate: '2026-01-10',
      },
      {
        id: 2,
        title: 'Fresh Bread',
        status: 'CLAIMED',
        donorName: 'Jane Donor',
        receiverName: 'Bob Receiver',
        flagged: true,
        createdAt: '2026-01-07T10:00:00',
        updatedAt: '2026-01-11T14:30:00',
      },
    ],
    totalPages: 1,
    totalElements: 2,
  };

  const mockDonationDetails = {
    ...mockDonations.content[0],
    donorEmail: 'john@example.com',
    donorOrganization: 'Food Corp',
    timeline: [
      {
        eventType: 'DONATION_CREATED',
        timestamp: '2026-01-08T08:01:51',
        actor: 'donor',
        visibleToUsers: true,
        oldStatus: null,
        newStatus: 'AVAILABLE',
        details: 'Donation created',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adminDonationAPI.getAllDonations.mockResolvedValue({ data: mockDonations });
    adminDonationAPI.getDonationById.mockResolvedValue({
      data: mockDonationDetails,
    });
    feedbackAPI.getFeedbackForClaim.mockResolvedValue({ data: [] });
    adminDonationAPI.overrideStatus.mockResolvedValue({
      data: { ...mockDonationDetails, status: 'COMPLETED' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('loads donations and renders rows', async () => {
    render(<AdminDonations />);

    expect(screen.getByText('adminDonations.loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      expect(screen.getByText('Fresh Bread')).toBeInTheDocument();
    });
  });

  test('calls API on mount with expected filters', async () => {
    render(<AdminDonations />);

    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        fromDate: undefined,
        toDate: undefined,
        page: 0,
        size: 20,
      });
    });
  });

  test('search uses debounced value', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');

    const input = screen.getByPlaceholderText(
      'adminDonations.searchPlaceholder'
    );
    await user.type(input, 'bread');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'bread' })
      );
    });
  });

  test('applies status filter', async () => {
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');

    fireEvent.change(screen.getAllByTestId('react-select')[0], {
      target: { value: 'AVAILABLE' },
    });

    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'AVAILABLE' })
      );
    });
  });

  test('resets filters', async () => {
    const user = userEvent.setup();
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');

    const input = screen.getByPlaceholderText(
      'adminDonations.searchPlaceholder'
    );
    await user.type(input, 'abc');
    fireEvent.click(
      screen.getByRole('button', { name: 'adminDonations.filters.reset' })
    );

    expect(input).toHaveValue('');
  });

  test('opens detail modal from view details action', async () => {
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');

    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() => {
      expect(adminDonationAPI.getDonationById).toHaveBeenCalledWith(1);
      expect(
        screen.getByText('Donation Details - Basic Info & Participants')
      ).toBeInTheDocument();
    });
  });

  test('disables back button on first modal page', async () => {
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });
  });

  test('navigates to timeline and shows event', async () => {
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await screen.findByText('Page 1 of 3');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Donation Details - Timeline')
      ).toBeInTheDocument();
      expect(screen.getAllByText('DONATION_CREATED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Donation created').length).toBeGreaterThan(0);
    });
  });

  test('shows status override validation errors', async () => {
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await screen.findByText('Page 1 of 3');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Page 2 of 3');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Donation Details - Override Status');

    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));
    await screen.findByText('Please select a new status');

    const selects = screen.getAllByTestId('react-select');
    fireEvent.change(selects[selects.length - 1], {
      target: { value: 'COMPLETED' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));

    await waitFor(() => {
      expect(
        screen.getByText('Please provide a reason for the override')
      ).toBeInTheDocument();
    });
  });

  test('overrides status successfully', async () => {
    const user = userEvent.setup();
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await screen.findByText('Page 1 of 3');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Page 2 of 3');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Donation Details - Override Status');

    const selects = screen.getAllByTestId('react-select');
    fireEvent.change(selects[selects.length - 1], {
      target: { value: 'COMPLETED' },
    });

    const reason = screen
      .getAllByPlaceholderText('Provide a reason for the status override...')
      .at(-1);
    await user.type(reason, 'Admin override for testing');

    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));

    await waitFor(() => {
      expect(adminDonationAPI.overrideStatus).toHaveBeenCalledWith(
        1,
        'COMPLETED',
        'Admin override for testing'
      );
      expect(
        screen.getByText('Status updated successfully!')
      ).toBeInTheDocument();
    });
  });

  test('shows load error message when API fails', async () => {
    adminDonationAPI.getAllDonations.mockRejectedValueOnce(
      new Error('Network')
    );

    render(<AdminDonations />);

    await waitFor(() => {
      expect(
        screen.getByText('adminDonations.errors.loadFailed')
      ).toBeInTheDocument();
    });
  });

  test('shows empty state when donations list is empty', async () => {
    adminDonationAPI.getAllDonations.mockResolvedValueOnce({
      data: { content: [], totalPages: 0, totalElements: 0 },
    });

    render(<AdminDonations />);

    expect(await screen.findByText('adminDonations.empty')).toBeInTheDocument();
  });

  test('applies from/to date filters', async () => {
    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-01-31' } });

    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2026-01-01',
          toDate: '2026-01-31',
        })
      );
    });
  });

  test('supports pagination next and previous', async () => {
    adminDonationAPI.getAllDonations.mockResolvedValue({
      data: {
        content: [mockDonations.content[0]],
        totalPages: 2,
        totalElements: 25,
      },
    });

    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'adminVerificationQueue.pagination.next',
      })
    );
    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'adminVerificationQueue.pagination.previous',
        })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'adminVerificationQueue.pagination.previous',
      })
    );
    await waitFor(() => {
      expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });
  });

  test('fetches feedback on expanded claim row and shows rating + low-rating flag', async () => {
    adminDonationAPI.getAllDonations.mockResolvedValueOnce({
      data: {
        content: [
          {
            ...mockDonations.content[0],
            claimId: 44,
            donorId: 10,
            receiverId: 20,
            flagged: false,
          },
        ],
        totalPages: 1,
        totalElements: 1,
      },
    });
    feedbackAPI.getFeedbackForClaim.mockResolvedValueOnce({
      data: [
        { reviewerId: 10, rating: 1, reviewText: 'late handoff' },
        { reviewerId: 20, rating: 3, reviewText: 'good food' },
      ],
    });

    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');

    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    await waitFor(() => {
      expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
    });
    expect(await screen.findByText('2.0')).toBeInTheDocument();
    expect(await screen.findByText(/late handoff/)).toBeInTheDocument();
    expect(await screen.findByText(/good food/)).toBeInTheDocument();
  });

  test('handles 404 feedback response gracefully in expanded row', async () => {
    adminDonationAPI.getAllDonations.mockResolvedValueOnce({
      data: {
        content: [
          {
            ...mockDonations.content[0],
            claimId: 45,
            donorId: 10,
            receiverId: 20,
          },
        ],
        totalPages: 1,
        totalElements: 1,
      },
    });
    feedbackAPI.getFeedbackForClaim.mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    expect(
      await screen.findByText('adminDonations.details.noFeedback')
    ).toBeInTheDocument();
  });

  test('shows detail-load error when opening modal fails', async () => {
    adminDonationAPI.getDonationById.mockRejectedValueOnce(new Error('boom'));
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    expect(
      await screen.findByText('Failed to load donation details')
    ).toBeInTheDocument();
  });

  test('shows override API error message on failure', async () => {
    adminDonationAPI.overrideStatus.mockRejectedValueOnce({
      response: { data: 'No permission' },
    });
    const user = userEvent.setup();
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );
    fireEvent.click(await screen.findByRole('button', { name: /next/i }));
    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    const selects = screen.getAllByTestId('react-select');
    fireEvent.change(selects[selects.length - 1], {
      target: { value: 'COMPLETED' },
    });

    const reason = screen
      .getAllByPlaceholderText('Provide a reason for the status override...')
      .at(-1);
    await user.type(reason, 'manual review');
    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));

    expect(await screen.findByText('No permission')).toBeInTheDocument();
  });

  test('closes detail modal from close button and overlay click', async () => {
    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');

    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );
    expect(
      await screen.findByText('Donation Details - Basic Info & Participants')
    ).toBeInTheDocument();

    fireEvent.click(document.querySelector('.donation-admin-modal-close'));
    await waitFor(() => {
      expect(
        screen.queryByText('Donation Details - Basic Info & Participants')
      ).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );
    await screen.findByText('Donation Details - Basic Info & Participants');
    fireEvent.click(document.querySelector('.donation-admin-modal-overlay'));
    await waitFor(() => {
      expect(
        screen.queryByText('Donation Details - Basic Info & Participants')
      ).not.toBeInTheDocument();
    });
  });

  test('handles generic feedback fetch error and collapse toggle', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    adminDonationAPI.getAllDonations.mockResolvedValueOnce({
      data: {
        content: [
          {
            ...mockDonations.content[0],
            claimId: 99,
            donorId: 10,
            receiverId: 20,
          },
        ],
        totalPages: 1,
        totalElements: 1,
      },
    });
    feedbackAPI.getFeedbackForClaim.mockRejectedValueOnce(new Error('fail'));

    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');

    const expandBtn = document.querySelector('.expand-btn');
    fireEvent.click(expandBtn);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ Error fetching feedback:',
        expect.any(Error)
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText('adminDonations.details.foodCategories')
      ).toBeInTheDocument();
    });

    fireEvent.click(expandBtn);
    await waitFor(() => {
      expect(
        screen.queryByText('adminDonations.details.foodCategories')
      ).not.toBeInTheDocument();
    });
    errorSpy.mockRestore();
  });

  test('renders detail modal feedback cards and supports page navigation back', async () => {
    adminDonationAPI.getDonationById.mockResolvedValueOnce({
      data: {
        ...mockDonationDetails,
        claimId: 77,
        donorId: 10,
        receiverId: 20,
      },
    });
    feedbackAPI.getFeedbackForClaim.mockResolvedValueOnce({
      data: [
        { reviewerId: 20, rating: 2, reviewText: 'receiver note' },
        { reviewerId: 10, rating: 4, reviewText: 'donor note' },
      ],
    });

    render(<AdminDonations />);
    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await screen.findByText('Donation Details - Basic Info & Participants');
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
    expect(await screen.findByText('Donation Details - Timeline')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /back/i })[0]);
    expect(
      await screen.findByText('Donation Details - Basic Info & Participants')
    ).toBeInTheDocument();
  });

  test('closes modal after successful override timeout refresh', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<AdminDonations />);

    await screen.findByText('Vegetable Lasagna');
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );
    await screen.findByText('Donation Details - Basic Info & Participants');
    fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /next/i })[0]);

    const scopedOverrideForm = document.querySelector(
      '.donation-admin-override-form'
    );
    const modalSelect = scopedOverrideForm.querySelector('select');
    fireEvent.change(modalSelect, { target: { value: 'COMPLETED' } });

    const modalTextarea = scopedOverrideForm.querySelector('textarea');
    await user.type(modalTextarea, 'approved after review');
    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));

    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(
        screen.queryByText('Donation Details - Basic Info & Participants')
      ).not.toBeInTheDocument();
    });
  });
});
