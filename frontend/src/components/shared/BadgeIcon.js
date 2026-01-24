import React, { useState } from 'react';
import {
  Gift,
  Trophy,
  Award,
  Heart,
  Users,
  Zap,
  Star,
  Medal,
} from 'lucide-react';
import './BadgeDisplay.css';

/**
 * Map achievement categories to icons
 */
const getAchievementIcon = (name, category) => {
  // Try to match by name first
  const nameLower = name.toLowerCase();

  if (nameLower.includes('first') && nameLower.includes('donation')) {
    return Gift;
  }
  if (nameLower.includes('5') || nameLower.includes('five')) {
    return Trophy;
  }
  if (nameLower.includes('10') || nameLower.includes('ten')) {
    return Award;
  }
  if (nameLower.includes('claim')) {
    return Heart;
  }
  if (nameLower.includes('community') || nameLower.includes('helper')) {
    return Users;
  }
  if (nameLower.includes('quick') || nameLower.includes('fast')) {
    return Zap;
  }
  if (nameLower.includes('milestone')) {
    return Star;
  }

  // Fallback to category
  if (category === 'MILESTONE') {
    return Medal;
  }
  if (category === 'ENGAGEMENT') {
    return Zap;
  }
  if (category === 'COMMUNITY') {
    return Users;
  }

  // Default
  return Trophy;
};

/**
 * BadgeIcon component - Displays individual badge with tooltip
 * @param {Object} props
 * @param {Object} props.achievement - Achievement data
 * @param {boolean} props.unlocked - Whether badge is unlocked
 * @param {Object} props.progress - Progress data (for locked badges)
 */
const BadgeIcon = ({ achievement, unlocked = false, progress = null }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const Icon = getAchievementIcon(achievement.name, achievement.category);

  const getProgressText = () => {
    if (!progress) {
      return null;
    }
    return `${progress.currentValue || 0} / ${achievement.criteriaValue}`;
  };

  return (
    <div
      className={`badge-icon ${unlocked ? 'unlocked' : 'locked'}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="badge-icon-wrapper">
        <Icon size={32} />
      </div>

      {showTooltip && (
        <div className="badge-tooltip">
          <div className="badge-tooltip-header">
            <strong>{achievement.name}</strong>
            {unlocked && (
              <span className="badge-unlocked-indicator">✓ Unlocked</span>
            )}
          </div>
          <p className="badge-tooltip-description">{achievement.description}</p>

          {!unlocked && (
            <div className="badge-tooltip-criteria">
              <span className="criteria-label">Unlock Criteria:</span>
              <span className="criteria-value">
                {achievement.criteriaValue}{' '}
                {achievement.criteriaType.toLowerCase().replace('_', ' ')}
              </span>
              {progress && (
                <div className="badge-progress">
                  <div className="badge-progress-bar">
                    <div
                      className="badge-progress-fill"
                      style={{
                        width: `${(progress.currentValue / achievement.criteriaValue) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="badge-progress-text">
                    {getProgressText()}
                  </span>
                </div>
              )}
            </div>
          )}

          {unlocked && achievement.pointsReward > 0 && (
            <div className="badge-tooltip-reward">
              +{achievement.pointsReward} points earned
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeIcon;
