import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPanel from '../ChatPanel';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockPost = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
    post: (...args) => mockPost(...args),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => '123'),
};
global.localStorage = localStorageMock;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ChatPanel', () => {
  const mockConversation = {
    id: 1,
    otherUserName: 'John Doe',
    otherUserEmail: 'john@test.com',
  };

  const mockMessages = [
    {
      id: 1,
      senderId: 123,
      messageBody: 'Hello there',
      createdAt: '2025-01-01T12:00:00Z',
    },
    {
      id: 2,
      senderId: 456,
      messageBody: 'Hi! How are you?',
      createdAt: '2025-01-01T12:01:00Z',
    },
  ];

  const mockOnMessageSent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockClear();
    mockPut.mockClear();
    mockPost.mockClear();
  });

  test('shows empty state when no conversation selected', () => {
    render(<ChatPanel conversation={null} onMessageSent={mockOnMessageSent} />);
    
    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
    expect(screen.getByText('Select a conversation from the sidebar or start a new one')).toBeInTheDocument();
  });

  test('loads and displays messages for selected conversation', async () => {
    mockGet.mockResolvedValue({ data: mockMessages });
    mockPut.mockResolvedValue({});

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
      expect(screen.getByText('Hi! How are you?')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledWith('/conversations/1/messages');
    expect(mockPut).toHaveBeenCalledWith('/conversations/1/read');
  });

  test('displays conversation header with user info', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPut.mockResolvedValue({});

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
    });
  });

  test('shows no messages state when conversation is empty', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPut.mockResolvedValue({});

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
    });
  });

  test('sends a message successfully', async () => {
    const newMessage = {
      id: 3,
      senderId: 123,
      messageBody: 'New message',
      createdAt: '2025-01-01T12:02:00Z',
    };

    mockGet.mockResolvedValue({ data: mockMessages });
    mockPut.mockResolvedValue({});
    mockPost.mockResolvedValue({ data: newMessage });

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/messages', {
        conversationId: 1,
        messageBody: 'New message',
      });
      expect(mockOnMessageSent).toHaveBeenCalled();
    });

    expect(input.value).toBe('');
  });

  test('does not send empty message', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPut.mockResolvedValue({});

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  test('displays loading state while fetching messages', () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves
    mockPut.mockResolvedValue({});

    render(<ChatPanel conversation={mockConversation} onMessageSent={mockOnMessageSent} />);

    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });
});
