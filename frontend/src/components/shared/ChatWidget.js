import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  X,
  Send,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import './ChatWidget.css';

/**
 * In-app support chat widget component
 * Provides contextual support assistance using FoodFlow knowledge base
 */
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState('');
  const [chatEnded, setChatEnded] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const tSupport = (key, fallback) =>
    t(`supportChat.${key}`, { defaultValue: fallback });

  const getActionLabel = action => {
    if (!action) {
      return '';
    }

    const label = action.label || '';
    const value = action.value || '';

    const labelKeyMap = {
      'Create Donation': 'actions.createDonation',
      'My Messages': 'actions.myMessages',
      Settings: 'actions.settings',
      'Browse Food': 'actions.browseFood',
      'My Claims': 'actions.myClaims',
      'My Donations': 'actions.myDonations',
      'Help Center': 'actions.helpCenter',
      'Email Support': 'actions.emailSupport',
      'Contact Support': 'actions.contactSupport',
      Dashboard: 'actions.dashboard',
    };

    if (labelKeyMap[label]) {
      return tSupport(labelKeyMap[label], label);
    }

    const valueKeyMap = {
      '/donor/list': 'actions.createDonation',
      '/donor/messages': 'actions.myMessages',
      '/receiver/messages': 'actions.myMessages',
      '/donor/settings': 'actions.settings',
      '/receiver/settings': 'actions.settings',
      '/admin/settings': 'actions.settings',
      '/receiver/browse': 'actions.browseFood',
      '/receiver/my-claims': 'actions.myClaims',
      '/admin': 'actions.dashboard',
      '/donor/help': 'actions.helpCenter',
      '/receiver/help': 'actions.helpCenter',
      '/admin/help': 'actions.helpCenter',
    };

    if (valueKeyMap[value]) {
      return tSupport(valueKeyMap[value], label || value);
    }

    if (action.type === 'contact' && value.includes('@')) {
      return tSupport('actions.contactSupport', label || 'Contact Support');
    }

    return label;
  };

  // Get current page context for better assistance
  const getPageContext = () => {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    return {
      route: currentPath,
      donationId: urlParams.get('donationId') || null,
      claimId: urlParams.get('claimId') || null,
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    setError('');

    // Add welcome message on first open (if chat hasn't ended)
    if (!isOpen && messages.length === 0 && !chatEnded) {
      const welcomeMessage = tSupport(
        'welcome',
        "👋 Hi! I'm the FoodFlow support assistant. How can I help you today?"
      );

      setMessages([
        {
          id: Date.now(),
          type: 'assistant',
          content: welcomeMessage,
          actions: [],
        },
      ]);
    }
  };

  const endChat = () => {
    const endMessage = tSupport(
      'endMessage',
      'Chat ended. Thank you for using FoodFlow support! If you have more questions, feel free to start a new conversation.'
    );

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'assistant',
        content: endMessage,
        actions: [],
        ended: true,
      },
    ]);

    setChatEnded(true);
    setInputMessage('');
  };

  const startNewChat = () => {
    setMessages([]);
    setChatEnded(false);
    setError('');

    const welcomeMessage = tSupport(
      'welcome',
      "👋 Hi! I'm the FoodFlow support assistant. How can I help you today?"
    );

    setMessages([
      {
        id: Date.now(),
        type: 'assistant',
        content: welcomeMessage,
        actions: [],
      },
    ]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || chatEnded) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/support/chat', {
        message: userMessage.content,
        pageContext: getPageContext(),
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.reply,
        intent: response.data.intent,
        actions: response.data.actions || [],
        escalate: response.data.escalate,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Support chat error:', error);

      // Create a more helpful error message with support contact
      const errorMessage = tSupport(
        'errorMessage',
        'Sorry, I cannot respond right now. Please contact our support team directly.'
      );

      const errorResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: errorMessage,
        actions: [
          {
            type: 'contact',
            label: tSupport('actions.contactSupport', 'Contact Support'),
            value: 'support@foodflow.com',
          },
        ],
        escalate: true,
      };

      setMessages(prev => [...prev, errorResponse]);
      setError('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = action => {
    switch (action.type) {
      case 'link':
        // Navigate to internal route without closing chat
        if (action.value.startsWith('/')) {
          // Internal route - use React Router navigate to keep chat open
          navigate(action.value);
        } else {
          // External link - open in new tab
          window.open(action.value, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'contact':
        if (action.value.includes('@')) {
          // Email
          window.location.href = `mailto:${action.value}`;
        } else {
          // Phone
          window.location.href = `tel:${action.value}`;
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(action.value);
        break;
      default:
        break;
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderInlineContent = text => {
    if (!text) {
      return null;
    }

    const parts = text.split(/(\*\*[^*]+?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
      }

      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  };

  const renderParagraph = (text, key) => {
    if (!text) {
      return null;
    }

    const lines = text.split('\n');

    return (
      <p key={key} className="message-paragraph">
        {lines.map((line, lineIndex) => (
          <React.Fragment key={`${key}-${lineIndex}`}>
            {renderInlineContent(line)}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  };

  const renderMessageContent = content => {
    if (!content) {
      return null;
    }

    const lines = content.split('\n');
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];

        while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
          index += 1;
        }

        blocks.push({ type: 'ol', items });
        continue;
      }

      if (/^\s*[-*•]\s+/.test(line)) {
        const items = [];

        while (index < lines.length && /^\s*[-*•]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\s*[-*•]\s+/, ''));
          index += 1;
        }

        blocks.push({ type: 'ul', items });
        continue;
      }

      const paragraphLines = [];

      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^\s*\d+\.\s+/.test(lines[index]) &&
        !/^\s*[-*•]\s+/.test(lines[index])
      ) {
        paragraphLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: 'p', text: paragraphLines.join('\n') });
    }

    return blocks.map((block, blockIndex) => {
      if (block.type === 'ol') {
        return (
          <ol key={`ol-${blockIndex}`} className="message-list ordered">
            {block.items.map((item, itemIndex) => (
              <li key={`ol-${blockIndex}-${itemIndex}`}>
                {renderInlineContent(item)}
              </li>
            ))}
          </ol>
        );
      }

      if (block.type === 'ul') {
        return (
          <ul key={`ul-${blockIndex}`} className="message-list unordered">
            {block.items.map((item, itemIndex) => (
              <li key={`ul-${blockIndex}-${itemIndex}`}>
                {renderInlineContent(item)}
              </li>
            ))}
          </ul>
        );
      }

      return renderParagraph(block.text, `p-${blockIndex}`);
    });
  };

  const renderMessage = message => {
    return (
      <div key={message.id} className={`message ${message.type}`}>
        <div className="message-content">
          {renderMessageContent(message.content)}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="message-actions">
            {message.actions.map((action, index) => (
              <button
                key={index}
                className={`action-btn ${action.type}`}
                onClick={() => handleAction(action)}
              >
                {action.type === 'contact' && action.value.includes('@') && (
                  <Mail size={14} />
                )}
                {action.type === 'contact' && !action.value.includes('@') && (
                  <Phone size={14} />
                )}
                {action.type === 'link' && <ExternalLink size={14} />}
                {getActionLabel(action)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-widget">
      {/* Floating button */}
      <button
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleWidget}
        aria-label={
          isOpen
            ? tSupport('aria.close', 'Close support chat')
            : tSupport('aria.open', 'Open support chat')
        }
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="support-chat-panel">
          <div className="chat-header">
            <div className="header-content">
              <MessageCircle size={18} />
              <span>{tSupport('title', 'FoodFlow Support')}</span>
            </div>
            <div className="header-actions">
              {!chatEnded && messages.length > 1 && (
                <button
                  className="end-chat-btn"
                  onClick={endChat}
                  title={tSupport('titles.endChat', 'End chat')}
                >
                  {tSupport('buttons.endChat', 'End Chat')}
                </button>
              )}
              {chatEnded && (
                <button
                  className="new-chat-btn"
                  onClick={startNewChat}
                  title={tSupport('titles.newChat', 'New chat')}
                >
                  {tSupport('buttons.newChat', 'New Chat')}
                </button>
              )}
              <button className="close-btn" onClick={toggleWidget}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(renderMessage)}

            {isLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  chatEnded
                    ? tSupport(
                        'placeholders.ended',
                        'Chat ended. Click "New Chat" to start over.'
                      )
                    : tSupport('placeholders.input', 'Type your question...')
                }
                rows={1}
                disabled={isLoading || chatEnded}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || chatEnded}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
