import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTimezone } from '../../contexts/TimezoneContext';
import {
  foodTypeImages,
  getFoodTypeLabel,
} from '../../constants/foodConstants';
import {
  formatTimeInTimezone,
  getDateSeparatorInTimezone,
  areDifferentDaysInTimezone,
} from '../../utils/timezoneUtils';
import './ChatPanel.css';

const ChatPanel = ({
  conversation,
  onMessageSent,
  onConversationRead,
  onBack,
  showOnMobile = true,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const currentUserRole = (
    localStorage.getItem('userRole') || ''
  ).toUpperCase();
  const { userTimezone } = useTimezone();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      loadMessages();
      markAsRead();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(
        `/conversations/${conversation.id}/messages`
      );
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation) {
      return;
    }

    try {
      await api.put(`/conversations/${conversation.id}/read`);
      // Notify parent to refresh conversations list
      if (onConversationRead) {
        onConversationRead();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) {
      return;
    }

    try {
      setSending(true);
      const response = await api.post('/messages', {
        conversationId: conversation.id,
        messageBody: newMessage.trim(),
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
      onMessageSent();
    } catch (err) {
      console.error('Error sending message:', err);
      alert(t('chat.failedToSend'));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDateSeparator = timestamp => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    messageDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return t('chat.today');
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return t('chat.yesterday');
    } else {
      return messageDate.toLocaleDateString(i18n.language, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) {
      return true;
    }

    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);

    currentDate.setHours(0, 0, 0, 0);
    previousDate.setHours(0, 0, 0, 0);

    return currentDate.getTime() !== previousDate.getTime();
  };

  const getStatusInfo = () => {
    const rawStatus = (conversation?.status || 'ACTIVE')
      .toString()
      .toUpperCase();
    const normalized = rawStatus.replace(/\s+/g, '_');

    const classByStatus = {
      ACTIVE: 'active',
      AVAILABLE: 'available',
      CLAIMED: 'claimed',
      READY_FOR_PICKUP: 'ready-for-pickup',
      COMPLETED: 'completed',
      NOT_COMPLETED: 'not-completed',
      EXPIRED: 'expired',
    };

    return {
      label: normalized.replace(/_/g, ' '),
      className: classByStatus[normalized] || 'active',
    };
  };

  const getOtherParticipantRoleLabel = () => {
    if (!conversation?.donationId) {
      return 'participant';
    }

    if (
      conversation.donorId &&
      currentUserId &&
      conversation.donorId.toString() === currentUserId.toString()
    ) {
      return 'receiver';
    }

    return 'donor';
  };

  const handleViewDonation = () => {
    if (!conversation?.donationId) {
      return;
    }

    if (currentUserRole === 'DONOR') {
      navigate('/donor/list', {
        state: { focusDonationId: conversation.donationId },
      });
      return;
    }

    if (currentUserRole === 'RECEIVER') {
      navigate('/receiver/my-claims', {
        state: { focusDonationId: conversation.donationId },
      });
      return;
    }

    navigate('/receiver/browse', {
      state: { focusDonationId: conversation.donationId },
    });
  };

  const getConversationAvatarUrl = () => {
    if (conversation?.donationPhoto) {
      const categoryLabel = getFoodTypeLabel(conversation.donationPhoto);
      return foodTypeImages[categoryLabel] || foodTypeImages['Prepared Meals'];
    }
    if (conversation?.otherUserProfilePhoto) {
      return getProfilePhotoUrl(conversation.otherUserProfilePhoto);
    }
    return null;
  };

  if (!conversation) {
    return (
      <div
        className={`chat-panel empty ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}
      >
        <div className="empty-state">
          <h3>{t('chat.noConversationSelected')}</h3>
          <p>{t('chat.selectConversation')}</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const conversationAvatarUrl = getConversationAvatarUrl();

  return (
    <div
      className={`chat-panel ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}
    >
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="chat-header-left">
          <div className="chat-header-info">
            <h3>{conversation.donationTitle || conversation.otherUserName}</h3>
            <p className="chat-header-subtitle">
              {t('chat.with')} {getOtherParticipantRoleLabel()}:{' '}
              {conversation.otherUserName}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          {conversation.donationId && (
            <button className="view-post-btn" onClick={handleViewDonation}>
              View donation
            </button>
          )}
          {conversation.donationId && (
            <span className={`status-badge ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}
          <button className="menu-btn">&#8942;</button>
        </div>
      </div>

      {conversation.donationTitle && (
        <div className="donation-banner">
          <div className="donation-banner-info">
            <span className="donation-banner-label">
              {t('chat.donationContext', 'Donation')}
            </span>
            <span className="donation-banner-title">
              {conversation.donationTitle}
            </span>
          </div>
          {conversation.donationDescription && (
            <p className="donation-banner-description">
              {conversation.donationDescription}
            </p>
          )}
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0
          ? !loading && (
              <div className="no-messages">
                <p>{t('chat.noMessagesYet')}</p>
              </div>
            )
          : messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {areDifferentDaysInTimezone(
                  message.createdAt,
                  messages[index - 1]?.createdAt,
                  userTimezone
                ) && (
                  <div className="date-separator">
                    <span>
                      {getDateSeparatorInTimezone(
                        message.createdAt,
                        userTimezone
                      )}
                    </span>
                  </div>
                )}
                {message.messageType === 'SYSTEM' ? (
                  <div className="system-message">
                    <span className="system-message-text">
                      {message.messageBody}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`message ${
                      message.senderId.toString() === currentUserId
                        ? 'sent'
                        : 'received'
                    }`}
                  >
                    {message.senderId.toString() !== currentUserId && (
                      <div className="message-avatar">
                        {conversationAvatarUrl ? (
                          <img
                            src={conversationAvatarUrl}
                            alt={
                              conversation.donationTitle ||
                              conversation.otherUserName
                            }
                            className="message-avatar-image"
                          />
                        ) : (
                          conversation.otherUserName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      <p className="message-text">{message.messageBody}</p>
                      <span className="message-time">
                        {formatTimeInTimezone(message.createdAt, userTimezone)}
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={t('chat.typeMessage')}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
              // Enter alone sends the message
              e.preventDefault();
              handleSendMessage(e);
            }
            // Ctrl+Enter or Shift+Enter adds a new line (default behavior)
          }}
          disabled={sending}
          rows={1}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!newMessage.trim() || sending}
          title={t('chat.sendMessage')}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
