import React, { useEffect, useState } from 'react';
import { paymentAPI, refundAPI } from '../../services/api';

function PaymentRefunds({ active }) {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentAPI.getHistory({ page: 0, size: 10 });
      setPayments(response.data?.content || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load payments for refunds.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRefunds = async payment => {
    setSelectedPayment(payment);
    setRefundLoading(true);
    setError('');

    try {
      const response = await refundAPI.listForPayment(payment.id);
      setRefunds(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load refund history for this payment.'
      );
    } finally {
      setRefundLoading(false);
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
          <h3>Refunds</h3>
          <p>
            Review refund activity for your money donations. Refund requests are
            handled by FoodFlow admins.
          </p>
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
          {loading
            ? 'Loading payments...'
            : 'No payments available for refunds.'}
        </div>
      ) : (
        <div className="payment-tools-list">
          {payments.map(payment => (
            <article key={payment.id} className="payment-tools-item">
              <div>
                <h4>
                  {payment.amount} {payment.currency}
                </h4>
                <p>
                  Payment #{payment.id} • {payment.status}
                </p>
              </div>
              <div className="payment-tools-actions">
                <button
                  type="button"
                  className="secondary-btn payment-tools-btn"
                  onClick={() => loadRefunds(payment)}
                >
                  View Refunds
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedPayment && (
        <div className="payment-tools-panel">
          <div className="payment-tools-card payment-tools-card--nested">
            <div className="payment-tools-card__header">
              <div>
                <h4>Refund History</h4>
                <p>Payment #{selectedPayment.id}</p>
              </div>
            </div>

            <div className="payment-tools-placeholder">
              Refund review decisions are handled by FoodFlow admins.
            </div>

            {refundLoading ? (
              <div className="payment-tools-placeholder">
                Loading refund history...
              </div>
            ) : refunds.length === 0 ? (
              <div className="payment-tools-placeholder">
                No refund activity for this payment yet.
              </div>
            ) : (
              <div className="payment-tools-list">
                {refunds.map(refund => (
                  <article key={refund.id} className="payment-tools-item">
                    <div>
                      <h4>{refund.amount}</h4>
                      <p>
                        {refund.status} •{' '}
                        {refund.reason || 'No reason provided'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default PaymentRefunds;
