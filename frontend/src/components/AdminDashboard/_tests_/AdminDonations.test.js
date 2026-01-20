import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminDonations from '../AdminDonations';
import { adminDonationAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  adminDonationAPI: {
    getAllDonations: jest.fn(),
    getDonationById: jest.fn(),
    overrideStatus: jest.fn(),
  },
}));

// Mock react-select
jest.mock('react-select', () => ({ options, value, onChange, placeholder }) => {
  return (
    <select
      data-testid="react-select"
      value={value?.value || ''}
      onChange={e => {
        const selected = options.find(opt => opt.value === e.target.value);
        onChange(selected);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

// Mock lucide-react icons
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
}));

// Mock CSS import
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
        temperature: null,
        packagingConditions: null,
        description: 'lasagna yum',
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
        foodCategories: ['BAKED_GOODS'],
        quantity: { value: 20, unit: 'LOAVES' },
        expiryDate: '2026-01-13',
        pickupDate: '2026-01-12',
        temperature: 22,
        packagingConditions: 'Good',
        description: 'Fresh baked bread',
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
  });

  describe('Initial Rendering', () => {
    test('renders without crashing', async () => {
      render(<AdminDonations />);
      await waitFor(() => {
        expect(
          screen.queryByText('Loading donations...')
        ).not.toBeInTheDocument();
      });
    });

    test('displays stats cards correctly', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const statsGrid = document.querySelector('.stats-grid');
        expect(
          within(statsGrid).getByText('Total Donations')
        ).toBeInTheDocument();
        expect(within(statsGrid).getByText('Active')).toBeInTheDocument();
        expect(within(statsGrid).getByText('Completed')).toBeInTheDocument();
        expect(within(statsGrid).getByText('Flagged')).toBeInTheDocument();
      });
    });

    test('calculates and displays correct stats', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const statValues = screen.getAllByText(/^[0-9]+$/);
        expect(statValues.some(el => el.textContent === '2')).toBeTruthy(); // totalElements
      });
    });

    test('displays loading state initially', () => {
      render(<AdminDonations />);
      expect(screen.getByText('Loading donations...')).toBeInTheDocument();
    });

    test('fetches donations on mount', async () => {
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
  });

  describe('Donations Table', () => {
    test('displays donations in table', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
        expect(screen.getByText('Fresh Bread')).toBeInTheDocument();
      });
    });

    test('displays correct table headers', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(
          screen.getByRole('columnheader', { name: 'ID' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Title' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Status' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Donor' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Receiver' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Flagged' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Created' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Updated' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'Actions' })
        ).toBeInTheDocument();
      });
    });

    test('displays donor names correctly', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.getByText('Jane Donor')).toBeInTheDocument();
      });
    });

    test('displays receiver name or N/A', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Bob Receiver')).toBeInTheDocument();
        const cells = screen.getAllByText('N/A');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    test('shows no donations message when list is empty', async () => {
      adminDonationAPI.getAllDonations.mockResolvedValue({
        data: { content: [], totalPages: 0, totalElements: 0 },
      });

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('No donations found')).toBeInTheDocument();
      });
    });
  });

  describe('Row Expansion', () => {
    test('expands row to show details when expand button is clicked', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const expandButtons = screen.getAllByRole('button');
      const expandBtn = expandButtons.find(
        btn => btn.className === 'expand-btn'
      );

      fireEvent.click(expandBtn);

      await waitFor(() => {
        expect(screen.getByText('Food Categories')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByText('Pickup Date')).toBeInTheDocument();
      });
    });

    test('collapses expanded row when expand button is clicked again', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const expandButtons = screen.getAllByRole('button');
      const expandBtn = expandButtons.find(
        btn => btn.className === 'expand-btn'
      );

      // Expand
      fireEvent.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText('Food Categories')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(expandBtn);
      await waitFor(() => {
        expect(screen.queryByText('Food Categories')).not.toBeInTheDocument();
      });
    });

    test('displays temperature and packaging conditions in expanded view', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Fresh Bread')).toBeInTheDocument();
      });

      const expandButtons = screen.getAllByRole('button');
      // Find the second expand button (for Fresh Bread)
      const expandBtn = expandButtons[1];

      fireEvent.click(expandBtn);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('Packaging Conditions')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('renders search input', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          'Search by title, donor, receiver, or ID...'
        );
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('updates search term on input change', async () => {
      const user = userEvent.setup();
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by title, donor, receiver, or ID...'
      );
      await user.type(searchInput, 'lasagna');

      expect(searchInput.value).toBe('lasagna');
    });

    test('debounces search and calls API after delay', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by title, donor, receiver, or ID...'
      );
      await user.type(searchInput, 'test');

      // Fast-forward time
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test',
          })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Filtering', () => {
    test('renders status filter dropdown', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const selects = screen.getAllByTestId('react-select');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    test('renders date filter inputs', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const dateInputs = screen.getAllByPlaceholderText(/Date/);
        expect(dateInputs.length).toBe(2);
      });
    });

    test('filters by status when status is selected', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByTestId('react-select')[0];
      fireEvent.change(statusSelect, { target: { value: 'AVAILABLE' } });

      await waitFor(() => {
        expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'AVAILABLE',
          })
        );
      });
    });

    test('filters by date range', async () => {
      const user = userEvent.setup();
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const dateInputs = screen.getAllByPlaceholderText(/Date/);
      await user.type(dateInputs[0], '2026-01-01');
      await user.type(dateInputs[1], '2026-01-31');

      await waitFor(() => {
        expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            fromDate: '2026-01-01',
            toDate: '2026-01-31',
          })
        );
      });
    });

    test('resets all filters when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      // Set some filters
      const searchInput = screen.getByPlaceholderText(
        'Search by title, donor, receiver, or ID...'
      );
      await user.type(searchInput, 'test');

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(searchInput.value).toBe('');
    });
  });

  describe('Pagination', () => {
    test('displays pagination info correctly', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('1 - 2 of 2')).toBeInTheDocument();
      });
    });

    test('hides pagination when only one page', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        const nextButton = screen.queryByText('Next');
        expect(nextButton).not.toBeInTheDocument();
      });
    });

    test('shows pagination controls when multiple pages exist', async () => {
      adminDonationAPI.getAllDonations.mockResolvedValue({
        data: { ...mockDonations, totalPages: 3 },
      });

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    test('navigates to next page when next button is clicked', async () => {
      adminDonationAPI.getAllDonations.mockResolvedValue({
        data: { ...mockDonations, totalPages: 3 },
      });

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(adminDonationAPI.getAllDonations).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          })
        );
      });
    });

    test('disables previous button on first page', async () => {
      adminDonationAPI.getAllDonations.mockResolvedValue({
        data: { ...mockDonations, totalPages: 3 },
      });

      render(<AdminDonations />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Detail Modal', () => {
    beforeEach(() => {
      adminDonationAPI.getDonationById.mockResolvedValue({
        data: mockDonationDetails,
      });
    });

    test('opens modal when eye button is clicked', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Basic Info & Participants')
        ).toBeInTheDocument();
      });
    });

    test('fetches donation details when modal opens', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(adminDonationAPI.getDonationById).toHaveBeenCalledWith(1);
      });
    });

    test('closes modal when close button is clicked', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Basic Info & Participants')
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Donation Details - Basic Info & Participants')
        ).not.toBeInTheDocument();
      });
    });

    test('displays basic info on page 1', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
    });

    test('navigates to timeline page when next is clicked', async () => {
      adminDonationAPI.getDonationById.mockResolvedValue({
        data: mockDonationDetails,
      });
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Basic Info & Participants')
        ).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Timeline')
        ).toBeInTheDocument();
        expect(screen.getAllByText('Timeline').length).toBeGreaterThan(0);
      });
    });

    test('navigates to override status page', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      // Navigate to page 3
      const nextButtons = screen.getAllByText('Next');
      fireEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      });

      const nextButton2 = screen.getAllByText('Next')[0];
      fireEvent.click(nextButton2);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Override Status')
        ).toBeInTheDocument();
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getAllByText('New Status:').length).toBeGreaterThan(0);
      });
    });

    test('disables back button on first page', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeDisabled();
      });
    });

    test('displays timeline events correctly', async () => {
      adminDonationAPI.getDonationById.mockResolvedValue({
        data: mockDonationDetails,
      });
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const nextButton = screen.getAllByText('Next')[0];
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('Donation Details - Timeline')
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getAllByText('DONATION_CREATED').length).toBeGreaterThan(
          0
        );
        expect(screen.getAllByText('Donation created').length).toBeGreaterThan(
          0
        );
      });
    });
  });

  describe('Status Override', () => {
    beforeEach(() => {
      adminDonationAPI.getDonationById.mockResolvedValue({
        data: mockDonationDetails,
      });
      adminDonationAPI.overrideStatus.mockResolvedValue({
        data: { ...mockDonationDetails, status: 'COMPLETED' },
      });
    });

    test('shows error when status is not selected', async () => {
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      // Navigate to override page
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const nextButtons = screen.getAllByText('Next');
      fireEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Next')[0]);

      await waitFor(() => {
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getAllByText('New Status:').length).toBeGreaterThan(0);
      });

      const overrideButton = screen.getByRole('button', {
        name: 'Override Status',
      });
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please select a new status')
        ).toBeInTheDocument();
      });
    });

    test('shows error when reason is not provided', async () => {
      const user = userEvent.setup();
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      // Navigate to override page
      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getAllByText('New Status:').length).toBeGreaterThan(0);
      });

      // Select status but don't provide reason
      const statusSelects = screen.getAllByTestId('react-select');
      const overrideSelect = statusSelects[statusSelects.length - 1];
      fireEvent.change(overrideSelect, { target: { value: 'COMPLETED' } });

      const overrideButton = screen.getByRole('button', {
        name: 'Override Status',
      });
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please provide a reason for the override')
        ).toBeInTheDocument();
      });
    });

    test('successfully overrides status with valid inputs', async () => {
      const user = userEvent.setup();
      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      // Navigate to override page
      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getAllByText('New Status:').length).toBeGreaterThan(0);
      });

      // Select status
      const statusSelects = screen.getAllByTestId('react-select');
      const overrideSelect = statusSelects[statusSelects.length - 1];
      fireEvent.change(overrideSelect, { target: { value: 'COMPLETED' } });

      // Provide reason
      const reasonTextareas = screen.getAllByPlaceholderText(
        'Provide a reason for the status override...'
      );
      const reasonTextarea = reasonTextareas[reasonTextareas.length - 1];
      await user.type(reasonTextarea, 'Admin override for testing');

      const overrideButton = screen.getByRole('button', {
        name: 'Override Status',
      });
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(adminDonationAPI.overrideStatus).toHaveBeenCalledWith(
          1,
          'COMPLETED',
          'Admin override for testing'
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Status updated successfully!')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when fetching donations fails', async () => {
      adminDonationAPI.getAllDonations.mockRejectedValue(
        new Error('Network error')
      );

      render(<AdminDonations />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load donations. Please try again.')
        ).toBeInTheDocument();
      });
    });

    test('displays error when fetching donation details fails', async () => {
      adminDonationAPI.getDonationById.mockRejectedValue(
        new Error('Not found')
      );

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load donation details')
        ).toBeInTheDocument();
      });
    });

    test('displays error when status override fails', async () => {
      const user = userEvent.setup();
      adminDonationAPI.getDonationById.mockResolvedValue({
        data: mockDonationDetails,
      });
      adminDonationAPI.overrideStatus.mockRejectedValue({
        response: { data: 'Override failed' },
      });

      render(<AdminDonations />);

      await waitFor(() => {
        expect(screen.getByText('Vegetable Lasagna')).toBeInTheDocument();
      });

      const eyeButtons = screen.getAllByTitle('View Details');
      fireEvent.click(eyeButtons[0]);

      // Navigate to override page
      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        const nextButtons = screen.getAllByText('Next');
        fireEvent.click(nextButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getAllByText('New Status:').length).toBeGreaterThan(0);
      });

      // Select status and provide reason
      const statusSelects = screen.getAllByTestId('react-select');
      const overrideSelect = statusSelects[statusSelects.length - 1];
      fireEvent.change(overrideSelect, { target: { value: 'COMPLETED' } });

      const reasonTextareas = screen.getAllByPlaceholderText(
        'Provide a reason for the status override...'
      );
      const reasonTextarea = reasonTextareas[reasonTextareas.length - 1];
      await user.type(reasonTextarea, 'Test reason');

      const overrideButton = screen.getByRole('button', {
        name: 'Override Status',
      });
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override failed')).toBeInTheDocument();
      });
    });
  });
});
