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
import { adminDonationAPI } from '../../../services/api';

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

jest.mock('react-select', () => ({ options, value, onChange, placeholder }) => (
  <select
    data-testid="react-select"
    value={value?.value || ''}
    onChange={e => onChange(options.find(opt => opt.value === e.target.value))}
  >
    <option value="">{placeholder}</option>
    {options.map(option => (
      <option key={option.value || 'empty'} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
));

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });
  });

  test('navigates to timeline and shows event', async () => {
    render(<AdminDonations />);

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() =>
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    );
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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() =>
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() =>
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Donation Details - Override Status')
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Override Status' }));
    await waitFor(() =>
      expect(screen.getByText('Please select a new status')).toBeInTheDocument()
    );

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

    await waitFor(() =>
      expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getAllByTitle('adminDonations.actions.viewDetails')[0]
    );

    await waitFor(() =>
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() =>
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Donation Details - Override Status')
      ).toBeInTheDocument()
    );

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
});
