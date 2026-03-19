/**
 * ga4Service — wraps Firebase Analytics logEvent for FoodFlow GA4 tracking.
 *
 * Design decisions:
 * - Uses the existing Firebase Analytics instance (already initialised in firebase.js)
 * - All events are silently skipped on /admin/* routes
 * - All events are silently skipped when the user has declined cookie consent
 * - No PII is ever passed: no email, phone, or precise address
 * - City is resolved from IP geolocation (ipapi.co) on app boot and cached in
 *   localStorage. Registration city overrides this if provided (more accurate).
 * - Role is read from localStorage/sessionStorage (set by AuthContext on login)
 * - IP anonymization is on by default in Firebase Analytics for web — no extra config needed
 */

import { logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { getAnalyticsInstance, isAnalyticsInitialized } from './firebase';

const CONSENT_KEY = 'ff_analytics_consent';
const CITY_KEY = 'ff_user_city';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true ONLY if the user has explicitly accepted (no data collected until then). */
const hasConsent = () => localStorage.getItem(CONSENT_KEY) === 'true';

/** Returns true when on an admin route — analytics always suppressed there. */
const isAdminRoute = () => window.location.pathname.startsWith('/admin');

/** Returns true only in a production build. */
const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Fetches coarse city name from IP geolocation and caches it in localStorage.
 * Only runs once per session (skips if city already cached).
 * Fire-and-forget — failures are silently swallowed.
 */
const fetchAndCacheCity = async () => {
  if (localStorage.getItem(CITY_KEY)) return; // already known
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return;
    const data = await res.json();
    if (data.city) localStorage.setItem(CITY_KEY, data.city);
  } catch (_) {
    // network error or blocked — degrade gracefully, city just won't appear in events
  }
};

/** Reads role from whichever storage AuthContext wrote it to. */
const getRole = () =>
  localStorage.getItem('userRole') ||
  sessionStorage.getItem('userRole') ||
  null;

/** Base properties attached to every event. */
const baseParams = () => ({
  timestamp_ms: Date.now(),
  city: localStorage.getItem(CITY_KEY) || undefined,
  role: getRole() || undefined,
});

/**
 * Core dispatch — skips silently if consent declined or on admin route.
 * Strips undefined values so GA4 doesn't receive empty properties.
 */
const track = (eventName, params = {}) => {
  if (!isProduction() || isAdminRoute() || !hasConsent()) return;

  const merged = { ...baseParams(), ...params };
  // Remove keys whose value is undefined (GA4 rejects them)
  const clean = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined)
  );

  logEvent(getAnalyticsInstance(), eventName, clean);
};

// ─── Public API ───────────────────────────────────────────────────────────────

const ga4Service = {
  /**
   * Synchronise Firebase Analytics collection state with stored consent.
   * Called once on app boot and whenever consent changes.
   */
  applyConsent() {
    if (!isProduction()) return;
    // Only initialise (and thus activate) the analytics instance after explicit consent.
    // Before consent, we simply do nothing — getAnalyticsInstance() is never called.
    if (hasConsent()) {
      setAnalyticsCollectionEnabled(getAnalyticsInstance(), true);
      fetchAndCacheCity();
    }
  },

  /**
   * Persist consent decision and update Firebase Analytics collection state.
   * @param {boolean} accepted
   */
  setConsent(accepted) {
    localStorage.setItem(CONSENT_KEY, String(accepted));
    if (isProduction()) {
      if (accepted) {
        // First time consent given — now safe to initialise analytics for the first time.
        setAnalyticsCollectionEnabled(getAnalyticsInstance(), true);
        fetchAndCacheCity();
      } else {
        // Only disable if analytics was already initialised (i.e. previously accepted).
        if (isAnalyticsInitialized()) {
          setAnalyticsCollectionEnabled(getAnalyticsInstance(), false);
        }
      }
    }
  },

  /** True when the user has not yet made a consent choice (never set the key). */
  isConsentPending() {
    return localStorage.getItem(CONSENT_KEY) === null;
  },

  /** True when the user has consented. */
  hasConsent,

  // ── Page tracking ──────────────────────────────────────────────────────────

  /**
   * Manual page_view trigger for SPA navigation.
   * Called on every route change by useAnalytics.
   * @param {string} path  e.g. '/donor/dashboard'
   */
  trackPageView(path) {
    track('page_view', {
      page_path: path,
      page_title: document.title,
    });
  },

  // ── Auth events ───────────────────────────────────────────────────────────

  /**
   * Fired on successful login.
   * @param {string} role  'DONOR' | 'RECEIVER'
   */
  trackLogin(role) {
    track('login_success', { role });
  },

  /**
   * Fired on successful registration.
   * Also caches city in localStorage for use in future events.
   * @param {string} role  'DONOR' | 'RECEIVER'
   * @param {string} city  Coarse city name from the registration form
   */
  trackSignUp(role, city) {
    if (city) localStorage.setItem(CITY_KEY, city);
    track('sign_up_success', { role, city: city || undefined });
  },

  // ── Platform action events ────────────────────────────────────────────────

  /** Fired when a donor successfully creates a new surplus listing. */
  trackDonationCreated() {
    track('donation_created');
  },

  /** Fired when a receiver successfully claims a donation. */
  trackDonationClaimed() {
    track('donation_claimed');
  },

  /** Fired when any user sends a chat message. */
  trackMessageSent() {
    track('message_sent');
  },
};

// Apply stored consent state immediately on module load
ga4Service.applyConsent();

export default ga4Service;
