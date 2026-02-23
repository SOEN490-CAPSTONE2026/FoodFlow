import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import './BadgeDisplay.css';

/**
 * PointsDisplay component - Shows user's total points
 * @param {Object} props
 * @param {number} props.points - Total points
 * @param {boolean} props.loading - Loading state
 */
const PointsDisplay = ({ points = 0, loading = false }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="points-display loading">
        <div className="points-icon-skeleton"></div>
        <div className="points-content-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="points-display">
      <div className="points-icon">
        <Trophy size={24} />
      </div>
      <div className="points-content">
        <span className="points-label">
          {t('achievements.totalPoints', 'Total Points')}
        </span>
        <span className="points-value">{points.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PointsDisplay;
