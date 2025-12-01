import React from 'react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('ForgotPassword - selection and basic flows', () => {
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

    // phone input should appear
    const phoneInput = screen.getByPlaceholderText(/enter your phone number/i);
    expect(phoneInput).toBeInTheDocument();

    // SMS option should be marked pressed
    expect(smsOption).toHaveAttribute('aria-pressed', 'true');
    expect(emailOption).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('ForgotPassword - SMS code timer and expiry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('submitting SMS shows code entry and countdown', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    const smsOption = screen.getByTestId('option-sms');
    await user.click(smsOption);

    const phoneInput = screen.getByPlaceholderText(/enter your phone number/i);
    await user.type(phoneInput, '+14165551234');

    // submit - button text can be "Send Code" for SMS
    const submitButton = screen.getByRole('button', { name: /send code|send reset link/i });
    await user.click(submitButton);

    // advance simulated API timeout used by component (1500ms)
    jest.advanceTimersByTime(1500);

    // Wait for code sent title
    expect(await screen.findByText(/code sent/i)).toBeInTheDocument();

    // Countdown should show (initially 60s)
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in 60s/i)).toBeInTheDocument();

    // Advance 5 seconds and verify the countdown decreased
    jest.advanceTimersByTime(5000);
    expect(screen.getByText(/expires in 55s/i)).toBeInTheDocument();
  });

  test('timer expiry shows oops message with resend and back to login', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    // start SMS flow
    await user.click(screen.getByTestId('option-sms'));
    await user.type(screen.getByPlaceholderText(/enter your phone number/i), '+14165551234');
    await user.click(screen.getByRole('button', { name: /send code|send reset link/i }));
    jest.advanceTimersByTime(1500); // API

    // ensure we're on code view
    expect(await screen.findByText(/code sent/i)).toBeInTheDocument();

    // fast-forward to expiry (60s)
    jest.advanceTimersByTime(60000);

    // run pending timers to trigger state updates
    await waitFor(() => {
      expect(screen.getByText(/oops! you did not submit in time/i)).toBeInTheDocument();
    });

    // Resend button and Back to Login link should be visible
    expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  test('resend resets expiry and shows code inputs again', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    // start SMS flow and expire
    await user.click(screen.getByTestId('option-sms'));
    await user.type(screen.getByPlaceholderText(/enter your phone number/i), '+14165551234');
    await user.click(screen.getByRole('button', { name: /send code|send reset link/i }));
    jest.advanceTimersByTime(1500); // API
    expect(await screen.findByText(/code sent/i)).toBeInTheDocument();
    jest.advanceTimersByTime(60000); // expire

    // confirm expired state
    await waitFor(() => expect(screen.getByText(/oops! you did not submit in time/i)).toBeInTheDocument());

    // click resend
    await user.click(screen.getByRole('button', { name: /resend code/i }));

    // after resend, inputs should be present again and timer reset to 60
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/expires in 60s/i)).toBeInTheDocument();
  });
});
