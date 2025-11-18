import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ForgotPassword Component', () => {
  test('renders forgot password form', () => {
    renderWithRouter(<ForgotPassword />);
    
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('No worries! Enter your email address and we\'ll send you a link to reset your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  test('renders back to login link', () => {
    renderWithRouter(<ForgotPassword />);
    
    const backLink = screen.getByText('Back to Login');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/login');
  });

  test('shows error when email is empty', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });
  });

  test('shows error when email is invalid', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('submits form with valid email and shows success message', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText(/We've sent a password reset link to/i)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('disables input and button while submitting', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  test('allows user to try again from success screen', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    // Submit form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click try again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Should be back to form
    await waitFor(() => {
      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toHaveValue('');
    });
  });

  test('renders mail icon', () => {
    renderWithRouter(<ForgotPassword />);
    
    const iconWrapper = screen.getByText('Forgot Password?').previousSibling;
    expect(iconWrapper).toBeInTheDocument();
  });

  test('renders success screen with check circle icon', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Success icon should be visible
    const successIcon = screen.getByText('Check Your Email').previousSibling;
    expect(successIcon).toBeInTheDocument();
  });

  test('success screen shows back to login button', async () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    }, { timeout: 3000 });

    const backToLoginButton = screen.getByRole('link', { name: /back to login/i });
    expect(backToLoginButton).toBeInTheDocument();
    expect(backToLoginButton).toHaveAttribute('href', '/login');
  });

  test('email input has correct placeholder', () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
  });

  test('email input has correct type', () => {
    renderWithRouter(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
