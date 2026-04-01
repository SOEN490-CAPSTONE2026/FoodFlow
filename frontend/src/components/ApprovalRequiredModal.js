import React from 'react';
import { AlertTriangle, Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './ApprovalRequiredModal.css';

export default function ApprovalRequiredModal({
  isOpen,
  onClose,
  title,
  message,
}) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="approval-required-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-required-title"
      onClick={onClose}
    >
      <div
        className="approval-required-card"
        onClick={event => event.stopPropagation()}
      >
        <div className="approval-required-badge">
          <Clock3 size={16} />
          <span>{t('common.approvalRequired.badge')}</span>
        </div>

        <div className="approval-required-icon" aria-hidden="true">
          <AlertTriangle size={28} />
        </div>

        <h3 id="approval-required-title">
          {title || t('common.approvalRequired.title')}
        </h3>
        <p>{message || t('common.approvalRequired.message')}</p>

        <button
          type="button"
          className="approval-required-button"
          onClick={onClose}
        >
          {t('common.approvalRequired.action')}
        </button>
      </div>
    </div>
  );
}
