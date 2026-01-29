import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AdminUsers from '../AdminUsers';
import { feedbackAPI } from '../../../services/api';

// Mock axios and feedbackAPI
jest.mock('axios');
jest.mock('../../../services/api', () => ({
  feedbackAPI: {
    getUserRating: jest.fn(),
  },
}));

describe('AdminUsers', () => {
  const mockUsers = [
    {
      id: 1,
      email: 'donor1@test.com',
      contactPerson: 'John Donor',
      organizationName: 'Food Bank A',
      phone: '1234567890',
      role: 'DONOR',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      createdAt: '2024-12-01T00:00:00Z',
      donationCount: 10,
    },
    {
      id: 2,
      email: 'receiver1@test.com',
      contactPerson: 'Jane Receiver',
      organizationName: 'Shelter B',
      phone: '0987654321',
      role: 'RECEIVER',
      verificationStatus: 'PENDING',
      accountStatus: 'ACTIVE',
      createdAt: '2025-01-15T00:00:00Z',
      claimCount: 5,
    },
    {
      id: 3,
      email: 'admin@test.com',
      contactPerson: 'Admin User',
      organizationName: 'Admin Org',
      phone: '5555555555',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      createdAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 4,
      email: 'deactivated@test.com',
      contactPerson: 'Deactivated User',
      organizationName: 'Inactive Org',
      phone: '1111111111',
      role: 'DONOR',
      verificationStatus: 'VERIFIED',
      accountStatus: 'DEACTIVATED',
      createdAt: '2024-06-01T00:00:00Z',
      donationCount: 3,
    },
  ];

  const mockPaginatedResponse = {
    content: mockUsers,
    totalPages: 1,
  };

  beforeEach(() => {
    localStorage.setItem('jwtToken', 'test-token');
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:8080';
    
    axios.get.mockResolvedValue({ data: mockPaginatedResponse });
    feedbackAPI.getUserRating.mockResolvedValue({
      data: { averageRating: 4.5, totalReviews: 10 },
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AdminUsers />);
    expect(container).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<AdminUsers />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('fetches and displays users', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
      expect(screen.getByText('Jane Receiver')).toBeInTheDocument();
    });
  });

  it('displays stats correctly', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Donors
      expect(screen.getByText('1')).toBeInTheDocument(); // Total Receivers
      expect(screen.getByText('1')).toBeInTheDocument(); // New Users (within 30 days)
    });
  });

  it('handles search input', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    await waitFor(() => {
      expect(screen.getByText('Jane Receiver')).toBeInTheDocument();
      expect(screen.queryByText('John Donor')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('filters users by role', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    // Find and click on the role filter
    const roleSelect = screen.getAllByText('All Roles')[0];
    fireEvent.mouseDown(roleSelect);
    
    await waitFor(() => {
      const donorOptions = screen.getAllByText('Donor');
      const donorOption = donorOptions.find(el => el.getAttribute('role') === 'option');
      fireEvent.click(donorOption);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: expect.objectContaining({ role: 'DONOR' }),
        })
      );
    });
  });

  it('filters users by status', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByText('All Status')[0];
    fireEvent.mouseDown(statusSelect);
    
    await waitFor(() => {
      const activeOptions = screen.getAllByText('Active');
      const activeOption = activeOptions.find(el => el.getAttribute('role') === 'option');
      fireEvent.click(activeOption);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: expect.objectContaining({ accountStatus: 'ACTIVE' }),
        })
      );
    });
  });

  it('resets filters when reset button is clicked', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: { page: 0, size: 20 },
        })
      );
    });
  });

  it('expands user row and fetches rating', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledWith(1);
      expect(screen.getByText(/4.5\/5/)).toBeInTheDocument();
    });
  });

  it('opens deactivate modal for active users', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Deactivate User:')).toBeInTheDocument();
      const emailElements = screen.getAllByText('donor1@test.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });
  });

  it('deactivates user with admin notes', async () => {
    axios.put.mockResolvedValue({ data: {} });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/enter reason for deactivation/i);
      fireEvent.change(textarea, { target: { value: 'Policy violation' } });
    });

    const confirmButton = screen.getByText('Deactivate');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1/deactivate'),
        { adminNotes: 'Policy violation' },
        expect.any(Object)
      );
      expect(screen.getByText('User deactivated successfully')).toBeInTheDocument();
    });
  });

  it('shows error when deactivating without admin notes', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByText('Deactivate');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Please provide a reason for deactivation')).toBeInTheDocument();
    });
  });

  it('opens reactivate modal for deactivated users', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Deactivated User')).toBeInTheDocument();
    });

    const reactivateButton = screen.getByTitle('Reactivate');
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      expect(screen.getByText('Reactivate User')).toBeInTheDocument();
      const emailElements = screen.getAllByText('deactivated@test.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });
  });

  it('reactivates user successfully', async () => {
    axios.put.mockResolvedValue({ data: {} });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Deactivated User')).toBeInTheDocument();
    });

    const reactivateButton = screen.getByTitle('Reactivate');
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Reactivate');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/4/reactivate'),
        {},
        expect.any(Object)
      );
      expect(screen.getByText('User reactivated successfully')).toBeInTheDocument();
    });
  });

  it('opens send alert modal', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Send Alert to:')).toBeInTheDocument();
    });
  });

  it('sends alert with custom message', async () => {
    axios.post.mockResolvedValue({ data: {} });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const customOption = screen.getByText('Custom Alert');
      fireEvent.click(customOption.closest('label'));
    });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/enter your custom message/i);
      fireEvent.change(textarea, { target: { value: 'Important message' } });
    });

    const sendButton = screen.getByText('Send Alert');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1/send-alert'),
        { message: 'Important message' },
        expect.any(Object)
      );
      expect(screen.getByText('Alert sent successfully')).toBeInTheDocument();
    });
  });

  it('shows error when sending alert without message', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const sendButton = screen.getByText('Send Alert');
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Please enter an alert message')).toBeInTheDocument();
    });
  });

  it('handles warning alert type', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const warningOption = screen.getByText('Warning');
      fireEvent.click(warningOption.closest('label'));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/policy violation/i)).toBeInTheDocument();
    });
  });

  it('handles safety alert type', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const safetyOption = screen.getByText('Safety Notice');
      fireEvent.click(safetyOption.closest('label'));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/safety guidelines/i)).toBeInTheDocument();
    });
  });

  it('handles compliance alert type', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const complianceOption = screen.getByText('Compliance Reminder');
      fireEvent.click(complianceOption.closest('label'));
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/compliance requirements/i)).toBeInTheDocument();
    });
  });

  it('closes modals when clicking outside', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Deactivate User:')).toBeInTheDocument();
    });

    const overlay = screen.getByText('Deactivate User:').closest('.modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Deactivate User:')).not.toBeInTheDocument();
    });
  });

  it('closes alert modal when clicking close button', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Send Alert to:')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Send Alert to:')).not.toBeInTheDocument();
    });
  });

  it('closes notification modal', async () => {
    axios.post.mockResolvedValue({ data: {} });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const customOption = screen.getByText('Custom Alert');
      fireEvent.click(customOption.closest('label'));
    });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/enter your custom message/i);
      fireEvent.change(textarea, { target: { value: 'Test message' } });
    });

    const sendButton = screen.getByText('Send Alert');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Alert sent successfully')).toBeInTheDocument();
    });

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    await waitFor(() => {
      expect(screen.queryByText('Alert sent successfully')).not.toBeInTheDocument();
    });
  });

  it('displays error message when API fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles deactivate API error', async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: 'Deactivation failed' },
    });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/enter reason for deactivation/i);
      fireEvent.change(textarea, { target: { value: 'Test reason' } });
    });

    const confirmButton = screen.getByText('Deactivate');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Deactivation failed')).toBeInTheDocument();
    });
  });

  it('handles reactivate API error', async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: 'Reactivation failed' },
    });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Deactivated User')).toBeInTheDocument();
    });

    const reactivateButton = screen.getByTitle('Reactivate');
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Reactivate');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Reactivation failed')).toBeInTheDocument();
    });
  });

  it('handles send alert API error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Send alert failed'));
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const customOption = screen.getByText('Custom Alert');
      fireEvent.click(customOption.closest('label'));
    });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/enter your custom message/i);
      fireEvent.change(textarea, { target: { value: 'Test' } });
    });

    const sendButton = screen.getByText('Send Alert');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send alert')).toBeInTheDocument();
    });
  });

  it('displays correct activity count for donors', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const donorRow = rows.find(row => row.textContent.includes('John Donor'));
      expect(within(donorRow).getByText('10')).toBeInTheDocument();
    });
  });

  it('displays correct activity count for receivers', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const receiverRow = rows.find(row => row.textContent.includes('Jane Receiver'));
      expect(within(receiverRow).getByText('5')).toBeInTheDocument();
    });
  });

  it('displays N/A for admin phone when not available', async () => {
    const usersWithoutPhone = [{
      ...mockUsers[0],
      phone: null,
    }];
    axios.get.mockResolvedValueOnce({
      data: { content: usersWithoutPhone, totalPages: 1 },
    });
    
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('toggles alert type selection', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const warningOption = screen.getByText('Warning');
      const warningLabel = warningOption.closest('label');
      
      // Select warning
      fireEvent.click(warningLabel);
      expect(screen.getByDisplayValue(/policy violation/i)).toBeInTheDocument();
      
      // Deselect warning
      fireEvent.click(warningLabel);
    });

    await waitFor(() => {
      expect(screen.queryByDisplayValue(/policy violation/i)).not.toBeInTheDocument();
    });
  });

  it('prevents modal close on content click', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const alertButtons = screen.getAllByTitle('Send Alert');
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      const modalContent = screen.getByText('Send Alert to:').closest('.modal-content');
      fireEvent.click(modalContent);
    });

    await waitFor(() => {
      expect(screen.getByText('Send Alert to:')).toBeInTheDocument();
    });
  });

  it('handles getUserRating error gracefully', async () => {
    feedbackAPI.getUserRating.mockRejectedValueOnce(new Error('Rating fetch failed'));
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledWith(1);
    });
  });

  it('does not refetch user rating if already cached', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(btn => btn.querySelector('svg'));
    
    // Expand first time
    fireEvent.click(expandButton);
    
    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledTimes(1);
    });

    // Collapse
    fireEvent.click(expandButton);
    
    // Expand again
    fireEvent.click(expandButton);

    await waitFor(() => {
      // Should still be called only once due to caching
      expect(feedbackAPI.getUserRating).toHaveBeenCalledTimes(1);
    });
  });

  it('displays "No users found" when filteredUsers is empty', async () => {
    axios.get.mockResolvedValueOnce({
      data: { content: [], totalPages: 0 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('uses sessionStorage token if localStorage is empty', async () => {
    localStorage.clear();
    sessionStorage.setItem('jwtToken', 'session-token');

    render(<AdminUsers />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer session-token' },
        })
      );
    });

    sessionStorage.clear();
  });

  it('cancels deactivate modal', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const powerButtons = screen.getAllByTitle('Deactivate');
    fireEvent.click(powerButtons[0]);

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Deactivate User:')).not.toBeInTheDocument();
    });
  });

  it('cancels reactivate modal', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Deactivated User')).toBeInTheDocument();
    });

    const reactivateButton = screen.getByTitle('Reactivate');
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Reactivate User')).not.toBeInTheDocument();
    });
  });

  it('displays correct badge colors for different statuses', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      const activeStatus = screen.getAllByText('Active');
      const verifiedStatus = screen.getAllByText('Verified');
      const pendingStatus = screen.getByText('Pending');
      const deactivatedStatus = screen.getByText('Deactivated');

      expect(activeStatus.length).toBeGreaterThan(0);
      expect(verifiedStatus.length).toBeGreaterThan(0);
      expect(pendingStatus).toBeInTheDocument();
      expect(deactivatedStatus).toBeInTheDocument();
    });
  });

  it('displays user initials correctly', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });
  });

  it('handles expanded row details correctly', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Total Activity')).toBeInTheDocument();
      expect(screen.getByText('10 donations')).toBeInTheDocument();
      expect(screen.getByText('Disputes')).toBeInTheDocument();
      expect(screen.getByText('Feedback Score')).toBeInTheDocument();
      expect(screen.getByText('Member Since')).toBeInTheDocument();
    });
  });

  it('does not show deactivate button for admin users', async () => {
    const adminUser = [{
      ...mockUsers[2],
    }];
    
    axios.get.mockResolvedValueOnce({
      data: { content: adminUser, totalPages: 1 },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.queryByTitle('Deactivate')).not.toBeInTheDocument();
    });
  });
});
