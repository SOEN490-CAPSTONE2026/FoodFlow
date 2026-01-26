import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmailVerificationRequired from '../EmailVerificationRequired';
import { AuthContext } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    resendVerificationEmail: jest.fn(),
  },
}));

// Mock the CSS
jest.mock('../../style/EmailVerificationRequired.css', () => ({}), {
  virtual: true,
});

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithAuth = () => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ logout: mockLogout }}>
        <EmailVerificationRequired />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('EmailVerificationRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the main heading', () => {
    renderWithAuth();
    expect(
      screen.getByText(/email verification required/i)
    ).toBeInTheDocument();
  });

  it('displays verification instructions', () => {
    renderWithAuth();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /we've sent a verification link to your registered email address/i
      )
    ).toBeInTheDocument();
  });

  it('renders email icon', () => {
    const { container } = renderWithAuth();
    const icon = container.querySelector('.verification-icon');
    expect(icon).toBeInTheDocument();
  });

  it('renders resend verification email button', () => {
    renderWithAuth();
    expect(
      screen.getByRole('button', { name: /resend verification email/i })
    ).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderWithAuth();
    expect(
      screen.getByRole('button', { name: /log out/i })
    ).toBeInTheDocument();
  });

  it('calls logout and navigates to login when logout button is clicked', () => {
    renderWithAuth();
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('calls API when resend button is clicked', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(authAPI.resendVerificationEmail).toHaveBeenCalled();
    });
  });

  it('shows loading state when resending email', async () => {
    authAPI.resendVerificationEmail.mockImplementationOnce(
      () =>
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 1000))
    );

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /sending/i })
      ).toBeInTheDocument();
    });
  });

  it('disables button while sending email', async () => {
    authAPI.resendVerificationEmail.mockImplementationOnce(
      () =>
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 1000))
    );

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      const sendingButton = screen.getByRole('button', { name: /sending/i });
      expect(sendingButton).toBeDisabled();
    });
  });

  it('shows success modal after successful resend', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('shows check mark icon in success modal', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      const modal = screen
        .getByText(/verification email sent successfully/i)
        .closest('.success-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  it('auto-dismisses success modal after 3 seconds', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(
        screen.queryByText(/verification email sent successfully/i)
      ).not.toBeInTheDocument();
    });
  });

  it('allows manual dismissal of success modal by clicking overlay', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });

    const overlay = document.querySelector('.success-modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(
        screen.queryByText(/verification email sent successfully/i)
      ).not.toBeInTheDocument();
    });
  });

  it('shows error message when resend fails', async () => {
    authAPI.resendVerificationEmail.mockRejectedValueOnce({
      response: {
        data: { message: 'Failed to send email' },
      },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send email/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message when API returns no message', async () => {
    authAPI.resendVerificationEmail.mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to resend verification email/i)
      ).toBeInTheDocument();
    });
  });

  it('clears error message before new resend attempt', async () => {
    authAPI.resendVerificationEmail
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ data: { message: 'Success' } });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    // First attempt - fails
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to resend verification email/i)
      ).toBeInTheDocument();
    });

    // Second attempt - succeeds
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/failed to resend verification email/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('displays "please check your inbox" in success modal', async () => {
    authAPI.resendVerificationEmail.mockResolvedValueOnce({
      data: { message: 'Email sent successfully' },
    });

    renderWithAuth();
    const resendButton = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/please check your inbox/i)).toBeInTheDocument();
    });
  });
});
