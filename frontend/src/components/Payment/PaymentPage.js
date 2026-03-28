import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import PaymentWorkspaceBar from './PaymentWorkspaceBar';
import PaymentMethodManager from './PaymentMethodManager';
import PaymentHistory from './PaymentHistory';
import PaymentInvoices from './PaymentInvoices';
import PaymentRefunds from './PaymentRefunds';
import api from '../../services/api';
import './PaymentPage.css';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
);

function PaymentPage() {
  const [activeView, setActiveView] = useState('donate');
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const predefinedAmounts = [5, 10, 25, 50, 100];
  const supportedCurrencies = ['USD', 'CAD', 'EUR', 'GBP'];
  const paymentViews = [
    { id: 'donate', label: 'Donate' },
    { id: 'methods', label: 'Methods' },
    { id: 'history', label: 'History' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'refunds', label: 'Refunds' },
  ];

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
      const response = await api.post('/payments/create-intent', {
        amount,
        currency: selectedCurrency,
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
      <PaymentWorkspaceBar
        views={paymentViews}
        activeView={activeView}
        onChange={setActiveView}
      />

      <div className="payment-container">
        <div className="payment-view-shell">
          {activeView === 'donate' && (
            <div className="payment-donate-panel">
              <div className="payment-highlights" aria-label="Donation impact">
                <div className="payment-highlight">
                  <span className="payment-highlight__icon" aria-hidden="true">
                    +
                  </span>
                  <span>Support local food recovery</span>
                </div>
                <div className="payment-highlight">
                  <span className="payment-highlight__icon" aria-hidden="true">
                    +
                  </span>
                  <span>Fund community hunger relief</span>
                </div>
                <div className="payment-highlight">
                  <span className="payment-highlight__icon" aria-hidden="true">
                    +
                  </span>
                  <span>Secure checkout with Stripe</span>
                </div>
              </div>

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

              {step === 1 && (
                <div className="amount-selection">
                  <div className="payment-section-heading">
                    <h2>Select Donation Amount</h2>
                    <p>
                      Choose a quick amount, currency, or enter a custom gift.
                    </p>
                  </div>

                  <div className="payment-currency-picker">
                    <label htmlFor="payment-currency">Currency</label>
                    <select
                      id="payment-currency"
                      value={selectedCurrency}
                      onChange={event =>
                        setSelectedCurrency(event.target.value)
                      }
                    >
                      {supportedCurrencies.map(currency => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

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
                    <label htmlFor="payment-custom-amount">
                      Or enter custom amount:
                    </label>
                    <div className="custom-amount-input">
                      <span className="currency-symbol">$</span>
                      <input
                        id="payment-custom-amount"
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
                    <span aria-hidden="true">Lock</span>
                    <span>
                      Secured by Stripe - Your payment information is encrypted
                      and secure
                    </span>
                  </div>
                </div>
              )}

              {step === 2 && clientSecret && (
                <div className="payment-form-section">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      amount={getFinalAmount()}
                      currency={selectedCurrency}
                      onBack={() => setStep(1)}
                    />
                  </Elements>
                </div>
              )}
            </div>
          )}

          {activeView === 'methods' && <PaymentMethodManager active />}
          {activeView === 'history' && <PaymentHistory active />}
          {activeView === 'invoices' && <PaymentInvoices active />}
          {activeView === 'refunds' && <PaymentRefunds active />}
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
