import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';
import { authAPI } from '../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../services/api');
jest.mock('../services/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signInWithPhoneNumber: jest.fn(),
  RecaptchaVerifier: jest.fn().mockImplementation(() => ({})),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = ui => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('switches methods and renders key placeholders', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    expect(screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder')).toBeInTheDocument();

    await user.click(screen.getByTestId('option-sms'));
    expect(screen.getByPlaceholderText('forgotPasswordPage.phonePlaceholder')).toBeInTheDocument();
  });

  test('shows key validation error for empty email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' }));

    expect(await screen.findByText('forgotPasswordPage.enterEmailAddress')).toBeInTheDocument();
  });

  test('calls forgotPassword API for valid email', async () => {
    authAPI.forgotPassword = jest.fn().mockResolvedValue({ data: { message: 'ok' } });
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);

    await user.click(screen.getByTestId('option-email'));
    await user.type(screen.getByPlaceholderText('forgotPasswordPage.emailPlaceholder'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.sendCode' }));

    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com', method: 'email' });
    });
  });
});
