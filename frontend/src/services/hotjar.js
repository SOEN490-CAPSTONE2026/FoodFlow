import Hotjar from '@hotjar/browser';

const HOTJAR_SITE_ID = 6567728;
const HOTJAR_VERSION = 6;

/**
 * Initialize Hotjar tracking
 * Only initializes in production or UAT environments
 */
export const initHotjar = () => {
  // TEMPORARY: Always enable for testing
  try {
    Hotjar.init(HOTJAR_SITE_ID, HOTJAR_VERSION);
    console.log('🎯 Hotjar initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Hotjar:', error);
  }
};

/**
 * Identify a user in Hotjar
 * @param {string} userId - Unique user identifier
 * @param {object} attributes - User attributes (e.g., role, email, etc.)
 */
export const identifyHotjarUser = (userId, attributes = {}) => {
  const isProductionDeploy = window.location.hostname.includes('railway.app') || 
                             window.location.hostname.includes('frontend-production');
  const isUAT = process.env.REACT_APP_ENV === 'uat';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProductionDeploy || isUAT || isProduction) {
    try {
      Hotjar.identify(userId, attributes);
      console.log('👤 Hotjar user identified:', userId, attributes);
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
  const isProductionDeploy = window.location.hostname.includes('railway.app') || 
                             window.location.hostname.includes('frontend-production');
  const isUAT = process.env.REACT_APP_ENV === 'uat';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProductionDeploy || isUAT || isProduction) {
    try {
      Hotjar.event(eventName);
      console.log('📊 Hotjar event tracked:', eventName);
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
  const isProductionDeploy = window.location.hostname.includes('railway.app') || 
                             window.location.hostname.includes('frontend-production');
  const isUAT = process.env.REACT_APP_ENV === 'uat';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProductionDeploy || isUAT || isProduction) {
    try {
      Hotjar.stateChange(relativePath);
    } catch (error) {
      console.error('Failed to update Hotjar state:', error);
    }
  }
};
