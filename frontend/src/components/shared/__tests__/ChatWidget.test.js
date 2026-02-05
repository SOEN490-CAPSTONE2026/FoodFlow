import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import ChatWidget from '../shared/ChatWidget';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockApi = api;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
}));

describe('ChatWidget', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'RECEIVER',
    languagePreference: 'en'
  };

  const renderWithProviders = (user = mockUser) => {
    return render(
      <AuthContext.Provider value={{ user }}>
        <BrowserRouter>
          <ChatWidget />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockApi.post.mockClear();
    jest.clearAllMocks();
  });

  describe('Widget Toggle', () => {
    test('should render chat toggle button when closed', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByLabelText('Open support chat');
      expect(toggleButton).toBeInTheDocument();
      expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
    });

    test('should open chat widget when toggle button is clicked', () => {
      renderWithProviders();
      
      const toggleButton = screen.getByLabelText('Open support chat');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('FoodFlow Support')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ask your question...')).toBeInTheDocument();
    });

    test('should close chat widget when close button is clicked', () => {
      renderWithProviders();
      
      // Open chat
      const toggleButton = screen.getByLabelText('Open support chat');
      fireEvent.click(toggleButton);
      
      // Close chat
      const closeButton = screen.getByLabelText('Close chat');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('FoodFlow Support')).not.toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    test('should send message when submit button is clicked', async () => {
      const mockResponse = {
        data: {
          reply: 'Thank you for your question. Here is the answer...',
          intent: 'ACCOUNT_CREATE',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Registration',
              value: '/register'
            }
          ],
          requiresEscalation: false
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      // Open chat
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Type message
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'How do I create an account?' } });
      
      // Send message
      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);
      
      // Verify user message appears
      expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
      
      // Wait for API response
      await waitFor(() => {
        expect(screen.getByText('Thank you for your question. Here is the answer...')).toBeInTheDocument();
      });
      
      // Verify API was called with correct data
      expect(mockApi.post).toHaveBeenCalledWith('/support/chat', {
        message: 'How do I create an account?',
        pageContext: expect.objectContaining({
          route: '/',
        })
      });
    });

    test('should send message when Enter key is pressed', async () => {
      const mockResponse = {
        data: {
          reply: 'Here is your answer',
          intent: 'GENERAL',
          actions: [],
          requiresEscalation: false
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      // Open chat
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Type message and press Enter
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });
    });

    test('should not send empty message', () => {
      renderWithProviders();
      
      // Open chat
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Try to send empty message
      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);
      
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    test('should clear input after sending message', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          intent: 'GENERAL',
          actions: [],
          requiresEscalation: false
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      // Open chat
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Type and send message
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      expect(input.value).toBe('');
    });
  });

  describe('Rate Limiting', () => {
    test('should display rate limit error message', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            reply: 'Too many requests. Please wait before trying again.',
            intent: 'RATE_LIMITED',
            actions: [],
            requiresEscalation: false
          }
        }
      };
      mockApi.post.mockRejectedValue(mockError);
      
      renderWithProviders();
      
      // Open chat and send message
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText('Too many requests. Please wait before trying again.')).toBeInTheDocument();
      });
    });

    test('should show rate limit headers information', async () => {
      const mockError = {
        response: {
          status: 429,
          headers: {
            'x-ratelimit-remaining': '0',
            'retry-after': '60'
          },
          data: {
            reply: 'Rate limit exceeded',
            intent: 'RATE_LIMITED'
          }
        }
      };
      mockApi.post.mockRejectedValue(mockError);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error message when API call fails', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            reply: 'An error occurred. Please contact support.',
            intent: 'ERROR',
            requiresEscalation: true
          }
        }
      };
      mockApi.post.mockRejectedValue(mockError);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please contact support.')).toBeInTheDocument();
      });
    });

    test('should display generic error for network failures', async () => {
      mockApi.post.mockRejectedValue(new Error('Network Error'));
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to send message/)).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    test('should render navigation action buttons', async () => {
      const mockResponse = {
        data: {
          reply: 'You can register here',
          intent: 'ACCOUNT_CREATE',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Registration',
              value: '/register'
            }
          ],
          requiresEscalation: false
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'How to register?' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText('Go to Registration')).toBeInTheDocument();
      });
    });

    test('should navigate when navigation action is clicked', async () => {
      const mockResponse = {
        data: {
          reply: 'Navigate to registration',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Registration',
              value: '/register'
            }
          ]
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        const actionButton = screen.getByText('Go to Registration');
        fireEvent.click(actionButton);
        expect(mockNavigate).toHaveBeenCalledWith('/register');
      });
    });

    test('should render contact action buttons', async () => {
      const mockResponse = {
        data: {
          reply: 'Please contact support',
          actions: [
            {
              type: 'contact',
              label: 'Contact Support',
              value: 'support@foodflow.com'
            }
          ]
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Need help' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText('Contact Support')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Management', () => {
    test('should show new chat button when chat has ended', () => {
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Simulate ending chat
      const endChatButton = screen.getByText('End Chat');
      fireEvent.click(endChatButton);
      
      expect(screen.getByText('Start New Chat')).toBeInTheDocument();
    });

    test('should clear messages when starting new chat', async () => {
      const mockResponse = {
        data: {
          reply: 'Test response',
          actions: []
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      // Send a message
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
      
      // End and start new chat
      fireEvent.click(screen.getByText('End Chat'));
      fireEvent.click(screen.getByText('Start New Chat'));
      
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('Page Context', () => {
    test('should include current route in page context', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          actions: []
        }
      };
      mockApi.post.mockResolvedValue(mockResponse);
      
      // Mock location
      delete window.location;
      window.location = { pathname: '/donations', search: '?donationId=123' };
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/support/chat', {
          message: 'Test',
          pageContext: {
            route: '/donations',
            donationId: '123',
            claimId: null
          }
        });
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state while sending message', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValue(promise);
      
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      const input = screen.getByPlaceholderText('Ask your question...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      
      // Check loading state
      expect(screen.getByLabelText('Send message')).toBeDisabled();
      
      // Resolve promise
      resolvePromise({
        data: {
          reply: 'Response',
          actions: []
        }
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Send message')).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Open support chat')).toBeInTheDocument();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
      expect(screen.getByLabelText('Support chat messages')).toBeInTheDocument();
    });

    test('should focus input when chat opens', () => {
      renderWithProviders();
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      const input = screen.getByPlaceholderText('Ask your question...');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('User Role Styling', () => {
    test('should apply DONOR role styling', () => {
      const donorUser = { ...mockUser, role: 'DONOR' };
      renderWithProviders(donorUser);
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      const chatWidget = screen.getByLabelText('Support chat messages').closest('.chat-widget');
      expect(chatWidget).toHaveClass('role-donor');
    });

    test('should apply RECEIVER role styling', () => {
      const receiverUser = { ...mockUser, role: 'RECEIVER' };
      renderWithProviders(receiverUser);
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      const chatWidget = screen.getByLabelText('Support chat messages').closest('.chat-widget');
      expect(chatWidget).toHaveClass('role-receiver');
    });

    test('should apply ADMIN role styling', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      renderWithProviders(adminUser);
      
      fireEvent.click(screen.getByLabelText('Open support chat'));
      
      const chatWidget = screen.getByLabelText('Support chat messages').closest('.chat-widget');
      expect(chatWidget).toHaveClass('role-admin');
    });
  });
});