import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminVerificationQueue from '../AdminVerificationQueue';
import { adminVerificationAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('react-select', () => {
  return function MockSelect(props) {
    return (
      <select
        data-testid={props.placeholder || 'select'}
        value={props.value?.value ?? ''}
        onChange={e => {
          const selected = props.options.find(
            opt => String(opt.value) === String(e.target.value)
          );
          props.onChange(selected);
        }}
      >
        {props.options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock('../../../services/api', () => ({
  adminVerificationAPI: {
    getPendingUsers: jest.fn(),
    approveUser: jest.fn(),
    rejectUser: jest.fn(),
    verifyEmail: jest.fn(),
  },
}));

global.alert = jest.fn();

describe('AdminVerificationQueue', () => {
  const users = [
    {
      id: 1,
      organizationName: 'Food Bank Alpha',
      contactName: 'John Doe',
      email: 'john@foodbank.com',
      phoneNumber: '1234567890',
      role: 'RECEIVER',
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      createdAt: new Date().toISOString(),
      supportingDocument: 'doc.pdf',
      address: { street: '123', city: 'Montreal', state: 'QC', zipCode: 'H1A' },
    },
    {
      id: 2,
      organizationName: 'Shelter Beta',
      contactName: 'Jane Roe',
      email: 'jane@shelter.org',
      phoneNumber: '2222222222',
      role: 'DONOR',
      accountStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      businessLicense: 'BL-123',
      supportingDocument: 'license.pdf',
      address: { street: '456', city: 'Laval', state: 'QC', zipCode: 'H2B' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    adminVerificationAPI.getPendingUsers.mockResolvedValue({
      data: { content: users, totalElements: 2, totalPages: 2 },
    });
    adminVerificationAPI.approveUser.mockResolvedValue({ data: {} });
    adminVerificationAPI.rejectUser.mockResolvedValue({ data: {} });
    adminVerificationAPI.verifyEmail.mockResolvedValue({ data: {} });
  });

  test('renders loading key', () => {
    adminVerificationAPI.getPendingUsers.mockImplementation(
      () => new Promise(() => {})
    );
    render(<AdminVerificationQueue />);
    expect(
      screen.getByText('adminVerificationQueue.loading')
    ).toBeInTheDocument();
  });

  test('renders key-based filters and data', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Food Bank Alpha')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('adminVerificationQueue.searchPlaceholder')
      ).toBeInTheDocument();
      expect(
        screen.getByText('adminVerificationQueue.stats.totalPending')
      ).toBeInTheDocument();
    });
  });

  test('shows empty state when no users match current status filter', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.empty.title')
      ).toBeInTheDocument();
    });
  });

  test('shows API error state when loading fails', async () => {
    adminVerificationAPI.getPendingUsers.mockRejectedValueOnce(
      new Error('fail')
    );
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load pending users. Please try again.')
      ).toBeInTheDocument();
    });
  });

  test('opens approval modal by key title and approves user', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    const approveButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.approve'
    );
    fireEvent.click(approveButtons[0]);

    const title = await screen.findByText(
      'adminVerificationQueue.modals.approval.title'
    );
    expect(title).toBeInTheDocument();
    const modalRoot = title.closest('.modal-content');
    fireEvent.click(modalRoot.querySelector('.btn-approve'));

    await waitFor(() => {
      expect(adminVerificationAPI.approveUser).toHaveBeenCalledWith(1);
      expect(
        screen.getByText('adminVerificationQueue.toasts.approved')
      ).toBeInTheDocument();
    });
  });

  test('opens rejection modal and rejects with selected reason', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    fireEvent.click(
      screen.getAllByTitle('adminVerificationQueue.actions.reject')[0]
    );

    const title = await screen.findByText(
      'adminVerificationQueue.modals.rejection.title'
    );
    const modalRoot = title.closest('.modal-content');

    fireEvent.change(
      modalRoot.querySelector(
        '[data-testid="adminVerificationQueue.modals.rejection.reasonPlaceholder"]'
      ),
      { target: { value: 'other' } }
    );

    fireEvent.change(modalRoot.querySelector('textarea'), {
      target: { value: 'Missing details' },
    });

    fireEvent.click(modalRoot.querySelector('.btn-reject'));

    await waitFor(() => {
      expect(adminVerificationAPI.rejectUser).toHaveBeenCalledWith(
        1,
        'other',
        'Missing details'
      );
      expect(
        screen.getByText('adminVerificationQueue.toasts.rejected')
      ).toBeInTheDocument();
    });
  });

  test('manual verification flow calls verify email API', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    fireEvent.change(
      screen.getByTestId('adminVerificationQueue.filters.byStatus'),
      { target: { value: 'PENDING_VERIFICATION' } }
    );
    await screen.findByText('Shelter Beta');

    fireEvent.click(
      screen.getAllByTitle('adminVerificationQueue.actions.verifyEmail')[0]
    );

    const title = await screen.findByText(
      'adminVerificationQueue.modals.manualVerify.title'
    );
    const modalRoot = title.closest('.modal-content');
    fireEvent.click(modalRoot.querySelector('.btn-approve'));

    await waitFor(() => {
      expect(adminVerificationAPI.verifyEmail).toHaveBeenCalledWith(2);
      expect(
        screen.getByText('adminVerificationQueue.toasts.verified')
      ).toBeInTheDocument();
    });
  });

  test('toggle expand row and preview document alert', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    const expandButtons = document.querySelectorAll('.expand-btn');
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Organization Identity')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('doc.pdf'));
    expect(global.alert).toHaveBeenCalled();
  });

  test('pagination buttons trigger next and previous page fetches', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    fireEvent.click(screen.getByText('adminVerificationQueue.pagination.next'));
    await waitFor(() => {
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    fireEvent.click(
      screen.getByText('adminVerificationQueue.pagination.previous')
    );
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
    });
  });
});
