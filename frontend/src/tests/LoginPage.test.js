import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../components/LoginPage';

// Silence React Router future flag warnings
let warnSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (String(msg).includes('React Router Future Flag Warning')) return;
    // Uncomment to pass through other warnings:
    // console.warn(msg, ...args);
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


const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    // Ensure clean DOM/localStorage state per test
    window.localStorage.clear();
  });

  test('renders email, password fields and submit button', () => {
    renderWithRouter();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: /log in/i });
    expect(submit).toBeInTheDocument();

    // Useful links exist
    const forgot = screen.getByRole('link', { name: /forgot password\?/i });
    expect(forgot).toHaveAttribute('href', '/forgot-password');

    const signup = screen.getByRole('link', { name: /sign up/i });
    expect(signup).toHaveAttribute('href', '/signup');
  });

  test('password visibility toggle switches input type and aria-label', () => {
    renderWithRouter();

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

    renderWithRouter();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'secret' },
    });

    const submit = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submit);

    // Button shows loading state
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

    renderWithRouter();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    // Error message appears
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();

    // No navigation on failure
    expect(mockNavigate).not.toHaveBeenCalled();

    // Button returns to normal state
    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
  });
});