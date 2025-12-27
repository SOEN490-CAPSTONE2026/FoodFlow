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
  test('submitting SMS shows code entry and countdown', async () => {
    renderWithRouter(<ForgotPassword />);
    const user = userEvent.setup();

    const smsOption = screen.getByTestId('option-sms');
    await user.click(smsOption);

    const phoneInput = screen.getByPlaceholderText(/enter your phone number/i);
    await user.type(phoneInput, '+14165551234');

    const submitButton = screen.getByRole('button', { name: /send code/i });
    await user.click(submitButton);

    // Wait for code sent title and countdown
    expect(await screen.findByText(/code sent/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    
    // Should show code inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(6);
  });

});


