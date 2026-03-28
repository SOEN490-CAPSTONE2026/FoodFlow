import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { paymentAPI } from '../../services/api';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
);

function PaymentMethodFormInner({ onSaved, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Unable to save payment method.');
        setIsSubmitting(false);
        return;
      }

      if (!setupIntent?.payment_method) {
        setError('Stripe did not return a payment method to store.');
        setIsSubmitting(false);
        return;
      }

      await paymentAPI.attachMethod({
        paymentMethodId: setupIntent.payment_method,
        setAsDefault: true,
      });

      onSaved();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to save this payment method right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="payment-tools-card" onSubmit={handleSubmit}>
      <div className="payment-tools-card__header">
        <h4>Add Payment Method</h4>
        <p>Save a card or ACH account securely with Stripe tokenization.</p>
      </div>

      <div className="payment-tools-element">
        <PaymentElement />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payment-tools-actions">
        <button
          type="button"
          className="secondary-btn payment-tools-btn"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="primary-btn payment-tools-btn"
          disabled={isSubmitting || !stripe}
        >
          {isSubmitting ? 'Saving...' : 'Save Method'}
        </button>
      </div>
    </form>
  );
}

function PaymentMethodForm({ onSaved, onCancel }) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSetupIntent = async () => {
      try {
        const response = await paymentAPI.createMethodSetupIntent();
        if (isMounted) {
          setClientSecret(response.data.clientSecret);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to prepare payment method setup.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSetupIntent();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="payment-tools-placeholder">Preparing secure setup...</div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="error-message">{error || 'Missing setup intent.'}</div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentMethodFormInner onSaved={onSaved} onCancel={onCancel} />
    </Elements>
  );
}

export default PaymentMethodForm;
