import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

// Mock static imports
jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../style/Registration.css', () => ({}), { virtual: true });

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock API
jest.mock('../services/api', () => ({
  authAPI: { registerDonor: jest.fn() }
}));

import DonorRegistration from '../components/DonorRegistration';

// Auth context mock
const mockAuthContextValue = {
  isLoggedIn: false,
  role: null,
  userId: null,
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithAuth = (component) =>
  render(
    <AuthContext.Provider value={mockAuthContextValue}>
      {component}
    </AuthContext.Provider>
  );

// Helper to fill fields
const fillAllFields = async (user) => {
  await user.type(screen.getByLabelText(/^email address$/i), 'donor@example.com');
  await user.type(screen.getByLabelText(/^password$/i), 'password123');
  await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
  await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
  await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/phone number/i), '1234567890');
  await user.type(screen.getByLabelText(/^address$/i), '456 Main St');
  await user.selectOptions(screen.getByLabelText(/organization type/i), 'RESTAURANT');
  await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
};

describe('DonorRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the form with all required fields', () => {
    renderWithAuth(<DonorRegistration />);
    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
  });

  it('renders illustration and description', () => {
    renderWithAuth(<DonorRegistration />);
    expect(screen.getByAltText(/donor illustration/i)).toBeInTheDocument();
    expect(screen.getByText(/your generosity provides meals/i)).toBeInTheDocument();
  });

  it('updates form values', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    expect(screen.getByLabelText(/^email address$/i)).toHaveValue('donor@example.com');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('password123');
    expect(screen.getByLabelText(/organization name/i)).toHaveValue('Donor Org');
    expect(screen.getByLabelText(/contact person/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/^address$/i)).toHaveValue('456 Main St');
    expect(screen.getByLabelText(/business license/i)).toHaveValue('BL-123456');
  });

  it('password mismatch shows error and blocks submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithAuth(<DonorRegistration />);

    await user.type(screen.getByLabelText(/^email address$/i), 'donor@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'wrongpass');

    // Fill the rest so validation passes
    await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
    await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    await user.type(screen.getByLabelText(/^address$/i), '123 St');
    await user.selectOptions(screen.getByLabelText(/organization type/i), 'RESTAURANT');
    await user.type(screen.getByLabelText(/business license/i), 'BL-999');

    const submit = screen.getByRole('button', { name: /register as donor/i });
    await user.click(submit);

    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );

    expect(authAPI.registerDonor).not.toHaveBeenCalled();
  });

  it('successfully registers donor with token', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.registerDonor.mockResolvedValueOnce({
      data: {
        token: 'fake-token-123',
        role: 'DONOR',
        userId: 'user-123',
      },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(screen.getByRole('button', { name: /register as donor/i }));

    await waitFor(() =>
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    );

    // Only check first three args
    expect(mockAuthContextValue.login.mock.calls[0][0]).toBe('fake-token-123');
    expect(mockAuthContextValue.login.mock.calls[0][1]).toBe('DONOR');
    expect(mockAuthContextValue.login.mock.calls[0][2]).toBe('user-123');

    jest.advanceTimersByTime(2000);
    expect(mockNavigate).toHaveBeenCalledWith('/donor');
  });

  it('successfully registers donor without token', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.registerDonor.mockResolvedValueOnce({
      data: {
        role: 'DONOR',
        userId: 'user-123',
      },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(screen.getByRole('button', { name: /register as donor/i }));

    await waitFor(() =>
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
    );

    expect(mockAuthContextValue.login).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(mockNavigate).toHaveBeenCalledWith('/donor');
  });

  it('shows API-specific error message', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.registerDonor.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(screen.getByRole('button', { name: /register as donor/i }));

    await waitFor(() =>
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error if no backend message', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.registerDonor.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(screen.getByRole('button', { name: /register as donor/i }));

    await waitFor(() =>
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    );
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.registerDonor.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
    );

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    const submit = screen.getByRole('button', { name: /register as donor/i });
    await user.click(submit);

    expect(submit).toBeDisabled();
    expect(screen.getByText(/registering/i)).toBeInTheDocument();
  });

  it('back button navigates', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithAuth(<DonorRegistration />);
    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('address field is a textarea', () => {
    renderWithAuth(<DonorRegistration />);
    const textarea = screen.getByLabelText(/^address$/i);
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '3');
  });
});