import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import StripePaymentForm from '../StripePaymentForm';

const mockConfirmPayment = jest.fn();
const mockNavigate = jest.fn();
const mockUseStripe = jest.fn();
const mockUseElements = jest.fn();

jest.mock('@stripe/react-stripe-js', () => ({
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = (props = {}) => {
  const defaultProps = {
    amount: 50,
    onBack: jest.fn(),
    ...props,
  };

  return render(
    <BrowserRouter>
      <StripePaymentForm {...defaultProps} />
    </BrowserRouter>
  );
};

describe('StripePaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { origin: 'http://localhost:3000' };
    
    // Setup default mock returns
    mockUseStripe.mockReturnValue({
      confirmPayment: mockConfirmPayment,
    });
    mockUseElements.mockReturnValue({});
  });

  describe('Initial Render', () => {
    it('should render the payment form', () => {
      renderComponent();

      expect(screen.getByText(/Complete Your Donation/i)).toBeInTheDocument();
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });

    it('should display donation amount', () => {
      renderComponent({ amount: 75.5 });

      expect(screen.getByText('Donation Amount:')).toBeInTheDocument();
      expect(screen.getByText('$75.50 USD')).toBeInTheDocument();
    });

    it('should display amount with proper decimal formatting', () => {
      renderComponent({ amount: 100 });

      expect(screen.getByText('$100.00 USD')).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderComponent();

      const backBtn = screen.getByRole('button', { name: /← Back/i });
      expect(backBtn).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderComponent({ amount: 25 });

      const submitBtn = screen.getByRole('button', { name: /Donate \$25\.00/i });
      expect(submitBtn).toBeInTheDocument();
    });

    it('should display test mode notice', () => {
      renderComponent();

      expect(screen.getByText(/Test Mode:/i)).toBeInTheDocument();
      expect(screen.getByText('4242 4242 4242 4242')).toBeInTheDocument();
      expect(
        screen.getByText(/Any future date, any 3-digit CVC, any zip code/i)
      ).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', () => {
      const onBack = jest.fn();
      renderComponent({ onBack });

      const backBtn = screen.getByRole('button', { name: /← Back/i });
      fireEvent.click(backBtn);

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should disable back button while processing', async () => {
      mockConfirmPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        const backBtn = screen.getByRole('button', { name: /← Back/i });
        expect(backBtn).toBeDisabled();
      });
    });
  });

  describe('Payment Submission', () => {
    it('should not submit if stripe is not loaded', () => {
      mockUseStripe.mockReturnValueOnce(null);

      renderComponent();

      const submitBtn = screen.getByRole('button', { name: /Donate/i });
      expect(submitBtn).toBeDisabled();
    });

    it('should submit payment when form is submitted', async () => {
      mockConfirmPayment.mockResolvedValueOnce({});

      renderComponent({ amount: 30 });

      const form = screen.getByRole('button', { name: /Donate \$30\.00/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockConfirmPayment).toHaveBeenCalledWith({
          elements: {},
          confirmParams: {
            return_url: 'http://localhost:3000/payment/success',
          },
        });
      });
    });

    it('should show processing state during payment', async () => {
      mockConfirmPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should disable submit button while processing', async () => {
      mockConfirmPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      renderComponent();

      const submitBtn = screen.getByRole('button', { name: /Donate/i });
      const form = submitBtn.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
      });
    });

    it('should display error message when payment fails', async () => {
      mockConfirmPayment.mockResolvedValueOnce({
        error: { message: 'Your card was declined' },
      });

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Your card was declined')).toBeInTheDocument();
      });
    });

    it('should display generic error when error has no message', async () => {
      mockConfirmPayment.mockResolvedValueOnce({
        error: {},
      });

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText('An error occurred during payment')
        ).toBeInTheDocument();
      });
    });

    it('should handle exception during payment', async () => {
      mockConfirmPayment.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should reset processing state after error', async () => {
      mockConfirmPayment.mockResolvedValueOnce({
        error: { message: 'Payment failed' },
      });

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: /Donate/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it('should clear error message when submitting again', async () => {
      mockConfirmPayment
        .mockResolvedValueOnce({
          error: { message: 'First error' },
        })
        .mockResolvedValueOnce({});

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      
      // First submission with error
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission should clear error
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Amount Display', () => {
    it('should display different amounts correctly', () => {
      const { rerender } = renderComponent({ amount: 15 });
      expect(screen.getByText('$15.00 USD')).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <StripePaymentForm amount={99.99} onBack={jest.fn()} />
        </BrowserRouter>
      );
      expect(screen.getByText('$99.99 USD')).toBeInTheDocument();
    });

    it('should format amount in submit button', () => {
      renderComponent({ amount: 123.45 });

      expect(screen.getByRole('button', { name: /Donate \$123\.45/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should show error with alert role', async () => {
      mockConfirmPayment.mockResolvedValueOnce({
        error: { message: 'Insufficient funds' },
      });

      renderComponent();

      const form = screen.getByRole('button', { name: /Donate/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        const errorMsg = screen.getByRole('alert');
        expect(errorMsg).toBeInTheDocument();
        expect(errorMsg).toHaveTextContent('Insufficient funds');
      });
    });
  });
});
