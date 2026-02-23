import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FoodFlowLogo from '../../assets/Logo.png';
import {
  foodTypeImages,
  getFoodTypeLabel,
} from '../../constants/foodConstants';
import './ConversationsSidebar.css';

const ConversationsSidebar = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
  showOnMobile = true,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  const getProfilePhotoUrl = photoUrl => {
    if (!photoUrl) {
      return null;
    }
    if (
      photoUrl.startsWith('http://') ||
      photoUrl.startsWith('https://') ||
      photoUrl.startsWith('data:')
    ) {
      return photoUrl;
    }
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const backendBaseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');
    if (photoUrl.startsWith('/uploads/')) {
      const filename = photoUrl.substring('/uploads/'.length);
      return `${backendBaseUrl}/api/files/uploads/${filename}`;
    }
    if (photoUrl.startsWith('/api/files/')) {
      return `${backendBaseUrl}${photoUrl}`;
    }
    return `${backendBaseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  };

  const formatTimestamp = timestamp => {
    if (!timestamp) {
      return '';
    }
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) {
      return t('messaging.justNow');
    }
    if (diffInMins < 60) {
      return t('messaging.minutesAgo', { count: diffInMins });
    }
    if (diffInHours < 24) {
      return t('messaging.hoursAgo', { count: diffInHours });
    }
    if (diffInDays < 7) {
      return t('messaging.daysAgo', { count: diffInDays });
    }
    return date.toLocaleDateString();
  };

  // Filter conversations based on selected filter
  const filteredConversations =
    filter === 'unread'
      ? conversations.filter(conv => conv.unreadCount > 0)
      : conversations;

  // Count unread conversations
  const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;

  const getDonationAvatarUrl = conversation => {
    const rawName = conversation?.otherUserName || '';
    const rawEmail = conversation?.otherUserEmail || '';
    const role = (conversation?.otherUserRole || '').toUpperCase();
    const lookup = `${rawName} ${rawEmail}`.toLowerCase();
    const isAdminSupport =
      role === 'ADMIN' ||
      lookup.includes('admin@foodflow.com') ||
      lookup === 'admin';

    if (isAdminSupport) {
      return FoodFlowLogo;
    }

    if (!conversation?.donationPhoto) {
      return null;
    }
    const categoryLabel = getFoodTypeLabel(conversation.donationPhoto);
    return foodTypeImages[categoryLabel] || foodTypeImages['Prepared Meals'];
  };

  const isAdminSupportConversation = conversation => {
    const rawName = conversation?.otherUserName || '';
    const rawEmail = conversation?.otherUserEmail || '';
    const role = (conversation?.otherUserRole || '').toUpperCase();
    const lookup = `${rawName} ${rawEmail}`.toLowerCase();

    return (
      role === 'ADMIN' ||
      lookup.includes('admin@foodflow.com') ||
      lookup === 'admin'
    );
  };

  const getOtherParticipantDisplayName = conversation => {
    const rawName = conversation?.otherUserName || '';
    const rawEmail = conversation?.otherUserEmail || '';
    const role = (conversation?.otherUserRole || '').toUpperCase();
    const lookup = `${rawName} ${rawEmail}`.toLowerCase();

    const isAdminSupport =
      role === 'ADMIN' ||
      lookup.includes('admin@foodflow.com') ||
      lookup === 'admin';

    if (isAdminSupport) {
      return t('messaging.customerSupport', 'Customer Support');
    }

    return rawName || rawEmail || t('messaging.participant', 'Participant');
  };

  return (
    <div
      className={`conversations-sidebar ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}
    >
      <div className="sidebar-header">
        <div className="header-content">
          <h2>{t('messaging.messages')}</h2>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('messaging.all')}
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          {t('messaging.unread')}
          {unreadCount > 0 && (
            <span className="filter-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>{t('messaging.noConversationsYet')}</p>
            <p className="hint">{t('messaging.clickToStart')}</p>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const displayName = getOtherParticipantDisplayName(conversation);
            const isAdminSupport = isAdminSupportConversation(conversation);

            return (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div
                  className={`conversation-avatar ${isAdminSupport ? 'admin-support' : ''}`}
                >
                  {getDonationAvatarUrl(conversation) ? (
                    <img
                      src={getDonationAvatarUrl(conversation)}
                      alt={conversation.donationTitle || displayName}
                      className={`conversation-avatar-image ${isAdminSupport ? 'admin-support' : ''}`}
                    />
                  ) : conversation.otherUserProfilePhoto ? (
                    <img
                      src={getProfilePhotoUrl(
                        conversation.otherUserProfilePhoto
                      )}
                      alt={displayName}
                      className={`conversation-avatar-image ${isAdminSupport ? 'admin-support' : ''}`}
                    />
                  ) : (
                    (displayName || '?').charAt(0).toUpperCase()
                  )}
                </div>

                <div className="conversation-info">
                  <div className="conversation-header-row">
                    <h3 className="conversation-name">
                      {conversation.donationTitle || displayName}
                    </h3>
                    <span className="conversation-time">
                      {formatTimestamp(conversation.lastMessageAt)}
                    </span>
                  </div>

                  <div className="conversation-inline-text">
                    {displayName} · {conversation.lastMessagePreview}
                  </div>

                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge-inline">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationsSidebar;
