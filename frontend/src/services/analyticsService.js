import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async trackEvent(action, component, additionalData = {}) {
    try {
      const eventData = {
        action,
        component,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.pathname,
        ...additionalData
      };

      // Send to backend
      await axios.post(`${API_BASE_URL}/analytics/track`, eventData);
      
      // Also log to console for debugging
      console.log('Analytics Event:', eventData);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  trackPageView(pageName) {
    this.trackEvent('page_view', 'navigation', { pageName });
  }

  trackButtonClick(buttonName, location) {
    this.trackEvent('button_click', buttonName, { location });
  }

  trackFormSubmission(formName, success = true) {
    this.trackEvent('form_submission', formName, { success });
  }

  trackUserRegistration(userType) {
    this.trackEvent('user_registration', 'registration_form', { userType });
  }

  trackLogin(success = true) {
    this.trackEvent('login', 'login_form', { success });
  }

  trackNavigation(from, to) {
    this.trackEvent('navigation', 'router', { from, to });
  }
}

export default new AnalyticsService();
