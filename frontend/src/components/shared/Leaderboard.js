import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useLeaderboard from '../../hooks/useLeaderboard';
import LeaderboardEntry from './LeaderboardEntry';
import './Leaderboard.css';

/**
 * Leaderboard component - displays top 10 users and current user's position
 *
 * @param {Object} props
 * @param {string} props.role - User role ('DONOR' or 'RECEIVER')
 */
const Leaderboard = ({ role }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: leaderboard, isLoading, error, refetch } = useLeaderboard(role);

  // Manual refresh handler
  const handleRefresh = () => {
    queryClient.invalidateQueries(['leaderboard', role]);
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <Trophy size={24} />
          <h2>{t('leaderboard.title', 'Leaderboard')}</h2>
        </div>
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>{t('leaderboard.loading', 'Loading leaderboard...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <Trophy size={24} />
          <h2>{t('leaderboard.title', 'Leaderboard')}</h2>
        </div>
        <div className="leaderboard-error">
          <AlertCircle size={48} />
          <h3>{t('leaderboard.error', 'Unable to load leaderboard')}</h3>
          <p>
            {t('leaderboard.errorMessage', 'Please try refreshing the page')}
          </p>
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw size={16} />
            {t('leaderboard.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!leaderboard || leaderboard.topUsers.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <Trophy size={24} />
          <h2>{t('leaderboard.title', 'Leaderboard')}</h2>
        </div>
        <div className="leaderboard-empty">
          <Trophy size={64} />
          <h3>{t('leaderboard.noData', 'No leaderboard data yet')}</h3>
          <p>
            {t(
              'leaderboard.noDataMessage',
              'Be the first to earn points and climb the leaderboard!'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="header-left">
          <Trophy size={24} />
          <h2>
            {role === 'DONOR'
              ? t('leaderboard.topDonors', 'Top Donors')
              : t('leaderboard.topReceivers', 'Top Receivers')}
          </h2>
        </div>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          title={t('leaderboard.refresh', 'Refresh')}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Top 10 Users */}
      <div className="leaderboard-list">
        {leaderboard.topUsers.map(entry => (
          <LeaderboardEntry
            key={entry.userId}
            entry={entry}
            showMedals={true}
          />
        ))}
      </div>

      {/* Current User Position (if outside top 10) */}
      {leaderboard.currentUserEntry && (
        <div className="current-user-section">
          <div className="divider">
            <span>{t('leaderboard.yourPosition', 'Your Position')}</span>
          </div>
          <LeaderboardEntry
            entry={leaderboard.currentUserEntry}
            showMedals={false}
          />
          <p className="encouragement-text">
            {t(
              'leaderboard.keepGoing',
              'Keep contributing to climb the leaderboard!'
            )}
          </p>
        </div>
      )}

      {/* Footer Stats */}
      <div className="leaderboard-footer">
        <p>
          {t('leaderboard.totalUsers', {
            count: leaderboard.totalUsers,
            defaultValue: `${leaderboard.totalUsers} total users`,
          })}
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
