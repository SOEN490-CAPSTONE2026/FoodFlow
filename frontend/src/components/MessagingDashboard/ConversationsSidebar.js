import React, { useState } from 'react';
import './ConversationsSidebar.css';

const ConversationsSidebar = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
  showOnMobile = true,
}) => {
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
      return 'Just now';
    }
    if (diffInMins < 60) {
      return `${diffInMins}m ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
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

  return (
    <div
      className={`conversations-sidebar ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}
    >
      <div className="sidebar-header">
        <div className="header-content">
          <h2>Messages</h2>
          <p className="sidebar-subtitle">Connect and coordinate here!</p>
        </div>
        <button
          className="new-conversation-btn"
          onClick={onNewConversation}
          title="Start new conversation"
        >
          +
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
          {unreadCount > 0 && (
            <span className="filter-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <p className="hint">Click + to start a new conversation</p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                selectedConversation?.id === conversation.id ? 'active' : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="conversation-avatar">
                {conversation.otherUserProfilePhoto ? (
                  <img
                    src={getProfilePhotoUrl(conversation.otherUserProfilePhoto)}
                    alt={conversation.otherUserName}
                    className="conversation-avatar-image"
                  />
                ) : (
                  conversation.otherUserName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="conversation-info">
                <div className="conversation-header-row">
                  <h3 className="conversation-name">
                    {conversation.otherUserName}
                  </h3>
                  <span className="conversation-time">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>

                <div className="conversation-preview-row">
                  <p className="conversation-preview">
                    {conversation.lastMessagePreview}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationsSidebar;
