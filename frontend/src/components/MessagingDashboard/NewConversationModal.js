import React, { useState } from 'react';
import api from '../../services/api';
import './NewConversationModal.css';

const NewConversationModal = ({ onClose, onConversationCreated }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!recipientEmail.trim()) {
      setError('Please enter an email address');
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
        setError('User not found or invalid email');
      } else {
        setError('Failed to start conversation. Please try again.');
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
          <h2>Start New Conversation</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient-email">Recipient Email Address</label>
            <input
              id="recipient-email"
              type="email"
              className="form-input"
              placeholder="Enter email address"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="form-hint">
              Enter the email address of the user you want to message
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !recipientEmail.trim()}
            >
              {loading ? 'Starting...' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
