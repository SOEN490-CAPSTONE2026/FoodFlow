import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock axios to avoid ESM issues
jest.mock('axios', () => {
  const handlers = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return { __esModule: true, default: { create: () => handlers, ...handlers } };
});

let warnSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (String(msg).includes('React Router Future Flag Warning')) {
      return;
    }
  });
});
afterAll(() => warnSpy && warnSpy.mockRestore());

const mockNavigate = jest.fn();

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authAPI
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

// Mock analytics hook
jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackButtonClick: jest.fn(),
    trackLogin: jest.fn(),
  }),
}));

const { authAPI } = require('../services/api');
const { useAnalytics } = require('../hooks/useAnalytics');

const defaultAuthValue = {
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn(),
  setIsLoggedIn: jest.fn(),
  role: null,
  userId: null,
  setRole: jest.fn(),
  user: null,
  setUser: jest.fn(),
};

const renderWithProviders = (authOverrides = {}) =>
  render(
    <AuthContext.Provider value={{ ...defaultAuthValue, ...authOverrides }}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    // Reset analytics mock to default behavior
    jest
      .spyOn(require('../hooks/useAnalytics'), 'useAnalytics')
      .mockReturnValue({
        trackButtonClick: jest.fn(),
        trackLogin: jest.fn(),
      });
  });

  test('renders email, password fields and submit button', () => {
    renderWithProviders();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^password$/i, { selector: 'input' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /forgot password\?/i })
    ).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  test('password visibility toggle switches input type and aria-label', () => {
    renderWithProviders();

    const pwd = screen.getByLabelText(/^password$/i, { selector: 'input' });
    const toggle = screen.getByRole('button', { name: /show password/i });

    expect(pwd).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);

    expect(
      screen.getByLabelText(/^password$/i, { selector: 'input' })
    ).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide password/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(
      screen.getByLabelText(/^password$/i, { selector: 'input' })
    ).toHaveAttribute('type', 'password');
  });

  test('successful login calls AuthContext.login and navigates by role', async () => {
    const mockTrackLogin = jest.fn();
    const mockTrackButtonClick = jest.fn();
    jest
      .spyOn(require('../hooks/useAnalytics'), 'useAnalytics')
      .mockReturnValue({
        trackButtonClick: mockTrackButtonClick,
        trackLogin: mockTrackLogin,
      });

    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'donor',
        userId: '42',
        organizationName: 'Test Organization',
        verificationStatus: null,
        accountStatus: 'ACTIVE',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'secret' },
      }
    );

    const submit = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret',
      });
    });

    await waitFor(() => {
      expect(defaultAuthValue.login).toHaveBeenCalledWith(
        'abc123',
        'donor',
        '42',
        'Test Organization',
        null,
        'ACTIVE'
      );
    });

    await waitFor(() => {
      expect(mockTrackLogin).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/donor');
    });
  });

  test('failed login shows error and does not navigate', async () => {
    const mockTrackLogin = jest.fn();
    jest
      .spyOn(require('../hooks/useAnalytics'), 'useAnalytics')
      .mockReturnValue({
        trackButtonClick: jest.fn(),
        trackLogin: mockTrackLogin,
      });

    authAPI.login.mockRejectedValueOnce(new Error('bad creds'));

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'wrong' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
    expect(defaultAuthValue.login).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockTrackLogin).toHaveBeenCalledWith(false);
  });

  test('401 error shows invalid credentials message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'wrong' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  test('403 error with email not verified shows custom message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Email not verified' },
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/email not verified/i)).toBeInTheDocument();
  });

  test('403 error with account not approved shows custom message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Account not approved yet' },
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/account not approved yet/i)
    ).toBeInTheDocument();
  });

  test('500 error shows server error message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 500,
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/server error.*please try again later/i)
    ).toBeInTheDocument();
  });

  test('503 error shows service unavailable message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 503,
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/service temporarily unavailable/i)
    ).toBeInTheDocument();
  });

  test('error with custom server message shows that message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Custom server error message' },
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/custom server error message/i)
    ).toBeInTheDocument();
  });

  test('network error shows network connection message', async () => {
    authAPI.login.mockRejectedValueOnce({
      request: {},
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(
        /unable to connect to server.*check your connection/i
      )
    ).toBeInTheDocument();
  });

  test('missing token in response throws error', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        role: 'donor',
        userId: '42',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/login successful but received incomplete data/i)
    ).toBeInTheDocument();
  });

  test('missing role in response throws error', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        userId: '42',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/login successful but received incomplete data/i)
    ).toBeInTheDocument();
  });

  test('missing userId in response throws error', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'donor',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/login successful but received incomplete data/i)
    ).toBeInTheDocument();
  });

  test('successful login with ADMIN role navigates to /admin', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'ADMIN',
        userId: '42',
        organizationName: 'Admin Org',
        verificationStatus: null,
        accountStatus: 'ACTIVE',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('successful login with DONOR role navigates to /donor', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'DONOR',
        userId: '42',
        organizationName: 'Donor Org',
        verificationStatus: null,
        accountStatus: 'ACTIVE',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'donor@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/donor');
    });
  });

  test('successful login with RECEIVER role navigates to /receiver', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'RECEIVER',
        userId: '42',
        organizationName: 'Receiver Org',
        verificationStatus: null,
        accountStatus: 'ACTIVE',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'receiver@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/receiver');
    });
  });

  test('successful login with unknown role navigates to /dashboard by default', async () => {
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'UNKNOWN_ROLE',
        userId: '42',
        organizationName: 'Org',
        verificationStatus: null,
        accountStatus: 'ACTIVE',
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^password$/i, { selector: 'input' }),
      {
        target: { value: 'password' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
