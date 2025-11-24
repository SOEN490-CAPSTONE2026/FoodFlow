import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock axios to avoid ESM issues
jest.mock('axios', () => {
  const handlers = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
  return { __esModule: true, default: { create: () => handlers, ...handlers } };
});

let warnSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (String(msg).includes('React Router Future Flag Warning')) return;
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
  });

  test('renders email, password fields and submit button', () => {
    renderWithProviders();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password\?/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
  });

  test('password visibility toggle switches input type and aria-label', () => {
    renderWithProviders();

    const pwd = screen.getByLabelText(/^password$/i, { selector: 'input' });
    const toggle = screen.getByRole('button', { name: /toggle password visibility \(show\)/i });

    expect(pwd).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);

    expect(screen.getByLabelText(/^password$/i, { selector: 'input' })).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /toggle password visibility \(hide\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /toggle password visibility \(hide\)/i }));
    expect(screen.getByLabelText(/^password$/i, { selector: 'input' })).toHaveAttribute('type', 'password');
  });

  test('successful login calls AuthContext.login and navigates by role', async () => {
    const mockTrackLogin = jest.fn();
    const mockTrackButtonClick = jest.fn();
    jest.spyOn(require('../hooks/useAnalytics'), 'useAnalytics').mockReturnValue({
      trackButtonClick: mockTrackButtonClick,
      trackLogin: mockTrackLogin,
    });

    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'abc123',
        role: 'donor',
        userId: '42',
        organizationName: 'Test Organization'
      }
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i, { selector: 'input' }), {
      target: { value: 'secret' },
    });

    const submit = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret',
      });
    });

    await waitFor(() => {
      expect(defaultAuthValue.login).toHaveBeenCalledWith('abc123', 'donor', '42', 'Test Organization');
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
    jest.spyOn(require('../hooks/useAnalytics'), 'useAnalytics').mockReturnValue({
      trackButtonClick: jest.fn(),
      trackLogin: mockTrackLogin,
    });

    authAPI.login.mockRejectedValueOnce(new Error('bad creds'));

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i, { selector: 'input' }), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(defaultAuthValue.login).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockTrackLogin).toHaveBeenCalledWith(false);
  });
});
