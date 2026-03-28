import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import './Donor_Styles/DonateNowModal.css';

export default function DonateNowModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = event => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="donation-support-modal-overlay" onClick={onClose}>
      <div
        className="donation-support-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('donation.modalAriaLabel')}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="donation-support-modal-close"
          aria-label={t('donation.closeAriaLabel')}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="donation-support-modal-body" />
      </div>
    </div>
  );
}
