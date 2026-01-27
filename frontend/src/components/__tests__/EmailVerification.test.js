import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EmailVerification from '../EmailVerification';
import { AuthContext } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    verifyEmail: jest.fn(),
  },
}));

// Mock the CSS
jest.mock('../../style/EmailVerification.css', () => ({}), { virtual: true });

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (initialRoute = '/verify-email?token=abc123') => {
  return render(
    <AuthContext.Provider value={{ logout: mockLogout }}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/verify-email" element={<EmailVerification />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('EmailVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    renderWithRouter();
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we confirm your email address/i)
    ).toBeInTheDocument();
  });

  it('shows error when no token is provided', async () => {
    renderWithRouter('/verify-email');

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/no verification token found/i)
      ).toBeInTheDocument();
    });

    expect(authAPI.verifyEmail).not.toHaveBeenCalled();
  });

  it('calls API with token and shows success message', async () => {
    authAPI.verifyEmail.mockResolvedValueOnce({
      data: {
        message: 'Email verified successfully!',
        email: 'test@example.com',
      },
    });

    renderWithRouter('/verify-email?token=test-token-123');

    await waitFor(() => {
      expect(authAPI.verifyEmail).toHaveBeenCalledWith('test-token-123');
    });

    await waitFor(() => {
      expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
      expect(
        screen.getByText(/email verified successfully!/i)
      ).toBeInTheDocument();
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows custom success message from API response', async () => {
    authAPI.verifyEmail.mockResolvedValueOnce({
      data: {
        message: 'Your account is now awaiting admin approval.',
        email: 'test@example.com',
      },
    });

    renderWithRouter('/verify-email?token=test-token-456');

    await waitFor(() => {
      expect(
        screen.getByText(/your account is now awaiting admin approval/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error message when verification fails', async () => {
    authAPI.verifyEmail.mockRejectedValueOnce({
      response: {
        data: {
          message: 'This verification link has already been used.',
        },
      },
    });

    renderWithRouter('/verify-email?token=used-token');

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/this verification link has already been used/i)
      ).toBeInTheDocument();
    });

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows generic error message when API returns no message', async () => {
    authAPI.verifyEmail.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter('/verify-email?token=network-error-token');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /verification failed/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/the link may be invalid or expired/i)
    ).toBeInTheDocument();
  });

  it('renders Go to Login button on success', async () => {
    authAPI.verifyEmail.mockResolvedValueOnce({
      data: { message: 'Success!', email: 'test@example.com' },
    });

    renderWithRouter('/verify-email?token=success-token');

    await waitFor(() => {
      expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
    });

    const loginButton = screen.getByRole('button', { name: /go to login/i });
    expect(loginButton).toBeInTheDocument();

    loginButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: {
        message: 'Email verified successfully! Please log in to continue.',
      },
    });
  });

  it('renders action buttons on error', async () => {
    authAPI.verifyEmail.mockRejectedValueOnce({
      response: { data: { message: 'Token expired' } },
    });

    renderWithRouter('/verify-email?token=expired-token');

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /go to login/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register new account/i })
    ).toBeInTheDocument();
  });

  it('prevents multiple API calls with hasVerifiedRef flag', async () => {
    authAPI.verifyEmail.mockResolvedValueOnce({
      data: { message: 'Success!', email: 'test@example.com' },
    });

    renderWithRouter('/verify-email?token=test-token');

    await waitFor(() => {
      expect(authAPI.verifyEmail).toHaveBeenCalledTimes(1);
    });

    // Even if React re-renders in Strict Mode, it should not call again
    await waitFor(() => {
      expect(authAPI.verifyEmail).toHaveBeenCalledTimes(1);
    });
  });

  it('calls logout after successful verification', async () => {
    authAPI.verifyEmail.mockResolvedValueOnce({
      data: { message: 'Success!', email: 'test@example.com' },
    });

    renderWithRouter('/verify-email?token=test-token');

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('does not call logout after failed verification', async () => {
    authAPI.verifyEmail.mockRejectedValueOnce({
      response: { data: { message: 'Invalid token' } },
    });

    renderWithRouter('/verify-email?token=bad-token');

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
