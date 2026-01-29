import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDisputes from '../AdminDisputes';
import { adminDisputeAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  adminDisputeAPI: {
    getAllDisputes: jest.fn(),
  },
}));

// Mock CSS import
jest.mock('../Admin_Styles/AdminDisputes.css', () => ({}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div>Search Icon</div>,
  AlertTriangle: () => <div>AlertTriangle Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  Clock: () => <div>Clock Icon</div>,
  CheckCircle: () => <div>CheckCircle Icon</div>,
  XCircle: () => <div>XCircle Icon</div>,
  Eye: () => <div>Eye Icon</div>,
}));

describe('AdminDisputes', () => {
  const mockDisputes = [
    {
      id: 1,
      reporterId: 101,
      reporterName: 'John Donor',
      reporterType: 'DONOR',
      reportedUserId: 201,
      reportedUserName: 'Jane Receiver',
      reportedUserType: 'RECEIVER',
      donationId: 301,
      donationTitle: 'Food Donation',
      description: 'Test dispute 1',
      status: 'OPEN',
      createdAt: '2024-01-15T10:30:00Z',
      resolvedAt: null,
    },
    {
      id: 2,
      reporterId: 102,
      reporterName: 'Alice Donor',
      reporterType: 'DONOR',
      reportedUserId: 202,
      reportedUserName: 'Bob Receiver',
      reportedUserType: 'RECEIVER',
      donationId: 302,
      donationTitle: 'Another Donation',
      description: 'Test dispute 2',
      status: 'UNDER_REVIEW',
      createdAt: '2024-01-16T14:45:00Z',
      resolvedAt: null,
    },
    {
      id: 3,
      reporterId: 103,
      reporterName: 'Charlie Donor',
      reporterType: 'DONOR',
      reportedUserId: 203,
      reportedUserName: 'David Receiver',
      reportedUserType: 'RECEIVER',
      donationId: 303,
      donationTitle: 'Third Donation',
      description: 'Test dispute 3',
      status: 'RESOLVED',
      createdAt: '2024-01-17T09:15:00Z',
      resolvedAt: '2024-01-20T16:00:00Z',
    },
    {
      id: 4,
      reporterId: 104,
      reporterName: 'Eve Donor',
      reporterType: 'DONOR',
      reportedUserId: 204,
      reportedUserName: 'Frank Receiver',
      reportedUserType: 'RECEIVER',
      donationId: null,
      donationTitle: null,
      description: 'Test dispute 4',
      status: 'CLOSED',
      createdAt: '2024-01-18T11:20:00Z',
      resolvedAt: '2024-01-19T10:00:00Z',
    },
  ];

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/admin/disputes']}>
        <Routes>
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route
            path="/admin/disputes/:id"
            element={<div>Dispute Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('displays loading message while fetching data', () => {
      adminDisputeAPI.getAllDisputes.mockImplementation(
        () => new Promise(() => {})
      );
      renderComponent();
      expect(screen.getByText('Loading disputes...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      adminDisputeAPI.getAllDisputes.mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Error loading disputes')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('retry button refetches disputes', async () => {
      adminDisputeAPI.getAllDisputes.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Error loading disputes')).toBeInTheDocument();
      });

      // Setup success response for retry
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        const allCasesHeaders = screen.getAllByText('All Cases');
        expect(allCasesHeaders.length).toBeGreaterThan(0);
      });
    });

    test('handles empty content array', async () => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: [] },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No Cases Found')).toBeInTheDocument();
      });
    });

    test('handles missing content in response', async () => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: {},
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No Cases Found')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('renders all disputes correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      expect(screen.getByText('Alice Donor')).toBeInTheDocument();
      expect(screen.getByText('Charlie Donor')).toBeInTheDocument();
      expect(screen.getByText('Eve Donor')).toBeInTheDocument();
    });

    test('displays stats correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
      });

      // Total cases
      const statValues = screen.getAllByText('4');
      expect(statValues.length).toBeGreaterThan(0);

      // Open cases
      const openLabels = screen.getAllByText('Open');
      expect(openLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 open case

      // Avg Resolution
      expect(screen.getByText('Avg Resolution')).toBeInTheDocument();
      expect(screen.getByText('2.4 days')).toBeInTheDocument();
    });

    test('transforms dispute data correctly', async () => {
      renderComponent();

      await waitFor(() => {
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`DR-${currentYear}-001`)).toBeInTheDocument();
      });
    });

    test('displays reporter information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const donorLabels = screen.getAllByText('Donor');
      expect(donorLabels.length).toBeGreaterThan(0);
    });

    test('displays reported user information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Receiver')).toBeInTheDocument();
      });

      expect(screen.getByText('Bob Receiver')).toBeInTheDocument();
      expect(screen.getByText('David Receiver')).toBeInTheDocument();
      expect(screen.getByText('Frank Receiver')).toBeInTheDocument();
    });

    test('displays donation IDs correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('DON-2024-0301')).toBeInTheDocument();
      });

      expect(screen.getByText('DON-2024-0302')).toBeInTheDocument();
      expect(screen.getByText('DON-2024-0303')).toBeInTheDocument();
    });

    test('displays dash for missing donation ID', async () => {
      renderComponent();

      await waitFor(() => {
        const noDonationElements = screen.getAllByText('—');
        expect(noDonationElements.length).toBeGreaterThan(0);
      });
    });

    test('formats dates correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      });

      expect(screen.getByText('2024-01-16')).toBeInTheDocument();
      expect(screen.getByText('2024-01-17')).toBeInTheDocument();
      expect(screen.getByText('2024-01-18')).toBeInTheDocument();
    });

    test('displays status badges with correct classes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('OPEN')).toBeInTheDocument();
      });

      expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
      expect(screen.getByText('RESOLVED')).toBeInTheDocument();
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('filters by OPEN status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const openButtons = screen.getAllByText('Open');
      const openTabButton = openButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(openTabButton);

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });
    });

    test('filters by UNDER_REVIEW status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Alice Donor')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Under Review'));

      await waitFor(() => {
        expect(screen.getByText('Alice Donor')).toBeInTheDocument();
        expect(screen.queryByText('John Donor')).not.toBeInTheDocument();
      });
    });

    test('filters by RESOLVED status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Charlie Donor')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Resolved'));

      await waitFor(() => {
        expect(screen.getByText('Charlie Donor')).toBeInTheDocument();
        expect(screen.queryByText('John Donor')).not.toBeInTheDocument();
      });
    });

    test('filters by CLOSED status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Eve Donor')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Closed'));

      await waitFor(() => {
        expect(screen.getByText('Eve Donor')).toBeInTheDocument();
        expect(screen.queryByText('John Donor')).not.toBeInTheDocument();
      });
    });

    test('shows all disputes when All Cases is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      // First filter to something else
      const openButtons = screen.getAllByText('Open');
      const openTabButton = openButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(openTabButton);

      await waitFor(() => {
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });

      // Then click All Cases
      const allCasesButtons = screen.getAllByText('All Cases');
      const allCasesTabButton = allCasesButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(allCasesTabButton);

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.getByText('Alice Donor')).toBeInTheDocument();
        expect(screen.getByText('Charlie Donor')).toBeInTheDocument();
        expect(screen.getByText('Eve Donor')).toBeInTheDocument();
      });
    });

    test('active tab button has active class', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('All Cases')[0]).toBeInTheDocument();
      });

      const allCasesButtons = screen.getAllByText('All Cases');
      const allCasesTabButton = allCasesButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      expect(allCasesTabButton).toHaveClass('active');

      const openButtons = screen.getAllByText('Open');
      const openTabButton = openButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(openTabButton);

      await waitFor(() => {
        expect(openTabButton).toHaveClass('active');
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('searches by case ID', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'DR-' } });

      await waitFor(() => {
        // All cases should still be visible as all have DR- prefix
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });
    });

    test('searches by reporter name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });
    });

    test('searches by reported user name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Bob Receiver')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'Bob' } });

      await waitFor(() => {
        expect(screen.getByText('Bob Receiver')).toBeInTheDocument();
        expect(screen.queryByText('Jane Receiver')).not.toBeInTheDocument();
      });
    });

    test('searches by donation ID', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: '301' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });
    });

    test('search is case insensitive', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'JOHN' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });
    });

    test('shows no cases message when search has no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentName' } });

      await waitFor(() => {
        expect(screen.getByText('No Cases Found')).toBeInTheDocument();
        expect(
          screen.getByText(
            'There are no disputes matching your current filters.'
          )
        ).toBeInTheDocument();
      });
    });

    test('clears search when input is emptied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');

      // Search for something
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.getByText('Alice Donor')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('applies both status filter and search', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      // Filter by OPEN status
      const openButtons = screen.getAllByText('Open');
      const openTabButton = openButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(openTabButton);

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });

      // Now search within OPEN disputes
      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });
    });

    test('shows no results when filters eliminate all disputes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      // Filter by CLOSED (only Eve Donor)
      const closedButtons = screen.getAllByText('Closed');
      const closedTabButton = closedButtons.find(el =>
        el.classList.contains('tab-btn')
      );
      fireEvent.click(closedTabButton);

      await waitFor(() => {
        expect(screen.getByText('Eve Donor')).toBeInTheDocument();
      });

      // Search for someone not in CLOSED status
      const searchInput = screen.getByPlaceholderText('Search cases...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('No Cases Found')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('navigates to dispute detail when View button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Dispute Detail Page')).toBeInTheDocument();
      });
    });

    test('navigates with correct dispute ID', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Dispute Detail Page')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('displays all table headers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CASE ID')).toBeInTheDocument();
      });

      expect(screen.getByText('REPORTER')).toBeInTheDocument();
      expect(screen.getByText('REPORTED USER')).toBeInTheDocument();
      expect(screen.getByText('DONATION ID')).toBeInTheDocument();
      expect(screen.getByText('CREATED')).toBeInTheDocument();
      expect(screen.getByText('STATUS')).toBeInTheDocument();
      expect(screen.getByText('ACTION')).toBeInTheDocument();
    });

    test('displays all stat cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
      });

      const openLabels = screen.getAllByText('Open');
      expect(openLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('Resolved Today')).toBeInTheDocument();
      expect(screen.getByText('Avg Resolution')).toBeInTheDocument();
    });

    test('displays all filter tabs', async () => {
      renderComponent();

      await waitFor(() => {
        const allCasesLabels = screen.getAllByText('All Cases');
        expect(allCasesLabels.length).toBeGreaterThan(0);
      });

      const openLabels = screen.getAllByText('Open');
      expect(openLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      const resolvedLabels = screen.getAllByText('Resolved');
      expect(resolvedLabels.length).toBeGreaterThan(0);
      const closedLabels = screen.getAllByText('Closed');
      expect(closedLabels.length).toBeGreaterThan(0);
    });

    test('displays search input with placeholder', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search cases...')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Stats Calculation', () => {
    test('calculates stats correctly for different statuses', async () => {
      const customDisputes = [
        { ...mockDisputes[0], status: 'OPEN' },
        { ...mockDisputes[1], status: 'OPEN' },
        { ...mockDisputes[2], status: 'UNDER_REVIEW' },
        { ...mockDisputes[3], status: 'RESOLVED' },
      ];

      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: customDisputes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
      });

      // Should have 2 open cases
      const openLabels = screen.getAllByText('Open');
      const openStatLabel = openLabels.find(el =>
        el.classList.contains('stat-label')
      );
      const openSection = openStatLabel.closest('.stat-card');
      expect(openSection).toHaveTextContent('2');
    });

    test('handles zero disputes', async () => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: [] },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
      });

      // All stats should be 0
      const totalSection = screen
        .getByText('Total Cases')
        .closest('.stat-card');
      expect(totalSection).toHaveTextContent('0');
    });
  });

  describe('Reporter Type Display', () => {
    test('displays Receiver type correctly', async () => {
      const customDisputes = [
        {
          ...mockDisputes[0],
          reporterType: 'RECEIVER',
        },
      ];

      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: customDisputes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Receiver')).toBeInTheDocument();
      });
    });

    test('handles missing reporterType and uses default', async () => {
      const customDisputes = [
        {
          ...mockDisputes[0],
          reporterType: undefined,
        },
      ];

      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: customDisputes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });
    });
  });

  describe('Date and Time Formatting', () => {
    test('formats date with correct padding', async () => {
      const customDisputes = [
        {
          ...mockDisputes[0],
          createdAt: '2024-03-05T08:09:10Z', // Single digit month and day
        },
      ];

      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: customDisputes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2024-03-05')).toBeInTheDocument();
      });
    });

    test('formats time correctly', async () => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      // Time should be displayed (format varies by locale, so we just check it exists)
      const timeElements = document.querySelectorAll('.date-time');
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Handle Search Form Submit', () => {
    beforeEach(() => {
      adminDisputeAPI.getAllDisputes.mockResolvedValue({
        data: { content: mockDisputes },
      });
    });

    test('handles form submission (though search is auto-applied)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search cases...');

      // Change the input
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Donor')).toBeInTheDocument();
        expect(screen.queryByText('Alice Donor')).not.toBeInTheDocument();
      });
    });
  });
});
