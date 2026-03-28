import React, { useEffect, useState } from 'react';
import { invoiceAPI, paymentAPI } from '../../services/api';
import InvoiceViewer from './InvoiceViewer';

function PaymentInvoices({ active }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentAPI.getHistory({ page: 0, size: 10 });
      setPayments(response.data?.content || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load payments for invoice viewing.'
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

  const handleOpenInvoice = async paymentId => {
    try {
      await invoiceAPI.generateForPayment(paymentId);
      setSelectedPaymentId(paymentId);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to prepare the invoice for this payment.'
      );
    }
  };

  return (
    <section className="payment-tools-card">
      <div className="payment-tools-card__header">
        <div>
          <h3>Invoices</h3>
          <p>Generate and download invoices for recent payments.</p>
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
            : 'No payments available for invoices.'}
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
                  onClick={() => handleOpenInvoice(payment.id)}
                >
                  View Invoice
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedPaymentId && (
        <div className="payment-tools-panel">
          <InvoiceViewer paymentId={selectedPaymentId} />
        </div>
      )}
    </section>
  );
}

export default PaymentInvoices;
