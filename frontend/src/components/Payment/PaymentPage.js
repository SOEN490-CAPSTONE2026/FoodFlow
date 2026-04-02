import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StripePaymentForm from './StripePaymentForm';
import PaymentWorkspaceBar from './PaymentWorkspaceBar';
import PaymentMethodManager from './PaymentMethodManager';
import PaymentHistory from './PaymentHistory';
import PaymentInvoices from './PaymentInvoices';
import PaymentRefunds from './PaymentRefunds';
import { donationStatsAPI, paymentAPI } from '../../services/api';
import './PaymentPage.css';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
);

function PaymentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState('donate');
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [platformStats, setPlatformStats] = useState(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState('new');
  const [savedMethodRequiresAction, setSavedMethodRequiresAction] =
    useState(false);

  const formatSavedMethodLabel = method => {
    if (!method) {
      return '';
    }

    if (method.paymentMethodType === 'ACH_DEBIT') {
      return t('paymentPage.savedMethod.bankEnding', {
        bankName: method.bankName || t('paymentPage.savedMethod.bankAccount'),
        last4: method.bankLast4 || '----',
      });
    }

    const brand = method.cardBrand
      ? method.cardBrand.charAt(0).toUpperCase() + method.cardBrand.slice(1)
      : t('paymentPage.savedMethod.card');
    return t('paymentPage.savedMethod.cardEnding', {
      brand,
      last4: method.cardLast4 || '----',
    });
  };

  // Fetch platform-wide donation stats from the backend on mount
  const fetchPlatformStats = useCallback(async () => {
    try {
      const response = await donationStatsAPI.getPlatformTotals();
      setPlatformStats(response.data);
    } catch (err) {
      console.error('Failed to load platform donation stats:', err);
      // Non-critical — the page still works with local estimates
      setPlatformStats(null);
    }
  }, []);

  useEffect(() => {
    fetchPlatformStats();
  }, [fetchPlatformStats]);

  const loadDefaultPaymentMethod = useCallback(async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await paymentAPI.listMethods();
      const methods = Array.isArray(response.data) ? response.data : [];
      const defaultMethod =
        methods.find(method => method.isDefault) || methods[0] || null;
      setDefaultPaymentMethod(defaultMethod);
      setPaymentMethodChoice(defaultMethod ? 'saved' : 'new');
    } catch (requestError) {
      setDefaultPaymentMethod(null);
      setPaymentMethodChoice('new');
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'donate') {
      loadDefaultPaymentMethod();
    }
  }, [activeView, loadDefaultPaymentMethod]);

  const predefinedAmounts = [5, 10, 25, 50, 100];
  const supportedCurrencies = ['USD', 'CAD', 'EUR', 'GBP'];
  const paymentViews = [
    { id: 'donate', label: t('paymentPage.tabs.donate') },
    { id: 'methods', label: t('paymentPage.tabs.methods') },
    { id: 'history', label: t('paymentPage.tabs.history') },
    { id: 'invoices', label: t('paymentPage.tabs.invoices') },
    { id: 'refunds', label: t('paymentPage.tabs.refunds') },
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
      setError(t('paymentPage.errors.minimumAmount'));
      return;
    }

    setLoading(true);
    setError('');
    setSavedMethodRequiresAction(false);

    try {
      const response = await paymentAPI.createIntent({
        amount,
        currency: selectedCurrency,
        paymentType: 'ONE_TIME',
        description: t('paymentPage.donationDescription'),
        paymentMethodId:
          paymentMethodChoice === 'saved'
            ? defaultPaymentMethod?.stripePaymentMethodId
            : undefined,
      });

      const intent = response.data || {};
      if (
        paymentMethodChoice === 'saved' &&
        (intent.status === 'succeeded' || intent.status === 'processing')
      ) {
        const query = new URLSearchParams();
        if (intent.status === 'succeeded') {
          query.set('redirect_status', 'succeeded');
        }
        if (intent.paymentIntentId) {
          query.set('payment_intent', intent.paymentIntentId);
        }
        navigate(
          `/payment/success${query.toString() ? `?${query.toString()}` : ''}`
        );
        return;
      }

      if (!intent.clientSecret) {
        setError(t('paymentPage.errors.unableToContinue'));
        return;
      }

      setClientSecret(intent.clientSecret || '');
      setSavedMethodRequiresAction(paymentMethodChoice === 'saved');
      setStep(2);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(
        err.response?.data?.message ||
          t('paymentPage.errors.initializationFailed')
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
  const savedMethodLabel = formatSavedMethodLabel(defaultPaymentMethod);

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
              <div className="payment-steps">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">
                    {t('paymentPage.steps.amount')}
                  </span>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">
                    {t('paymentPage.steps.payment')}
                  </span>
                </div>
              </div>

              {step === 1 && (
                <div className="amount-selection">
                  <div className="payment-section-heading">
                    <h2>{t('paymentPage.amount.title')}</h2>
                  </div>

                  <div className="payment-currency-picker">
                    <label htmlFor="payment-currency">
                      {t('paymentPage.amount.currency')}
                    </label>
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
                      {t('paymentPage.amount.customLabel')}
                    </label>
                    <div className="custom-amount-input">
                      <span className="currency-symbol">$</span>
                      <input
                        id="payment-custom-amount"
                        type="text"
                        placeholder={t('paymentPage.amount.customPlaceholder')}
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                      />
                    </div>
                  </div>

                  <div className="payment-method-choice">
                    <div className="payment-section-heading">
                      <h3>{t('paymentPage.paymentMethod.title')}</h3>
                      <p>
                        {defaultPaymentMethod
                          ? t('paymentPage.paymentMethod.savedOrNew')
                          : t('paymentPage.paymentMethod.noSavedDefault')}
                      </p>
                    </div>

                    {loadingPaymentMethods ? (
                      <div className="payment-tools-placeholder">
                        {t('paymentPage.paymentMethod.loading')}
                      </div>
                    ) : defaultPaymentMethod ? (
                      <div className="payment-method-choice__options">
                        <label
                          className={`payment-method-choice__option-card ${
                            paymentMethodChoice === 'saved'
                              ? 'payment-method-choice__option-card--selected'
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-method-choice"
                            checked={paymentMethodChoice === 'saved'}
                            onChange={() => setPaymentMethodChoice('saved')}
                          />
                          <span className="payment-method-choice__option-copy">
                            <span className="payment-method-choice__option-title">
                              {t('paymentPage.paymentMethod.useSaved')}
                            </span>
                            <span className="payment-method-choice__option-subtitle">
                              {savedMethodLabel}
                            </span>
                            <span className="payment-method-choice__option-badge">
                              {t('paymentPage.paymentMethod.defaultBadge')}
                            </span>
                          </span>
                        </label>
                        <label
                          className={`payment-method-choice__option-card ${
                            paymentMethodChoice === 'new'
                              ? 'payment-method-choice__option-card--selected'
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-method-choice"
                            checked={paymentMethodChoice === 'new'}
                            onChange={() => setPaymentMethodChoice('new')}
                          />
                          <span className="payment-method-choice__option-copy">
                            <span className="payment-method-choice__option-title">
                              {t('paymentPage.paymentMethod.useNew')}
                            </span>
                            <span className="payment-method-choice__option-subtitle">
                              {t('paymentPage.paymentMethod.newCardHint')}
                            </span>
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="payment-tools-placeholder">
                        {t('paymentPage.paymentMethod.addSavedHint')}
                      </div>
                    )}
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <section
                    className="impact-metrics"
                    aria-label={t('paymentPage.impact.ariaLabel')}
                  >
                    <div className="impact-metrics__header">
                      <h3>{t('paymentPage.impact.title')}</h3>
                      <p>
                        {platformStats
                          ? t('paymentPage.impact.poweredByData')
                          : t('paymentPage.impact.liveEstimate')}
                      </p>
                    </div>
                    <div className="impact-metrics__grid">
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.meals}
                        </span>
                        <span className="impact-metric-card__label">
                          {t('paymentPage.impact.meals')}
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.co2Kg} kg
                        </span>
                        <span className="impact-metric-card__label">
                          {t('paymentPage.impact.co2')}
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.waterLiters} L
                        </span>
                        <span className="impact-metric-card__label">
                          {t('paymentPage.impact.water')}
                        </span>
                      </article>
                      <article className="impact-metric-card">
                        <span className="impact-metric-card__value">
                          {impactMetrics.communityPacks}
                        </span>
                        <span className="impact-metric-card__label">
                          {t('paymentPage.impact.communityPacks')}
                        </span>
                      </article>
                    </div>
                  </section>

                  <button
                    className="continue-btn"
                    onClick={handleContinueToPayment}
                    disabled={loading || (!selectedAmount && !customAmount)}
                  >
                    {loading
                      ? t('paymentPage.actions.processing')
                      : t('paymentPage.actions.continueToPayment', {
                          amount: getFinalAmount()
                            ? `($${getFinalAmount()})`
                            : '',
                        })}
                  </button>

                  <div className="security-notice">
                    <span aria-hidden="true">
                      {t('paymentPage.security.lock')}
                    </span>
                    <span>{t('paymentPage.security.notice')}</span>
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
                      clientSecret={clientSecret}
                      savedMethodLabel={
                        savedMethodRequiresAction ? savedMethodLabel : ''
                      }
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
