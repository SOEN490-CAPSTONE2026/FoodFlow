import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';
import { authAPI } from '../services/api';
import { signInWithPhoneNumber } from 'firebase/auth';

// Mock API and Firebase
jest.mock('../services/api');
jest.mock('../services/firebase', () => ({
  auth: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithPhoneNumber: jest.fn(),
  RecaptchaVerifier: jest.fn().mockImplementation(() => ({})),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = ui => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ForgotPassword - Method Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('selecting Email shows email input and highlights the Email option', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    const emailOption = screen.getByTestId('option-email');
    const smsOption = screen.getByTestId('option-sms');

    await user.click(emailOption);

    // email input should appear
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    expect(emailInput).toBeInTheDocument();

    // Email option should be marked pressed
    expect(emailOption).toHaveAttribute('aria-pressed', 'true');
    expect(smsOption).toHaveAttribute('aria-pressed', 'false');
  });

  test('selecting SMS shows phone input and highlights the SMS option', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    const smsOption = screen.getByTestId('option-sms');
    const emailOption = screen.getByTestId('option-email');

    await user.click(smsOption);

    // phone input should appear (from PhoneInput component)
    const phoneInput = screen.getByPlaceholderText(/phone number/i);
    expect(phoneInput).toBeInTheDocument();

    // SMS option should be marked pressed
    expect(smsOption).toHaveAttribute('aria-pressed', 'true');
    expect(emailOption).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows error when submitting without selecting a method', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    const submitButton = screen.queryByRole('button', { name: /send code/i });
    expect(submitButton).not.toBeInTheDocument();
  });
});

describe('ForgotPassword - Email Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error for empty email', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('option-email'));
    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/please enter your email address/i)
    ).toBeInTheDocument();
  });

  test('shows error for invalid email format', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'invalidemail');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  test('successfully sends email when valid', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        method: 'email',
      });
    });
  });

  test('shows error when email does not exist in database', async () => {
    authAPI.forgotPassword = jest.fn().mockRejectedValue({
      response: { data: { message: 'User not found' } },
    });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'nonexistent@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });
});

describe('ForgotPassword - Phone Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error for empty phone number', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('option-sms'));
    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/please enter your phone number/i)
    ).toBeInTheDocument();
  });
});

describe('ForgotPassword - Code Entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows 6 code input fields after email submission', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });
  });

  test('shows timer countdown for email (60 seconds)', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/expires in/i)).toBeInTheDocument();
      expect(screen.getByText(/60s/i)).toBeInTheDocument();
    });
  });

  test('auto-focuses next input when entering digit', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');

    await waitFor(() => {
      expect(document.activeElement).toBe(inputs[1]);
    });
  });
});

describe('ForgotPassword - Code Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error when incorrect email code is entered', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest.fn().mockRejectedValue({
      response: { data: { message: 'Invalid reset code' } },
    });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter incorrect code
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], '9');
    }

    await waitFor(() => {
      expect(
        screen.getByText(/the code you submitted is incorrect/i)
      ).toBeInTheDocument();
    });
  });

  test('shows password form when correct email code is entered', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Code verified' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter correct code
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Confirm New Password')
      ).toBeInTheDocument();
    });
  });

  test('shows error when SMS code is incorrect', async () => {
    const mockConfirmationResult = {
      confirm: jest
        .fn()
        .mockRejectedValue({ code: 'auth/invalid-verification-code' }),
    };
    signInWithPhoneNumber.mockResolvedValue(mockConfirmationResult);

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-sms'));
    const phoneInput = screen.getByPlaceholderText(/phone number/i);
    await user.type(phoneInput, '+14165551234');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter incorrect code
    const inputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], '9');
    }

    await waitFor(() => {
      expect(
        screen.getByText(/the code you submitted is incorrect/i)
      ).toBeInTheDocument();
    });
  });
});

describe('ForgotPassword - Password Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error when passwords do not match', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Code verified' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /send code/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter code
    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Enter non-matching passwords
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    await user.type(newPasswordInput, 'Password123');
    await user.type(confirmPasswordInput, 'DifferentPassword');

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('shows error when password is too short', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Code verified' } });
    authAPI.resetPassword = jest.fn();

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /send code/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter code
    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Enter short password
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    await user.type(newPasswordInput, 'Pass1!');
    await user.type(confirmPasswordInput, 'Pass1!');

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 10 characters/i)
      ).toBeInTheDocument();
    });

    expect(authAPI.resetPassword).not.toHaveBeenCalled();
  });

  test('successfully resets password with valid input', async () => {
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Code verified' } });
    authAPI.resetPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Password reset successful' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /send code/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Enter code
    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Enter valid password
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(authAPI.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '111111',
        newPassword: 'NewPassword123!',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/password reset/i)).toBeInTheDocument();
    });
  });

  test('shows success screen and redirects after password reset', async () => {
    jest.useFakeTimers();
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });
    authAPI.verifyResetCode = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Code verified' } });
    authAPI.resetPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Password reset successful' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /send code/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText(
      'Confirm New Password'
    );

    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');

    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(
        screen.getByText(/you will be redirected to the login page now/i)
      ).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    jest.useRealTimers();
  });
});

describe('ForgotPassword - Resend Code', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows resending code when expired', async () => {
    jest.useFakeTimers();
    authAPI.forgotPassword = jest
      .fn()
      .mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup({ delay: null });

    await user.click(screen.getByTestId('option-email'));
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    await user.type(emailInput, 'test@example.com');

    await user.click(screen.getByRole('button', { name: /send code/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });

    // Fast-forward 60 seconds to expire code
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(screen.getByText(/did not submit in time/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /resend code/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
