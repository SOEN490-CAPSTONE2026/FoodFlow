import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './MessageNotification.css';

const MessageNotification = ({ notification, onClose }) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!notification) {
      return;
    }

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification) {
    return null;
  }

  // For claim notifications and donation notifications, use senderName as the title directly
  const isClaimNotification =
    notification.senderName === 'New Claim' ||
    notification.senderName === 'Claim Cancelled' ||
    notification.senderName === 'Claim Confirmed' ||
    notification.senderName === 'Claim Status';

  const isDonationNotification =
    notification.senderName === '🔔 New Donation Available' ||
    notification.senderName?.includes('New Donation');

  const isAdminAlert =
    notification.type === 'ADMIN_ALERT' ||
    notification.senderName === 'Warning' ||
    notification.senderName === 'Safety Notice' ||
    notification.senderName === 'Compliance Reminder' ||
    notification.senderName === 'Admin Alert';

  const resolveAlertLanguage = () => {
    const rawLanguage = notification.preferredLanguage || i18n.language || 'en';
    const normalizedLanguage = String(rawLanguage).trim().toLowerCase();
    const baseLanguage = normalizedLanguage.includes('-')
      ? normalizedLanguage.split('-')[0]
      : normalizedLanguage;

    const supportedLanguages = ['en', 'fr', 'es', 'zh', 'ar', 'pt'];
    return supportedLanguages.includes(baseLanguage) ? baseLanguage : 'en';
  };

  const getAdminAlertHeader = () => {
    const alertT = i18n.getFixedT(resolveAlertLanguage());
    const rawType = notification.alertType || notification.senderName || '';
    const normalizedType = String(rawType).trim().toLowerCase();

    if (normalizedType === 'warning') {
      return alertT('notifications.adminAlertHeaders.warning', {
        defaultValue: 'Warning',
      });
    }

    if (normalizedType === 'safety' || normalizedType === 'safety notice') {
      return alertT('notifications.adminAlertHeaders.safetyNotice', {
        defaultValue: 'Safety Notice',
      });
    }

    if (
      normalizedType === 'compliance' ||
      normalizedType === 'compliance reminder'
    ) {
      return alertT('notifications.adminAlertHeaders.complianceReminder', {
        defaultValue: 'Compliance Reminder',
      });
    }

    return alertT('notifications.adminAlertHeaders.adminAlert', {
      defaultValue: 'Admin Alert',
    });
  };

  const headerText =
    isClaimNotification || isDonationNotification
      ? notification.senderName
      : isAdminAlert
        ? getAdminAlertHeader()
        : t('notifications.newMessageFrom', {
            senderName: notification.senderName,
          });

  return (
    <div className="message-notification">
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
      <div className="notification-header">
        <strong>{headerText}</strong>
      </div>
      <div className="notification-body">{notification.message}</div>
    </div>
  );
};

export default MessageNotification;
