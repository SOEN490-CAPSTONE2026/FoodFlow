// Unmock the global API mock from setupTests.js so we can test the real implementation
jest.unmock('../api');

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
        foodTypes: ['Fruits & Vegetables', 'Frozen Food'],
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
      expect.stringMatching(/\/surplus\/search\?.*foodType=BAKERY/)
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

  // authAPI tests
  test('authAPI.registerDonor with FormData', async () => {
    const mockPut = jest.fn();
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const formData = new FormData();
    formData.append('email', 'donor@test.com');
    const resp = await authAPI.registerDonor(formData);

    expect(mockPost).toHaveBeenCalledWith('/auth/register/donor', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.registerDonor with regular object', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const data = { email: 'donor@test.com', password: 'pass123' };
    const resp = await authAPI.registerDonor(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/register/donor', data, {});
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.registerReceiver with FormData', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const formData = new FormData();
    formData.append('email', 'receiver@test.com');
    const resp = await authAPI.registerReceiver(formData);

    expect(mockPost).toHaveBeenCalledWith('/auth/register/receiver', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.registerReceiver with regular object', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const data = { email: 'receiver@test.com', password: 'pass123' };
    const resp = await authAPI.registerReceiver(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/register/receiver', data, {});
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.forgotPassword', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Email sent' } });
    const { authAPI } = require('../api');

    const data = { email: 'user@test.com' };
    const resp = await authAPI.forgotPassword(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', data);
    expect(resp).toEqual({ data: { message: 'Email sent' } });
  });

  test('authAPI.verifyResetCode', async () => {
    mockPost.mockResolvedValue({ data: { valid: true } });
    const { authAPI } = require('../api');

    const data = { email: 'user@test.com', code: '123456' };
    const resp = await authAPI.verifyResetCode(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/verify-reset-code', data);
    expect(resp).toEqual({ data: { valid: true } });
  });

  test('authAPI.resetPassword', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const data = {
      email: 'user@test.com',
      code: '123456',
      newPassword: 'newpass',
    };
    const resp = await authAPI.resetPassword(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', data);
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.checkEmailExists', async () => {
    mockGet.mockResolvedValue({ data: { exists: true } });
    const { authAPI } = require('../api');

    const resp = await authAPI.checkEmailExists('test@test.com');

    expect(mockGet).toHaveBeenCalledWith('/auth/check-email', {
      params: { email: 'test@test.com' },
    });
    expect(resp).toEqual({ data: { exists: true } });
  });

  test('authAPI.checkPhoneExists', async () => {
    mockGet.mockResolvedValue({ data: { exists: false } });
    const { authAPI } = require('../api');

    const resp = await authAPI.checkPhoneExists('514-555-1234');

    expect(mockGet).toHaveBeenCalledWith('/auth/check-phone', {
      params: { phone: '514-555-1234' },
    });
    expect(resp).toEqual({ data: { exists: false } });
  });

  test('authAPI.changePassword', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const data = { oldPassword: 'old', newPassword: 'new' };
    const resp = await authAPI.changePassword(data);

    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', data);
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.verifyEmail', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { authAPI } = require('../api');

    const resp = await authAPI.verifyEmail('token123');

    expect(mockPost).toHaveBeenCalledWith('/auth/verify-email', null, {
      params: { token: 'token123' },
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('authAPI.resendVerificationEmail', async () => {
    mockPost.mockResolvedValue({ data: { sent: true } });
    const { authAPI } = require('../api');

    const resp = await authAPI.resendVerificationEmail();

    expect(mockPost).toHaveBeenCalledWith('/auth/resend-verification-email');
    expect(resp).toEqual({ data: { sent: true } });
  });

  // surplusAPI tests
  test('surplusAPI.list', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.list();

    expect(mockGet).toHaveBeenCalledWith('/surplus');
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.getMyPosts', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.getMyPosts();

    expect(mockGet).toHaveBeenCalledWith('/surplus/my-posts');
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.getPost', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.getPost(1);

    expect(mockGet).toHaveBeenCalledWith('/surplus/1');
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('surplusAPI.create', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const { surplusAPI } = require('../api');

    const data = { title: 'Food', quantity: 10 };
    const resp = await surplusAPI.create(data);

    expect(mockPost).toHaveBeenCalledWith(
      '/surplus',
      expect.objectContaining({
        title: 'Food',
        quantity: 10,
        dietaryTags: [],
      })
    );
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('surplusAPI.update', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { id: 1 } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { surplusAPI } = require('../api');

    const data = { title: 'Updated' };
    const resp = await surplusAPI.update(1, data);

    expect(mockPut).toHaveBeenCalledWith(
      '/surplus/1',
      expect.objectContaining({
        title: 'Updated',
        dietaryTags: [],
      })
    );
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('surplusAPI.deletePost', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.deletePost(1);

    expect(mockDelete).toHaveBeenCalledWith('/surplus/1/delete');
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.claim without slot', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.claim(123);

    expect(mockPost).toHaveBeenCalledWith('/claims', { surplusPostId: 123 });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.completeSurplusPost', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.completeSurplusPost(1, '123456');

    expect(mockPatch).toHaveBeenCalledWith('/surplus/1/complete', {
      otpCode: '123456',
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.confirmPickup', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { surplusAPI } = require('../api');

    const resp = await surplusAPI.confirmPickup(1, '654321');

    expect(mockPost).toHaveBeenCalledWith('/surplus/pickup/confirm', {
      postId: 1,
      otpCode: '654321',
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  test('surplusAPI.search with minimal filters', async () => {
    mockPost.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const filters = {};
    const resp = await surplusAPI.search(filters);

    expect(mockPost).toHaveBeenCalledWith('/surplus/search', {
      status: 'AVAILABLE',
    });
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.search with foodType only', async () => {
    mockPost.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const filters = { foodType: ['Dairy & Cold Items'] };
    const resp = await surplusAPI.search(filters);

    expect(mockPost).toHaveBeenCalledWith('/surplus/search', {
      foodTypes: ['Dairy & Cold Items'],
      status: 'AVAILABLE',
    });
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.search with expiryBefore only', async () => {
    mockPost.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const filters = { expiryBefore: '2026-02-01' };
    const resp = await surplusAPI.search(filters);

    expect(mockPost).toHaveBeenCalledWith('/surplus/search', {
      expiryBefore: '2026-02-01',
      status: 'AVAILABLE',
    });
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.search with location but no distance', async () => {
    mockPost.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const filters = {
      locationCoords: { lat: '45.5', lng: '-73.5', address: 'Montreal' },
    };
    const resp = await surplusAPI.search(filters);

    expect(mockPost).toHaveBeenCalledWith('/surplus/search', {
      status: 'AVAILABLE',
    });
    expect(resp).toEqual({ data: [] });
  });

  test('surplusAPI.uploadEvidence', async () => {
    mockPost.mockResolvedValue({
      data: { url: 'http://example.com/evidence.jpg' },
    });
    const { surplusAPI } = require('../api');

    const file = new File(['content'], 'evidence.jpg', { type: 'image/jpeg' });
    const resp = await surplusAPI.uploadEvidence(1, file);

    expect(mockPost).toHaveBeenCalledWith(
      '/surplus/1/evidence',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(resp).toEqual({ data: { url: 'http://example.com/evidence.jpg' } });
  });

  test('surplusAPI.searchBasic with empty foodType', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { surplusAPI } = require('../api');

    const filters = { foodType: [] };
    const resp = await surplusAPI.searchBasic(filters);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('status=AVAILABLE')
    );
    expect(resp).toEqual({ data: [] });
  });

  // claimsAPI tests
  test('claimsAPI.myClaims', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { claimsAPI } = require('../api');

    const resp = await claimsAPI.myClaims();

    expect(mockGet).toHaveBeenCalledWith('/claims/my-claims');
    expect(resp).toEqual({ data: [] });
  });

  test('claimsAPI.claim', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const { claimsAPI } = require('../api');

    const resp = await claimsAPI.claim(123);

    expect(mockPost).toHaveBeenCalledWith('/claims', { surplusPostId: 123 });
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('claimsAPI.cancel', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const { claimsAPI } = require('../api');

    const resp = await claimsAPI.cancel(456);

    expect(mockDelete).toHaveBeenCalledWith('/claims/456');
    expect(resp).toEqual({ data: { success: true } });
  });

  test('claimsAPI.getClaimForSurplusPost', async () => {
    mockGet.mockResolvedValue({ data: { id: 789 } });
    const { claimsAPI } = require('../api');

    const resp = await claimsAPI.getClaimForSurplusPost(123);

    expect(mockGet).toHaveBeenCalledWith('/claims/post/123');
    expect(resp).toEqual({ data: { id: 789 } });
  });

  // recommendationAPI tests
  test('recommendationAPI.getBrowseRecommendations with postIds', async () => {
    mockGet.mockResolvedValue({ data: { 1: 80, 2: 90 } });
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getBrowseRecommendations([1, 2, 3]);

    expect(mockGet).toHaveBeenCalledWith('/recommendations/browse', {
      params: { postIds: '1,2,3' },
    });
    expect(result).toEqual({ 1: 80, 2: 90 });
  });

  test('recommendationAPI.getBrowseRecommendations with empty array', async () => {
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getBrowseRecommendations([]);

    expect(mockGet).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  test('recommendationAPI.getBrowseRecommendations with null', async () => {
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getBrowseRecommendations(null);

    expect(mockGet).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  test('recommendationAPI.getBrowseRecommendations handles error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGet.mockRejectedValue(new Error('Network error'));
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getBrowseRecommendations([1, 2]);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching browse recommendations:',
      expect.any(Error)
    );
    expect(result).toEqual({});
    consoleSpy.mockRestore();
  });

  test('recommendationAPI.getRecommendationForPost', async () => {
    mockGet.mockResolvedValue({ data: { score: 85 } });
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getRecommendationForPost(123);

    expect(mockGet).toHaveBeenCalledWith('/recommendations/post/123');
    expect(result).toEqual({ score: 85 });
  });

  test('recommendationAPI.getRecommendationForPost handles error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGet.mockRejectedValue(new Error('Not found'));
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getRecommendationForPost(999);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching post recommendation:',
      expect.any(Error)
    );
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  test('recommendationAPI.getTopRecommendations with default minScore', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getTopRecommendations([1, 2, 3]);

    expect(mockGet).toHaveBeenCalledWith('/recommendations/top', {
      params: {
        minScore: 50,
        postIds: '1,2,3',
      },
    });
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('recommendationAPI.getTopRecommendations with custom minScore', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getTopRecommendations([1, 2, 3], 75);

    expect(mockGet).toHaveBeenCalledWith('/recommendations/top', {
      params: {
        minScore: 75,
        postIds: '1,2,3',
      },
    });
    expect(result).toEqual([]);
  });

  test('recommendationAPI.getTopRecommendations handles error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGet.mockRejectedValue(new Error('Server error'));
    const { recommendationAPI } = require('../api');

    const result = await recommendationAPI.getTopRecommendations(60);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching top recommendations:',
      expect.any(Error)
    );
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  // userAPI tests
  test('userAPI.getProfile', async () => {
    const mockPut = jest.fn();
    mockGet.mockResolvedValue({ data: { id: 1, name: 'John' } });
    const { userAPI } = require('../api');

    const resp = await userAPI.getProfile(123);

    expect(mockGet).toHaveBeenCalledWith('/users/123');
    expect(resp).toEqual({ data: { id: 1, name: 'John' } });
  });

  test('userAPI.updateProfile', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { id: 1 } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { userAPI } = require('../api');

    const formData = new FormData();
    const resp = await userAPI.updateProfile(formData);

    expect(mockPut).toHaveBeenCalledWith('/users/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('userAPI.updatePassword', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { success: true } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { userAPI } = require('../api');

    const data = { oldPassword: 'old', newPassword: 'new' };
    const resp = await userAPI.updatePassword(data);

    expect(mockPut).toHaveBeenCalledWith('/users/update-password', data);
    expect(resp).toEqual({ data: { success: true } });
  });

  // profileAPI tests
  test('profileAPI.get', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    const { profileAPI } = require('../api');

    const resp = await profileAPI.get();

    expect(mockGet).toHaveBeenCalledWith('/profile');
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('profileAPI.update', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { id: 1 } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { profileAPI } = require('../api');

    const data = { name: 'Updated' };
    const resp = await profileAPI.update(data);

    expect(mockPut).toHaveBeenCalledWith('/profile', data);
    expect(resp).toEqual({ data: { id: 1 } });
  });

  // reportAPI tests
  test('reportAPI.createReport', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const { reportAPI } = require('../api');

    const reportData = {
      reportedUserId: 123,
      donationId: 456,
      description: 'Test report',
      photoEvidenceUrl: 'http://example.com/photo.jpg',
    };
    const resp = await reportAPI.createReport(reportData);

    expect(mockPost).toHaveBeenCalledWith('/reports', {
      reportedId: 123,
      donationId: 456,
      description: 'Test report',
      imageUrl: 'http://example.com/photo.jpg',
    });
    expect(resp).toEqual({ data: { id: 1 } });
  });

  // feedbackAPI tests
  test('feedbackAPI.submitFeedback', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const { feedbackAPI } = require('../api');

    const payload = { rating: 5, comment: 'Great!' };
    const resp = await feedbackAPI.submitFeedback(payload);

    expect(mockPost).toHaveBeenCalledWith('/feedback', payload);
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('feedbackAPI.getFeedbackForClaim', async () => {
    mockGet.mockResolvedValue({ data: { rating: 5 } });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.getFeedbackForClaim(123);

    expect(mockGet).toHaveBeenCalledWith('/feedback/claim/123');
    expect(resp).toEqual({ data: { rating: 5 } });
  });

  test('feedbackAPI.getMyRating', async () => {
    mockGet.mockResolvedValue({ data: { averageRating: 4.5 } });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.getMyRating();

    expect(mockGet).toHaveBeenCalledWith('/feedback/my-rating');
    expect(resp).toEqual({ data: { averageRating: 4.5 } });
  });

  test('feedbackAPI.getUserRating', async () => {
    mockGet.mockResolvedValue({ data: { rating: 4.8 } });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.getUserRating(456);

    expect(mockGet).toHaveBeenCalledWith('/feedback/rating/456');
    expect(resp).toEqual({ data: { rating: 4.8 } });
  });

  test('feedbackAPI.canProvideFeedback', async () => {
    mockGet.mockResolvedValue({ data: { can: true } });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.canProvideFeedback(789);

    expect(mockGet).toHaveBeenCalledWith('/feedback/can-review/789');
    expect(resp).toEqual({ data: { can: true } });
  });

  test('feedbackAPI.getPendingFeedback', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.getPendingFeedback();

    expect(mockGet).toHaveBeenCalledWith('/feedback/pending');
    expect(resp).toEqual({ data: [] });
  });

  test('feedbackAPI.getMyReviews', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { feedbackAPI } = require('../api');

    const resp = await feedbackAPI.getMyReviews();

    expect(mockGet).toHaveBeenCalledWith('/feedback/my-reviews');
    expect(resp).toEqual({ data: [] });
  });

  // adminDisputeAPI tests
  test('adminDisputeAPI.getAllDisputes with no filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminDisputeAPI } = require('../api');

    const resp = await adminDisputeAPI.getAllDisputes();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/admin/disputes?')
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=0'));
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('size=20'));
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminDisputeAPI.getAllDisputes with filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminDisputeAPI } = require('../api');

    const filters = { status: 'OPEN', page: 1, size: 10 };
    const resp = await adminDisputeAPI.getAllDisputes(filters);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('status=OPEN')
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('size=10'));
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminDisputeAPI.getDisputeById', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    const { adminDisputeAPI } = require('../api');

    const resp = await adminDisputeAPI.getDisputeById(123);

    expect(mockGet).toHaveBeenCalledWith('/admin/disputes/123');
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('adminDisputeAPI.updateDisputeStatus', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { id: 1 } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { adminDisputeAPI } = require('../api');

    const resp = await adminDisputeAPI.updateDisputeStatus(
      123,
      'RESOLVED',
      'Fixed'
    );

    expect(mockPut).toHaveBeenCalledWith('/admin/disputes/123/status', {
      status: 'RESOLVED',
      adminNotes: 'Fixed',
    });
    expect(resp).toEqual({ data: { id: 1 } });
  });

  // adminDonationAPI tests
  test('adminDonationAPI.getAllDonations with minimal filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminDonationAPI } = require('../api');

    const resp = await adminDonationAPI.getAllDonations();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/admin/donations?')
    );
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminDonationAPI.getAllDonations with all filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminDonationAPI } = require('../api');

    const filters = {
      status: 'COMPLETED',
      donorId: 1,
      receiverId: 2,
      flagged: true,
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
      search: 'food',
      page: 2,
      size: 50,
    };
    const resp = await adminDonationAPI.getAllDonations(filters);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('status=COMPLETED')
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('donorId=1'));
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('receiverId=2')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('flagged=true')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('fromDate=2026-01-01')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('toDate=2026-01-31')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('search=food')
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('size=50'));
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminDonationAPI.getDonationById', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    const { adminDonationAPI } = require('../api');

    const resp = await adminDonationAPI.getDonationById(123);

    expect(mockGet).toHaveBeenCalledWith('/admin/donations/123');
    expect(resp).toEqual({ data: { id: 1 } });
  });

  test('adminDonationAPI.overrideStatus', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const { adminDonationAPI } = require('../api');

    const resp = await adminDonationAPI.overrideStatus(
      123,
      'COMPLETED',
      'Admin override'
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/admin/donations/123/override-status',
      {
        newStatus: 'COMPLETED',
        reason: 'Admin override',
      }
    );
    expect(resp).toEqual({ data: { id: 1 } });
  });

  // adminVerificationAPI tests
  test('adminVerificationAPI.getPendingUsers with no filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminVerificationAPI } = require('../api');

    const resp = await adminVerificationAPI.getPendingUsers();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/admin/pending-users?')
    );
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminVerificationAPI.getPendingUsers with all filters', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    const { adminVerificationAPI } = require('../api');

    const filters = {
      userType: 'DONOR',
      search: 'food bank',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      size: 10,
    };
    const resp = await adminVerificationAPI.getPendingUsers(filters);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('userType=DONOR')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('search=food+bank')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=date')
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('sortOrder=desc')
    );
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('size=10'));
    expect(resp).toEqual({ data: { content: [] } });
  });

  test('adminVerificationAPI.approveUser', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { adminVerificationAPI } = require('../api');

    const resp = await adminVerificationAPI.approveUser(123);

    expect(mockPost).toHaveBeenCalledWith('/admin/approve/123');
    expect(resp).toEqual({ data: { success: true } });
  });

  test('adminVerificationAPI.verifyEmail', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { adminVerificationAPI } = require('../api');

    const resp = await adminVerificationAPI.verifyEmail(123);

    expect(mockPost).toHaveBeenCalledWith('/admin/verify-email/123');
    expect(resp).toEqual({ data: { success: true } });
  });

  test('adminVerificationAPI.rejectUser', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const { adminVerificationAPI } = require('../api');

    const resp = await adminVerificationAPI.rejectUser(
      123,
      'Invalid documents',
      'Please resubmit'
    );

    expect(mockPost).toHaveBeenCalledWith('/admin/reject/123', {
      reason: 'Invalid documents',
      message: 'Please resubmit',
    });
    expect(resp).toEqual({ data: { success: true } });
  });

  // notificationPreferencesAPI tests
  test('notificationPreferencesAPI.getPreferences', async () => {
    mockGet.mockResolvedValue({ data: { email: true } });
    const { notificationPreferencesAPI } = require('../api');

    const resp = await notificationPreferencesAPI.getPreferences();

    expect(mockGet).toHaveBeenCalledWith('/user/notifications/preferences');
    expect(resp).toEqual({ data: { email: true } });
  });

  test('notificationPreferencesAPI.updatePreferences', async () => {
    const mockPut = jest.fn().mockResolvedValue({ data: { success: true } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        post: mockPost,
        get: mockGet,
        put: mockPut,
        patch: mockPatch,
        delete: mockDelete,
      })),
    }));

    jest.resetModules();
    const { notificationPreferencesAPI } = require('../api');

    const data = { email: false };
    const resp = await notificationPreferencesAPI.updatePreferences(data);

    expect(mockPut).toHaveBeenCalledWith(
      '/user/notifications/preferences',
      data
    );
    expect(resp).toEqual({ data: { success: true } });
  });

  // gamificationAPI tests
  test('gamificationAPI.getUserStats', async () => {
    mockGet.mockResolvedValue({ data: { points: 100 } });
    const { gamificationAPI } = require('../api');

    const resp = await gamificationAPI.getUserStats(123);

    expect(mockGet).toHaveBeenCalledWith('/gamification/users/123/stats');
    expect(resp).toEqual({ data: { points: 100 } });
  });

  test('gamificationAPI.getAllAchievements', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { gamificationAPI } = require('../api');

    const resp = await gamificationAPI.getAllAchievements();

    expect(mockGet).toHaveBeenCalledWith('/gamification/achievements');
    expect(resp).toEqual({ data: [] });
  });
});
