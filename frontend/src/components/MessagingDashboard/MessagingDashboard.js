import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
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
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [searchParams] = useSearchParams();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    handleRecipientEmailQueryParam();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/conversations');
      setConversations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientEmailQueryParam = async () => {

    const recipientEmail = decodeURIComponent(searchParams.get("recipientEmail").trim());
    
    if (!recipientEmail) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/conversations', {
        recipientEmail: recipientEmail
      });
      
      handleConversationCreated(response.data);

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

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatOnMobile(true);
  };

  const handleBackToConversations = () => {
    setShowChatOnMobile(false);
  };

  const handleConversationRead = () => {
    // Refresh conversations to update unread count
    loadConversations();
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (newConversation) => {
    if (!newConversation.alreadyExists){
      setConversations([newConversation, ...conversations]);
    }
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
        showOnMobile={!showChatOnMobile}
      />
      
      <ChatPanel
        conversation={selectedConversation}
        onMessageSent={handleMessageSent}
        onConversationRead={handleConversationRead}
        onBack={handleBackToConversations}
        showOnMobile={showChatOnMobile}
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
