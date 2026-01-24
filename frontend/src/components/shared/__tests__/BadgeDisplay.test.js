import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BadgeDisplay from '../BadgeDisplay';
import * as gamificationHook from '../../../hooks/useGamification';

// Mock the hook
jest.mock('../../../hooks/useGamification');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('BadgeDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    gamificationHook.default.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    expect(screen.getByText('Total Points')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.badge-skeleton');
    expect(skeletons.length).toBe(4);
  });

  it('renders error state correctly', () => {
    gamificationHook.default.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to load',
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    expect(screen.getByText('Unable to load achievements')).toBeInTheDocument();
  });

  it('renders empty state when no stats', () => {
    gamificationHook.default.mockReturnValue({
      stats: null,
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    expect(screen.getByText('Start donating to earn badges!')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Points should show 0
  });

  it('renders unlocked badges correctly', async () => {
    const mockStats = {
      totalPoints: 150,
      unlockedAchievements: [
        {
          id: 1,
          name: 'First Donation',
          description: 'Complete your first donation',
          category: 'MILESTONE',
          criteriaType: 'DONATION_COUNT',
          criteriaValue: 1,
          pointsReward: 10,
        },
      ],
      progressToNext: [],
    };

    gamificationHook.default.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });
  });

  it('renders locked badges with progress', async () => {
    const mockStats = {
      totalPoints: 50,
      unlockedAchievements: [],
      progressToNext: [
        {
          achievementId: 2,
          achievementName: '5 Donations',
          achievementDescription: 'Complete 5 donations',
          achievementCategory: 'MILESTONE',
          criteriaType: 'DONATION_COUNT',
          currentValue: 3,
          targetValue: 5,
        },
      ],
    };

    gamificationHook.default.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('0 / 1')).toBeInTheDocument();
    });
  });

  it('shows "View All Achievements" button when more than 6 badges', async () => {
    const mockAchievements = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Achievement ${i + 1}`,
      description: `Description ${i + 1}`,
      category: 'MILESTONE',
      criteriaType: 'DONATION_COUNT',
      criteriaValue: i + 1,
      pointsReward: 10,
    }));

    const mockStats = {
      totalPoints: 200,
      unlockedAchievements: mockAchievements,
      progressToNext: [],
    };

    gamificationHook.default.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View All Achievements')).toBeInTheDocument();
    });
  });

  it('navigates to achievements page when "View All" is clicked', async () => {
    const mockAchievements = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Achievement ${i + 1}`,
      description: `Description ${i + 1}`,
      category: 'MILESTONE',
      criteriaType: 'DONATION_COUNT',
      criteriaValue: i + 1,
      pointsReward: 10,
    }));

    const mockStats = {
      totalPoints: 200,
      unlockedAchievements: mockAchievements,
      progressToNext: [],
    };

    gamificationHook.default.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    const { getByText } = render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    const viewAllButton = getByText('View All Achievements');
    viewAllButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/donor/achievements');
  });

  it('displays points with comma formatting', async () => {
    const mockStats = {
      totalPoints: 1500,
      unlockedAchievements: [],
      progressToNext: [],
    };

    gamificationHook.default.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <BadgeDisplay />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });
  });
});
