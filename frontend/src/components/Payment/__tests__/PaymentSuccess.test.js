import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PaymentSuccess from '../PaymentSuccess';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = (searchParams = '') => {
  return render(
    <MemoryRouter initialEntries={[`/payment/success${searchParams}`]}>
      <PaymentSuccess />
    </MemoryRouter>
  );
};

describe('PaymentSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success State', () => {
    it('should render success message when redirect_status is succeeded', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      expect(
        screen.getByText(/Thank You for Your Donation!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your generous contribution helps us fight food waste and feed communities in need/i
        )
      ).toBeInTheDocument();
    });

    it('should display success icon', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      const successIcon = screen.getByText('✓');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon).toHaveClass('success-icon');
    });

    it('should display receipt notice', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      expect(
        screen.getByText(/A receipt has been sent to your email address/i)
      ).toBeInTheDocument();
    });

    it('should display truncated payment ID', () => {
      renderComponent(
        '?redirect_status=succeeded&payment_intent=pi_1234567890123456789012345'
      );

      expect(
        screen.getByText(/Payment ID: pi_1234567890123456.../i)
      ).toBeInTheDocument();
    });

    it('should display impact message', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      expect(screen.getByText(/Your Impact/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your donation will help redirect surplus food to those who need it most/i
        )
      ).toBeInTheDocument();
    });

    it('should have return home button', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      const returnBtn = screen.getByRole('button', { name: /Return to Home/i });
      expect(returnBtn).toBeInTheDocument();
    });

    it('should navigate to home when return button is clicked', () => {
      renderComponent('?redirect_status=succeeded&payment_intent=pi_123456789');

      const returnBtn = screen.getByRole('button', { name: /Return to Home/i });
      fireEvent.click(returnBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Failed State', () => {
    it('should render failure message when redirect_status is failed', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Unfortunately, your payment could not be processed/i)
      ).toBeInTheDocument();
    });

    it('should display failed icon', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      const failedIcon = screen.getByText('✕');
      expect(failedIcon).toBeInTheDocument();
      expect(failedIcon).toHaveClass('success-icon failed');
    });

    it('should have try again button', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
      expect(tryAgainBtn).toBeInTheDocument();
    });

    it('should have return home button on failure', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      const returnBtn = screen.getByRole('button', { name: /Return Home/i });
      expect(returnBtn).toBeInTheDocument();
    });

    it('should navigate to payment page when try again is clicked', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/payment');
    });

    it('should navigate to home when return home is clicked on failure', () => {
      renderComponent('?redirect_status=failed&payment_intent=pi_failed123');

      const returnBtn = screen.getByRole('button', { name: /Return Home/i });
      fireEvent.click(returnBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Processing State', () => {
    it('should render processing message when no redirect_status', () => {
      renderComponent('?payment_intent=pi_processing123');

      expect(
        screen.getByText(/Processing Your Payment.../i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please wait while we confirm your donation/i)
      ).toBeInTheDocument();
    });

    it('should display processing icon', () => {
      renderComponent('?payment_intent=pi_processing123');

      const processingIcon = screen.getByText('⌛');
      expect(processingIcon).toBeInTheDocument();
      expect(processingIcon).toHaveClass('success-icon processing');
    });

    it('should render processing message for unknown redirect_status', () => {
      renderComponent('?redirect_status=unknown&payment_intent=pi_123');

      expect(
        screen.getByText(/Processing Your Payment.../i)
      ).toBeInTheDocument();
    });
  });

  describe('URL Parameters', () => {
    it('should handle missing payment_intent parameter', () => {
      renderComponent('?redirect_status=succeeded');

      expect(
        screen.getByText(/Thank You for Your Donation!/i)
      ).toBeInTheDocument();
    });

    it('should handle missing all parameters', () => {
      renderComponent('');

      expect(
        screen.getByText(/Processing Your Payment.../i)
      ).toBeInTheDocument();
    });
  });
});
