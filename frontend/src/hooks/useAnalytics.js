import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import ga4Service from '../services/ga4Service';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views — both internal backend analytics and GA4
    analyticsService.trackPageView(location.pathname);
    ga4Service.trackPageView(location.pathname);
  }, [location]);

  return {
    trackButtonClick: analyticsService.trackButtonClick.bind(analyticsService),
    trackFormSubmission:
      analyticsService.trackFormSubmission.bind(analyticsService),
    trackUserRegistration:
      analyticsService.trackUserRegistration.bind(analyticsService),
    trackLogin: analyticsService.trackLogin.bind(analyticsService),
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
  };
};
