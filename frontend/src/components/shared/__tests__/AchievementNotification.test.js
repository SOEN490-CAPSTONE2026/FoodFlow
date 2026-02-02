import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AchievementNotification from '../AchievementNotification';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('AchievementNotification', () => {
  const mockAchievement = {
    achievementId: 1,
    name: 'First Donation',
    description: 'Made your first donation',
    badgeIcon: '🎉',
    pointsValue: 10,
    category: 'DONATION',
    earnedAt: '2026-02-01T10:00:00',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders achievement notification with correct data', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('First Donation')).toBeInTheDocument();
    expect(screen.getByText('Made your first donation')).toBeInTheDocument();
    expect(screen.getByText('+10 points')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
  });

  test('auto-dismisses after 5 seconds', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onClose={mockOnClose}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('closes when close button clicked', () => {
    render(
      <AchievementNotification
        achievement={mockAchievement}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('renders confetti elements', () => {
    const { container } = render(
      <AchievementNotification
        achievement={mockAchievement}
        onClose={mockOnClose}
      />
    );

    const confetti = container.querySelectorAll('.confetti');
    expect(confetti.length).toBe(15);
  });

  test('does not render when achievement is null', () => {
    const { container } = render(
      <AchievementNotification achievement={null} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders trophy icon', () => {
    const { container } = render(
      <AchievementNotification
        achievement={mockAchievement}
        onClose={mockOnClose}
      />
    );

    const trophyIcon = container.querySelector('.trophy-icon');
    expect(trophyIcon).toBeInTheDocument();
  });
});
