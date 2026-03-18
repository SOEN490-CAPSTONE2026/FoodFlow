import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, TrendingUp, Target } from 'lucide-react';
import useGamification from '../../hooks/useGamification';
import PointsDisplay from '../shared/PointsDisplay';
import BadgeIcon from '../shared/BadgeIcon';
import Leaderboard from '../shared/Leaderboard';
import { translateAchievement } from '../../utils/achievementsI18n';
import './Donor_Styles/DonorAchievements.css';

/**
 * DonorAchievements - Full-page achievements display for donors
 * Shows all badges, points, and progress with donor green theming
 */
const DonorAchievements = () => {
  const { t } = useTranslation();
  const { stats, loading, error } = useGamification();

  if (loading) {
    return (
      <div className="donor-achievements-container">
        <div className="donor-achievements-loading">
          <div className="loading-spinner"></div>
          <p>{t('achievements.loading', 'Loading your achievements...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donor-achievements-container">
        <div className="donor-achievements-error">
          <Award size={48} />
          <h3>{t('achievements.error', 'Unable to load achievements')}</h3>
          <p>
            {t('achievements.errorMessage', 'Please try refreshing the page')}
          </p>
        </div>
      </div>
    );
  }

  // Handle case where stats is null or empty
  if (!stats) {
    return (
      <div className="donor-achievements-container">
        <div className="donor-achievements-empty">
          <Award size={64} />
          <h2>{t('achievements.noAchievements', 'No Achievements Yet')}</h2>
          <p>
            {t(
              'achievements.startDonating',
              'Start donating food to earn badges and points!'
            )}
          </p>
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
        pointsReward: 0,
        unlocked: false,
        progress: prog,
      })),
  ];

  // Categorize achievements
  const categorizedAchievements = {
    unlocked: allAchievements.filter(ach => ach.unlocked),
    inProgress: allAchievements.filter(ach => !ach.unlocked && ach.progress),
    locked: allAchievements.filter(ach => !ach.unlocked && !ach.progress),
  };

  const totalAchievements = allAchievements.length;
  const unlockedCount = categorizedAchievements.unlocked.length;
  const progressPercentage =
    totalAchievements > 0
      ? Math.round((unlockedCount / totalAchievements) * 100)
      : 0;

  return (
    <div className="donor-achievements-container">
      {/* Header Section */}
      <div className="donor-achievements-header">
        <div className="header-content">
          <div className="header-icon">
            <Award size={48} />
          </div>
          <div className="header-text">
            <h1>{t('achievements.title', 'Your Achievements')}</h1>
            <p>
              {t(
                'achievements.subtitle',
                'Track your progress and earn rewards'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="donor-stats-overview">
        {/* Total Points Card */}
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <h3>{t('achievements.totalPoints', 'Total Points')}</h3>
            <div className="stat-value">{stats.totalPoints || 0}</div>
            <p className="stat-description">
              {t(
                'achievements.pointsDescription',
                'Points earned from achievements'
              )}
            </p>
          </div>
        </div>

        {/* Achievements Progress Card */}
        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">
            <Target size={32} />
          </div>
          <div className="stat-content">
            <h3>{t('achievements.progress', 'Progress')}</h3>
            <div className="stat-value">
              {unlockedCount} / {totalAchievements}
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="stat-description">
              {progressPercentage}% {t('achievements.complete', 'Complete')}
            </p>
          </div>
        </div>

        {/* Unlocked Badges Card */}
        <div className="stat-card stat-card-tertiary">
          <div className="stat-icon">
            <Award size={32} />
          </div>
          <div className="stat-content">
            <h3>{t('achievements.unlockedBadges', 'Unlocked Badges')}</h3>
            <div className="stat-value">{unlockedCount}</div>
            <p className="stat-description">
              {t('achievements.badgesDescription', 'Achievements earned')}
            </p>
          </div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {categorizedAchievements.unlocked.length > 0 && (
        <div className="achievements-section">
          <div className="section-header">
            <h2>{t('achievements.unlocked', 'Unlocked Achievements')}</h2>
            <span className="section-count">
              {categorizedAchievements.unlocked.length}
            </span>
          </div>
          <div className="achievements-grid">
            {categorizedAchievements.unlocked.map(achievement => {
              const localizedAchievement = translateAchievement(t, achievement);
              return (
                <div key={achievement.id} className="achievement-card unlocked">
                  <BadgeIcon
                    achievement={localizedAchievement}
                    unlocked={true}
                    progress={progressMap[achievement.id]}
                    showTooltip={true}
                  />
                  <div className="achievement-info">
                    <h3>{localizedAchievement.name}</h3>
                    <p>{localizedAchievement.description}</p>
                    {achievement.pointsReward > 0 && (
                      <div className="achievement-reward">
                        +{achievement.pointsReward}{' '}
                        {t('achievements.points', 'points')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress Achievements */}
      {categorizedAchievements.inProgress.length > 0 && (
        <div className="achievements-section">
          <div className="section-header">
            <h2>{t('achievements.inProgress', 'In Progress')}</h2>
            <span className="section-count">
              {categorizedAchievements.inProgress.length}
            </span>
          </div>
          <div className="achievements-grid">
            {categorizedAchievements.inProgress.map(achievement => {
              const localizedAchievement = translateAchievement(t, achievement);
              return (
                <div
                  key={achievement.id}
                  className="achievement-card in-progress"
                >
                  <BadgeIcon
                    achievement={localizedAchievement}
                    unlocked={false}
                    progress={achievement.progress}
                    showTooltip={true}
                  />
                  <div className="achievement-info">
                    <h3>{localizedAchievement.name}</h3>
                    <p>{localizedAchievement.description}</p>
                    {achievement.progress && (
                      <div className="achievement-progress">
                        <div className="progress-text">
                          {achievement.progress.currentValue} /{' '}
                          {achievement.progress.targetValue}
                        </div>
                        <div className="progress-bar-mini">
                          <div
                            className="progress-bar-mini-fill"
                            style={{
                              width: `${Math.min(
                                (achievement.progress.currentValue /
                                  achievement.progress.targetValue) *
                                  100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {categorizedAchievements.locked.length > 0 && (
        <div className="achievements-section">
          <div className="section-header">
            <h2>{t('achievements.locked', 'Locked Achievements')}</h2>
            <span className="section-count">
              {categorizedAchievements.locked.length}
            </span>
          </div>
          <div className="achievements-grid">
            {categorizedAchievements.locked.map(achievement => {
              const localizedAchievement = translateAchievement(t, achievement);
              return (
                <div key={achievement.id} className="achievement-card locked">
                  <BadgeIcon
                    achievement={localizedAchievement}
                    unlocked={false}
                    progress={null}
                    showTooltip={true}
                  />
                  <div className="achievement-info">
                    <h3>{localizedAchievement.name}</h3>
                    <p>{localizedAchievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <Leaderboard role="DONOR" />

      {/* Empty State */}
      {allAchievements.length === 0 && (
        <div className="donor-achievements-empty">
          <Award size={64} />
          <h2>{t('achievements.noAchievements', 'No Achievements Yet')}</h2>
          <p>
            {t(
              'achievements.startDonating',
              'Start donating food to earn badges and points!'
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default DonorAchievements;
