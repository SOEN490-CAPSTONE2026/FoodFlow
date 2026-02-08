import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DonorAchievements from '../DonorAchievements';
import useGamification from '../../../hooks/useGamification';

// Mock the useGamification hook
jest.mock('../../../hooks/useGamification');

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock BadgeIcon component
jest.mock('../../shared/BadgeIcon', () => {
  return function BadgeIcon({ achievement, unlocked }) {
    return (
      <div data-testid={`badge-icon-${achievement.id}`}>
        {achievement.name} - {unlocked ? 'Unlocked' : 'Locked'}
      </div>
    );
  };
});

// Mock PointsDisplay component
jest.mock('../../shared/PointsDisplay', () => {
  return function PointsDisplay() {
    return <div data-testid="points-display">Points Display</div>;
  };
});

describe('DonorAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    useGamification.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(<DonorAchievements />);
    expect(screen.getByText(/Loading your achievements/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    useGamification.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to load',
    });

    render(<DonorAchievements />);
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

    render(<DonorAchievements />);
    expect(screen.getByText(/No Achievements Yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Start donating food to earn badges and points!/i)
    ).toBeInTheDocument();
  });

  it('should render achievements with stats', async () => {
    const mockStats = {
      totalPoints: 150,
      unlockedAchievements: [
        {
          id: 1,
          name: 'First Donation',
          description: 'Complete your first donation',
          category: 'DONATIONS',
          criteriaType: 'DONATION_COUNT',
          criteriaValue: 1,
          pointsReward: 50,
        },
      ],
      progressToNext: [
        {
          achievementId: 3,
          achievementName: 'Dedicated Donor',
          achievementDescription: 'Complete 10 donations',
          achievementCategory: 'DONATIONS',
          criteriaType: 'DONATION_COUNT',
          targetValue: 10,
          currentValue: 5,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    const { container } = render(<DonorAchievements />);

    await waitFor(() => {
      // Check header
      expect(screen.getByText('Your Achievements')).toBeInTheDocument();
      expect(
        screen.getByText('Track your progress and earn rewards')
      ).toBeInTheDocument();

      // Check stats
      expect(screen.getByText('150')).toBeInTheDocument(); // Total points

      // Check unlocked achievements
      expect(screen.getByText('First Donation')).toBeInTheDocument();
      expect(
        screen.getByText('Complete your first donation')
      ).toBeInTheDocument();

      // Check in-progress achievement
      expect(screen.getByText('Dedicated Donor')).toBeInTheDocument();
      expect(screen.getByText('Complete 10 donations')).toBeInTheDocument();
      
      // Check progress in the specific achievement card
      const progressSection = container.querySelector('.achievement-progress');
      expect(progressSection).toHaveTextContent('5');
      expect(progressSection).toHaveTextContent('10');
    });
  });

  it('should categorize achievements correctly', () => {
    const mockStats = {
      totalPoints: 200,
      unlockedAchievements: [
        {
          id: 1,
          name: 'Unlocked 1',
          description: 'Description 1',
          pointsReward: 50,
        },
        {
          id: 2,
          name: 'Unlocked 2',
          description: 'Description 2',
          pointsReward: 50,
        },
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

    render(<DonorAchievements />);

    // Check section headers and counts
    const unlockedSection = screen
      .getByText('Unlocked Achievements')
      .closest('.achievements-section');
    expect(unlockedSection).toHaveTextContent('2');

    const inProgressSection = screen
      .getByText('In Progress')
      .closest('.achievements-section');
    expect(inProgressSection).toHaveTextContent('1');
  });

  it('should render locked achievements section when present', () => {
    const mockStats = {
      totalPoints: 100,
      unlockedAchievements: [],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(<DonorAchievements />);

    // Should show empty state since no achievements
    expect(screen.getByText(/No Achievements Yet/i)).toBeInTheDocument();
  });

  it('should handle achievements with no points reward', () => {
    const mockStats = {
      totalPoints: 0,
      unlockedAchievements: [
        {
          id: 1,
          name: 'Test Achievement',
          description: 'Test Description',
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

    render(<DonorAchievements />);

    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    // Should not show points reward badge since pointsReward is 0
    expect(screen.queryByText(/\+0 points/i)).not.toBeInTheDocument();
  });

  it('should display progress bars for in-progress achievements', () => {
    const mockStats = {
      totalPoints: 50,
      unlockedAchievements: [],
      progressToNext: [
        {
          achievementId: 1,
          achievementName: 'Progress Achievement',
          achievementDescription: 'Test',
          currentValue: 7,
          targetValue: 10,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(<DonorAchievements />);

    expect(screen.getByText(/7/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();

    // Check for progress bar
    const progressBar = document.querySelector('.progress-bar-mini-fill');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '70%' });
  });

  it('should calculate progress percentage correctly', () => {
    const mockStats = {
      totalPoints: 150,
      unlockedAchievements: [
        { id: 1, name: 'Ach 1', description: 'D1', pointsReward: 50 },
        { id: 2, name: 'Ach 2', description: 'D2', pointsReward: 50 },
      ],
      progressToNext: [
        {
          achievementId: 3,
          achievementName: 'Ach 3',
          achievementDescription: 'D3',
          currentValue: 5,
          targetValue: 10,
        },
        {
          achievementId: 4,
          achievementName: 'Ach 4',
          achievementDescription: 'D4',
          currentValue: 0,
          targetValue: 10,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    const { container } = render(<DonorAchievements />);

    // 2 unlocked out of 4 total = 50%
    // Check progress stat card specifically
    const statCards = container.querySelectorAll('.stat-card');
    const progressCard = statCards[1]; // Second card is progress
    expect(progressCard).toHaveTextContent('2');
    expect(progressCard).toHaveTextContent('4');
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('should display stats overview correctly', () => {
    const mockStats = {
      totalPoints: 250,
      unlockedAchievements: [
        { id: 1, name: 'Achievement 1', description: 'D1', pointsReward: 100 },
        { id: 2, name: 'Achievement 2', description: 'D2', pointsReward: 150 },
      ],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    const { container } = render(<DonorAchievements />);

    // Total Points
    expect(screen.getByText('Total Points')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();

    // Progress
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('100% Complete')).toBeInTheDocument();

    // Unlocked Badges
    expect(screen.getByText('Unlocked Badges')).toBeInTheDocument();
    const statCards = container.querySelectorAll('.stat-card');
    const badgesCard = statCards[2]; // Third card is badges
    expect(badgesCard).toHaveTextContent('2');
  });

  it('should handle empty progressToNext array', () => {
    const mockStats = {
      totalPoints: 100,
      unlockedAchievements: [
        {
          id: 1,
          name: 'Only Achievement',
          description: 'D',
          pointsReward: 100,
        },
      ],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(<DonorAchievements />);

    expect(screen.getByText('Only Achievement')).toBeInTheDocument();
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Locked Achievements')).not.toBeInTheDocument();
  });

  it('should not render sections for empty categories', () => {
    const mockStats = {
      totalPoints: 50,
      unlockedAchievements: [],
      progressToNext: [
        {
          achievementId: 1,
          achievementName: 'Only In Progress',
          achievementDescription: 'Test',
          currentValue: 3,
          targetValue: 10,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(<DonorAchievements />);

    expect(screen.queryByText('Unlocked Achievements')).not.toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.queryByText('Locked Achievements')).not.toBeInTheDocument();
  });

  it('should handle progress bar with 100% completion', () => {
    const mockStats = {
      totalPoints: 50,
      unlockedAchievements: [],
      progressToNext: [
        {
          achievementId: 1,
          achievementName: 'Almost Done',
          achievementDescription: 'Test',
          currentValue: 10,
          targetValue: 10,
        },
      ],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(<DonorAchievements />);

    const progressBar = document.querySelector('.progress-bar-mini-fill');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('should use green color theme classes', () => {
    const mockStats = {
      totalPoints: 100,
      unlockedAchievements: [
        { id: 1, name: 'Test', description: 'Test', pointsReward: 100 },
      ],
      progressToNext: [],
    };

    useGamification.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    const { container } = render(<DonorAchievements />);

    // Check for donor-specific classes
    expect(
      container.querySelector('.donor-achievements-container')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.donor-achievements-header')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.donor-stats-overview')
    ).toBeInTheDocument();
  });
});
