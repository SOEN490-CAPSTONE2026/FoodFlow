import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarSync } from '../useCalendarSync';
import { calendarAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the API
jest.mock('../../services/api', () => ({
  calendarAPI: {
    sync: jest.fn(),
    getStatus: jest.fn(),
  },
}));

describe('useCalendarSync', () => {
  const mockUserId = 'test-user-123';

  const wrapper = ({ children, userId = mockUserId }) => (
    <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('triggerSync', () => {
    it('should trigger sync successfully', async () => {
      calendarAPI.sync.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.triggerSync();

      expect(calendarAPI.sync).toHaveBeenCalled();
      expect(success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        'Calendar sync triggered successfully'
      );
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      calendarAPI.sync.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.triggerSync();

      expect(calendarAPI.sync).toHaveBeenCalled();
      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to trigger calendar sync:',
        error
      );
    });

    it('should be memoized and not change between renders', () => {
      const { result, rerender } = renderHook(() => useCalendarSync(), {
        wrapper,
      });

      const firstTriggerSync = result.current.triggerSync;
      rerender();
      const secondTriggerSync = result.current.triggerSync;

      expect(firstTriggerSync).toBe(secondTriggerSync);
    });
  });

  describe('isCalendarConnected', () => {
    it('should return true when calendar is connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const isConnected = await result.current.isCalendarConnected();

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(isConnected).toBe(true);
    });

    it('should return false when calendar is not connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: false } },
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const isConnected = await result.current.isCalendarConnected();

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(isConnected).toBe(false);
    });

    it('should return false when status check fails', async () => {
      const error = new Error('Network error');
      calendarAPI.getStatus.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const isConnected = await result.current.isCalendarConnected();

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(isConnected).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check calendar status:',
        error
      );
    });

    it('should handle missing data gracefully', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: {},
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const isConnected = await result.current.isCalendarConnected();

      expect(isConnected).toBe(false);
    });

    it('should handle null response gracefully', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const isConnected = await result.current.isCalendarConnected();

      expect(isConnected).toBe(false);
    });
  });

  describe('syncDonationToCalendar', () => {
    const mockDonationId = 'donation-123';
    const mockDonationData = {
      foodType: 'PREPARED_FOOD',
      quantity: 10,
      pickupTime: '2026-02-26T10:00:00Z',
    };

    it('should sync donation when calendar is connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncDonationToCalendar(
        mockDonationId,
        mockDonationData
      );

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(calendarAPI.sync).toHaveBeenCalled();
      expect(success).toBe(true);
    });

    it('should skip sync when calendar is not connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: false } },
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncDonationToCalendar(
        mockDonationId,
        mockDonationData
      );

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(calendarAPI.sync).not.toHaveBeenCalled();
      expect(success).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Calendar not connected, skipping sync'
      );
    });

    it('should handle sync errors gracefully', async () => {
      const error = new Error('Sync failed');
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncDonationToCalendar(
        mockDonationId,
        mockDonationData
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to trigger calendar sync:',
        error
      );
    });

    it('should handle status check errors', async () => {
      const error = new Error('Network error');
      calendarAPI.getStatus.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncDonationToCalendar(
        mockDonationId,
        mockDonationData
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check calendar status:',
        error
      );
    });
  });

  describe('syncClaimToCalendar', () => {
    const mockClaimId = 'claim-456';
    const mockClaimData = {
      donationId: 'donation-123',
      pickupTime: '2026-02-26T10:00:00Z',
    };

    it('should sync claim when calendar is connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncClaimToCalendar(
        mockClaimId,
        mockClaimData
      );

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(calendarAPI.sync).toHaveBeenCalled();
      expect(success).toBe(true);
    });

    it('should skip sync when calendar is not connected', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: false } },
      });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncClaimToCalendar(
        mockClaimId,
        mockClaimData
      );

      expect(calendarAPI.getStatus).toHaveBeenCalled();
      expect(calendarAPI.sync).not.toHaveBeenCalled();
      expect(success).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Calendar not connected, skipping sync'
      );
    });

    it('should handle sync errors gracefully', async () => {
      const error = new Error('Sync failed');
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncClaimToCalendar(
        mockClaimId,
        mockClaimData
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to trigger calendar sync:',
        error
      );
    });

    it('should handle status check errors', async () => {
      const error = new Error('Network error');
      calendarAPI.getStatus.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const success = await result.current.syncClaimToCalendar(
        mockClaimId,
        mockClaimData
      );

      expect(success).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check calendar status:',
        error
      );
    });
  });

  describe('Hook Return Value', () => {
    it('should return all expected methods', () => {
      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      expect(result.current).toHaveProperty('triggerSync');
      expect(result.current).toHaveProperty('isCalendarConnected');
      expect(result.current).toHaveProperty('syncDonationToCalendar');
      expect(result.current).toHaveProperty('syncClaimToCalendar');
      expect(typeof result.current.triggerSync).toBe('function');
      expect(typeof result.current.isCalendarConnected).toBe('function');
      expect(typeof result.current.syncDonationToCalendar).toBe('function');
      expect(typeof result.current.syncClaimToCalendar).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple sync operations in sequence', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCalendarSync(), { wrapper });

      const donation1 = await result.current.syncDonationToCalendar(
        'donation-1',
        {}
      );
      const claim1 = await result.current.syncClaimToCalendar('claim-1', {});
      const donation2 = await result.current.syncDonationToCalendar(
        'donation-2',
        {}
      );

      expect(donation1).toBe(true);
      expect(claim1).toBe(true);
      expect(donation2).toBe(true);
      expect(calendarAPI.sync).toHaveBeenCalledTimes(3);
    });

    it('should work with different user contexts', async () => {
      calendarAPI.getStatus.mockResolvedValue({
        data: { data: { isConnected: true } },
      });
      calendarAPI.sync.mockResolvedValue({ data: { success: true } });

      const wrapper1 = ({ children }) => (
        <AuthContext.Provider value={{ userId: 'user-1' }}>
          {children}
        </AuthContext.Provider>
      );

      const wrapper2 = ({ children }) => (
        <AuthContext.Provider value={{ userId: 'user-2' }}>
          {children}
        </AuthContext.Provider>
      );

      const { result: result1 } = renderHook(() => useCalendarSync(), {
        wrapper: wrapper1,
      });
      const { result: result2 } = renderHook(() => useCalendarSync(), {
        wrapper: wrapper2,
      });

      const success1 = await result1.current.triggerSync();
      const success2 = await result2.current.triggerSync();

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(calendarAPI.sync).toHaveBeenCalledTimes(2);
    });
  });
});
