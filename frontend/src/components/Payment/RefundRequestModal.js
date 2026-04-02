import React, { useState } from 'react';
import { refundAPI } from '../../services/api';

function RefundRequestModal({ payment, onClose, onSubmitted }) {
  const [amount, setAmount] = useState(payment?.amount || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await refundAPI.create({
        paymentId: payment.id,
        amount: Number(amount),
        reason,
      });
      setSuccessMessage(
        'Refund request submitted. A FoodFlow admin must approve it before any money is returned and the invoice is updated.'
      );
      await onSubmitted();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to submit this refund request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!payment) {
    return null;
  }

  return (
    <div className="payment-modal-backdrop" role="presentation">
      <div className="payment-modal">
        <div className="payment-tools-card__header">
          <div>
            <h3>Refund Request</h3>
            <p>
              Submit a refund request for payment #{payment.id}. An admin must
              review it before it is processed.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn payment-tools-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-tools-form">
          <label className="payment-tools-field">
            <span>Refund amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={event => setAmount(event.target.value)}
            />
          </label>

          <label className="payment-tools-field">
            <span>Reason</span>
            <textarea
              rows="4"
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </label>

          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="payment-tools-placeholder">{successMessage}</div>
          )}

          <div className="payment-tools-actions">
            <button
              type="button"
              className="secondary-btn payment-tools-btn"
              onClick={onClose}
            >
              {successMessage ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="primary-btn payment-tools-btn"
              disabled={submitting || Boolean(successMessage)}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RefundRequestModal;
