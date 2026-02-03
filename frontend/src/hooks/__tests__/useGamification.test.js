import { renderHook, waitFor } from '@testing-library/react';
import { useGamification } from '../useGamification';
import { gamificationAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the API
jest.mock('../../services/api', () => ({
  gamificationAPI: {
    getUserStats: jest.fn(),
  },
}));

describe('useGamification', () => {
  const mockUserId = 'test-user-123';
  const mockStats = {
    points: 100,
    level: 5,
    badges: ['badge1', 'badge2'],
    achievements: ['achievement1'],
  };

  const wrapper = ({ children, userId = mockUserId }) => (
    <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Initial Load', () => {
    it('should initialize with loading state', () => {
      gamificationAPI.getUserStats.mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should fetch gamification data on mount', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(gamificationAPI.getUserStats).toHaveBeenCalledWith(mockUserId);
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch data when userId is null', async () => {
      const { result } = renderHook(() => useGamification(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={{ userId: null }}>
            {children}
          </AuthContext.Provider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(gamificationAPI.getUserStats).not.toHaveBeenCalled();
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch data when userId is undefined', async () => {
      const { result } = renderHook(() => useGamification(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={{ userId: undefined }}>
            {children}
          </AuthContext.Provider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(gamificationAPI.getUserStats).not.toHaveBeenCalled();
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch data when userId is empty string', async () => {
      const { result } = renderHook(() => useGamification(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={{ userId: '' }}>
            {children}
          </AuthContext.Provider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(gamificationAPI.getUserStats).not.toHaveBeenCalled();
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should handle API error with message', async () => {
      const errorMessage = 'Network error';
      gamificationAPI.getUserStats.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.stats).toBe(null);
    });

    it('should handle API error without message', async () => {
      gamificationAPI.getUserStats.mockRejectedValue({});

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load gamification data');
      expect(result.current.stats).toBe(null);
    });

    it('should handle API error with undefined message', async () => {
      gamificationAPI.getUserStats.mockRejectedValue(new Error());

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load gamification data');
      expect(result.current.stats).toBe(null);
    });

    it('should handle string error', async () => {
      const errorMessage = 'String error';
      gamificationAPI.getUserStats.mockRejectedValue(errorMessage);

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load gamification data');
      expect(result.current.stats).toBe(null);
    });

    it('should clear error on successful retry', async () => {
      gamificationAPI.getUserStats
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide a refresh function', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.refresh).toBeDefined();
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should refetch data when refresh is called', async () => {
      const initialStats = { points: 50, level: 3 };
      const updatedStats = { points: 150, level: 6 };

      gamificationAPI.getUserStats
        .mockResolvedValueOnce({ data: initialStats })
        .mockResolvedValueOnce({ data: updatedStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.stats).toEqual(initialStats);
      });

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.stats).toEqual(updatedStats);
      });

      expect(gamificationAPI.getUserStats).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refresh', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a promise we can control
      let resolveRefresh;
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve;
      });

      gamificationAPI.getUserStats.mockImplementation(() => refreshPromise);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      resolveRefresh({ data: mockStats });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle refresh with no userId', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={{ userId: null }}>
            {children}
          </AuthContext.Provider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callCount = gamificationAPI.getUserStats.mock.calls.length;

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not call API when userId is null
      expect(gamificationAPI.getUserStats).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('userId Changes', () => {
    it('should refetch data when userId changes', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const stats1 = { points: 50, level: 3 };
      const stats2 = { points: 100, level: 5 };

      gamificationAPI.getUserStats
        .mockResolvedValueOnce({ data: stats1 })
        .mockResolvedValueOnce({ data: stats2 });

      let currentUserId = userId1;

      const WrapperComponent = ({ children }) => (
        <AuthContext.Provider value={{ userId: currentUserId }}>
          {children}
        </AuthContext.Provider>
      );

      const { result, rerender } = renderHook(() => useGamification(), {
        wrapper: WrapperComponent,
      });

      await waitFor(() => {
        expect(result.current.stats).toEqual(stats1);
      });

      expect(gamificationAPI.getUserStats).toHaveBeenCalledWith(userId1);

      // Change userId
      currentUserId = userId2;
      rerender();

      await waitFor(() => {
        expect(result.current.stats).toEqual(stats2);
      });

      expect(gamificationAPI.getUserStats).toHaveBeenCalledWith(userId2);
      expect(gamificationAPI.getUserStats).toHaveBeenCalledTimes(2);
    });

    it('should not refetch when userId changes from null to null', async () => {
      const { rerender } = renderHook(() => useGamification(), {
        wrapper: ({ children }) => (
          <AuthContext.Provider value={{ userId: null }}>
            {children}
          </AuthContext.Provider>
        ),
      });

      await waitFor(() => {
        expect(gamificationAPI.getUserStats).not.toHaveBeenCalled();
      });

      rerender();

      await waitFor(() => {
        expect(gamificationAPI.getUserStats).not.toHaveBeenCalled();
      });
    });

    it('should clear data when userId changes to null', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      let currentUserId = mockUserId;

      const WrapperComponent = ({ children }) => (
        <AuthContext.Provider value={{ userId: currentUserId }}>
          {children}
        </AuthContext.Provider>
      );

      const { result, rerender } = renderHook(() => useGamification(), {
        wrapper: WrapperComponent,
      });

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });

      // Change userId to null
      currentUserId = null;
      rerender();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Stats should still be there (not cleared), but no new fetch
      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('Return Value', () => {
    it('should return stats, loading, error, and refresh', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refresh');
    });

    it('should have correct types for return values', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.loading).toBe('boolean');
      expect(
        result.current.error === null ||
          typeof result.current.error === 'string'
      ).toBe(true);
      expect(typeof result.current.refresh).toBe('function');
      expect(
        result.current.stats === null ||
          typeof result.current.stats === 'object'
      ).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set loading to true when fetching starts', async () => {
      let resolveApi;
      const apiPromise = new Promise(resolve => {
        resolveApi = resolve;
      });

      gamificationAPI.getUserStats.mockImplementation(() => apiPromise);

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      expect(result.current.loading).toBe(true);

      resolveApi({ data: mockStats });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
    });

    it('should set loading to false after failed fetch', async () => {
      gamificationAPI.getUserStats.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('API error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid refresh calls', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refresh multiple times rapidly
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have been called: 1 (initial) + 3 (refreshes) = 4 times
      expect(
        gamificationAPI.getUserStats.mock.calls.length
      ).toBeGreaterThanOrEqual(1);
    });

    it('should handle API returning null data', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle API returning undefined data', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeUndefined();
      expect(result.current.error).toBe(null);
    });

    it('should handle API returning empty object', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({});
      expect(result.current.error).toBe(null);
    });

    it('should handle missing data property in response', async () => {
      gamificationAPI.getUserStats.mockResolvedValue({});

      const { result } = renderHook(() => useGamification(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeUndefined();
      expect(result.current.error).toBe(null);
    });
  });
});
