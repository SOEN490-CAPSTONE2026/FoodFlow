import React from 'react';
import api from '../../../services/api';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessagingDashboard from '../MessagingDashboard';
import { MemoryRouter } from 'react-router-dom';

const mockGet = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

// ConversationsSidebar mock: keep your UI AND add a "Select First" button to trigger onSelectConversation
jest.mock('../ConversationsSidebar', () => ({
  __esModule: true,
  default: ({
    conversations,
    loading,
    onNewConversation,
    onSelectConversation,
  }) => (
    <div data-testid="conversations-sidebar">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <button onClick={onNewConversation}>New Conversation</button>
          <button
            onClick={() =>
              onSelectConversation(
                conversations[0] || {
                  id: 111,
                  otherUserName: 'Fallback User',
                  otherUserEmail: 'fallback@test.com',
                }
              )
            }
          >
            Select First
          </button>
          <div>Conversations: {conversations.length}</div>
        </>
      )}
    </div>
  ),
}));

// ChatPanel mock: expose triggers for onMessageSent and onConversationRead
jest.mock('../ChatPanel', () => ({
  __esModule: true,
  default: ({ conversation, onMessageSent, onConversationRead }) => (
    <div data-testid="chat-panel">
      <div>
        {conversation
          ? `Chat with ${conversation.otherUserName}`
          : 'No conversation selected'}
      </div>
      <button onClick={onMessageSent}>Send Message</button>
      <button onClick={onConversationRead}>Mark Read</button>
    </div>
  ),
}));

// NewConversationModal mock: keep your UI — provides Close and Create actions
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
    const neverResolvingPromise = new Promise(() => {});
    mockGet.mockReturnValue(neverResolvingPromise);

    // Also mock the POST request that runs in the second useEffect
    const mockPost = jest.fn().mockReturnValue(neverResolvingPromise);
    api.post = mockPost;

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads and displays conversations', async () => {
    const mockConversations = [
      { id: 1, otherUserName: 'User 1', otherUserEmail: 'user1@test.com' },
      { id: 2, otherUserName: 'User 2', otherUserEmail: 'user2@test.com' },
    ];
    mockGet.mockResolvedValue({ data: mockConversations });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 2')).toBeInTheDocument();
    });
    expect(mockGet).toHaveBeenCalledWith('/conversations');
  });

  test('displays error message when loading fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load conversations')
      ).toBeInTheDocument();
    });
  });

  test('shows empty state when no conversations', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });
  });

  test('renders chat panel and sidebar', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('conversations-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });
  });

  // ---- New tests to increase coverage of handlers/branches ----

  test('selecting a conversation updates ChatPanel (handleSelectConversation)', async () => {
    const mockConversations = [
      { id: 1, otherUserName: 'User 1', otherUserEmail: 'user1@test.com' },
      { id: 2, otherUserName: 'User 2', otherUserEmail: 'user2@test.com' },
    ];
    mockGet.mockResolvedValue({ data: mockConversations });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select First'));
    expect(screen.getByText('Chat with User 1')).toBeInTheDocument();
  });

  test('clicking New Conversation opens modal; Create prepends, selects, and closes modal (handleNewConversation & handleConversationCreated)', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });

    // open modal
    fireEvent.click(screen.getByText('New Conversation'));
    expect(screen.getByTestId('new-conversation-modal')).toBeInTheDocument();

    // create conversation
    fireEvent.click(screen.getByText('Create'));

    // modal closed & chat switched to new conversation
    await waitFor(() => {
      expect(
        screen.queryByTestId('new-conversation-modal')
      ).not.toBeInTheDocument();
      expect(screen.getByText('Chat with New User')).toBeInTheDocument();
      // conversations list updated
      expect(screen.getByText('Conversations: 1')).toBeInTheDocument();
    });
  });

  test('closing modal without creating hides the modal (show/hide branch)', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Conversation'));
    expect(screen.getByTestId('new-conversation-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(
      screen.queryByTestId('new-conversation-modal')
    ).not.toBeInTheDocument();
  });

  test('Send Message triggers a refresh (handleMessageSent -> loadConversations)', async () => {
    // 1st call returns 1 conversation; 2nd call returns same list (we only assert call count)
    mockGet
      .mockResolvedValueOnce({
        data: [{ id: 1, otherUserName: 'A', otherUserEmail: 'a@test.com' }],
      })
      .mockResolvedValueOnce({
        data: [{ id: 1, otherUserName: 'A', otherUserEmail: 'a@test.com' }],
      });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 1')).toBeInTheDocument();
    });

    // select conversation so ChatPanel shows buttons
    fireEvent.click(screen.getByText('Select First'));
    expect(screen.getByText('Chat with A')).toBeInTheDocument();

    // trigger onMessageSent
    fireEvent.click(screen.getByText('Send Message'));

    await waitFor(() => {
      // initial load + refresh
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  test('Mark Read triggers a refresh (handleConversationRead -> loadConversations)', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [{ id: 2, otherUserName: 'B', otherUserEmail: 'b@test.com' }],
      })
      .mockResolvedValueOnce({
        data: [{ id: 2, otherUserName: 'B', otherUserEmail: 'b@test.com' }],
      });

    render(
      <MemoryRouter>
        <MessagingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversations: 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select First'));
    expect(screen.getByText('Chat with B')).toBeInTheDocument();

    // trigger onConversationRead
    fireEvent.click(screen.getByText('Mark Read'));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2); // initial + refresh
    });
  });
});
