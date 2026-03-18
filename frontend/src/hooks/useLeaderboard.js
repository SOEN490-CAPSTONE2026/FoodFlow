import { useQuery } from '@tanstack/react-query';
import { gamificationAPI } from '../services/api';

/**
 * Custom hook to fetch leaderboard data for a specific role.
 * Uses React Query for caching and automatic refetching.
 *
 * @param {string} role - User role ('DONOR' or 'RECEIVER')
 * @returns {Object} Query result with leaderboard data, loading, and error states
 */
const useLeaderboard = role => {
  return useQuery({
    queryKey: ['leaderboard', role],
    queryFn: async () => {
      const response = await gamificationAPI.getLeaderboard(role);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches backend cache
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    enabled: !!role, // Only run query if role is provided
    retry: 2, // Retry failed requests twice
  });
};

export default useLeaderboard;
