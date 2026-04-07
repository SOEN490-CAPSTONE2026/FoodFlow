import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { authAPI } from '../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

jest.mock('../services/api', () => ({
  authAPI: {
    changePassword: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">eye-off</span>,
  X: () => <span data-testid="close-icon">close</span>,
}));

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderModal = props =>
    render(<ChangePasswordModal isOpen onClose={jest.fn()} {...props} />);

  const fillForm = ({
    currentPassword = 'current-pass',
    newPassword = 'new-password',
    confirmPassword = 'new-password',
  } = {}) => {
    fireEvent.change(screen.getByLabelText(/fields.currentPassword/i), {
      target: { value: currentPassword, name: 'currentPassword' },
    });
    fireEvent.change(screen.getByLabelText(/fields.newPassword/i), {
      target: { value: newPassword, name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText(/fields.confirmNewPassword/i), {
      target: { value: confirmPassword, name: 'confirmPassword' },
    });
  };

  test('does not render when closed', () => {
    render(<ChangePasswordModal isOpen={false} onClose={jest.fn()} />);
    expect(
      screen.queryByText('changePasswordModal.title')
    ).not.toBeInTheDocument();
  });

  test('validates required fields and clears a field error when typing', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));
    expect(
      screen.getByText('changePasswordModal.errors.currentPasswordRequired')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/fields.currentPassword/i), {
      target: { value: 'updated-current', name: 'currentPassword' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('changePasswordModal.errors.currentPasswordRequired')
      ).not.toBeInTheDocument();
    });
  });

  test('validates minimum length, same password, missing confirm password, and mismatch', () => {
    renderModal();

    fillForm({ newPassword: 'short', confirmPassword: 'short' });
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));
    expect(
      screen.getByText('changePasswordModal.errors.newPasswordMinLength')
    ).toBeInTheDocument();

    fillForm({
      currentPassword: 'same-password',
      newPassword: 'same-password',
      confirmPassword: 'same-password',
    });
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));
    expect(
      screen.getByText('changePasswordModal.errors.newPasswordDifferent')
    ).toBeInTheDocument();

    fillForm({
      currentPassword: 'current-pass',
      newPassword: 'new-password',
      confirmPassword: '',
    });
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));
    expect(
      screen.getByText('changePasswordModal.errors.confirmPasswordRequired')
    ).toBeInTheDocument();

    fillForm({
      currentPassword: 'current-pass',
      newPassword: 'new-password',
      confirmPassword: 'other-password',
    });
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));
    expect(
      screen.getByText('changePasswordModal.errors.passwordsDoNotMatch')
    ).toBeInTheDocument();
  });

  test('submits successfully, toggles visibility, and closes after the timeout', async () => {
    const onClose = jest.fn();
    authAPI.changePassword.mockResolvedValue({
      data: { message: 'Password updated' },
    });
    renderModal({ onClose });

    const currentInput = screen.getByLabelText(/fields.currentPassword/i);
    const toggleButtons = screen.getAllByRole('button', {
      name: /aria.togglePasswordVisibility/i,
    });

    expect(currentInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButtons[0]);
    expect(currentInput).toHaveAttribute('type', 'text');

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));

    await waitFor(() => {
      expect(authAPI.changePassword).toHaveBeenCalledWith({
        currentPassword: 'current-pass',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Password updated')).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(currentInput).toHaveValue('');
  });

  test.each([
    [
      'Incorrect current password',
      /fields.currentPassword/i,
      'Incorrect current password',
    ],
    [
      'Passwords do not match',
      /fields.confirmNewPassword/i,
      'Passwords do not match',
    ],
    [
      'New password same as current',
      /fields.newPassword/i,
      'New password same as current',
    ],
    ['Unexpected failure', null, 'Unexpected failure'],
  ])('maps backend errors for "%s"', async (message, fieldLabel, expected) => {
    authAPI.changePassword.mockRejectedValueOnce({
      response: { data: { message } },
    });

    renderModal();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /common.confirm/i }));

    await waitFor(() => {
      expect(authAPI.changePassword).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
    if (fieldLabel) {
      expect(screen.getByLabelText(fieldLabel)).toHaveClass('error');
    }

    cleanup();
  });

  test('cancels from the overlay and reset button', () => {
    const onClose = jest.fn();
    const { container } = renderModal({ onClose });

    fillForm({
      currentPassword: 'filled-current',
      newPassword: 'filled-password',
      confirmPassword: 'filled-password',
    });

    fireEvent.click(container.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /aria.closeModal/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
