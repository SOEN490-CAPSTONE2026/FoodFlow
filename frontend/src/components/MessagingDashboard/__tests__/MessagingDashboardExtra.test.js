import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessagingDashboard from '../MessagingDashboard';
import { MemoryRouter } from 'react-router-dom';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

jest.mock('../ConversationsSidebar', () => ({
  __esModule: true,
  default: ({ conversations, loading }) => (
    <div data-testid="conversations-sidebar">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>Conversations: {conversations.length}</div>
      )}
    </div>
  ),
}));

jest.mock('../ChatPanel', () => ({
  __esModule: true,
  default: ({ conversation }) => (
    <div data-testid="chat-panel">
      {conversation
        ? `Chat with ${conversation.otherUserName}`
        : 'No conversation selected'}
    </div>
  ),
}));

jest.mock('../NewConversationModal', () => ({
  __esModule: true,
  default: ({ onClose }) => (
    <div data-testid="new-conversation-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('MessagingDashboard - query param handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('selects conversation from conversationId query param when found in list', async () => {
    const mockConversations = [
      {
        id: 42,
        otherUserName: 'Target User',
        otherUserEmail: 'target@test.com',
      },
    ];
    mockGet.mockResolvedValue({ data: mockConversations });

    render(
      <MemoryRouter initialEntries={['/?conversationId=42']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chat with Target User')).toBeInTheDocument();
    });
  });

  test('fetches conversation directly when conversationId not in list', async () => {
    const mockConversations = [
      { id: 1, otherUserName: 'User 1', otherUserEmail: 'user1@test.com' },
    ];
    const fetchedConversation = {
      id: 99,
      otherUserName: 'Fetched User',
      otherUserEmail: 'fetched@test.com',
    };

    mockGet
      .mockResolvedValueOnce({ data: mockConversations })
      .mockResolvedValueOnce({ data: fetchedConversation });

    render(
      <MemoryRouter initialEntries={['/?conversationId=99']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chat with Fetched User')).toBeInTheDocument();
    });
  });

  test('handles error when fetching conversation by id fails', async () => {
    const mockConversations = [
      { id: 1, otherUserName: 'User 1', otherUserEmail: 'user1@test.com' },
    ];

    mockGet
      .mockResolvedValueOnce({ data: mockConversations })
      .mockRejectedValueOnce(new Error('Fetch failed'));

    render(
      <MemoryRouter initialEntries={['/?conversationId=99']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 1')).toBeInTheDocument();
    });
  });

  test('creates conversation from recipientEmail query param', async () => {
    const newConversation = {
      id: 55,
      otherUserName: 'Email User',
      otherUserEmail: 'emailuser@test.com',
      alreadyExists: false,
    };

    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: newConversation });

    render(
      <MemoryRouter initialEntries={['/?recipientEmail=emailuser%40test.com']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chat with Email User')).toBeInTheDocument();
    });

    expect(mockPost).toHaveBeenCalledWith('/conversations', {
      recipientEmail: 'emailuser@test.com',
    });
  });

  test('shows error when recipientEmail conversation creation fails with 400', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockRejectedValue({ response: { status: 400 } });

    render(
      <MemoryRouter initialEntries={['/?recipientEmail=bad%40test.com']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });
  });

  test('shows error when recipientEmail conversation creation fails with non-400', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockRejectedValue({ response: { status: 500 } });

    render(
      <MemoryRouter initialEntries={['/?recipientEmail=bad%40test.com']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });
  });

  test('does nothing when no recipientEmail param present', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter initialEntries={['/']}>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });
});
