import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PaymentPage from '../PaymentPage';
import api from '../../../services/api';

// Mock the dependencies
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
}));
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: jest.fn(),
  }),
  useElements: () => ({}),
}));

jest.mock('../StripePaymentForm', () => {
  return function MockStripePaymentForm({ amount, onBack }) {
    return (
      <div data-testid="stripe-payment-form">
        <p>Payment Form - Amount: ${amount}</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  };
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <PaymentPage />
    </BrowserRouter>
  );
};

describe('PaymentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render - Step 1', () => {
    it('should render the component with header and amount selection', () => {
      renderComponent();

      expect(screen.getByText(/Support FoodFlow/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your donation helps us fight food waste and feed communities in need/i
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Select Donation Amount/i)).toBeInTheDocument();
    });

    it('should render progress steps', () => {
      renderComponent();

      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    it('should render predefined amount buttons', () => {
      renderComponent();

      expect(screen.getByText('$5')).toBeInTheDocument();
      expect(screen.getByText('$10')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should render custom amount input', () => {
      renderComponent();

      expect(screen.getByText(/Or enter custom amount:/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('should render security notice', () => {
      renderComponent();

      expect(
        screen.getByText(/Secured by Stripe - Your payment information is encrypted and secure/i)
      ).toBeInTheDocument();
    });

    it('should have continue button disabled initially', () => {
      renderComponent();

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment/i,
      });
      expect(continueBtn).toBeDisabled();
    });
  });

  describe('Amount Selection', () => {
    it('should select predefined amount when clicked', () => {
      renderComponent();

      const amountBtn = screen.getByText('$25');
      fireEvent.click(amountBtn);

      expect(amountBtn).toHaveClass('selected');
    });

    it('should enable continue button when amount is selected', () => {
      renderComponent();

      const amountBtn = screen.getByText('$10');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$10\)/i,
      });
      expect(continueBtn).not.toBeDisabled();
    });

    it('should clear custom amount when predefined amount is selected', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '75' } });

      const amountBtn = screen.getByText('$25');
      fireEvent.click(amountBtn);

      expect(customInput.value).toBe('');
    });

    it('should accept valid custom amount', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '123.45' } });

      expect(customInput.value).toBe('123.45');
    });

    it('should accept custom amount with decimal', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '99.99' } });

      expect(customInput.value).toBe('99.99');
    });

    it('should not accept invalid custom amount format', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: 'abc' } });

      expect(customInput.value).toBe('');
    });

    it('should not accept more than 2 decimal places', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '12.345' } });

      expect(customInput.value).toBe('');
    });

    it('should clear predefined selection when custom amount is entered', () => {
      renderComponent();

      const amountBtn = screen.getByText('$25');
      fireEvent.click(amountBtn);
      expect(amountBtn).toHaveClass('selected');

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '75' } });

      expect(amountBtn).not.toHaveClass('selected');
    });

    it('should enable continue button with custom amount', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '75.50' } });

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$75\.5\)/i,
      });
      expect(continueBtn).not.toBeDisabled();
    });
  });

  describe('Continue to Payment', () => {
    it('should show error when clicking continue with no amount', () => {
      renderComponent();

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment/i,
      });

      // Button should be disabled, but let's test the validation
      expect(continueBtn).toBeDisabled();
    });

    it('should create payment intent and move to step 2 on successful API call', async () => {
      api.post.mockResolvedValueOnce({
        data: { clientSecret: 'test_secret_123' },
      });

      renderComponent();

      const amountBtn = screen.getByText('$50');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$50\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/payments/create-intent', {
          amount: 50,
          currency: 'USD',
          paymentType: 'ONE_TIME',
          description: 'FoodFlow Donation',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
      });
    });

    it('should show error message when API call fails', async () => {
      api.post.mockRejectedValueOnce({
        response: { data: { message: 'Payment initialization failed' } },
      });

      renderComponent();

      const amountBtn = screen.getByText('$25');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$25\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText('Payment initialization failed')).toBeInTheDocument();
      });
    });

    it('should show generic error when API call fails without message', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '15' } });

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$15\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to initialize payment. Please try again./i)
        ).toBeInTheDocument();
      });
    });

    it('should show loading state during payment intent creation', async () => {
      api.post.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderComponent();

      const amountBtn = screen.getByText('$10');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$10\)/i,
      });
      fireEvent.click(continueBtn);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should validate minimum amount of $1', async () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '0.50' } });

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$0\.5\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid amount \(minimum \$1\)/i)
        ).toBeInTheDocument();
      });

      expect(api.post).not.toHaveBeenCalled();
    });

    it('should clear error when selecting new amount', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '0.50' } });

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$0\.5\)/i,
      });
      fireEvent.click(continueBtn);

      // Error should appear
      const errorMessage = screen.getByText(/Please enter a valid amount \(minimum \$1\)/i);
      expect(errorMessage).toBeInTheDocument();

      // Select a valid amount
      const amountBtn = screen.getByText('$10');
      fireEvent.click(amountBtn);

      // Error should be cleared
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  describe('Step 2 - Payment Form', () => {
    it('should show StripePaymentForm on step 2', async () => {
      api.post.mockResolvedValueOnce({
        data: { clientSecret: 'test_secret_456' },
      });

      renderComponent();

      const amountBtn = screen.getByText('$100');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$100\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
        expect(screen.getByText('Payment Form - Amount: $100')).toBeInTheDocument();
      });
    });

    it('should go back to step 1 when back button is clicked', async () => {
      api.post.mockResolvedValueOnce({
        data: { clientSecret: 'test_secret_789' },
      });

      renderComponent();

      const amountBtn = screen.getByText('$50');
      fireEvent.click(amountBtn);

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$50\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
      });

      const backBtn = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backBtn);

      expect(screen.getByText(/Select Donation Amount/i)).toBeInTheDocument();
    });
  });

  describe('Amount Display', () => {
    it('should display selected amount in continue button', () => {
      renderComponent();

      const amountBtn = screen.getByText('$25');
      fireEvent.click(amountBtn);

      expect(screen.getByText(/Continue to Payment \(\$25\)/i)).toBeInTheDocument();
    });

    it('should display custom amount in continue button', () => {
      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '37.50' } });

      expect(screen.getByText(/Continue to Payment \(\$37\.5\)/i)).toBeInTheDocument();
    });

    it('should handle amount with custom decimal format', async () => {
      api.post.mockResolvedValueOnce({
        data: { clientSecret: 'test_secret' },
      });

      renderComponent();

      const customInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(customInput, { target: { value: '42' } });

      const continueBtn = screen.getByRole('button', {
        name: /Continue to Payment \(\$42\)/i,
      });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/payments/create-intent', {
          amount: 42,
          currency: 'USD',
          paymentType: 'ONE_TIME',
          description: 'FoodFlow Donation',
        });
      });
    });
  });
});
