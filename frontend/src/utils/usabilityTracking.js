import { trackHotjarEvent } from '../services/hotjar';

/**
 * Custom hooks and utilities for tracking usability metrics in Hotjar
 */

/**
 * Task tracking for measuring completion rate and time
 */
export const usabilityTasks = {
  // Donor tasks
  DONOR_REGISTER: 'task_donor_register',
  DONOR_CREATE_POST: 'task_donor_create_post',
  DONOR_MANAGE_CLAIM: 'task_donor_manage_claim',
  DONOR_SEND_MESSAGE: 'task_donor_send_message',
  DONOR_VIEW_ANALYTICS: 'task_donor_view_analytics',
  
  // Receiver tasks
  RECEIVER_REGISTER: 'task_receiver_register',
  RECEIVER_BROWSE_DONATIONS: 'task_receiver_browse_donations',
  RECEIVER_FILTER_SEARCH: 'task_receiver_filter_search',
  RECEIVER_CLAIM_DONATION: 'task_receiver_claim_donation',
  RECEIVER_VIEW_CLAIMS: 'task_receiver_view_claims',
  RECEIVER_SEND_MESSAGE: 'task_receiver_send_message',
  
  // Admin tasks
  ADMIN_LOGIN: 'task_admin_login',
  ADMIN_VERIFY_USER: 'task_admin_verify_user',
  ADMIN_VIEW_ANALYTICS: 'task_admin_view_analytics',
};

/**
 * Track task start
 * @param {string} taskName - Name of the task from usabilityTasks
 */
export const startTask = (taskName) => {
  const startTime = Date.now();
  sessionStorage.setItem(`task_${taskName}_start`, startTime);
  trackHotjarEvent(`${taskName}_started`);
  console.log(`🚀 TASK STARTED: ${taskName}`);
};

/**
 * Track task completion
 * @param {string} taskName - Name of the task from usabilityTasks
 * @param {boolean} success - Whether task was completed successfully
 */
export const completeTask = (taskName, success = true) => {
  const startTime = sessionStorage.getItem(`task_${taskName}_start`);
  
  if (startTime) {
    const duration = Date.now() - parseInt(startTime);
    sessionStorage.removeItem(`task_${taskName}_start`);
    
    // Track completion with success/failure
    trackHotjarEvent(success ? `${taskName}_completed` : `${taskName}_failed`);
    
    // Log duration for manual analysis
    console.log(`✅ TASK ${success ? 'COMPLETED' : 'FAILED'}: ${taskName} - Duration: ${duration}ms`);
  } else {
    trackHotjarEvent(success ? `${taskName}_completed` : `${taskName}_failed`);
    console.log(`✅ TASK ${success ? 'COMPLETED' : 'FAILED'}: ${taskName} - No start time recorded`);
  }
};

/**
 * Track user errors/mistakes
 * @param {string} errorType - Type of error (e.g., 'validation_error', 'navigation_error')
 * @param {string} location - Where the error occurred
 */
export const trackError = (errorType, location) => {
  trackHotjarEvent(`error_${errorType}_${location}`);
  console.log(`❌ ERROR TRACKED: ${errorType} at ${location}`);
};

/**
 * Track user satisfaction rating
 * @param {number} rating - Rating from 1-5
 * @param {string} feature - Feature being rated
 */
export const trackSatisfaction = (rating, feature) => {
  trackHotjarEvent(`satisfaction_${feature}_${rating}star`);
};

/**
 * Track navigation patterns
 * @param {string} from - Previous page
 * @param {string} to - Current page
 */
export const trackNavigation = (from, to) => {
  trackHotjarEvent(`navigation_${from}_to_${to}`);
};

/**
 * Track feature usage
 * @param {string} featureName - Name of feature used
 */
export const trackFeatureUse = (featureName) => {
  trackHotjarEvent(`feature_${featureName}`);
  console.log(`🔧 FEATURE USED: ${featureName}`);
};
