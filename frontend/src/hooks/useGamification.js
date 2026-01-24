import { useState, useEffect, useContext, useCallback } from 'react';
import { gamificationAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to fetch and manage gamification data (points, badges, achievements)
 * @returns {Object} Gamification data and utility functions
 */
export const useGamification = () => {
  const { userId } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGamificationData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await gamificationAPI.getUserStats(userId);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setError(err.message || 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  /**
   * Manually refresh gamification data
   */
  const refresh = () => {
    fetchGamificationData();
  };

  return {
    stats: data,
    loading,
    error,
    refresh,
  };
};

export default useGamification;
