import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminVerificationQueue from '../AdminVerificationQueue';
import { adminVerificationAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    adminVerificationAPI.getPendingUsers.mockResolvedValue({
      data: { content: users, totalElements: 1, totalPages: 1 },
    });
    adminVerificationAPI.approveUser.mockResolvedValue({ data: {} });
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

  test('opens approval modal by key title', async () => {
    render(<AdminVerificationQueue />);
    await screen.findByText('Food Bank Alpha');

    const approveButtons = screen.getAllByTitle(
      'adminVerificationQueue.actions.approve'
    );
    fireEvent.click(approveButtons[0]);

    expect(
      await screen.findByText('adminVerificationQueue.modals.approval.title')
    ).toBeInTheDocument();
  });
});
