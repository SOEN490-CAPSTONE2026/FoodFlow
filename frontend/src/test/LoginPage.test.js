import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock axios to avoid ESM parsing in tests
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

// Mock the authAPI
jest.mock('../services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

const { authAPI } = require('../services/api');


const defaultAuthValue = {
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn(),
  setIsLoggedIn: jest.fn(),
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
    // Ensure clean DOM/localStorage state per test
    window.localStorage.clear();
  });

  test('renders email, password fields and submit button', () => {
    renderWithProviders();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: /log in/i });
    expect(submit).toBeInTheDocument();

    // Useful links exist
    const forgot = screen.getByRole('link', { name: /forgot password\?/i });
    expect(forgot).toHaveAttribute('href', '/forgot-password');


    const signupBtn = screen.getByRole('button', { name: /sign up/i });
    expect(signupBtn).toBeInTheDocument();
    fireEvent.click(signupBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('password visibility toggle switches input type and aria-label', () => {
    renderWithProviders();

    const pwd = screen.getByLabelText(/password/i, { selector: 'input' });
    const toggle = screen.getByRole('button', { name: /show password/i });

    // Starts hidden
    expect(pwd).toHaveAttribute('type', 'password');

    // Reveal
    fireEvent.click(toggle);
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    // Hide again
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toHaveAttribute('type', 'password');
  });

  test('successful login saves token and navigates to /dashboard', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'abc123' } });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'secret' },
    });

    const submit = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submit);

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret',
      });
    });

    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBe('abc123');
    });

    // Assert navigation without relying on typed Jest matchers
    const firstNavigateArg = mockNavigate.mock.calls?.[0]?.[0];
    expect(firstNavigateArg).toBe('/dashboard');
  });

  test('failed login shows error and does not navigate', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('bad creds'));

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
  });
});