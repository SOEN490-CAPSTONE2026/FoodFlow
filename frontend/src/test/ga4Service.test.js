/**
 * ga4Service — simplified tests
 *
 * NODE_ENV is 'test' by default. All production-mode tests temporarily set it
 * to 'production' before calling and restore it after — this exercises the
 * production-guarded code paths.
 *
 * Assertions avoid checking the analytics instance arg (which is undefined in
 * the test environment because the Firebase lazy-init returns undefined from
 * the mock) and instead just verify that the right functions were called.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogEvent = jest.fn();
const mockSetAnalyticsCollectionEnabled = jest.fn();
const mockGetAnalyticsInstance = jest.fn();
const mockIsAnalyticsInitialized = jest.fn(() => false);

jest.mock('firebase/analytics', () => ({
  logEvent: (...args) => mockLogEvent(...args),
  setAnalyticsCollectionEnabled: (...args) =>
    mockSetAnalyticsCollectionEnabled(...args),
}));

jest.mock('../services/firebase', () => ({
  getAnalyticsInstance: () => mockGetAnalyticsInstance(),
  isAnalyticsInitialized: () => mockIsAnalyticsInitialized(),
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSENT_KEY = 'ff_analytics_consent';
const CITY_KEY = 'ff_user_city';

// ─── Per-test setup ───────────────────────────────────────────────────────────

let ga4Service;

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  ga4Service = require('../ga4Service').default;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setProd = () => {
  process.env.NODE_ENV = 'production';
};
const setTest = () => {
  process.env.NODE_ENV = 'test';
};

// ─── hasConsent() ─────────────────────────────────────────────────────────────

describe('hasConsent()', () => {
  test('returns false when key is not set', () => {
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('returns true when consent key is "true"', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    expect(ga4Service.hasConsent()).toBe(true);
  });

  test('returns false when consent key is "false"', () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('returns false for non-exact values ("1", "yes", "True")', () => {
    ['1', 'yes', 'True', ''].forEach(val => {
      localStorage.setItem(CONSENT_KEY, val);
      expect(ga4Service.hasConsent()).toBe(false);
    });
  });
});

// ─── isConsentPending() ───────────────────────────────────────────────────────

describe('isConsentPending()', () => {
  test('returns true when key is absent', () => {
    expect(ga4Service.isConsentPending()).toBe(true);
  });

  test('returns false when key is "true"', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    expect(ga4Service.isConsentPending()).toBe(false);
  });

  test('returns false when key is "false"', () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    expect(ga4Service.isConsentPending()).toBe(false);
  });
});

// ─── setConsent() — localStorage ─────────────────────────────────────────────

describe('setConsent() localStorage', () => {
  test('setConsent(true) writes "true"', () => {
    ga4Service.setConsent(true);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('true');
  });

  test('setConsent(false) writes "false"', () => {
    ga4Service.setConsent(false);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('false');
  });

  test('accept → decline → hasConsent returns false', () => {
    ga4Service.setConsent(true);
    ga4Service.setConsent(false);
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('decline → accept → hasConsent returns true', () => {
    ga4Service.setConsent(false);
    ga4Service.setConsent(true);
    expect(ga4Service.hasConsent()).toBe(true);
  });

  test('after setConsent, isConsentPending returns false', () => {
    ga4Service.setConsent(false);
    expect(ga4Service.isConsentPending()).toBe(false);
  });
});

// ─── setConsent() — production-mode Firebase calls ───────────────────────────

describe('setConsent() production-mode Firebase calls', () => {
  afterEach(setTest);

  test('setConsent(true) calls setAnalyticsCollectionEnabled in production', () => {
    setProd();
    ga4Service.setConsent(true);
    expect(mockSetAnalyticsCollectionEnabled).toHaveBeenCalledTimes(1);
    expect(mockSetAnalyticsCollectionEnabled.mock.calls[0][1]).toBe(true);
  });

  test('setConsent(false) when analytics initialized calls setAnalyticsCollectionEnabled(_, false)', () => {
    mockIsAnalyticsInitialized.mockReturnValue(true);
    setProd();
    ga4Service.setConsent(false);
    expect(mockSetAnalyticsCollectionEnabled).toHaveBeenCalledTimes(1);
    expect(mockSetAnalyticsCollectionEnabled.mock.calls[0][1]).toBe(false);
  });

  test('setConsent(false) when analytics not yet initialized skips Firebase call', () => {
    mockIsAnalyticsInitialized.mockReturnValue(false);
    setProd();
    ga4Service.setConsent(false);
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });

  test('setConsent(true/false) does not call setAnalyticsCollectionEnabled in test env', () => {
    ga4Service.setConsent(true);
    ga4Service.setConsent(false);
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });
});

// ─── applyConsent() — production-mode ────────────────────────────────────────

describe('applyConsent() production-mode', () => {
  afterEach(setTest);

  test('calls setAnalyticsCollectionEnabled when consent is given', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    expect(mockSetAnalyticsCollectionEnabled).toHaveBeenCalledTimes(1);
    expect(mockSetAnalyticsCollectionEnabled.mock.calls[0][1]).toBe(true);
  });

  test('does not call setAnalyticsCollectionEnabled when no consent', () => {
    setProd();
    ga4Service.applyConsent();
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });

  test('does not call setAnalyticsCollectionEnabled in test env', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    ga4Service.applyConsent();
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });
});

// ─── track() — guard: no-ops in test env ─────────────────────────────────────

describe('track() — no-op in test environment', () => {
  beforeEach(() => {
    localStorage.setItem(CONSENT_KEY, 'true');
  });

  test('trackLogin does not call logEvent in test env', () => {
    ga4Service.trackLogin('DONOR');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackSignUp does not call logEvent in test env', () => {
    ga4Service.trackSignUp('RECEIVER', 'Boston');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackDonationCreated does not call logEvent in test env', () => {
    ga4Service.trackDonationCreated();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackDonationClaimed does not call logEvent in test env', () => {
    ga4Service.trackDonationClaimed();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackMessageSent does not call logEvent in test env', () => {
    ga4Service.trackMessageSent();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackPageView does not call logEvent in test env', () => {
    ga4Service.trackPageView('/donor/dashboard');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});

// ─── track() — production-mode happy path ────────────────────────────────────

describe('track() — production-mode happy path', () => {
  beforeEach(() => {
    localStorage.setItem(CONSENT_KEY, 'true');
  });
  afterEach(setTest);

  test('trackLogin calls logEvent once', () => {
    setProd();
    ga4Service.trackLogin('DONOR');
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('login_success');
    expect(mockLogEvent.mock.calls[0][2]).toMatchObject({ role: 'DONOR' });
  });

  test('trackSignUp calls logEvent once with correct event name', () => {
    setProd();
    ga4Service.trackSignUp('RECEIVER', 'Toronto');
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('sign_up_success');
    expect(mockLogEvent.mock.calls[0][2]).toMatchObject({
      role: 'RECEIVER',
      city: 'Toronto',
    });
  });

  test('trackDonationCreated calls logEvent with donation_created', () => {
    setProd();
    ga4Service.trackDonationCreated();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('donation_created');
  });

  test('trackDonationClaimed calls logEvent with donation_claimed', () => {
    setProd();
    ga4Service.trackDonationClaimed();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('donation_claimed');
  });

  test('trackMessageSent calls logEvent with message_sent', () => {
    setProd();
    ga4Service.trackMessageSent();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('message_sent');
  });

  test('trackPageView calls logEvent with page_view and correct path', () => {
    setProd();
    ga4Service.trackPageView('/receiver/browse');
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    expect(mockLogEvent.mock.calls[0][1]).toBe('page_view');
    expect(mockLogEvent.mock.calls[0][2]).toMatchObject({
      page_path: '/receiver/browse',
    });
  });

  test('logEvent params include a numeric timestamp_ms', () => {
    setProd();
    ga4Service.trackLogin('DONOR');
    const params = mockLogEvent.mock.calls[0][2];
    expect(typeof params.timestamp_ms).toBe('number');
  });

  test('track is suppressed on admin routes even with consent', () => {
    delete window.location;
    window.location = { pathname: '/admin/users' };
    setProd();
    ga4Service.trackLogin('DONOR');
    expect(mockLogEvent).not.toHaveBeenCalled();
    window.location = { pathname: '/' };
  });

  test('track is suppressed when no consent in production', () => {
    localStorage.removeItem(CONSENT_KEY);
    setProd();
    ga4Service.trackLogin('DONOR');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});

// ─── getRole() sessionStorage fallback ───────────────────────────────────────

describe('getRole() sessionStorage fallback (via track params)', () => {
  afterEach(setTest);

  test('uses sessionStorage role when localStorage has none', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    sessionStorage.setItem('userRole', 'RECEIVER');
    setProd();
    ga4Service.trackMessageSent();
    expect(mockLogEvent.mock.calls[0][2]).toMatchObject({ role: 'RECEIVER' });
  });

  test('localStorage role takes priority over sessionStorage', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    localStorage.setItem('userRole', 'DONOR');
    sessionStorage.setItem('userRole', 'RECEIVER');
    setProd();
    ga4Service.trackMessageSent();
    expect(mockLogEvent.mock.calls[0][2].role).toBe('DONOR');
  });

  test('role key is absent when neither storage has it', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.trackMessageSent();
    expect(mockLogEvent.mock.calls[0][2]).not.toHaveProperty('role');
  });
});

// ─── trackSignUp city caching ─────────────────────────────────────────────────

describe('trackSignUp() city caching', () => {
  test('caches provided city in localStorage', () => {
    ga4Service.trackSignUp('DONOR', 'Montreal');
    expect(localStorage.getItem(CITY_KEY)).toBe('Montreal');
  });

  test('does not write city when city is undefined', () => {
    ga4Service.trackSignUp('DONOR', undefined);
    expect(localStorage.getItem(CITY_KEY)).toBeNull();
  });

  test('does not overwrite existing city with falsy value', () => {
    localStorage.setItem(CITY_KEY, 'Toronto');
    ga4Service.trackSignUp('DONOR', '');
    expect(localStorage.getItem(CITY_KEY)).toBe('Toronto');
  });
});

// ─── fetchAndCacheCity() — production-mode ────────────────────────────────────

describe('fetchAndCacheCity() — production-mode via applyConsent', () => {
  const flush = () => new Promise(r => setTimeout(r, 0));
  afterEach(() => {
    setTest();
    delete global.fetch;
  });

  test('caches city from successful ipapi response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ city: 'Vancouver' }),
      })
    );
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    await flush();
    expect(localStorage.getItem(CITY_KEY)).toBe('Vancouver');
  });

  test('skips fetch when city already cached', async () => {
    global.fetch = jest.fn();
    localStorage.setItem(CITY_KEY, 'Ottawa');
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    await flush();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('does not cache city on non-ok response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: jest.fn() })
    );
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    await flush();
    expect(localStorage.getItem(CITY_KEY)).toBeNull();
  });

  test('does not cache city when response has no city field', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ country: 'CA' }),
      })
    );
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    await flush();
    expect(localStorage.getItem(CITY_KEY)).toBeNull();
  });

  test('swallows network errors silently', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network fail')));
    localStorage.setItem(CONSENT_KEY, 'true');
    setProd();
    ga4Service.applyConsent();
    await expect(flush()).resolves.not.toThrow();
  });
});

// ─── Service shape ────────────────────────────────────────────────────────────

describe('ga4Service public shape', () => {
  const methods = [
    'applyConsent',
    'setConsent',
    'isConsentPending',
    'hasConsent',
    'trackPageView',
    'trackLogin',
    'trackSignUp',
    'trackDonationCreated',
    'trackDonationClaimed',
    'trackMessageSent',
  ];

  test('is a non-null object', () => {
    expect(typeof ga4Service).toBe('object');
    expect(ga4Service).not.toBeNull();
  });

  methods.forEach(name => {
    test(`exposes ${name} as a function`, () => {
      expect(typeof ga4Service[name]).toBe('function');
    });
  });
});
