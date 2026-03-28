import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../../services/api';

function PaymentRetryNotification({ payment, onRetried }) {
  const [retry, setRetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRetries = async () => {
      if (!payment?.id || payment.status !== 'FAILED') {
        return;
      }

      try {
        const response = await paymentAPI.getRetries(payment.id);
        if (isMounted) {
          setRetry(response.data?.[0] || null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load retry information.'
          );
        }
      }
    };

    loadRetries();

    return () => {
      isMounted = false;
    };
  }, [payment]);

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentAPI.retry(payment.id);
      onRetried(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Unable to retry payment.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!payment || payment.status !== 'FAILED') {
    return null;
  }

  return (
    <div className="payment-retry-notification">
      <div>
        <strong>Retry available</strong>
        <p>
          {retry
            ? `Attempt ${retry.attemptNumber} is ${retry.status.toLowerCase()}.`
            : 'This failed payment can be retried securely.'}
        </p>
      </div>
      <div className="payment-tools-actions">
        <button
          type="button"
          className="primary-btn payment-tools-btn"
          onClick={handleRetry}
          disabled={loading}
        >
          {loading ? 'Retrying...' : 'Retry Payment'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default PaymentRetryNotification;
