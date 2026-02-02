import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, X } from 'lucide-react';
import BadgeIcon from './BadgeIcon';
import './AchievementNotification.css';

const AchievementNotification = ({ achievement, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!achievement) {
      return;
    }

    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for exit animation
  };

  if (!achievement) {
    return null;
  }

  return (
    <div className={`achievement-notification ${isVisible ? 'visible' : ''}`}>
      {/* Confetti animation */}
      <div className="confetti-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`confetti confetti-${i % 5}`} />
        ))}
      </div>

      {/* Close button */}
      <button
        className="achievement-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={20} />
      </button>

      {/* Content */}
      <div className="achievement-content">
        <div className="achievement-header">
          <Trophy className="trophy-icon" size={24} />
          <span className="achievement-title">
            {t('achievements.unlocked', 'Achievement Unlocked!')}
          </span>
        </div>

        <div className="achievement-body">
          <div className="achievement-badge">
            <BadgeIcon
              achievement={{
                name: achievement.name,
                category: achievement.category,
                criteriaValue: 0,
                criteriaType: 'MESSAGE_COUNT',
                pointsReward: achievement.pointsValue || 0,
              }}
              unlocked={true}
              progress={null}
            />
            <div className="badge-glow"></div>
          </div>

          <div className="achievement-details">
            <h3 className="achievement-name">{achievement.name}</h3>
            <p className="achievement-description">{achievement.description}</p>
            <div className="achievement-points">
              <span className="points-badge">
                +{achievement.pointsValue} {t('achievements.points', 'points')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
