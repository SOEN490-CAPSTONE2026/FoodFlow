import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Leaderboard from '../Leaderboard';
import useLeaderboard from '../../../hooks/useLeaderboard';

// Mock the hooks
jest.mock('../../../hooks/useLeaderboard');
jest.mock('@tanstack/react-query');

// Mock LeaderboardEntry component
jest.mock('../LeaderboardEntry', () => {
  return function MockLeaderboardEntry({ entry }) {
    return (
      <div data-testid="leaderboard-entry">
        {entry.userName} - {entry.totalPoints} pts - Rank: {entry.rank}
        {entry.isCurrentUser && (
          <span data-testid="current-user-badge">You</span>
        )}
      </div>
    );
  };
});

describe('Leaderboard Component', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  it('renders loading state', () => {
    useLeaderboard.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    useLeaderboard.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByText(/unable to load leaderboard/i)).toBeInTheDocument();
  });

  it('renders empty state when no users', () => {
    useLeaderboard.mockReturnValue({
      data: { topUsers: [], currentUserRank: null },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByText(/no leaderboard data yet/i)).toBeInTheDocument();
  });

  it('renders leaderboard with top users', () => {
    const mockData = {
      topUsers: [
        { userId: 1, userName: 'User 1', totalPoints: 500, rank: 1 },
        { userId: 2, userName: 'User 2', totalPoints: 400, rank: 2 },
        { userId: 3, userName: 'User 3', totalPoints: 300, rank: 3 },
      ],
      currentUserRank: null,
    };

    useLeaderboard.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByText(/top donors/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('leaderboard-entry')).toHaveLength(3);
  });

  it('renders with receiver role', () => {
    const mockData = {
      topUsers: [
        { userId: 1, userName: 'Receiver 1', totalPoints: 500, rank: 1 },
      ],
      currentUserRank: null,
    };

    useLeaderboard.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="RECEIVER" />);

    expect(screen.getByText(/top receivers/i)).toBeInTheDocument();
  });

  it('renders current user rank when outside top 10', () => {
    const mockData = {
      topUsers: [{ userId: 1, userName: 'User 1', totalPoints: 500, rank: 1 }],
      currentUserEntry: {
        userId: 99,
        userName: 'Current User',
        totalPoints: 50,
        rank: 25,
        isCurrentUser: true,
      },
    };

    useLeaderboard.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByText(/your position/i)).toBeInTheDocument();
    expect(screen.getByTestId('current-user-badge')).toBeInTheDocument();
  });

  it('calls refetch when refresh button is clicked', () => {
    const mockRefetch = jest.fn();
    const mockData = {
      topUsers: [{ userId: 1, userName: 'User 1', totalPoints: 500, rank: 1 }],
      currentUserRank: null,
    };

    useLeaderboard.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Leaderboard role="DONOR" />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith([
      'leaderboard',
      'DONOR',
    ]);
  });

  it('highlights current user in top 10', () => {
    const mockData = {
      topUsers: [
        { userId: 1, userName: 'User 1', totalPoints: 500, rank: 1 },
        {
          userId: 2,
          userName: 'Current User',
          totalPoints: 400,
          rank: 2,
          isCurrentUser: true,
        },
      ],
      currentUserRank: null,
    };

    useLeaderboard.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Leaderboard role="DONOR" />);

    expect(screen.getByTestId('current-user-badge')).toBeInTheDocument();
  });
});
