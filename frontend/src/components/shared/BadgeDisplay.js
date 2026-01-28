import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import useGamification from '../../hooks/useGamification';
import PointsDisplay from './PointsDisplay';
import BadgeIcon from './BadgeIcon';
import './BadgeDisplay.css';

/**
 * BadgeDisplay component - Main container for gamification display
 * Shows points and badges in the donor sidebar
 */
const BadgeDisplay = () => {
  const navigate = useNavigate();
  const { stats, loading, error } = useGamification();

  if (error) {
    return (
      <div className="badge-display-error">
        <p>Unable to load achievements</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="badge-display-container">
        <PointsDisplay loading={true} />
        <div className="badges-grid loading">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="badge-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // Handle case where stats is null or empty
  if (!stats) {
    return (
      <div className="badge-display-container">
        <PointsDisplay points={0} />
        <div className="badges-empty">
          <p>Start donating to earn badges!</p>
        </div>
      </div>
    );
  }

  // Get unlocked achievements
  const unlockedAchievements = stats.unlockedAchievements || [];

  // Get progress for locked achievements
  const progressData = stats.progressToNext || [];

  // Create a map of achievement progress by achievement ID
  const progressMap = {};
  progressData.forEach(prog => {
    progressMap[prog.achievementId] = prog;
  });

  // Combine unlocked and in-progress achievements
  const allAchievements = [
    ...unlockedAchievements.map(ach => ({ ...ach, unlocked: true })),
    ...progressData
      .filter(
        prog => !unlockedAchievements.find(ach => ach.id === prog.achievementId)
      )
      .map(prog => ({
        id: prog.achievementId,
        name: prog.achievementName,
        description: prog.achievementDescription,
        category: prog.achievementCategory,
        criteriaType: prog.criteriaType,
        criteriaValue: prog.targetValue,
        pointsReward: 0, // We don't have this in progress data
        unlocked: false,
        progress: prog,
      })),
  ];

  // Limit to 6 badges for sidebar display
  const displayedBadges = allAchievements.slice(0, 6);
  const hasMore = allAchievements.length > 6;

  const handleViewAll = () => {
    navigate('/donor/achievements');
  };

  return (
    <div className="badge-display-container">
      <PointsDisplay points={stats.totalPoints || 0} />

      <div className="badges-section">
        <div className="badges-header">
          <h4>Achievements</h4>
          <span className="badges-count">
            {unlockedAchievements.length} / {allAchievements.length}
          </span>
        </div>

        {displayedBadges.length === 0 ? (
          <div className="badges-empty">
            <p>Start donating to earn badges!</p>
          </div>
        ) : (
          <div className="badges-grid">
            {displayedBadges.map(achievement => (
              <BadgeIcon
                key={achievement.id}
                achievement={achievement}
                unlocked={achievement.unlocked}
                progress={achievement.progress || progressMap[achievement.id]}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <button className="view-all-btn" onClick={handleViewAll}>
            View All Achievements
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BadgeDisplay;
