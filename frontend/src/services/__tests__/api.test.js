const mockPost = jest.fn();
const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    post: mockPost,
    get: mockGet,
    patch: mockPatch,
    delete: mockDelete,
  })),
}));

describe('API service', () => {
  beforeEach(() => {
    jest.resetModules();
    mockPost.mockReset();
    mockGet.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
    localStorage.clear();
  });

  test('call /auth/login', async () => {
    mockPost.mockResolvedValue({ data: { token: 'test-token-123' } });
    const { authAPI } = require('../api');
    const resp = await authAPI.login({ username: 'alice', password: 'pw' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      username: 'alice',
      password: 'pw',
    });
    expect(localStorage.getItem('jwtToken')).toBe('test-token-123');
    expect(resp).toEqual({ data: { token: 'test-token-123' } });
  });

  test('call /auth/logout', async () => {
    localStorage.setItem('jwtToken', 'existing-token');
    mockPost.mockResolvedValue({ status: 200 });
    const { authAPI } = require('../api');
    const resp = await authAPI.logout();
    expect(localStorage.getItem('jwtToken')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    expect(resp).toEqual({ status: 200 });
  });

  test('call /surplus/search', async () => {
    mockPost.mockResolvedValue({ data: { results: [] } });
    const { surplusAPI } = require('../api');
    const filters = {
      foodType: ['Fruits & Vegetables', 'Frozen Food'],
      expiryBefore: '2025-12-01',
      locationCoords: { lat: '45.0', lng: '-73.0', address: '123 Main St' },
      distance: '10',
    };
    const resp = await surplusAPI.search(filters);
    expect(mockPost).toHaveBeenCalledWith(
      '/surplus/search',
      expect.objectContaining({
        foodCategories: ['FRUITS_VEGETABLES', 'FROZEN'],
        expiryBefore: '2025-12-01',
        userLocation: { latitude: 45, longitude: -73, address: '123 Main St' },
        maxDistanceKm: 10,
        status: 'AVAILABLE',
      })
    );
    expect(resp).toEqual({ data: { results: [] } });
  });

  test('send pickupSlotId', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');
    const postId = 123;
    const slot = { id: 55 };
    const resp = await surplusAPI.claim(postId, slot);
    expect(mockPost).toHaveBeenCalledWith('/claims', {
      surplusPostId: postId,
      pickupSlotId: 55,
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.claim includes pickupSlot', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');
    const postId = 222;
    const slot = { start: '10:00', end: '10:30' };
    const resp = await surplusAPI.claim(postId, slot);
    expect(mockPost).toHaveBeenCalledWith('/claims', {
      surplusPostId: postId,
      pickupSlot: slot,
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.searchBasic builds query params and calls GET', async () => {
    mockGet.mockResolvedValue({ data: { items: [] } });
    const { surplusAPI } = require('../api');
    const filters = {
      foodType: ['Bakery & Pastry'],
      expiryBefore: '2025-01-01',
    };
    const resp = await surplusAPI.searchBasic(filters);
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/\/surplus\/search\?.*foodCategories=BAKERY_PASTRY/)
    );
    expect(resp).toEqual({ data: { items: [] } });
  });

  test('surplusAPI.getTimeline calls GET /surplus/{postId}/timeline', async () => {
    const mockTimelineData = [
      {
        id: 1,
        eventType: 'DONATION_POSTED',
        timestamp: '2026-01-11T10:00:00',
        actor: 'donor',
        actorUserId: 1,
        newStatus: 'AVAILABLE',
        details: 'Donation created',
        visibleToUsers: true,
      },
      {
        id: 2,
        eventType: 'DONATION_CLAIMED',
        timestamp: '2026-01-11T11:00:00',
        actor: 'receiver',
        actorUserId: 2,
        oldStatus: 'AVAILABLE',
        newStatus: 'CLAIMED',
        details: 'Claimed by Food Bank',
        visibleToUsers: true,
      },
    ];

    mockGet.mockResolvedValue({ data: mockTimelineData });
    const { surplusAPI } = require('../api');
    const postId = 123;
    const resp = await surplusAPI.getTimeline(postId);

    expect(mockGet).toHaveBeenCalledWith('/surplus/123/timeline');
    expect(resp.data).toEqual(mockTimelineData);
    expect(resp.data.length).toBe(2);
  });

  test('surplusAPI.getTimeline handles empty timeline', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');
    const postId = 456;
    const resp = await surplusAPI.getTimeline(postId);

    expect(mockGet).toHaveBeenCalledWith('/surplus/456/timeline');
    expect(resp.data).toEqual([]);
  });

  test('surplusAPI.getTimeline handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    const { surplusAPI } = require('../api');
    const postId = 789;

    await expect(surplusAPI.getTimeline(postId)).rejects.toThrow(
      'Network error'
    );
    expect(mockGet).toHaveBeenCalledWith('/surplus/789/timeline');
  });
});
