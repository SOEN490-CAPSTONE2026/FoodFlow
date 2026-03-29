import React from 'react';

function PaymentWorkspaceBar({ views, activeView, onChange }) {
  const sectionDescriptions = {
    donate:
      'Help us fight food waste and support communities with a secure donation.',
    methods:
      'Manage your saved cards and bank accounts for faster future payments.',
    history:
      'Review your recent transactions and track payment activity in one place.',
    invoices:
      'View and download invoices for your completed FoodFlow payments.',
    refunds: 'Check refund activity and submit refund requests when needed.',
  };

  return (
    <div className="payment-workspace-shell">
      <div className="payment-topnav__intro">
        <h2>Payment Workspace</h2>
        <p>
          {sectionDescriptions[activeView] ||
            'Move through billing sections like separate pages in one flow.'}
        </p>
      </div>

      <div className="payment-topnav__filters">
        <div
          className="payment-topnav__tabs payment-topnav__tabs--claims"
          role="tablist"
          aria-label="Payment sections"
        >
          {views.map(view => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              className={`payment-topnav__tab payment-topnav__filter-btn ${activeView === view.id ? 'payment-topnav__filter-btn--active' : ''}`}
              onClick={() => onChange(view.id)}
            >
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaymentWorkspaceBar;
