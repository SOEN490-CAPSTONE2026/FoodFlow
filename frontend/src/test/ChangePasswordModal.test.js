import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordModal from '../components/ChangePasswordModal';

describe('ChangePasswordModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    test('does not render when isOpen is false', () => {
      const { container } = render(
        <ChangePasswordModal isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('renders modal when isOpen is true', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('displays password requirements text', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 8 characters long/i)).toBeInTheDocument();
      expect(screen.getByText(/must be different from your current password/i)).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    test('closes modal when clicking close button', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('closes modal when clicking cancel button', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('closes modal when clicking overlay', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation - Empty Fields', () => {
    test('shows error when current password is empty', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
      });
    });

    test('shows error when new password is empty', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
      });
    });

    test('shows error when confirm password is empty', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please confirm your new password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation - Password Length', () => {
    test('shows error when new password is less than 8 characters', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Fill in fields with a short password (less than 8 chars)
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      });
    });

    test('accepts password with exactly 8 characters', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass1' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass1' } }); // exactly 8 chars
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass1' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Should NOT show the length error
        expect(screen.queryByText(/password must be at least 8 characters long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation - Password Matching', () => {
    test('shows error when passwords do not match', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    test('shows error when new password is same as current password', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      fireEvent.change(currentPasswordInput, { target: { value: 'samepass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'samepass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'samepass123' } });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/new password must be different from current password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    test('toggles current password visibility', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });
      
      // Initially should be password type (hidden)
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
      
      // Click to show
      fireEvent.click(toggleButtons[0]);
      expect(currentPasswordInput).toHaveAttribute('type', 'text');
      
      // Click to hide again
      fireEvent.click(toggleButtons[0]);
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    test('closes modal after valid submission', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Fill in valid data
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });
      fireEvent.click(confirmButton);
      
      // Modal should close after successful validation
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    test('clears form data on cancel', () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Fill in some data
      fireEvent.change(currentPasswordInput, { target: { value: 'test123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newtest123' } });
      
      // Click cancel
      fireEvent.click(cancelButton);
      
      // Modal should close
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Clearing on Input', () => {
    test('clears field-specific error when user types', async () => {
      render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Trigger validation error
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
      });
      
      // Start typing in the field
      fireEvent.change(currentPasswordInput, { target: { value: 't' } });
      
      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/current password is required/i)).not.toBeInTheDocument();
      });
    });
  });
});
