import React, { useEffect, useState } from 'react';
import PaymentMethodForm from './PaymentMethodForm';
import { paymentAPI } from '../../services/api';

function describeMethod(method) {
  if (method.paymentMethodType === 'ACH_DEBIT') {
    return `${method.bankName || 'Bank account'} ending in ${method.bankLast4 || '----'}`;
  }

  return `${method.cardBrand || 'Card'} ending in ${method.cardLast4 || '----'}`;
}

function PaymentMethodManager({ active }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadMethods = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentAPI.listMethods();
      setMethods(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to load saved payment methods.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      loadMethods();
    }
  }, [active]);

  const handleSetDefault = async methodId => {
    await paymentAPI.setDefaultMethod(methodId);
    await loadMethods();
  };

  const handleDelete = async methodId => {
    await paymentAPI.detachMethod(methodId);
    await loadMethods();
  };

  return (
    <section className="payment-tools-card">
      <div className="payment-tools-card__header">
        <div>
          <h3>Payment Method Manager</h3>
          <p>Manage saved cards and ACH payment methods.</p>
        </div>
        <button
          type="button"
          className="primary-btn payment-tools-btn"
          onClick={() => setShowForm(current => !current)}
        >
          {showForm ? 'Close' : 'Add Method'}
        </button>
      </div>

      {showForm && (
        <PaymentMethodForm
          onSaved={async () => {
            setShowForm(false);
            await loadMethods();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="payment-tools-placeholder">
          Loading saved methods...
        </div>
      ) : methods.length === 0 ? (
        <div className="payment-tools-placeholder">
          No saved payment methods yet.
        </div>
      ) : (
        <div className="payment-tools-list">
          {methods.map(method => (
            <article key={method.id} className="payment-tools-item">
              <div>
                <h4>{describeMethod(method)}</h4>
                <p>
                  {method.paymentMethodType}
                  {method.isDefault ? ' • Default method' : ''}
                </p>
              </div>
              <div className="payment-tools-actions">
                {!method.isDefault && (
                  <button
                    type="button"
                    className="secondary-btn payment-tools-btn"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-btn payment-tools-btn payment-tools-btn--danger"
                  onClick={() => handleDelete(method.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PaymentMethodManager;
