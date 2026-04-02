import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

function StripePaymentForm({
  amount,
  currency = 'USD',
  onBack,
  clientSecret = '',
  savedMethodLabel = '',
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const usingSavedMethod = Boolean(savedMethodLabel);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!stripe || (!usingSavedMethod && !elements)) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const confirmationPayload = {
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      };
      if (usingSavedMethod) {
        confirmationPayload.clientSecret = clientSecret;
      } else {
        confirmationPayload.elements = elements;
      }

      const { error } = await stripe.confirmPayment(confirmationPayload);

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
        <div className="payment-summary__meta">Step 2 of 2</div>
        <h2>Complete Your Donation</h2>
        <p>
          Review your amount and enter your payment details to complete your
          FoodFlow donation.
        </p>
        <div className="donation-amount">
          <span>Donation Amount:</span>
          <strong>
            {currency} {amount.toFixed(2)}
          </strong>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {usingSavedMethod ? (
          <div className="payment-tools-placeholder">
            Confirm your donation with the saved default method:{' '}
            <strong>{savedMethodLabel}</strong>
          </div>
        ) : (
          <PaymentElement />
        )}

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
            {isProcessing
              ? 'Processing...'
              : usingSavedMethod
                ? `Confirm ${currency} ${amount.toFixed(2)}`
                : `Donate ${currency} ${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      {!usingSavedMethod && (
        <div className="test-mode-notice">
          <p>
            <strong>Test Mode:</strong> Use card number{' '}
            <code>4242 4242 4242 4242</code>
          </p>
          <p>Any future date, any 3-digit CVC, any zip code</p>
        </div>
      )}
    </div>
  );
}

export default StripePaymentForm;
