import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useTimezone } from '../../contexts/TimezoneContext';
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
  const { userTimezone } = useTimezone();

  // Debug: log timezone
  console.log('ChatPanel using timezone:', userTimezone);

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
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
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
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
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

  if (!conversation) {
    return (
      <div
        className={`chat-panel empty ${showOnMobile ? 'show-mobile' : 'hide-mobile'}`}
      >
        <div className="empty-state">
          <h3>No conversation selected</h3>
          <p>Select a conversation from the sidebar or start a new one</p>
        </div>
      </div>
    );
  }

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
            <h3>{conversation.postTitle || conversation.otherUserName}</h3>
            <p className="chat-header-subtitle">
              with {conversation.otherUserName}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <span className="status-badge claimed">Claimed</span>
          <button className="view-post-btn">View Post</button>
          <button className="menu-btn">⋮</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0
          ? !loading && (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
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
                <div
                  className={`message ${
                    message.senderId.toString() === currentUserId
                      ? 'sent'
                      : 'received'
                  }`}
                >
                  {message.senderId.toString() !== currentUserId && (
                    <div className="message-avatar">
                      {conversation.otherUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="message-content">
                    <p className="message-text">{message.messageBody}</p>
                    <span className="message-time">
                      {formatTimeInTimezone(message.createdAt, userTimezone)}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Type your message here..."
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
          title="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
