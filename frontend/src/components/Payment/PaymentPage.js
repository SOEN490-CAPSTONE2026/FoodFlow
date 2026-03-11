import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import StripePaymentForm from './StripePaymentForm';
import api from '../../services/api';
import './PaymentPage.css';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
);

function PaymentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleAmountSelect = amount => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = e => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
      setError('');
    }
  };

  const handleContinueToPayment = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < 1) {
      setError('Please enter a valid amount (minimum $1)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/payments/create-intent', {
        amount: amount,
        currency: 'USD',
        paymentType: 'ONE_TIME',
        description: 'FoodFlow Donation',
      });

      setClientSecret(response.data.clientSecret);
      setStep(2);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(
        err.response?.data?.message ||
          'Failed to initialize payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getFinalAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <h1>💝 Support FoodFlow</h1>
          <p>
            Your donation helps us fight food waste and feed communities in need
          </p>
        </div>

        {/* Progress Steps */}
        <div className="payment-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Amount</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Payment</span>
          </div>
        </div>

        {/* Step 1: Amount Selection */}
        {step === 1 && (
          <div className="amount-selection">
            <h2>Select Donation Amount</h2>

            <div className="amount-buttons">
              {predefinedAmounts.map(amount => (
                <button
                  key={amount}
                  className={`amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                  onClick={() => handleAmountSelect(amount)}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="custom-amount">
              <label>Or enter custom amount:</label>
              <div className="custom-amount-input">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="continue-btn"
              onClick={handleContinueToPayment}
              disabled={loading || (!selectedAmount && !customAmount)}
            >
              {loading
                ? 'Processing...'
                : `Continue to Payment ${getFinalAmount() ? `($${getFinalAmount()})` : ''}`}
            </button>

            <div className="security-notice">
              🔒 Secured by Stripe - Your payment information is encrypted and
              secure
            </div>
          </div>
        )}

        {/* Step 2: Payment Form */}
        {step === 2 && clientSecret && (
          <div className="payment-form-section">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                amount={getFinalAmount()}
                onBack={() => setStep(1)}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentPage;
