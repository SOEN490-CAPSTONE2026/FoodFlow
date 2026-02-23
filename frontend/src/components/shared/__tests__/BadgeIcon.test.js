import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BadgeIcon from '../BadgeIcon';

jest.mock('lucide-react', () => ({
  Gift: () => <div data-testid="icon-gift" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Award: () => <div data-testid="icon-award" />,
  Heart: () => <div data-testid="icon-heart" />,
  Users: () => <div data-testid="icon-users" />,
  Zap: () => <div data-testid="icon-zap" />,
  Star: () => <div data-testid="icon-star" />,
  Medal: () => <div data-testid="icon-medal" />,
}));

describe('BadgeIcon', () => {
  const baseAchievement = {
    name: 'First Donation',
    description: 'Complete your first donation',
    category: 'MILESTONE',
    criteriaType: 'DONATION_COUNT',
    criteriaValue: 5,
    pointsReward: 10,
  };

  test('renders locked badge by default and shows tooltip on hover', () => {
    const { container } = render(<BadgeIcon achievement={baseAchievement} />);

    expect(container.querySelector('.badge-icon.locked')).toBeInTheDocument();
    expect(
      screen.queryByText('Complete your first donation')
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(container.querySelector('.badge-icon'));
    expect(
      screen.getByText('Complete your first donation')
    ).toBeInTheDocument();
    expect(screen.getByTestId('icon-gift')).toBeInTheDocument();
  });

  test('hides tooltip on mouse leave', () => {
    const { container } = render(<BadgeIcon achievement={baseAchievement} />);

    fireEvent.mouseEnter(container.querySelector('.badge-icon'));
    expect(
      screen.getByText('Complete your first donation')
    ).toBeInTheDocument();

    fireEvent.mouseLeave(container.querySelector('.badge-icon'));
    expect(
      screen.queryByText('Complete your first donation')
    ).not.toBeInTheDocument();
  });

  test('renders unlocked badge state and reward text', () => {
    const { container } = render(
      <BadgeIcon achievement={baseAchievement} unlocked={true} />
    );

    expect(container.querySelector('.badge-icon.unlocked')).toBeInTheDocument();

    fireEvent.mouseEnter(container.querySelector('.badge-icon'));
    expect(screen.getByText('✓ Unlocked')).toBeInTheDocument();
    expect(screen.getByText('+10 points earned')).toBeInTheDocument();
    expect(screen.queryByText('Unlock Criteria:')).not.toBeInTheDocument();
  });

  test('renders lock criteria and progress for locked badge with progress', () => {
    const { container } = render(
      <BadgeIcon achievement={baseAchievement} progress={{ currentValue: 2 }} />
    );

    fireEvent.mouseEnter(container.querySelector('.badge-icon'));

    expect(screen.getByText('Unlock Criteria:')).toBeInTheDocument();
    expect(screen.getByText('5 donation count')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
    expect(container.querySelector('.badge-progress-fill')).toHaveStyle({
      width: '40%',
    });
  });

  test('progress text falls back to zero when currentValue is missing', () => {
    const { container } = render(
      <BadgeIcon achievement={baseAchievement} progress={{}} />
    );

    fireEvent.mouseEnter(container.querySelector('.badge-icon'));
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
  });

  test('uses icon mapping by achievement name and category fallback', () => {
    const cases = [
      { name: 'Five donations', category: 'ANY', icon: 'icon-trophy' },
      { name: 'Ten donations', category: 'ANY', icon: 'icon-award' },
      { name: 'Claim hero', category: 'ANY', icon: 'icon-heart' },
      { name: 'Community helper', category: 'ANY', icon: 'icon-users' },
      { name: 'Quick responder', category: 'ANY', icon: 'icon-zap' },
      { name: 'Milestone unlocked', category: 'ANY', icon: 'icon-star' },
      { name: 'Plain name', category: 'MILESTONE', icon: 'icon-medal' },
      { name: 'Plain name', category: 'ENGAGEMENT', icon: 'icon-zap' },
      { name: 'Plain name', category: 'COMMUNITY', icon: 'icon-users' },
      { name: 'Unknown', category: 'OTHER', icon: 'icon-trophy' },
    ];

    cases.forEach(({ name, category, icon }) => {
      const { unmount } = render(
        <BadgeIcon
          achievement={{
            ...baseAchievement,
            name,
            category,
            pointsReward: 0,
          }}
        />
      );
      expect(screen.getByTestId(icon)).toBeInTheDocument();
      unmount();
    });
  });
});
