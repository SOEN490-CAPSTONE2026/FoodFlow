import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './ChatPanel.css';

const ChatPanel = ({ conversation, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/conversations/${conversation.id}/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation) return;
    
    try {
      await api.put(`/conversations/${conversation.id}/read`);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      const response = await api.post('/messages', {
        conversationId: conversation.id,
        messageBody: newMessage.trim()
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

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!conversation) {
    return (
      <div className="chat-panel empty">
        <div className="empty-state">
          <h3>No conversation selected</h3>
          <p>Select a conversation from the sidebar or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-avatar">
          {conversation.otherUserName.charAt(0).toUpperCase()}
        </div>
        <div className="chat-header-info">
          <h3>{conversation.otherUserName}</h3>
          <p className="chat-header-email">{conversation.otherUserEmail}</p>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.senderId.toString() === currentUserId ? 'sent' : 'received'
              }`}
            >
              <div className="message-content">
                <p>{message.messageBody}</p>
                <span className="message-time">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
