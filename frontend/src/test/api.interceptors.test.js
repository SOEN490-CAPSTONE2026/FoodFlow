// Unmock setup-level API mock and test the real module behavior.
jest.unmock('../services/api');

const mockPost = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

const mockEmitUnauthorized = jest.fn();
const mockNavigateTo = jest.fn();
const mockGetNavigationLocation = jest.fn();

let requestOnFulfilled;
let requestOnRejected;
let responseOnFulfilled;
let responseOnRejected;

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn((onFulfilled, onRejected) => {
          requestOnFulfilled = onFulfilled;
          requestOnRejected = onRejected;
        }),
      },
      response: {
        use: jest.fn((onFulfilled, onRejected) => {
          responseOnFulfilled = onFulfilled;
          responseOnRejected = onRejected;
        }),
      },
    },
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
    patch: (...args) => mockPatch(...args),
    delete: (...args) => mockDelete(...args),
  })),
}));

jest.mock('../services/authEvents', () => ({
  emitUnauthorized: (...args) => mockEmitUnauthorized(...args),
}));

jest.mock('../services/navigation', () => ({
  navigateTo: (...args) => mockNavigateTo(...args),
  getNavigationLocation: (...args) => mockGetNavigationLocation(...args),
}));

describe('api interceptors and endpoint wrappers', () => {
  beforeEach(() => {
    jest.resetModules();
    mockPost.mockReset();
    mockGet.mockReset();
    mockPut.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
    mockEmitUnauthorized.mockReset();
    mockNavigateTo.mockReset();
    mockGetNavigationLocation.mockReset();
    requestOnFulfilled = undefined;
    requestOnRejected = undefined;
    responseOnFulfilled = undefined;
    responseOnRejected = undefined;
    localStorage.clear();
    sessionStorage.clear();
  });

  test('request interceptor attaches token from localStorage', () => {
    require('../api');
    localStorage.setItem('jwtToken', 'token-local');
    const next = requestOnFulfilled({ headers: {} });
    expect(next.headers.Authorization).toBe('Bearer token-local');
  });

  test('request interceptor falls back to sessionStorage token', () => {
    require('../api');
    sessionStorage.setItem('jwtToken', 'token-session');
    const next = requestOnFulfilled({ headers: {} });
    expect(next.headers.Authorization).toBe('Bearer token-session');
  });

  test('request error handler rejects', async () => {
    require('../api');
    await expect(requestOnRejected(new Error('request fail'))).rejects.toThrow(
      'request fail'
    );
  });

  test('response interceptor appends rate limit metadata', () => {
    require('../api');
    const response = {
      headers: {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '42',
        'retry-after': '7',
      },
      data: {},
    };
    const out = responseOnFulfilled(response);
    expect(out.data.rateLimitInfo).toEqual({
      limit: 100,
      remaining: 42,
      retryAfter: 7,
    });
  });

  test('response error marks 429 with retry metadata', async () => {
    require('../api');
    const error = { response: { status: 429, headers: { 'retry-after': 9 } } };
    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(error.rateLimited).toBe(true);
    expect(error.retryAfter).toBe(9);
  });

  test('response error on 401 clears auth and redirects to login', async () => {
    require('../api');
    const authKeys = [
      'jwtToken',
      'userRole',
      'userId',
      'organizationName',
      'organizationVerificationStatus',
      'accountStatus',
    ];
    authKeys.forEach(key => {
      localStorage.setItem(key, 'x');
      sessionStorage.setItem(key, 'y');
    });
    mockGetNavigationLocation.mockReturnValue({
      pathname: '/receiver/browse',
      search: '?q=1',
      hash: '#hash',
    });

    const error = { response: { status: 401 } };
    await expect(responseOnRejected(error)).rejects.toBe(error);

    authKeys.forEach(key => {
      expect(localStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(key)).toBeNull();
    });
    expect(mockEmitUnauthorized).toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({ replace: true })
    );
  });

  test('response error on 401 does not redirect when already on login', async () => {
    require('../api');
    mockGetNavigationLocation.mockReturnValue({ pathname: '/login' });
    const error = { response: { status: 401 } };
    await expect(responseOnRejected(error)).rejects.toBe(error);
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(mockEmitUnauthorized).toHaveBeenCalled();
  });

  test('admin image + calendar wrappers call expected endpoints', async () => {
    mockGet
      .mockResolvedValueOnce({ data: [] }) // getLibrary
      .mockResolvedValueOnce({ data: [] }) // getUploads
      .mockResolvedValueOnce({ data: { status: 'CONNECTED' } }) // getStatus
      .mockResolvedValueOnce({ data: { code: 'ok' } }) // callback
      .mockResolvedValueOnce({ data: { syncEnabled: true } }) // getPreferences
      .mockResolvedValueOnce({ data: [] }); // getEvents
    mockPost
      .mockResolvedValueOnce({ data: { created: true } }) // addLibraryItem
      .mockResolvedValueOnce({ data: { connected: true } }) // initiateConnection
      .mockResolvedValueOnce({ data: { disconnected: true } }) // disconnect
      .mockResolvedValueOnce({ data: { synced: true } }) // sync
      .mockResolvedValueOnce({ data: { tested: true } }); // testConnection
    mockPatch
      .mockResolvedValueOnce({ data: { active: true } }) // patchLibraryItem
      .mockResolvedValueOnce({ data: { status: 'APPROVED' } }); // moderateUpload
    mockDelete
      .mockResolvedValueOnce({ data: { deleted: true } }) // deleteLibraryItem
      .mockResolvedValueOnce({ data: { deleted: true } }); // deleteUpload
    mockPut.mockResolvedValueOnce({ data: { saved: true } }); // updatePrefs

    const { adminImageAPI, calendarAPI } = require('../api');
    await adminImageAPI.getLibrary(true);
    await adminImageAPI.addLibraryItem({
      imageUrl: 'https://cdn.example.com/default.jpg',
      foodType: 'PRODUCE',
      active: false,
    });
    await adminImageAPI.deleteLibraryItem(10);
    await adminImageAPI.patchLibraryItem(10, true);
    await adminImageAPI.getUploads('PENDING');
    await adminImageAPI.moderateUpload(90, {
      status: 'APPROVED',
      reason: 'ok',
    });
    await adminImageAPI.deleteUpload(90);

    await calendarAPI.getStatus();
    await calendarAPI.initiateConnection('GOOGLE');
    await calendarAPI.handleOAuthCallback('code', 'state');
    await calendarAPI.disconnect('GOOGLE');
    await calendarAPI.getPreferences();
    await calendarAPI.updatePreferences({ syncEnabled: true });
    await calendarAPI.getEvents();
    await calendarAPI.sync();
    await calendarAPI.testConnection('GOOGLE');

    expect(mockGet).toHaveBeenCalledWith('/admin/image-library', {
      params: { activeOnly: true },
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/admin/image-library',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(mockDelete).toHaveBeenCalledWith('/admin/image-library/10');
    expect(mockPatch).toHaveBeenCalledWith('/admin/image-library/10', {
      active: true,
    });
    expect(mockGet).toHaveBeenCalledWith('/admin/uploads/images', {
      params: { status: 'PENDING' },
    });
    expect(mockPatch).toHaveBeenCalledWith('/admin/uploads/images/90', {
      status: 'APPROVED',
      reason: 'ok',
    });
    expect(mockDelete).toHaveBeenCalledWith('/admin/uploads/images/90');

    expect(mockGet).toHaveBeenCalledWith('/calendar/status');
    expect(mockPost).toHaveBeenCalledWith('/calendar/connect', {
      calendarProvider: 'GOOGLE',
    });
    expect(mockGet).toHaveBeenCalledWith('/calendar/oauth/google/callback', {
      params: { code: 'code', state: 'state' },
    });
    expect(mockPost).toHaveBeenCalledWith('/calendar/disconnect', null, {
      params: { provider: 'GOOGLE' },
    });
    expect(mockGet).toHaveBeenCalledWith('/calendar/preferences');
    expect(mockPut).toHaveBeenCalledWith('/calendar/preferences', {
      syncEnabled: true,
    });
    expect(mockGet).toHaveBeenCalledWith('/calendar/events');
    expect(mockPost).toHaveBeenCalledWith('/calendar/sync');
    expect(mockPost).toHaveBeenCalledWith('/calendar/test', null, {
      params: { provider: 'GOOGLE' },
    });
  });

  test('core bound methods proxy to axios instance', async () => {
    mockPost.mockResolvedValueOnce({ data: { ok: true } });
    mockGet.mockResolvedValueOnce({ data: { ok: true } });
    mockPut.mockResolvedValueOnce({ data: { ok: true } });
    mockDelete.mockResolvedValueOnce({ data: { ok: true } });
    mockPatch.mockResolvedValueOnce({ data: { ok: true } });

    const apiModule = require('../api');
    await apiModule.post('/x', { a: 1 });
    await apiModule.get('/x');
    await apiModule.put('/x', { b: 2 });
    await apiModule.del('/x');
    await apiModule.patch('/x', { c: 3 });

    expect(mockPost).toHaveBeenCalledWith('/x', { a: 1 });
    expect(mockGet).toHaveBeenCalledWith('/x');
    expect(mockPut).toHaveBeenCalledWith('/x', { b: 2 });
    expect(mockDelete).toHaveBeenCalledWith('/x');
    expect(mockPatch).toHaveBeenCalledWith('/x', { c: 3 });
  });
});
