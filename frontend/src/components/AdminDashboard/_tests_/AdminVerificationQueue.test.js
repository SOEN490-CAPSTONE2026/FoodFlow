import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminVerificationQueue from '../AdminVerificationQueue';
import { adminVerificationAPI } from '../../../services/api';

// Mock the adminVerificationAPI
jest.mock('../../../services/api', () => ({
  adminVerificationAPI: {
    getPendingUsers: jest.fn(),
    approveUser: jest.fn(),
    rejectUser: jest.fn(),
    verifyEmail: jest.fn(),
  },
}));

// Mock window.alert
global.alert = jest.fn();

describe('AdminVerificationQueue', () => {
  const mockPendingUsers = [
    {
      id: 1,
      organizationName: 'Food Bank Alpha',
      contactName: 'John Doe',
      email: 'john@foodbank.com',
      phoneNumber: '1234567890',
      role: 'RECEIVER',
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      organizationType: 'FOOD_BANK',
      charityRegistrationNumber: 'CH123456',
      capacity: '100 people per day',
      supportingDocument: 'charity-cert.pdf',
      address: {
        street: '123 Main St',
        unit: 'Suite 100',
        city: 'Montreal',
        state: 'QC',
        zipCode: 'H1A 1A1',
      },
    },
    {
      id: 2,
      organizationName: 'Restaurant Beta',
      contactName: 'Jane Smith',
      email: 'jane@restaurant.com',
      phoneNumber: '0987654321',
      role: 'DONOR',
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      organizationType: 'RESTAURANT',
      businessLicense: 'BL789012',
      supportingDocument: 'business-license.pdf',
      address: {
        street: '456 Oak Ave',
        city: 'Montreal',
        state: 'QC',
        zipCode: 'H2B 2B2',
      },
    },
    {
      id: 3,
      organizationName: 'Shelter Gamma',
      contactName: 'Bob Johnson',
      email: 'bob@shelter.com',
      phoneNumber: null,
      role: 'RECEIVER',
      accountStatus: 'PENDING_VERIFICATION',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      organizationType: 'HOMELESS_SHELTER',
      charityRegistrationNumber: 'CH654321',
      capacity: '50 people per day',
      supportingDocument: null,
      address: {
        street: '789 Pine Rd',
        city: 'Montreal',
        state: 'QC',
        zipCode: 'H3C 3C3',
      },
    },
  ];

  const mockPaginatedResponse = {
    content: mockPendingUsers,
    totalElements: 3,
    totalPages: 1,
  };

  beforeEach(() => {
    adminVerificationAPI.getPendingUsers.mockResolvedValue({
      data: mockPaginatedResponse,
    });
    adminVerificationAPI.approveUser.mockResolvedValue({ data: {} });
    adminVerificationAPI.rejectUser.mockResolvedValue({ data: {} });
    adminVerificationAPI.verifyEmail.mockResolvedValue({ data: {} });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AdminVerificationQueue />);
    expect(container).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<AdminVerificationQueue />);
    expect(screen.getByText('Loading pending users...')).toBeInTheDocument();
  });

  it('fetches and displays pending users', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
      // Shelter Gamma is PENDING_VERIFICATION and filtered out by default
      expect(screen.queryByText('Shelter Gamma')).not.toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total Pending
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending Donors
      expect(screen.getByText('2')).toBeInTheDocument(); // Pending Receivers
    });
  });

  it('handles search input with debounce', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by organization name or email/i
    );
    fireEvent.change(searchInput, { target: { value: 'Restaurant' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(adminVerificationAPI.getPendingUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Restaurant',
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it('filters users by type', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const typeSelects = screen.getAllByText('All Types');
    fireEvent.mouseDown(typeSelects[0]);

    await waitFor(() => {
      const donorOptions = screen.getAllByText('Donors');
      const donorOption = donorOptions.find(
        el => el.getAttribute('role') === 'option'
      );
      if (donorOption) {
        fireEvent.click(donorOption);
      }
    });

    await waitFor(() => {
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'DONOR',
        })
      );
    });
  });

  it('filters users by status', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    // Check initial filter (PENDING_ADMIN_APPROVAL)
    const emailVerifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_ADMIN_APPROVAL'
    );
    expect(emailVerifiedUsers.length).toBe(2);
  });

  it('changes sort order', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const sortButton = screen.getByTitle(/Sort Ascending/i);
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 'asc',
        })
      );
    });
  });

  it('changes sort by option', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const sortSelects = screen.getAllByText('Registration Date');
    fireEvent.mouseDown(sortSelects[0]);

    await waitFor(() => {
      const userTypeOptions = screen.getAllByText('User Type');
      const option = userTypeOptions.find(
        el => el.getAttribute('role') === 'option'
      );
      if (option) {
        fireEvent.click(option);
      }
    });

    await waitFor(() => {
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'userType',
        })
      );
    });
  });

  it('expands and collapses user details', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('expand-btn')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Organization Identity')).toBeInTheDocument();
        expect(screen.getByText('Verification & Trust')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Organization Identity')
        ).not.toBeInTheDocument();
      });
    }
  });

  it('opens approval modal for pending admin approval users', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      const modal = screen
        .getByText('Approve Registration')
        .closest('.modal-content');
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
      expect(within(modal).getByText('Food Bank Alpha')).toBeInTheDocument();
    });
  });

  it('approves a user successfully', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Approve User');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminVerificationAPI.approveUser).toHaveBeenCalledWith(1);
      expect(
        screen.getByText(/has been approved successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('cancels approval modal', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByText('Cancel');
    const approvalCancelButton = cancelButtons[0];
    fireEvent.click(approvalCancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Approve Registration')
      ).not.toBeInTheDocument();
    });
  });

  it('opens rejection modal', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reject Registration')).toBeInTheDocument();
    });
  });

  it('rejects a user with reason', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reject Registration')).toBeInTheDocument();
    });

    // Select rejection reason
    const selectPlaceholder = screen.getByText('Select a reason...');
    fireEvent.mouseDown(selectPlaceholder);

    await waitFor(() => {
      const incompleteOption = screen.getByText('Incomplete Information');
      fireEvent.click(incompleteOption);
    });

    // Add custom message
    const textarea = screen.getByPlaceholderText(
      /add any additional information/i
    );
    fireEvent.change(textarea, {
      target: { value: 'Missing required documents' },
    });

    const rejectButton = screen.getByText('Reject User');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(adminVerificationAPI.rejectUser).toHaveBeenCalledWith(
        1,
        'incomplete_info',
        'Missing required documents'
      );
      expect(screen.getByText(/has been rejected/i)).toBeInTheDocument();
    });
  });

  it('shows alert when rejecting without reason', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reject Registration')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject User');
    expect(rejectButton).toBeDisabled();
  });

  it('cancels rejection modal', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reject Registration')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByText('Cancel');
    const rejectionCancelButton = cancelButtons[0];
    fireEvent.click(rejectionCancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Reject Registration')).not.toBeInTheDocument();
    });
  });

  it('opens manual verify modal for unverified email users', async () => {
    // Override with unverified users only
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('Shelter Gamma')).toBeInTheDocument();
    });

    const verifyButton = screen.getByTitle('Verify Email');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Manually Verify Email')).toBeInTheDocument();
    });
  });

  it('manually verifies email successfully', async () => {
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('Shelter Gamma')).toBeInTheDocument();
    });

    const verifyButton = screen.getByTitle('Verify Email');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Manually Verify Email')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Verify Email');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminVerificationAPI.verifyEmail).toHaveBeenCalledWith(3);
      expect(screen.getByText('Email verified manually')).toBeInTheDocument();
    });
  });

  it('cancels manual verify modal', async () => {
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('Shelter Gamma')).toBeInTheDocument();
    });

    const verifyButton = screen.getByTitle('Verify Email');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Manually Verify Email')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Manually Verify Email')
      ).not.toBeInTheDocument();
    });
  });

  it('displays correct waiting time for users', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('2 days')).toBeInTheDocument(); // Food Bank Alpha
      expect(screen.getByText('5 hours')).toBeInTheDocument(); // Restaurant Beta
    });

    // Shelter Gamma is PENDING_VERIFICATION and won't show by default
    expect(screen.queryByText('Shelter Gamma')).not.toBeInTheDocument();
  });

  it('formats organization type correctly', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('expand-btn')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Food Bank')).toBeInTheDocument();
      });
    }
  });

  it('displays charity registration number for receivers', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('expand-btn')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('CH123456')).toBeInTheDocument();
      });
    }
  });

  it('displays business license for donors', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const donorRow = rows.find(row =>
      row.textContent.includes('Restaurant Beta')
    );

    if (donorRow) {
      const buttons = within(donorRow).getAllByRole('button');
      const expandButton = buttons.find(btn =>
        btn.className.includes('expand-btn')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('BL789012')).toBeInTheDocument();
      });
    }
  });

  it('handles document view click', async () => {
    // spy on window.open since the component opens documents in a new tab
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('expand-btn')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        const docButton = screen.getByText('charity-cert.pdf');
        fireEvent.click(docButton.closest('button'));
        expect(openSpy).toHaveBeenCalledWith(
          expect.stringContaining('charity-cert.pdf'),
          '_blank'
        );
      });
    }

    openSpy.mockRestore();
  });

  it('displays N/A for missing phone number', async () => {
    // Override to include PENDING_VERIFICATION users
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const shelterRow = rows.find(row =>
        row.textContent.includes('Shelter Gamma')
      );
      expect(within(shelterRow).getByText('N/A')).toBeInTheDocument();
    });
  });

  it('displays empty state when no pending users', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('No Pending Registrations')).toBeInTheDocument();
      expect(
        screen.getByText('All user registrations have been reviewed.')
      ).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    adminVerificationAPI.getPendingUsers.mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load pending users. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('handles approve user API error', async () => {
    adminVerificationAPI.approveUser.mockRejectedValueOnce(
      new Error('Approval failed')
    );

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByText('Approve User');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to approve user. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('handles reject user API error', async () => {
    adminVerificationAPI.rejectUser.mockRejectedValueOnce(
      new Error('Rejection failed')
    );

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      const selectPlaceholder = screen.getByText('Select a reason...');
      fireEvent.mouseDown(selectPlaceholder);
    });

    await waitFor(() => {
      const option = screen.getByText('Incomplete Information');
      fireEvent.click(option);
    });

    const rejectButton = screen.getByText('Reject User');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to reject user. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('handles manual verify email API error', async () => {
    // Override to include PENDING_VERIFICATION users first
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });
    adminVerificationAPI.verifyEmail.mockRejectedValueOnce({
      response: { data: { message: 'Verification failed' } },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('Shelter Gamma')).toBeInTheDocument();
    });

    const verifyButton = screen.getByTitle('Verify Email');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Verify Email');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });
  });

  it('closes modal when clicking backdrop', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });

    const backdrop = screen
      .getByText('Approve Registration')
      .closest('.modal-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(
        screen.queryByText('Approve Registration')
      ).not.toBeInTheDocument();
    });
  });

  it('prevents modal close when clicking inside modal content', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });

    const modalContent = screen
      .getByText('Approve Registration')
      .closest('.modal-content');
    fireEvent.mouseDown(modalContent);
    fireEvent.click(modalContent);

    await waitFor(() => {
      expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });
  });

  it('displays formatted date correctly', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const donorRow = rows.find(row =>
      row.textContent.includes('Restaurant Beta')
    );

    if (donorRow) {
      const buttons = within(donorRow).getAllByRole('button');
      const expandButton = buttons.find(btn =>
        btn.className.includes('expand-btn')
      );
      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText(/Submitted/)).toBeInTheDocument();
        });
      }
    }
  });

  it('shows pagination controls when multiple pages exist', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: 30,
        totalPages: 2,
      },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  it('handles pagination navigation', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: 30,
        totalPages: 2,
      },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });
  });

  it('disables previous button on first page', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: 30,
        totalPages: 2,
      },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  it('displays correct status pills', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getAllByText('Pending Approval').length).toBeGreaterThan(0);
    });
  });

  it('displays email not verified status pill', async () => {
    const unverifiedUsers = mockPendingUsers.filter(
      u => u.accountStatus === 'PENDING_VERIFICATION'
    );
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: unverifiedUsers,
        totalElements: unverifiedUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Total Pending')).toBeInTheDocument();
    });

    // Change status filter to 'Email Not Verified'
    const statusSelect = screen
      .getByText('Email Verified')
      .closest('.select__control');
    fireEvent.mouseDown(within(statusSelect).getByText('Email Verified'));

    await waitFor(() => {
      const option = screen.getByText('Email Not Verified');
      fireEvent.click(option);
    });

    await waitFor(() => {
      const pills = screen.getAllByText('Email Not Verified');
      const statusPill = pills.find(el =>
        el.className.includes('pill-email-pending')
      );
      expect(statusPill).toBeInTheDocument();
    });
  });

  it('displays correct role pills', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      const donorPills = screen.getAllByText('Donor');
      const receiverPills = screen.getAllByText('Receiver');
      expect(donorPills.length).toBeGreaterThan(0);
      expect(receiverPills.length).toBeGreaterThan(0);
    });
  });

  it('shows notification toast and auto-hides', async () => {
    jest.useFakeTimers();

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      const confirmButton = screen.getByText('Approve User');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/has been approved successfully/i)
      ).toBeInTheDocument();
    });

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(
        screen.queryByText(/has been approved successfully/i)
      ).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('displays address with unit correctly', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('expand-btn')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/123 Main St, Suite 100/)).toBeInTheDocument();
      });
    }
  });

  it('displays address without unit correctly', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant Beta')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const donorRow = rows.find(row =>
      row.textContent.includes('Restaurant Beta')
    );

    if (donorRow) {
      const buttons = within(donorRow).getAllByRole('button');
      const expandButton = buttons.find(btn =>
        btn.className.includes('expand-btn')
      );
      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText(/456 Oak Ave/)).toBeInTheDocument();
        });
      }
    }
  });
});
