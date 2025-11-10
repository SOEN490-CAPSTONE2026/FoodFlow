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
      lastMessagePreview: 'Hello there',
      lastMessageAt: '2025-01-01T12:00:00Z',
      unreadCount: 2,
    },
    {
      id: 2,
      otherUserName: 'Jane Smith',
      otherUserEmail: 'jane@test.com',
      lastMessagePreview: 'How are you?',
      lastMessageAt: '2025-01-01T11:00:00Z',
      unreadCount: 0,
    },
    {
      id: 3,
      otherUserName: 'Bob Wilson',
      otherUserEmail: 'bob@test.com',
      lastMessagePreview: 'See you soon',
      lastMessageAt: '2025-01-01T10:00:00Z',
      unreadCount: 1,
    },
  ];

  const mockOnSelectConversation = jest.fn();
  const mockOnNewConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sidebar header with title and subtitle', () => {
    render(
      <ConversationsSidebar
        conversations={[]}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Connect and coordinate here!')).toBeInTheDocument();
  });

  test('renders empty state when no conversations', () => {
    render(
      <ConversationsSidebar
        conversations={[]}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText(/click \+ to start a new conversation/i)).toBeInTheDocument();
  });

  test('renders list of conversations', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('calls onSelectConversation when conversation is clicked', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
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
      />
    );

    const selectedConversation = screen.getByText('John Doe').closest('.conversation-item');
    expect(selectedConversation).toHaveClass('active');
  });

  test('displays unread count badge when there are unread messages', () => {
    const { container } = render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    // Get unread badges from conversation items (not the filter badge)
    const unreadBadges = container.querySelectorAll('.unread-badge');
    expect(unreadBadges[0]).toHaveTextContent('2'); // John's badge
    expect(unreadBadges[1]).toHaveTextContent('1'); // Bob's badge
  });

  test('does not display unread badge for conversations with 0 unread', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const janeConversation = screen.getByText('Jane Smith').closest('.conversation-item');
    const badge = janeConversation.querySelector('.unread-badge');
    expect(badge).not.toBeInTheDocument();
  });

  test('calls onNewConversation when new conversation button is clicked', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const newButton = screen.getByTitle(/start new conversation/i);
    fireEvent.click(newButton);

    expect(mockOnNewConversation).toHaveBeenCalled();
  });

  test('renders All and Unread filter tabs', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });

  test('All tab is active by default', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const allTab = screen.getByText('All').closest('.filter-tab');
    expect(allTab).toHaveClass('active');
  });

  test('switches to Unread filter when Unread tab is clicked', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const unreadTab = screen.getByText('Unread').closest('.filter-tab');
    fireEvent.click(unreadTab);

    expect(unreadTab).toHaveClass('active');
  });

  test('filters to show only unread conversations', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const unreadTab = screen.getByText('Unread').closest('.filter-tab');
    fireEvent.click(unreadTab);

    // Should show John (2 unread) and Bob (1 unread), but not Jane (0 unread)
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('switches back to All filter', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    // Switch to Unread
    const unreadTab = screen.getByText('Unread').closest('.filter-tab');
    fireEvent.click(unreadTab);

    // Switch back to All
    const allTab = screen.getByText('All').closest('.filter-tab');
    fireEvent.click(allTab);

    expect(allTab).toHaveClass('active');
    // All conversations should be visible again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('displays unread count badge on Unread filter tab', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const unreadTab = screen.getByText('Unread').closest('.filter-tab');
    const filterBadge = unreadTab.querySelector('.filter-badge');
    
    // 2 conversations have unread messages (John and Bob)
    expect(filterBadge).toHaveTextContent('2');
  });

  test('does not display filter badge when no unread conversations', () => {
    const readConversations = mockConversations.map(conv => ({
      ...conv,
      unreadCount: 0,
    }));

    render(
      <ConversationsSidebar
        conversations={readConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const unreadTab = screen.getByText('Unread').closest('.filter-tab');
    const filterBadge = unreadTab.querySelector('.filter-badge');
    
    expect(filterBadge).not.toBeInTheDocument();
  });

  test('displays conversation avatar with first letter', () => {
    const { container } = render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const avatars = container.querySelectorAll('.conversation-avatar');
    expect(avatars[0]).toHaveTextContent('J'); // John
    expect(avatars[1]).toHaveTextContent('J'); // Jane
    expect(avatars[2]).toHaveTextContent('B'); // Bob
  });

  test('displays lastMessagePreview', () => {
    render(
      <ConversationsSidebar
        conversations={mockConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('See you soon')).toBeInTheDocument();
  });

  test('formats timestamp as "Just now" for recent messages', () => {
    const now = new Date();
    const recentConversations = [
      {
        ...mockConversations[0],
        lastMessageAt: now.toISOString(),
      },
    ];

    render(
      <ConversationsSidebar
        conversations={recentConversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  test('formats timestamp as minutes ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    const conversations = [
      {
        ...mockConversations[0],
        lastMessageAt: fiveMinutesAgo.toISOString(),
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  test('formats timestamp as hours ago', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60000);
    const conversations = [
      {
        ...mockConversations[0],
        lastMessageAt: twoHoursAgo.toISOString(),
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  test('formats timestamp as days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60000);
    const conversations = [
      {
        ...mockConversations[0],
        lastMessageAt: threeDaysAgo.toISOString(),
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  test('formats timestamp as date for old messages', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60000);
    const conversations = [
      {
        ...mockConversations[0],
        lastMessageAt: tenDaysAgo.toISOString(),
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversations}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    const expectedDate = tenDaysAgo.toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  test('handles null timestamp', () => {
    const conversationsWithNullTimestamp = [
      {
        ...mockConversations[0],
        lastMessageAt: null,
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversationsWithNullTimestamp}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('handles undefined timestamp', () => {
    const conversationsWithUndefinedTimestamp = [
      {
        ...mockConversations[0],
        lastMessageAt: undefined,
      },
    ];

    render(
      <ConversationsSidebar
        conversations={conversationsWithUndefinedTimestamp}
        selectedConversation={null}
        onSelectConversation={mockOnSelectConversation}
        onNewConversation={mockOnNewConversation}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});