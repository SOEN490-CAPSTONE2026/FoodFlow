import React from 'react';
import './ConversationsSidebar.css';

const ConversationsSidebar = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  onNewConversation,
  loading 
}) => {
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="conversations-sidebar">
      <div className="sidebar-header">
        <h2>Messages</h2>
        <button 
          className="new-conversation-btn"
          onClick={onNewConversation}
          title="Start new conversation"
        >
          +
        </button>
      </div>

      <div className="conversations-list">
        {loading ? (
          <div className="loading-conversations">
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <p className="hint">Click + to start a new conversation</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                selectedConversation?.id === conversation.id ? 'active' : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="conversation-avatar">
                {conversation.otherUserName.charAt(0).toUpperCase()}
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
