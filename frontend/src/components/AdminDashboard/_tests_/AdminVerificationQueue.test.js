import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminVerificationQueue from '../AdminVerificationQueue';
import { adminVerificationAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('react-select', () => {
  function MockSelect({ placeholder, value, options, onChange }) {
    return (
      <select
        data-testid={placeholder || 'select'}
        value={value?.value ?? ''}
        onChange={e => {
          const selected = options.find(
            opt => String(opt.value) === String(e.target.value)
          );
          onChange(selected);
        }}
      >
        {options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return MockSelect;
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

  const mockPendingUsers = [
    ...users,
    {
      id: 3,
      organizationName: 'Restaurant Beta',
      contactName: 'Bob Smith',
      email: 'bob@restaurant.com',
      phoneNumber: '3333333333',
      role: 'DONOR',
      accountStatus: 'PENDING_ADMIN_APPROVAL',
      createdAt: new Date().toISOString(),
      businessLicense: 'BL789012',
      supportingDocument: 'charity-cert.pdf',
      address: { street: '789', city: 'Quebec', state: 'QC', zipCode: 'H3C' },
    },
    {
      id: 4,
      organizationName: 'Shelter Gamma',
      contactName: 'Alice Jones',
      email: 'alice@shelter.org',
      phoneNumber: null,
      role: 'RECEIVER',
      accountStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      supportingDocument: 'doc2.pdf',
      address: { street: '101', city: 'Gatineau', state: 'QC', zipCode: 'H4D' },
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
    });
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('adminVerificationQueue.searchPlaceholder')
      ).toBeInTheDocument();
    });
    await waitFor(() => {
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
    // The approve button text is the i18n key: adminVerificationQueue.modals.approval.action
    fireEvent.click(
      within(modalRoot).getByText('adminVerificationQueue.modals.approval.action')
    );

    await waitFor(() => {
      expect(adminVerificationAPI.approveUser).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
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
      within(modalRoot).getByTestId(
        'adminVerificationQueue.modals.rejection.reasonPlaceholder'
      ),
      { target: { value: 'other' } }
    );

    // The textarea has no accessible name, so just get it by role without name filter
    fireEvent.change(
      within(modalRoot).getByRole('textbox'),
      {
        target: { value: 'Missing details' },
      }
    );

    // The reject button text is the i18n key
    fireEvent.click(
      within(modalRoot).getByText('adminVerificationQueue.modals.rejection.action')
    );

    await waitFor(() => {
      expect(adminVerificationAPI.rejectUser).toHaveBeenCalledWith(
        1,
        'other',
        'Missing details'
      );
    });
    await waitFor(() => {
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
    // The verify button text is the i18n key
    fireEvent.click(
      within(modalRoot).getByText('adminVerificationQueue.modals.manualVerify.action')
    );

    await waitFor(() => {
      expect(adminVerificationAPI.verifyEmail).toHaveBeenCalledWith(2);
    });
    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.toasts.verified')
      ).toBeInTheDocument();
    });
  });

  test('toggle expand row and preview document alert', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});

    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    // The expand button has no accessible name (just an SVG icon), use DOM query
    const expandButtons = document.querySelectorAll('.expand-btn');
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Organization Identity')).toBeInTheDocument();
    });

    // doc.pdf is a non-http document name, so handleViewDocument opens via fallback URL
    const docText = screen.getByText('doc.pdf');
    fireEvent.click(docText.closest('button'));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('doc.pdf'),
      '_blank'
    );

    openSpy.mockRestore();
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

    // The expand button has no accessible name, use DOM query
    const expandButtons = document.querySelectorAll('.expand-btn');
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);
      // User 1 is a RECEIVER with no charityRegistrationNumber, so it shows 'Not provided'
      await waitFor(() => {
        expect(screen.getByText('Organization Identity')).toBeInTheDocument();
      });
    }
  });

  it('displays business license for donors', async () => {
    // Need to provide mockPendingUsers so Restaurant Beta is in the data
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: mockPendingUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    await screen.findByText('Restaurant Beta');

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const donorRow = rows.find(row =>
      row.textContent.includes('Restaurant Beta')
    );

    expect(donorRow).toBeDefined();
    const expandButton = within(donorRow)
      .getAllByRole('button')
      .find(btn => btn.className.includes('expand-btn'));
    expect(expandButton).toBeDefined();
    fireEvent.click(expandButton);

    await screen.findByText('BL789012');
  });

  it('handles document view click', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});

    // Need to provide mockPendingUsers so charity-cert.pdf is in the data
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: mockPendingUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    await screen.findByText('Food Bank Alpha');

    // The expand button has no accessible name, use DOM query
    const expandButtons = document.querySelectorAll('.expand-btn');
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);

      const docButton = await screen.findByText('doc.pdf');
      fireEvent.click(docButton.closest('button'));

      // doc.pdf doesn't start with http, so it opens via the fallback URL
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('doc.pdf'),
        '_blank'
      );
    }

    openSpy.mockRestore();
  });

  it('displays N/A for missing phone number', async () => {
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

    // Wait for data to load - use translation key
    await screen.findByText('adminVerificationQueue.stats.totalPending');

    // Switch to PENDING_VERIFICATION status filter
    fireEvent.change(
      screen.getByTestId('adminVerificationQueue.filters.byStatus'),
      { target: { value: 'PENDING_VERIFICATION' } }
    );

    await screen.findByText('Shelter Gamma');

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const shelterRow = rows.find(row =>
      row.textContent.includes('Shelter Gamma')
    );
    expect(shelterRow).toBeDefined();
    expect(
      within(shelterRow).getByText('adminVerificationQueue.notAvailable')
    ).toBeInTheDocument();
  });

  it('displays empty state when no pending users', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.empty.title')
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.empty.description')
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

    // Use translation key for title
    const approveButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.approve'
    );
    fireEvent.click(approveButtons[0]);

    // Use translation key for button text
    const confirmButton = await screen.findByText(
      'adminVerificationQueue.modals.approval.action'
    );
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.toasts.approveFailed')
      ).toBeInTheDocument();
    });
  });

  it('handles reject user API error', async () => {
    adminVerificationAPI.rejectUser.mockRejectedValueOnce(
      new Error('Rejection failed')
    );

    render(<AdminVerificationQueue />);

    // Default mock only has Food Bank Alpha as PENDING_ADMIN_APPROVAL
    await screen.findByText('Food Bank Alpha');

    // Use translation key for title
    const rejectButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.reject'
    );
    fireEvent.click(rejectButtons[0]);

    // Select a reason using the mock select's data-testid
    const modalTitle = await screen.findByText(
      'adminVerificationQueue.modals.rejection.title'
    );
    const modalRoot = modalTitle.closest('.modal-content');

    fireEvent.change(
      within(modalRoot).getByTestId(
        'adminVerificationQueue.modals.rejection.reasonPlaceholder'
      ),
      { target: { value: 'incomplete_info' } }
    );

    // Click reject button using translation key
    fireEvent.click(
      within(modalRoot).getByText(
        'adminVerificationQueue.modals.rejection.action'
      )
    );

    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.toasts.rejectFailed')
      ).toBeInTheDocument();
    });
  });

  it('handles manual verify email API error', async () => {
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

    // Wait for data to load - use translation key
    await screen.findByText('adminVerificationQueue.stats.totalPending');

    // Switch to PENDING_VERIFICATION status filter
    fireEvent.change(
      screen.getByTestId('adminVerificationQueue.filters.byStatus'),
      { target: { value: 'PENDING_VERIFICATION' } }
    );

    await screen.findByText('Shelter Gamma');

    // Use translation key for title
    const verifyButton = screen.getAllByTitle(
      'adminVerificationQueue.actions.verifyEmail'
    )[0];
    fireEvent.click(verifyButton);

    // Use translation key for confirm button
    const confirmButton = await screen.findByText(
      'adminVerificationQueue.modals.manualVerify.action'
    );
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });
  });

  it('closes modal when clicking backdrop', async () => {
    render(<AdminVerificationQueue />);

    await screen.findByText('Food Bank Alpha');

    // Use translation key for title
    const approveButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.approve'
    );
    fireEvent.click(approveButtons[0]);

    const modalTitle = await screen.findByText(
      'adminVerificationQueue.modals.approval.title'
    );
    expect(modalTitle).toBeInTheDocument();

    const backdrop = modalTitle.closest('.modal-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(
        screen.queryByText('adminVerificationQueue.modals.approval.title')
      ).not.toBeInTheDocument();
    });
  });

  it('prevents modal close when clicking inside modal content', async () => {
    render(<AdminVerificationQueue />);

    await screen.findByText('Food Bank Alpha');

    // Use translation key for title
    const approveButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.approve'
    );
    fireEvent.click(approveButtons[0]);

    const modalTitle = await screen.findByText(
      'adminVerificationQueue.modals.approval.title'
    );
    expect(modalTitle).toBeInTheDocument();

    const modalContent = modalTitle.closest('.modal-content');
    fireEvent.mouseDown(modalContent);
    fireEvent.click(modalContent);

    expect(
      screen.getByText('adminVerificationQueue.modals.approval.title')
    ).toBeInTheDocument();
  });

  it('displays formatted date correctly', async () => {
    // Need to provide mockPendingUsers so Restaurant Beta is in the data
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: mockPendingUsers,
        totalElements: mockPendingUsers.length,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    await screen.findByText('Restaurant Beta');

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const donorRow = rows.find(row =>
      row.textContent.includes('Restaurant Beta')
    );

    expect(donorRow).toBeDefined();
    const expandButton = within(donorRow)
      .getAllByRole('button')
      .find(btn => btn.className.includes('expand-btn'));
    expect(expandButton).toBeDefined();
    fireEvent.click(expandButton);

    await screen.findByText(/Submitted/);
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

    // Use translation keys for pagination buttons
    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.pagination.previous')
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.pagination.next')
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText('adminVerificationQueue.pagination.pageOf')
      ).toBeInTheDocument();
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
      expect(
        screen.getByText('adminVerificationQueue.pagination.next')
      ).toBeInTheDocument();
    });

    const nextButton = screen.getByText(
      'adminVerificationQueue.pagination.next'
    );
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

    const previousButton = await screen.findByText(
      'adminVerificationQueue.pagination.previous'
    );
    expect(previousButton).toBeDisabled();
  });

  it('displays correct status pills', async () => {
    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(
        screen.getAllByText('adminVerificationQueue.status.pendingApproval')
          .length
      ).toBeGreaterThan(0);
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

    // Wait for data to load - use translation key
    await screen.findByText('adminVerificationQueue.stats.totalPending');

    // Switch to PENDING_VERIFICATION status filter
    fireEvent.change(
      screen.getByTestId('adminVerificationQueue.filters.byStatus'),
      { target: { value: 'PENDING_VERIFICATION' } }
    );

    await waitFor(() => {
      const pills = screen.getAllByText(
        'adminVerificationQueue.status.emailNotVerified'
      );
      expect(
        pills.some(el => el.className.includes('pill-email-pending'))
      ).toBe(true);
    });
  });

  // ==================== avgWaitTime negative guard tests ====================

  test('avgWaitTime stat displays 0h when all users have future createdAt (clock skew)', async () => {
    // Set createdAt far in the future to simulate clock skew
    const futureDate = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 7
    ).toISOString();
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 10,
            organizationName: 'Future Org',
            contactName: 'Test',
            email: 'future@test.com',
            phoneNumber: null,
            role: 'DONOR',
            accountStatus: 'PENDING_ADMIN_APPROVAL',
            createdAt: futureDate,
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      // avgWaitTime must not be negative — should render as 0h
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  test('avgWaitTime stat displays 0h when users have invalid createdAt', async () => {
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 11,
            organizationName: 'Bad Date Org',
            contactName: 'Test',
            email: 'bad@test.com',
            phoneNumber: null,
            role: 'RECEIVER',
            accountStatus: 'PENDING_ADMIN_APPROVAL',
            createdAt: 'not-a-valid-date',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);

    await waitFor(() => {
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  test('waiting time in expanded row shows 0 hours for future createdAt', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
    adminVerificationAPI.getPendingUsers.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 12,
            organizationName: 'Future Food Bank',
            contactName: 'Jane Future',
            email: 'jane@future.com',
            phoneNumber: '5555555555',
            role: 'DONOR',
            accountStatus: 'PENDING_ADMIN_APPROVAL',
            createdAt: futureDate,
            businessLicense: 'BL-999',
            supportingDocument: 'future.pdf',
            address: {
              street: '1 Future St',
              city: 'Montreal',
              state: 'QC',
              zipCode: 'H9Z',
            },
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(<AdminVerificationQueue />);
    await screen.findByText('Future Food Bank');

    // Expand the row
    const expandButtons = document.querySelectorAll('.expand-btn');
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      // Waiting Time in expanded row must not be negative
      const waitingTimeEl = screen
        .getByText('Waiting Time')
        .closest('.detail-item');
      expect(waitingTimeEl).toBeInTheDocument();
      // The displayed value should start with "0" (0 hours or 0 days)
      const valueEl = waitingTimeEl.querySelector('.detail-value');
      expect(valueEl.textContent).toMatch(/^0/);
    });
  });
});
