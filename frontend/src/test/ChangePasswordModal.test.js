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
  const fillValidForm = () => {
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
  };

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

  test('does not render when closed', () => {
    const { container } = render(
      <ChangePasswordModal isOpen={false} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('toggles password visibility for all password fields', () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    const currentPassword = screen.getByLabelText(
      'changePasswordModal.fields.currentPassword'
    );
    const newPassword = screen.getByLabelText(
      'changePasswordModal.fields.newPassword'
    );
    const confirmPassword = screen.getByLabelText(
      'changePasswordModal.fields.confirmNewPassword'
    );
    const toggleButtons = screen.getAllByRole('button', {
      name: 'changePasswordModal.aria.togglePasswordVisibility',
    });

    expect(currentPassword).toHaveAttribute('type', 'password');
    expect(newPassword).toHaveAttribute('type', 'password');
    expect(confirmPassword).toHaveAttribute('type', 'password');

    toggleButtons.forEach(button => fireEvent.click(button));

    expect(currentPassword).toHaveAttribute('type', 'text');
    expect(newPassword).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'text');
  });

  test('validates password rules and matching confirmation', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.currentPassword'),
      { target: { value: 'SamePass1!' } }
    );
    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.newPassword'),
      { target: { value: 'short' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(
        screen.getByText('changePasswordModal.errors.newPasswordMinLength')
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.newPassword'),
      { target: { value: 'SamePass1!' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(
        screen.getByText('changePasswordModal.errors.newPasswordDifferent')
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.newPassword'),
      { target: { value: 'Different1!' } }
    );
    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.confirmNewPassword'),
      { target: { value: 'Mismatch1!' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(
        screen.getByText('changePasswordModal.errors.passwordsDoNotMatch')
      ).toBeInTheDocument();
    });
  });

  test('submits valid form', async () => {
    authAPI.changePassword.mockResolvedValue({ data: { message: 'ok' } });
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => {
      expect(authAPI.changePassword).toHaveBeenCalled();
    });
  });

  test('maps backend field errors to the correct inputs', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fillValidForm();

    authAPI.changePassword.mockRejectedValueOnce({
      response: { data: { message: 'Incorrect current password' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));
    expect(
      await screen.findByText('Incorrect current password')
    ).toBeInTheDocument();

    authAPI.changePassword.mockRejectedValueOnce({
      response: { data: { message: 'Passwords do not match' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));
    expect(
      await screen.findByText('Passwords do not match')
    ).toBeInTheDocument();

    authAPI.changePassword.mockRejectedValueOnce({
      response: { data: { message: 'New password same as current password' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));
    expect(
      await screen.findByText('New password same as current password')
    ).toBeInTheDocument();

    authAPI.changePassword.mockRejectedValueOnce({
      response: { data: { message: 'Unexpected failure' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));
    expect(await screen.findByText('Unexpected failure')).toBeInTheDocument();
  });

  test('resets form state and closes when cancelled', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(
      screen.getByLabelText('changePasswordModal.fields.currentPassword'),
      { target: { value: 'OldPass123!' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    expect(
      await screen.findByText('changePasswordModal.errors.newPasswordRequired')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(
      screen.getByLabelText('changePasswordModal.fields.currentPassword')
    ).toHaveValue('');
    expect(
      screen.queryByText('changePasswordModal.errors.newPasswordRequired')
    ).not.toBeInTheDocument();
  });
});
