import Hotjar from '@hotjar/browser';

const HOTJAR_SITE_ID = 6567728;
const HOTJAR_VERSION = 6;

/**
 * Initialize Hotjar tracking
 * Only initializes in production or UAT environments
 */
export const initHotjar = () => {
  // Run Hotjar in production, UAT, or when hostname matches production URL
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REACT_APP_ENV === 'uat' ||
                       window.location.hostname === 'frontend-production-3b5a.up.railway.app';
  
  if (isProduction) {
    try {
      Hotjar.init(HOTJAR_SITE_ID, HOTJAR_VERSION);
      console.log('Hotjar initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hotjar:', error);
    }
  } else {
    console.log('Hotjar disabled in development mode');
  }
};

/**
 * Identify a user in Hotjar
 * @param {string} userId - Unique user identifier
 * @param {object} attributes - User attributes (e.g., role, email, etc.)
 */
export const identifyHotjarUser = (userId, attributes = {}) => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REACT_APP_ENV === 'uat' ||
                       window.location.hostname === 'frontend-production-3b5a.up.railway.app';
  
  if (isProduction) {
    try {
      Hotjar.identify(userId, attributes);
    } catch (error) {
      console.error('Failed to identify Hotjar user:', error);
    }
  }
};

/**
 * Track a custom event in Hotjar
 * @param {string} eventName - Name of the event to track
 */
export const trackHotjarEvent = (eventName) => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REACT_APP_ENV === 'uat' ||
                       window.location.hostname === 'frontend-production-3b5a.up.railway.app';
  
  if (isProduction) {
    try {
      Hotjar.event(eventName);
    } catch (error) {
      console.error('Failed to track Hotjar event:', error);
    }
  }
};

/**
 * Update Hotjar state change (for SPA navigation)
 * @param {string} relativePath - The new path/URL
 */
export const updateHotjarStateChange = (relativePath) => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REACT_APP_ENV === 'uat' ||
                       window.location.hostname === 'frontend-production-3b5a.up.railway.app';
  
  if (isProduction) {
    try {
      Hotjar.stateChange(relativePath);
    } catch (error) {
      console.error('Failed to update Hotjar state:', error);
    }
  }
};
