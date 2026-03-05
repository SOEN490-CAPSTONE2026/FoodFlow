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
      expect(screen.getByText('adminVerificationQueue.empty.title')).toBeInTheDocument();
    });
  });

  test('shows API error state when loading fails', async () => {
    adminVerificationAPI.getPendingUsers.mockRejectedValueOnce(new Error('fail'));
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
    fireEvent.click(
      modalRoot.querySelector('.btn-approve')
    );

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
      expect(adminVerificationAPI.getPendingUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });
  });
});
