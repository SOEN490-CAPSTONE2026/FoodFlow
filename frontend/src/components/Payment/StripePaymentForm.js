import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

function StripePaymentForm({ amount, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="stripe-payment-form">
      <div className="payment-summary">
        <h2>Complete Your Donation</h2>
        <div className="donation-amount">
          <span>Donation Amount:</span>
          <strong>${amount.toFixed(2)} USD</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <PaymentElement />

        {errorMessage && (
          <div className="error-message" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            disabled={isProcessing}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Donate $${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      <div className="test-mode-notice">
        <p>
          <strong>Test Mode:</strong> Use card number{' '}
          <code>4242 4242 4242 4242</code>
        </p>
        <p>Any future date, any 3-digit CVC, any zip code</p>
      </div>
    </div>
  );
}

export default StripePaymentForm;
