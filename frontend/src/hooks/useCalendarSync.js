/**
 * Hook for managing calendar sync operations
 * Provides methods to sync donations and claims to user's calendar
 */
import { useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { calendarAPI } from '../services/api';

export const useCalendarSync = () => {
  const { userId } = useContext(AuthContext);

  /**
   * Trigger calendar sync (syncs all pending events)
   */
  const triggerSync = useCallback(async () => {
    try {
      await calendarAPI.sync();
      console.log('Calendar sync triggered successfully');
      return true;
    } catch (error) {
      console.error('Failed to trigger calendar sync:', error);
      return false;
    }
  }, []);

  /**
   * Check if calendar is connected for current user
   */
  const isCalendarConnected = useCallback(async () => {
    try {
      const response = await calendarAPI.getStatus();
      return response.data?.data?.isConnected || false;
    } catch (error) {
      console.error('Failed to check calendar status:', error);
      return false;
    }
  }, []);

  /**
   * Sync donation to calendar (called when donation is created/updated)
   * The backend will create a CalendarEvent entity and sync it
   */
  const syncDonationToCalendar = useCallback(
    async (donationId, donationData) => {
      try {
        // Check if calendar is connected before attempting sync
        const connected = await isCalendarConnected();
        if (!connected) {
          console.log('Calendar not connected, skipping sync');
          return false;
        }

        // Trigger the sync which will process the donation
        return await triggerSync();
      } catch (error) {
        console.error('Failed to sync donation to calendar:', error);
        return false;
      }
    },
    [triggerSync, isCalendarConnected]
  );

  /**
   * Sync claim to calendar (called when claim is created/updated)
   */
  const syncClaimToCalendar = useCallback(
    async (claimId, claimData) => {
      try {
        // Check if calendar is connected before attempting sync
        const connected = await isCalendarConnected();
        if (!connected) {
          console.log('Calendar not connected, skipping sync');
          return false;
        }

        // Trigger the sync which will process the claim
        return await triggerSync();
      } catch (error) {
        console.error('Failed to sync claim to calendar:', error);
        return false;
      }
    },
    [triggerSync, isCalendarConnected]
  );

  return {
    triggerSync,
    isCalendarConnected,
    syncDonationToCalendar,
    syncClaimToCalendar,
  };
};

export default useCalendarSync;
