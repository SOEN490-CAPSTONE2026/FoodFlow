import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../../services/api';
import PaymentRetryNotification from './PaymentRetryNotification';

function PaymentHistory({ active }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentAPI.getHistory({ page: 0, size: 10 });
      setPayments(response.data?.content || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load payment history.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      loadPayments();
    }
  }, [active]);

  return (
    <section className="payment-tools-card">
      <div className="payment-tools-card__header">
        <div>
          <h3>Payment History</h3>
          <p>Review transactions and retry failed payments.</p>
        </div>
        <button
          type="button"
          className="secondary-btn payment-tools-btn"
          onClick={loadPayments}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {payments.length === 0 ? (
        <div className="payment-tools-placeholder">
          {loading ? 'Loading payments...' : 'No payment history yet.'}
        </div>
      ) : (
        <div className="payment-tools-list">
          {payments.map(payment => (
            <article
              key={payment.id}
              className="payment-tools-item payment-tools-item--stacked"
            >
              <div className="payment-tools-item__summary">
                <div>
                  <h4>
                    {payment.amount} {payment.currency}
                  </h4>
                  <p>
                    {payment.paymentType} • {payment.status} •{' '}
                    {payment.description || 'FoodFlow payment'}
                  </p>
                </div>
              </div>

              <PaymentRetryNotification
                payment={payment}
                onRetried={() => loadPayments()}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PaymentHistory;
