import React, { useEffect } from 'react';
import './MessageNotification.css';

const MessageNotification = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return;

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification) return null;

  // For claim notifications, use senderName as the title directly
  const isClaimNotification = 
    notification.senderName === 'New Claim' || 
    notification.senderName === 'Claim Cancelled' ||
    notification.senderName === 'Claim Confirmed' ||
    notification.senderName === 'Claim Status';
  
  const headerText = isClaimNotification 
    ? notification.senderName 
    : `New message from ${notification.senderName}`;

  return (
    <div className="message-notification">
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
      <div className="notification-header">
        <strong>{headerText}</strong>
      </div>
      <div className="notification-body">
        {notification.message}
      </div>
    </div>
  );
};

export default MessageNotification;
