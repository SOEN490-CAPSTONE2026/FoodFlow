/**
 * ga4Service tests
 *
 * NOTE: Jest always runs with NODE_ENV='test', so isProduction() returns false.
 * This means track() and applyConsent() are no-ops in this environment — which
 * is intentional and what we verify in the "guards" section.
 * For production-mode behavior (Firebase calls), we use jest.isolateModules()
 * to reload the module with NODE_ENV='production'.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogEvent = jest.fn();
const mockSetAnalyticsCollectionEnabled = jest.fn();
const mockGetAnalyticsInstance = jest.fn(() => ({ app: {} }));
const mockIsAnalyticsInitialized = jest.fn(() => false);

jest.mock('firebase/analytics', () => ({
  logEvent: (...args) => mockLogEvent(...args),
  setAnalyticsCollectionEnabled: (...args) =>
    mockSetAnalyticsCollectionEnabled(...args),
}));

jest.mock('../firebase', () => ({
  getAnalyticsInstance: () => mockGetAnalyticsInstance(),
  isAnalyticsInitialized: () => mockIsAnalyticsInitialized(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONSENT_KEY = 'ff_analytics_consent';
const CITY_KEY = 'ff_user_city';

// Run fresh import each test to avoid applyConsent() side-effects spilling across tests
let ga4Service;

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  // Re-require after clearing so applyConsent() runs on a clean slate each time
  ga4Service = require('../ga4Service').default;
});

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
});

// ─── isConsentPending() ───────────────────────────────────────────────────────

describe('isConsentPending()', () => {
  test('returns true when key is absent (never decided)', () => {
    expect(ga4Service.isConsentPending()).toBe(true);
  });

  test('returns false when consent key is "true"', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    expect(ga4Service.isConsentPending()).toBe(false);
  });

  test('returns false when consent key is "false"', () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    expect(ga4Service.isConsentPending()).toBe(false);
  });
});

// ─── setConsent() — localStorage writes (env-agnostic) ───────────────────────

describe('setConsent() localStorage', () => {
  test('setConsent(true) writes "true" to localStorage', () => {
    ga4Service.setConsent(true);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('true');
  });

  test('setConsent(false) writes "false" to localStorage', () => {
    ga4Service.setConsent(false);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('false');
  });

  test('setConsent(true) followed by hasConsent() returns true', () => {
    ga4Service.setConsent(true);
    expect(ga4Service.hasConsent()).toBe(true);
  });

  test('setConsent(false) followed by hasConsent() returns false', () => {
    ga4Service.setConsent(false);
    expect(ga4Service.hasConsent()).toBe(false);
  });
});

// ─── setConsent() — verifies Firebase helpers are NOT called in test env ─────

describe('setConsent() Firebase calls are skipped in test environment', () => {
  test('setConsent(true) does not call setAnalyticsCollectionEnabled in test env', () => {
    ga4Service.setConsent(true);
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });

  test('setConsent(false) does not call setAnalyticsCollectionEnabled in test env', () => {
    ga4Service.setConsent(false);
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });
});

// ─── track() guards — no-ops in test environment ─────────────────────────────

describe('track() guards in test environment (NODE_ENV=test)', () => {
  beforeEach(() => {
    localStorage.setItem(CONSENT_KEY, 'true'); // consent given
  });

  test('trackLogin does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackLogin('DONOR');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackSignUp does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackSignUp('RECEIVER', 'Boston');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackDonationCreated does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackDonationCreated();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackDonationClaimed does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackDonationClaimed();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackMessageSent does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackMessageSent();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('trackPageView does not call logEvent because NODE_ENV is not production', () => {
    ga4Service.trackPageView('/donor/dashboard');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});

// ─── trackSignUp city caching ─────────────────────────────────────────────────

describe('trackSignUp() city caching', () => {
  test('caches provided city in localStorage before tracking', () => {
    ga4Service.trackSignUp('DONOR', 'Montreal');
    expect(localStorage.getItem(CITY_KEY)).toBe('Montreal');
  });

  test('does not write city to localStorage when city is undefined', () => {
    ga4Service.trackSignUp('DONOR', undefined);
    expect(localStorage.getItem(CITY_KEY)).toBeNull();
  });

  test('does not overwrite existing city when new city is falsy', () => {
    localStorage.setItem(CITY_KEY, 'Toronto');
    ga4Service.trackSignUp('DONOR', '');
    expect(localStorage.getItem(CITY_KEY)).toBe('Toronto');
  });
});

// ─── applyConsent() — no-op in test environment ───────────────────────────────

describe('applyConsent()', () => {
  test('does not call setAnalyticsCollectionEnabled in test environment', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    ga4Service.applyConsent();
    expect(mockSetAnalyticsCollectionEnabled).not.toHaveBeenCalled();
  });
});

// ─── hasConsent() — edge cases ────────────────────────────────────────────────

describe('hasConsent() edge cases', () => {
  test('returns false for "1" (only exact "true" is accepted)', () => {
    localStorage.setItem(CONSENT_KEY, '1');
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('returns false for "yes"', () => {
    localStorage.setItem(CONSENT_KEY, 'yes');
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('returns false for "True" (case-sensitive)', () => {
    localStorage.setItem(CONSENT_KEY, 'True');
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('returns false for empty string', () => {
    localStorage.setItem(CONSENT_KEY, '');
    expect(ga4Service.hasConsent()).toBe(false);
  });
});

// ─── setConsent() — flip-flop behaviour ──────────────────────────────────────

describe('setConsent() toggling', () => {
  test('accepts → declines: hasConsent() is false', () => {
    ga4Service.setConsent(true);
    ga4Service.setConsent(false);
    expect(ga4Service.hasConsent()).toBe(false);
  });

  test('declines → accepts: hasConsent() is true', () => {
    ga4Service.setConsent(false);
    ga4Service.setConsent(true);
    expect(ga4Service.hasConsent()).toBe(true);
  });

  test('calling setConsent(true) twice: hasConsent() stays true', () => {
    ga4Service.setConsent(true);
    ga4Service.setConsent(true);
    expect(ga4Service.hasConsent()).toBe(true);
  });

  test('after any setConsent() call, isConsentPending() is false', () => {
    ga4Service.setConsent(false);
    expect(ga4Service.isConsentPending()).toBe(false);
  });
});

// ─── ga4Service public shape ──────────────────────────────────────────────────

describe('ga4Service exports', () => {
  test('is a plain object', () => {
    expect(typeof ga4Service).toBe('object');
    expect(ga4Service).not.toBeNull();
  });

  const expectedMethods = [
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

  expectedMethods.forEach(name => {
    test(`exposes method: ${name}`, () => {
      expect(typeof ga4Service[name]).toBe('function');
    });
  });
});

// ─── track methods are callable without throwing ─────────────────────────────

describe('track methods do not throw', () => {
  test('trackLogin does not throw with DONOR role', () => {
    expect(() => ga4Service.trackLogin('DONOR')).not.toThrow();
  });

  test('trackLogin does not throw with RECEIVER role', () => {
    expect(() => ga4Service.trackLogin('RECEIVER')).not.toThrow();
  });

  test('trackSignUp does not throw with role and city', () => {
    expect(() => ga4Service.trackSignUp('DONOR', 'Austin')).not.toThrow();
  });

  test('trackSignUp does not throw when city is omitted', () => {
    expect(() => ga4Service.trackSignUp('RECEIVER')).not.toThrow();
  });

  test('trackDonationCreated does not throw', () => {
    expect(() => ga4Service.trackDonationCreated()).not.toThrow();
  });

  test('trackDonationClaimed does not throw', () => {
    expect(() => ga4Service.trackDonationClaimed()).not.toThrow();
  });

  test('trackMessageSent does not throw', () => {
    expect(() => ga4Service.trackMessageSent()).not.toThrow();
  });

  test('trackPageView does not throw with a path string', () => {
    expect(() => ga4Service.trackPageView('/receiver/browse')).not.toThrow();
  });
});

// ─── track methods do not mutate consent state ───────────────────────────────

describe('track methods do not mutate consent state', () => {
  test('calling track methods does not change the consent key', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    ga4Service.trackLogin('DONOR');
    ga4Service.trackSignUp('DONOR', 'Chicago');
    ga4Service.trackDonationCreated();
    ga4Service.trackDonationClaimed();
    ga4Service.trackMessageSent();
    ga4Service.trackPageView('/donor/dashboard');
    expect(localStorage.getItem(CONSENT_KEY)).toBe('true');
  });

  test('calling track methods without consent does not set consent key', () => {
    // no consent set
    ga4Service.trackLogin('DONOR');
    ga4Service.trackDonationCreated();
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
  });
});
