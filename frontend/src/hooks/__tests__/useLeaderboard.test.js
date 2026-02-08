import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import useLeaderboard from '../useLeaderboard';
import { getLeaderboard } from '../../services/api';

// Mock the dependencies
jest.mock('@tanstack/react-query');
jest.mock('../../services/api');

describe('useLeaderboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls useQuery with correct parameters for DONOR role', () => {
    const mockUseQuery = jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }));
    useQuery.mockImplementation(mockUseQuery);

    renderHook(() => useLeaderboard('DONOR'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['leaderboard', 'DONOR'],
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      })
    );
  });

  it('calls useQuery with correct parameters for RECEIVER role', () => {
    const mockUseQuery = jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }));
    useQuery.mockImplementation(mockUseQuery);

    renderHook(() => useLeaderboard('RECEIVER'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['leaderboard', 'RECEIVER'],
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      })
    );
  });

  it('returns data from useQuery', () => {
    const mockData = {
      topUsers: [{ userId: 1, userName: 'Test', totalPoints: 100, rank: 1 }],
      currentUserRank: null,
    };

    useQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useLeaderboard('DONOR'));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('returns loading state', () => {
    useQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useLeaderboard('DONOR'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('returns error state', () => {
    const mockError = new Error('Failed to load');

    useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useLeaderboard('DONOR'));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(mockError);
  });
});
