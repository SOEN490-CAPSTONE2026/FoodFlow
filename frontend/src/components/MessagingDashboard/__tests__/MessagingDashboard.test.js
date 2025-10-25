import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessagingDashboard from '../MessagingDashboard';

const mockGet = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

jest.mock('../ConversationsSidebar', () => ({
  __esModule: true,
  default: ({ conversations, loading, onNewConversation }) => (
    <div data-testid="conversations-sidebar">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <button onClick={onNewConversation}>New Conversation</button>
          <div>Conversations: {conversations.length}</div>
        </>
      )}
    </div>
  ),
}));

jest.mock('../ChatPanel', () => ({
  __esModule: true,
  default: ({ conversation }) => (
    <div data-testid="chat-panel">
      {conversation ? `Chat with ${conversation.otherUserName}` : 'No conversation selected'}
    </div>
  ),
}));

jest.mock('../NewConversationModal', () => ({
  __esModule: true,
  default: ({ onClose, onConversationCreated }) => (
    <div data-testid="new-conversation-modal">
      <button onClick={onClose}>Close</button>
      <button
        onClick={() =>
          onConversationCreated({
            id: 999,
            otherUserName: 'New User',
            otherUserEmail: 'newuser@test.com',
          })
        }
      >
        Create
      </button>
    </div>
  ),
}));

describe('MessagingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockClear();
  });

  test('renders loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<MessagingDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads and displays conversations', async () => {
    const mockConversations = [
      { id: 1, otherUserName: 'User 1', otherUserEmail: 'user1@test.com' },
      { id: 2, otherUserName: 'User 2', otherUserEmail: 'user2@test.com' },
    ];

    mockGet.mockResolvedValue({ data: mockConversations });

    render(<MessagingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Conversations: 2')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledWith('/conversations');
  });

  test('displays error message when loading fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    render(<MessagingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
    });
  });

  test('shows empty state when no conversations', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(<MessagingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });
  });

  test('renders chat panel and sidebar', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(<MessagingDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('conversations-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });
  });
});
