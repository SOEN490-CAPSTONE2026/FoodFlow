import React from 'react';
import { render, screen } from '@testing-library/react';
import LeaderboardEntry from '../LeaderboardEntry';

describe('LeaderboardEntry Component', () => {
  const mockEntry = {
    userId: 1,
    userName: 'Test User',
    totalPoints: 500,
    rank: 1,
  };

  it('renders entry with all information', () => {
    render(<LeaderboardEntry entry={mockEntry} rank={1} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('pts')).toBeInTheDocument();
  });

  it('renders gold medal for rank 1', () => {
    const { container } = render(
      <LeaderboardEntry entry={mockEntry} rank={1} />
    );

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(container.querySelector('.entry-rank')).toBeInTheDocument();
  });

  it('renders silver medal for rank 2', () => {
    const { container } = render(
      <LeaderboardEntry entry={{ ...mockEntry, rank: 2 }} rank={2} />
    );

    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(container.querySelector('.entry-rank')).toBeInTheDocument();
  });

  it('renders bronze medal for rank 3', () => {
    const { container } = render(
      <LeaderboardEntry entry={{ ...mockEntry, rank: 3 }} rank={3} />
    );

    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(container.querySelector('.entry-rank')).toBeInTheDocument();
  });

  it('renders regular rank for rank 4+', () => {
    const { container } = render(
      <LeaderboardEntry entry={{ ...mockEntry, rank: 4 }} rank={4} />
    );

    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(container.querySelector('.entry-rank')).toBeInTheDocument();
  });

  it('highlights current user entry', () => {
    const currentUserEntry = { ...mockEntry, isCurrentUser: true };
    const { container } = render(
      <LeaderboardEntry entry={currentUserEntry} rank={1} />
    );

    expect(container.firstChild).toHaveClass(
      'leaderboard-entry',
      'current-user'
    );
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('does not show "You" badge for other users', () => {
    const otherUserEntry = { ...mockEntry, isCurrentUser: false };
    render(<LeaderboardEntry entry={otherUserEntry} rank={1} />);

    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('formats large point numbers with comma', () => {
    const entryWithManyPoints = { ...mockEntry, totalPoints: 1500 };
    render(<LeaderboardEntry entry={entryWithManyPoints} rank={1} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
  });
});
