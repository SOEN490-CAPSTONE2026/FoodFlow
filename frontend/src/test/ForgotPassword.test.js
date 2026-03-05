import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { signInWithPhoneNumber } from 'firebase/auth';
import ForgotPassword from '../components/ForgotPassword';
import { authAPI } from '../services/api';

const tMock = key => key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}));

jest.mock('../services/api', () => ({
  authAPI: {
    forgotPassword: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

jest.mock('../services/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signInWithPhoneNumber: jest.fn(),
  RecaptchaVerifier: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../components/PhoneInput', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder, disabled }) => (
    <input
      data-testid="mock-phone-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = ui => render(<BrowserRouter>{ui}</BrowserRouter>);

const fillOtp = async code => {
  const digits = code.split('');
  for (let i = 0; i < digits.length; i++) {
    fireEvent.change(screen.getByTestId(`code-digit-${i}`), {
      target: { value: digits[i] },
    });
  }
};

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authAPI.forgotPassword.mockResolvedValue({ data: { message: 'ok' } });
    authAPI.verifyResetCode.mockResolvedValue({ data: { ok: true } });
    authAPI.resetPassword.mockResolvedValue({ data: { ok: true } });
    signInWithPhoneNumber.mockResolvedValue({ confirm: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const requestEmailCode = async user => {
    await user.click(screen.getByTestId('option-email'));
    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder'),
      'test@example.com'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
  };

  const moveToVerifiedState = async user => {
    await requestEmailCode(user);
    await screen.findByTestId('code-digit-0');
    await fillOtp('123456');
    await screen.findByText('forgotPasswordPage.verifiedTitle');
  };

  test('switches methods and renders key placeholders', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    expect(
      screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder')
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('option-sms'));
    expect(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder')
    ).toBeInTheDocument();
  });

  test('shows validation error for no selected method when form submitted', () => {
    const { container } = renderWithRouter(<ForgotPassword />);
    fireEvent.submit(container.querySelector('form'));
    expect(
      screen.getByText('forgotPasswordPage.chooseMethod')
    ).toBeInTheDocument();
  });

  test('shows key validation errors for invalid email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.enterEmailAddress')
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder'),
      'bad-email'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.enterValidEmail')
    ).toBeInTheDocument();
  });

  test('shows validation errors for SMS phone input rules', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-sms'));
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.enterPhoneNumber')
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder'),
      '123456'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.selectCountryCode')
    ).toBeInTheDocument();

    await user.clear(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder')
    );
    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder'),
      '+'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.enterValidPhoneNumber')
    ).toBeInTheDocument();
  });

  test('calls forgotPassword API for valid email and moves to OTP step', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder'),
      'test@example.com'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        method: 'email',
      });
    });
    expect(
      screen.getByText('forgotPasswordPage.codeSentTitle')
    ).toBeInTheDocument();
  });

  test('handles SMS flow and initializes firebase phone auth', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-sms'));
    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder'),
      '+15145551234'
    );
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledWith({
        phone: '+15145551234',
        method: 'sms',
      });
      expect(signInWithPhoneNumber).toHaveBeenCalled();
    });
  });

  test('maps firebase and generic errors while sending SMS code', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);
    await user.click(screen.getByTestId('option-sms'));
    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder'),
      '+15145550000'
    );

    authAPI.forgotPassword.mockRejectedValueOnce({
      code: 'auth/invalid-phone-number',
    });
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.invalidPhoneFormat')
    ).toBeInTheDocument();

    authAPI.forgotPassword.mockRejectedValueOnce({
      code: 'auth/too-many-requests',
    });
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(
      await screen.findByText('forgotPasswordPage.tooManyRequests')
    ).toBeInTheDocument();

    authAPI.forgotPassword.mockRejectedValueOnce({
      response: { data: { message: 'backend-error' } },
    });
    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' })
    );
    expect(await screen.findByText('backend-error')).toBeInTheDocument();
  });

  test('verifies OTP for email and shows password reset form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await requestEmailCode(user);
    await screen.findByTestId('code-digit-0');
    await fillOtp('123456');
    await waitFor(() => {
      expect(authAPI.verifyResetCode).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
      });
    });
    expect(
      screen.getByText('forgotPasswordPage.verifiedTitle')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('forgotPasswordPage.newPasswordPlaceholder')
    ).toBeInTheDocument();
  });

  test('handles incorrect OTP and supports try again', async () => {
    const user = userEvent.setup();
    authAPI.verifyResetCode.mockRejectedValueOnce(new Error('bad-code'));
    renderWithRouter(<ForgotPassword />);

    await requestEmailCode(user);
    await screen.findByTestId('code-digit-0');

    await fillOtp('111111');
    expect(
      await screen.findByText('forgotPasswordPage.codeIncorrectTitle')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.tryAgain' })
    );
    expect(
      screen.queryByText('forgotPasswordPage.codeIncorrectTitle')
    ).not.toBeInTheDocument();
  });

  test('resend code triggers a new request', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await requestEmailCode(user);

    await user.click(
      screen.getByRole('button', { name: 'forgotPasswordPage.resendCode' })
    );

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledTimes(2);
    });
  });

  test('password form validations and successful reset navigate to login', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await moveToVerifiedState(user);

    const newPass = screen.getByPlaceholderText(
      'forgotPasswordPage.newPasswordPlaceholder'
    );
    const confirmPass = screen.getByPlaceholderText(
      'forgotPasswordPage.confirmNewPasswordPlaceholder'
    );

    await user.type(newPass, 'short');
    await user.type(confirmPass, 'short');
    await user.click(
      screen.getByRole('button', {
        name: 'forgotPasswordPage.resetPasswordAction',
      })
    );
    await waitFor(() => {
      expect(
        screen.getByText('forgotPasswordPage.passwordMinLength')
      ).toBeInTheDocument();
    });

    await user.clear(newPass);
    await user.clear(confirmPass);
    await user.type(newPass, 'Validpassword1!');
    await user.type(confirmPass, 'Mismatch1!');
    expect(
      await screen.findByText('forgotPasswordPage.passwordsDoNotMatch')
    ).toBeInTheDocument();

    await user.clear(confirmPass);
    await user.type(confirmPass, 'Validpassword1!');
    await user.click(
      screen.getByRole('button', {
        name: 'forgotPasswordPage.resetPasswordAction',
      })
    );

    await waitFor(() => {
      expect(authAPI.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Validpassword1!',
      });
    });
    expect(
      screen.getByText('forgotPasswordPage.resetSuccessTitle')
    ).toBeInTheDocument();
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
      },
      { timeout: 4000 }
    );
  }, 15000);

  test('shows backend field error for reset password failure', async () => {
    const user = userEvent.setup();
    authAPI.resetPassword.mockRejectedValueOnce({
      response: {
        data: {
          fieldErrors: [{ message: 'weak-password-field-error' }],
        },
      },
    });
    renderWithRouter(<ForgotPassword />);

    await moveToVerifiedState(user);

    await user.type(
      screen.getByPlaceholderText('forgotPasswordPage.newPasswordPlaceholder'),
      'Validpassword1!'
    );
    await user.type(
      screen.getByPlaceholderText(
        'forgotPasswordPage.confirmNewPasswordPlaceholder'
      ),
      'Validpassword1!'
    );
    await user.click(
      screen.getByRole('button', {
        name: 'forgotPasswordPage.resetPasswordAction',
      })
    );

    expect(
      await screen.findByText('weak-password-field-error')
    ).toBeInTheDocument();
  });

  test('toggles password visibility buttons in verified state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await moveToVerifiedState(user);

    const [toggleNew, toggleConfirm] = screen.getAllByRole('button', {
      name: 'common.showPassword',
    });
    const newPasswordInput = screen.getByPlaceholderText(
      'forgotPasswordPage.newPasswordPlaceholder'
    );

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    await user.click(toggleNew);
    expect(newPasswordInput).toHaveAttribute('type', 'text');
    await user.click(toggleConfirm);
    expect(
      screen.getAllByRole('button', { name: 'common.hidePassword' }).length
    ).toBeGreaterThan(0);
  });
});
