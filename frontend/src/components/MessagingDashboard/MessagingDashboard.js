import React, { useState, useEffect } from 'react';
import ConversationsSidebar from './ConversationsSidebar';
import ChatPanel from './ChatPanel';
import NewConversationModal from './NewConversationModal';
import api from '../../services/api';
import './MessagingDashboard.css';

const MessagingDashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/conversations');
      setConversations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (newConversation) => {
    setConversations([newConversation, ...conversations]);
    setSelectedConversation(newConversation);
    setShowNewConversationModal(false);
  };

  const handleMessageSent = () => {
    // Refresh conversations to update last message
    loadConversations();
  };

  return (
    <div className="messaging-dashboard">
      <ConversationsSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        loading={loading}
      />
      
      <ChatPanel
        conversation={selectedConversation}
        onMessageSent={handleMessageSent}
      />

      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default MessagingDashboard;
