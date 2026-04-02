import React from 'react';
import { useTranslation } from 'react-i18next';

function PaymentWorkspaceBar({ views, activeView, onChange }) {
  const { t } = useTranslation();
  const sectionDescriptions = {
    donate: t('paymentPage.workspace.descriptions.donate'),
    methods: t('paymentPage.workspace.descriptions.methods'),
    history: t('paymentPage.workspace.descriptions.history'),
    invoices: t('paymentPage.workspace.descriptions.invoices'),
    refunds: t('paymentPage.workspace.descriptions.refunds'),
  };

  return (
    <div className="payment-workspace-shell">
      <div className="payment-topnav__intro">
        <h2>{t('paymentPage.workspace.title')}</h2>
        <p>
          {sectionDescriptions[activeView] ||
            t('paymentPage.workspace.descriptions.fallback')}
        </p>
      </div>

      <div className="payment-topnav__filters">
        <div
          className="payment-topnav__tabs payment-topnav__tabs--claims"
          role="tablist"
          aria-label={t('paymentPage.workspace.ariaLabel')}
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
