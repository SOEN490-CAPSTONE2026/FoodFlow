import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import './NewConversationModal.css';

const NewConversationModal = ({ onClose, onConversationCreated }) => {
  const { t } = useTranslation();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!recipientEmail.trim()) {
      setError(t('messaging.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/conversations', {
        recipientEmail: recipientEmail.trim(),
      });

      onConversationCreated(response.data);
    } catch (err) {
      console.error('Error starting conversation:', err);
      if (err.response?.status === 400) {
        setError(t('messaging.userNotFound'));
      } else {
        setError(t('messaging.conversationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{t('messaging.newConversationTitle')}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient-email">
              {t('messaging.recipientEmailLabel')}
            </label>
            <input
              id="recipient-email"
              type="email"
              className="form-input"
              placeholder={t('messaging.recipientEmailPlaceholder')}
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="form-hint">{t('messaging.recipientEmailHint')}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              {t('messaging.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !recipientEmail.trim()}
            >
              {loading
                ? t('messaging.starting')
                : t('messaging.startConversation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
