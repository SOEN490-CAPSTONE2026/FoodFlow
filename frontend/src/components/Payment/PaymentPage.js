import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import PaymentWorkspaceBar from './PaymentWorkspaceBar';
import PaymentMethodManager from './PaymentMethodManager';
import PaymentHistory from './PaymentHistory';
import PaymentInvoices from './PaymentInvoices';
import PaymentRefunds from './PaymentRefunds';
import api, { donationStatsAPI } from '../../services/api';
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
  const [platformStats, setPlatformStats] = useState(null);
  const [platformStatsLoading, setPlatformStatsLoading] = useState(true);

  // Fetch platform-wide donation stats from the backend on mount
  const fetchPlatformStats = useCallback(async () => {
    setPlatformStatsLoading(true);
    try {
      const response = await donationStatsAPI.getPlatformTotals();
      setPlatformStats(response.data);
    } catch (err) {
      console.error('Failed to load platform donation stats:', err);
      // Non-critical — the page still works with local estimates
      setPlatformStats(null);
    } finally {
      setPlatformStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformStats();
  }, [fetchPlatformStats]);

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

  const getImpactMetrics = useCallback(
    amount => {
      const safeAmount = Math.max(0, Number(amount) || 0);

      // When platform stats are available from the backend, use them to
      // derive per-dollar impact ratios so the estimates stay grounded in
      // real data.  Falls back to the original static multipliers when the
      // backend is unreachable.
      if (platformStats && Number(platformStats.totalAmountDonated) > 0) {
        const totalDonated = Number(platformStats.totalAmountDonated);
        const totalDonations = Number(platformStats.totalDonationCount) || 1;
        const totalDonors = Number(platformStats.totalDonorCount) || 1;

        // Derive per-dollar ratios from real platform data
        const mealsPerDollar = (totalDonations * 3) / totalDonated;
        const co2PerDollar = (totalDonations * 0.9) / totalDonated;
        const waterPerDollar = (totalDonations * 42) / totalDonated;
        const packsPerDollar = totalDonors / totalDonated;

        return {
          meals: Math.round(safeAmount * mealsPerDollar),
          co2Kg: (safeAmount * co2PerDollar).toFixed(1),
          waterLiters: Math.round(safeAmount * waterPerDollar),
          communityPacks: Math.max(1, Math.round(safeAmount * packsPerDollar)),
        };
      }

      // Fallback: static frontend-only estimates
      return {
        meals: Math.round(safeAmount * 3),
        co2Kg: (safeAmount * 0.9).toFixed(1),
        waterLiters: Math.round(safeAmount * 42),
        communityPacks: Math.max(1, Math.round(safeAmount / 25)),
      };
    },
    [platformStats]
  );

  const impactMetrics = getImpactMetrics(getFinalAmount());

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

                  <section
                    className="impact-metrics"
                    aria-label="Impact metrics"
                  >
                    <div className="impact-metrics__header">
                      <h3>Estimated Impact</h3>
                      <p>
                        {platformStats
                          ? 'Estimates powered by real platform donation data.'
                          : 'Live estimate based on your selected donation amount.'}
                      </p>
                    </div>
                    <div className="impact-metrics__grid">
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.meals}
                        </span>
                        <span className="impact-metric-card__label">
                          Meals supported
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.co2Kg} kg
                        </span>
                        <span className="impact-metric-card__label">
                          CO<sub>2</sub> reduced
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.waterLiters} L
                        </span>
                        <span className="impact-metric-card__label">
                          Water footprint avoided
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.communityPacks}
                        </span>
                        <span className="impact-metric-card__label">
                          Community food packs
                        </span>
                      </article>
                    </div>

                    {platformStats && !platformStatsLoading && (
                      <div
                        className="platform-stats-banner"
                        aria-label="Platform donation totals"
                      >
                        <h4>Community Impact So Far</h4>
                        <div className="platform-stats__grid">
                          <div className="platform-stat">
                            <span className="platform-stat__value">
                              $
                              {Number(
                                platformStats.totalAmountDonated
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="platform-stat__label">
                              Total donated ({platformStats.currency || 'CAD'})
                            </span>
                          </div>
                          <div className="platform-stat">
                            <span className="platform-stat__value">
                              {Number(
                                platformStats.totalDonationCount
                              ).toLocaleString()}
                            </span>
                            <span className="platform-stat__label">
                              Donations made
                            </span>
                          </div>
                          <div className="platform-stat">
                            <span className="platform-stat__value">
                              {Number(
                                platformStats.totalDonorCount
                              ).toLocaleString()}
                            </span>
                            <span className="platform-stat__label">
                              Unique donors
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

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
