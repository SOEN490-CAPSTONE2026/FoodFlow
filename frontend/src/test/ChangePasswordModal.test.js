import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { authAPI } from '../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../services/api', () => ({
  authAPI: { changePassword: jest.fn() },
}));

describe('ChangePasswordModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders key-based labels and actions', () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.getByRole('heading', { name: 'changePasswordModal.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('changePasswordModal.fields.currentPassword')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'common.confirm' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'common.cancel' })
    ).toBeInTheDocument();
  });

  test('shows required validation key', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(
        screen.getByText('changePasswordModal.errors.currentPasswordRequired')
      ).toBeInTheDocument();
    });
  });

  test('submits valid form', async () => {
    authAPI.changePassword.mockResolvedValue({ data: { message: 'ok' } });
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.currentPassword'),
      { target: { value: 'OldPass123!' } }
    );
    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.newPassword'),
      { target: { value: 'NewPass123!' } }
    );
    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.confirmNewPassword'),
      { target: { value: 'NewPass123!' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(authAPI.changePassword).toHaveBeenCalled();
    });
  });
});
