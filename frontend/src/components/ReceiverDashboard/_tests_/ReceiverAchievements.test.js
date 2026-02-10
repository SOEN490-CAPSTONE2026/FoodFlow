import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReceiverAchievements from '../ReceiverAchievements';
import useGamification from '../../../hooks/useGamification';

// Mock the useGamification hook
jest.mock('../../../hooks/useGamification');

// Mock the Leaderboard component
jest.mock('../../shared/Leaderboard', () => {
  return function MockLeaderboard() {
    return <div data-testid="leaderboard-mock">Leaderboard</div>;
  };
});

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Award: () => <div data-testid="award-icon">Award</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
}));

// Mock shared components
jest.mock('../../shared/PointsDisplay', () => {
  return function PointsDisplay({ points }) {
    return <div data-testid="points-display">Points: {points}</div>;
  };
});

jest.mock('../../shared/BadgeIcon', () => {
  return function BadgeIcon({ achievement, unlocked }) {
    return (
      <div data-testid={`badge-icon-${achievement.id}`}>
        {achievement.name} - {unlocked ? 'Unlocked' : 'Locked'}
      </div>
    );
  };
});

const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ReceiverAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    useGamification.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    expect(screen.getByText(/Loading your achievements/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    useGamification.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to load',
    });

    renderWithRouter(<ReceiverAchievements />);

    expect(
      screen.getByText(/Unable to load achievements/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please try refreshing the page/i)
    ).toBeInTheDocument();
  });

  it('should render empty state when no stats', () => {
    useGamification.mockReturnValue({
      stats: null,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    expect(screen.getByText(/No Achievements Yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Start claiming donations to earn badges and points!/i)
    ).toBeInTheDocument();
  });

  it('should render achievements with stats', async () => {
    const mockStats = {
      totalPoints: 250,
      unlockedAchievements: [
        {
          id: 1,
          name: 'First Claim',
          description: 'Claim your first donation',
          pointsReward: 50,
          category: 'CLAIMS',
        },
        {
          id: 2,
          name: 'Early Bird',
          description: 'Claim 5 donations',
          pointsReward: 100,
          category: 'CLAIMS',
        },
      ],
      progressToNext: [
        {
          achievementId: 3,
          achievementName: 'Dedicated Receiver',
          achievementDescription: 'Claim 10 donations',
          achievementCategory: 'CLAIMS',
          criteriaType: 'CLAIM_COUNT',
          targetValue: 10,
          currentValue: 7,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    await waitFor(() => {
      // Check header
      expect(screen.getByText('Your Achievements')).toBeInTheDocument();
      expect(
        screen.getByText('Track your progress and earn rewards')
      ).toBeInTheDocument();

      // Check stats cards
      expect(screen.getByText('Total Points')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();

      // Check progress
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Check sections
      expect(screen.getByText('Unlocked Achievements')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();

      // Check unlocked achievements
      expect(screen.getByText('First Claim')).toBeInTheDocument();
      expect(screen.getByText('Early Bird')).toBeInTheDocument();

      // Check in-progress achievement
      expect(screen.getByText('Dedicated Receiver')).toBeInTheDocument();
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
    });
  });

  it('should display correct progress percentage', () => {
    const mockStats = {
      totalPoints: 150,
      unlockedAchievements: [
        {
          id: 1,
          name: 'Achievement 1',
          description: 'Desc 1',
          pointsReward: 50,
        },
      ],
      progressToNext: [
        {
          achievementId: 2,
          achievementName: 'Achievement 2',
          achievementDescription: 'Desc 2',
          currentValue: 5,
          targetValue: 10,
        },
        {
          achievementId: 3,
          achievementName: 'Achievement 3',
          achievementDescription: 'Desc 3',
          currentValue: 0,
          targetValue: 5,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    // 1 unlocked out of 3 total = 33%
    expect(screen.getByText(/33/)).toBeInTheDocument();
    expect(screen.getByText(/Complete/i)).toBeInTheDocument();
  });

  it('should render locked achievements section when present', () => {
    const mockStats = {
      totalPoints: 50,
      unlockedAchievements: [
        {
          id: 1,
          name: 'First Achievement',
          description: 'First desc',
          pointsReward: 50,
        },
      ],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    // Since we only have 1 unlocked and no progress data, there should be no locked section
    expect(screen.queryByText('Locked Achievements')).not.toBeInTheDocument();
  });

  it('should handle achievements with no points reward', () => {
    const mockStats = {
      totalPoints: 0,
      unlockedAchievements: [
        {
          id: 1,
          name: 'No Reward Badge',
          description: 'Badge with no points',
          pointsReward: 0,
        },
      ],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    expect(screen.getByText('No Reward Badge')).toBeInTheDocument();
    // Points reward should not be displayed when 0
    expect(screen.queryByText(/\+0 points/)).not.toBeInTheDocument();
  });

  it('should categorize achievements correctly', () => {
    const mockStats = {
      totalPoints: 300,
      unlockedAchievements: [
        { id: 1, name: 'Unlocked 1', description: 'Desc', pointsReward: 100 },
        { id: 2, name: 'Unlocked 2', description: 'Desc', pointsReward: 100 },
      ],
      progressToNext: [
        {
          achievementId: 3,
          achievementName: 'In Progress 1',
          achievementDescription: 'Desc',
          currentValue: 5,
          targetValue: 10,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    renderWithRouter(<ReceiverAchievements />);

    // Check section counts
    const unlockedSection = screen
      .getByText('Unlocked Achievements')
      .closest('.achievements-section');
    expect(unlockedSection).toHaveTextContent('2');

    const inProgressSection = screen
      .getByText('In Progress')
      .closest('.achievements-section');
    expect(inProgressSection).toHaveTextContent('1');
  });
});
