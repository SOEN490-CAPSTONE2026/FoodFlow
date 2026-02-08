import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import ChatWidget from '../ChatWidget';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
  patch: jest.fn(),
  supportChatAPI: {
    sendMessage: jest.fn(),
  },
  rateLimitAPI: {
    getStats: jest.fn(),
    getUserStatus: jest.fn(),
  },
}));

const mockApi = api;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MessageCircle: () => (
    <div data-testid="message-circle-icon">MessageCircle</div>
  ),
  X: () => <div data-testid="x-icon">X</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
}));

// Mock scrollIntoView which doesn't exist in test environment
global.Element.prototype.scrollIntoView = jest.fn();

describe('ChatWidget', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'RECEIVER',
    languagePreference: 'en',
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

  const openChat = () => {
    fireEvent.click(screen.getByLabelText('Open support chat'));
  };

  const getInput = () => screen.getByPlaceholderText('Type your question...');

  const getSendButton = container => container.querySelector('.send-btn');

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
      expect(
        screen.getByPlaceholderText('Type your question...')
      ).toBeInTheDocument();
    });

    test('should close chat widget when close button is clicked', () => {
      renderWithProviders();

      // Open chat
      openChat();

      // Close chat
      const closeButton = screen.getByLabelText('Close support chat');
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
              type: 'link',
              label: 'Go to Registration',
              value: '/register',
            },
          ],
          requiresEscalation: false,
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      // Open chat
      openChat();

      // Type message
      const input = getInput();
      fireEvent.change(input, {
        target: { value: 'How do I create an account?' },
      });

      // Send message
      const sendButton = getSendButton(container);
      fireEvent.click(sendButton);

      // Verify user message appears
      expect(
        screen.getByText('How do I create an account?')
      ).toBeInTheDocument();

      // Wait for API response
      await waitFor(() => {
        expect(
          screen.getByText('Thank you for your question. Here is the answer...')
        ).toBeInTheDocument();
      });

      // Verify API was called with correct data
      expect(mockApi.post).toHaveBeenCalledWith('/support/chat', {
        message: 'How do I create an account?',
        pageContext: expect.objectContaining({
          route: '/',
        }),
      });
    });

    test('should send message when Enter key is pressed', async () => {
      const mockResponse = {
        data: {
          reply: 'Here is your answer',
          intent: 'GENERAL',
          actions: [],
          requiresEscalation: false,
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      renderWithProviders();

      // Open chat
      openChat();

      // Type message and press Enter
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });
    });

    test('should not send empty message', () => {
      const { container } = renderWithProviders();

      // Open chat
      openChat();

      // Try to send empty message
      const sendButton = getSendButton(container);
      expect(sendButton).toBeDisabled();
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    test('should clear input after sending message', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          intent: 'GENERAL',
          actions: [],
          requiresEscalation: false,
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      // Open chat
      openChat();

      // Type and send message
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(input.value).toBe('');
      });
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
            requiresEscalation: false,
          },
        },
      };
      mockApi.post.mockRejectedValue(mockError);

      const { container } = renderWithProviders();

      // Open chat and send message
      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, I cannot respond right now. Please contact our support team directly.'
          )
        ).toBeInTheDocument();
      });
    });

    test('should show rate limit headers information', async () => {
      const mockError = {
        response: {
          status: 429,
          headers: {
            'x-ratelimit-remaining': '0',
            'retry-after': '60',
          },
          data: {
            reply: 'Rate limit exceeded',
            intent: 'RATE_LIMITED',
          },
        },
      };
      mockApi.post.mockRejectedValue(mockError);

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, I cannot respond right now. Please contact our support team directly.'
          )
        ).toBeInTheDocument();
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
            requiresEscalation: true,
          },
        },
      };
      mockApi.post.mockRejectedValue(mockError);

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, I cannot respond right now. Please contact our support team directly.'
          )
        ).toBeInTheDocument();
      });
    });

    test('should display generic error for network failures', async () => {
      mockApi.post.mockRejectedValue(new Error('Network Error'));

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, I cannot respond right now. Please contact our support team directly.'
          )
        ).toBeInTheDocument();
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
              type: 'link',
              label: 'Go to Registration',
              value: '/register',
            },
          ],
          requiresEscalation: false,
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'How to register?' } });
      fireEvent.click(getSendButton(container));

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
              type: 'link',
              label: 'Go to Registration',
              value: '/register',
            },
          ],
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(getSendButton(container));

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
              value: 'support@foodflow.com',
            },
          ],
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Need help' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(screen.getByText('Contact Support')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Management', () => {
    test('should show new chat button when chat has ended', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          actions: [],
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      openChat();

      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
      });

      const endChatButton = screen.getByText('End Chat');
      fireEvent.click(endChatButton);

      expect(screen.getByText('New Chat')).toBeInTheDocument();
    });

    test('should clear messages when starting new chat', async () => {
      const mockResponse = {
        data: {
          reply: 'Test response',
          actions: [],
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { container } = renderWithProviders();

      openChat();

      // Send a message
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // End and start new chat
      fireEvent.click(screen.getByText('End Chat'));
      fireEvent.click(screen.getByText('New Chat'));

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  describe('Page Context', () => {
    test('should include current route in page context', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          actions: [],
        },
      };
      mockApi.post.mockResolvedValue(mockResponse);

      window.history.pushState({}, '', '/donations?donationId=123');

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(getSendButton(container));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/support/chat', {
          message: 'Test',
          pageContext: {
            route: '/donations',
            donationId: '123',
            claimId: null,
          },
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

      const { container } = renderWithProviders();

      openChat();
      const input = getInput();
      fireEvent.change(input, { target: { value: 'Test' } });
      const sendButton = getSendButton(container);
      fireEvent.click(sendButton);

      // Check loading state
      expect(sendButton).toBeDisabled();

      // Resolve promise
      resolvePromise({
        data: {
          reply: 'Response',
          actions: [],
        },
      });

      await waitFor(() => {
        expect(
          container.querySelector('.typing-indicator')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const { container } = renderWithProviders();

      expect(screen.getByLabelText('Open support chat')).toBeInTheDocument();

      openChat();

      expect(screen.getByLabelText('Close support chat')).toBeInTheDocument();
      expect(container.querySelector('.chat-messages')).toBeInTheDocument();
    });

    test('should focus input when chat opens', () => {
      renderWithProviders();

      openChat();

      const input = getInput();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('User Role Styling', () => {
    test('should apply DONOR role styling', () => {
      const donorUser = { ...mockUser, role: 'DONOR' };
      renderWithProviders(donorUser);

      openChat();
      expect(document.querySelector('.chat-widget')).toBeInTheDocument();
    });

    test('should apply RECEIVER role styling', () => {
      const receiverUser = { ...mockUser, role: 'RECEIVER' };
      renderWithProviders(receiverUser);

      openChat();
      expect(document.querySelector('.chat-widget')).toBeInTheDocument();
    });

    test('should apply ADMIN role styling', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      renderWithProviders(adminUser);

      openChat();
      expect(document.querySelector('.chat-widget')).toBeInTheDocument();
    });
  });
});
