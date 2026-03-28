import React, { useState } from 'react';
import PaymentMethodManager from './PaymentMethodManager';
import PaymentHistory from './PaymentHistory';
import PaymentInvoices from './PaymentInvoices';
import PaymentRefunds from './PaymentRefunds';

const tabs = [
  { id: 'methods', label: 'Methods' },
  { id: 'history', label: 'History' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'refunds', label: 'Refunds' },
];

function PaymentManagementPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('methods');

  return (
    <section className="payment-management">
      <div className="payment-tools-card payment-tools-card--hero">
        <div className="payment-tools-card__header">
          <div>
            <h3>Billing Tools</h3>
            <p>
              Manage saved payment methods, payment history, invoices, and
              refunds without changing the existing checkout flow.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn payment-tools-btn"
            onClick={() => setOpen(current => !current)}
          >
            {open ? 'Hide Tools' : 'Open Tools'}
          </button>
        </div>

        {open && (
          <div
            className="payment-tools-tabs"
            role="tablist"
            aria-label="Billing tools"
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`payment-tools-tab ${activeTab === tab.id ? 'payment-tools-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="payment-management__content">
          {activeTab === 'methods' && <PaymentMethodManager active={open} />}
          {activeTab === 'history' && <PaymentHistory active={open} />}
          {activeTab === 'invoices' && <PaymentInvoices active={open} />}
          {activeTab === 'refunds' && <PaymentRefunds active={open} />}
        </div>
      )}
    </section>
  );
}

export default PaymentManagementPanel;
