import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import './Leaderboard.css';

/**
 * LeaderboardEntry component - displays a single leaderboard entry
 *
 * @param {Object} props
 * @param {Object} props.entry - Leaderboard entry data
 * @param {number} props.entry.rank - User's rank position
 * @param {string} props.entry.displayName - User's display name
 * @param {number} props.entry.totalPoints - User's total points
 * @param {boolean} props.entry.isCurrentUser - Whether this is the current user
 * @param {boolean} props.showMedals - Whether to show medal icons for top 3
 */
const LeaderboardEntry = ({ entry, showMedals = true }) => {
  const { t } = useTranslation();

  // Get medal for top 3 positions
  const getMedalIcon = rank => {
    if (!showMedals) {
      return null;
    }

    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const medal = getMedalIcon(entry.rank);

  return (
    <div
      className={`leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''} ${medal ? 'top-three' : ''}`}
    >
      <div className="entry-rank">{medal || `#${entry.rank}`}</div>

      <div className="entry-avatar">
        <div className="avatar-placeholder">
          {(entry.userName || entry.displayName || 'U').charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="entry-info">
        <div className="entry-name">
          {entry.userName || entry.displayName}
          {entry.isCurrentUser && (
            <span className="you-badge">{t('leaderboard.you', 'You')}</span>
          )}
        </div>
      </div>

      <div className="entry-points">
        <TrendingUp size={16} className="points-icon" />
        <span className="points-value">
          {entry.totalPoints.toLocaleString()}
        </span>
        <span className="points-label">{t('leaderboard.pts', 'pts')}</span>
      </div>
    </div>
  );
};

export default LeaderboardEntry;
