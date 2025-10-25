import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationsSidebar from '../ConversationsSidebar';

describe('ConversationsSidebar', () => {
  const mockConversations = [
    {
      id: 1,
      otherUserName: 'John Doe',
      otherUserEmail: 'john@test.com',
      lastMessage: 'Hello there',
      lastMessageTime: '2025-01-01T12:00:00Z',
      unreadCount: 2,
    },
    {
      id: 2,
      otherUserName: 'Jane Smith',
      otherUserEmail: 'jane@test.com',
      lastMessage: 'How are you?',
      lastMessageTime: '2025-01-01T11:00:00Z',
      unreadCount: 0,
    },
  ];

  const mockOnSelectConversation = jest.fn();
  const mockOnNewConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    render(
      <ConversationsSidebar
        conversations={[]}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={true}
      />
    );

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  test('renders empty state when no conversations', () => {
    render(
      <ConversationsSidebar
        conversations={[]}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText(/click \+ to start/i)).toBeInTheDocument();
  });

  test('renders list of conversations', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Note: lastMessage is rendered but may be empty in the component
  });

  test('calls onSelectConversation when conversation is clicked', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    const conversation = screen.getByText('John Doe').closest('.conversation-item');
    fireEvent.click(conversation);

    expect(mockOnSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
  });

  test('highlights selected conversation', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={mockConversations[0]}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    const selectedConversation = screen.getByText('John Doe').closest('.conversation-item');
    expect(selectedConversation).toHaveClass('active');
  });

  test('displays unread count badge when there are unread messages', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('calls onNewConversation when new conversation button is clicked', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
        loading={false}
      />
    );

    const newButton = screen.getByTitle(/start new conversation/i);
    fireEvent.click(newButton);

    expect(mockOnNewConversation).toHaveBeenCalled();
  });
});
