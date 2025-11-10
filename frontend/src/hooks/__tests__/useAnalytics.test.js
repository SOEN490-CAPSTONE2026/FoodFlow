import { renderHook } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../useAnalytics'; 
import analyticsService from '../../services/analyticsService';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn()
}));

jest.mock('../../services/analyticsService', () => ({
  trackPageView: jest.fn(),
  trackButtonClick: jest.fn(),
  trackFormSubmission: jest.fn(),
  trackUserRegistration: jest.fn(),
  trackLogin: jest.fn(),
  trackEvent: jest.fn()
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('page view tracking', () => {
    it('should track page view on mount', () => {
      const mockLocation = { pathname: '/home' };
      useLocation.mockReturnValue(mockLocation);
      renderHook(() => useAnalytics());
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/home');
      expect(analyticsService.trackPageView).toHaveBeenCalledTimes(1);
    });

    it('track page view on location change', () => {
      const mockLocation = { pathname: '/home' };
      useLocation.mockReturnValue(mockLocation);
      const { rerender } = renderHook(() => useAnalytics());
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/home');
      const newLocation = { pathname: '/about' };
      useLocation.mockReturnValue(newLocation);
      rerender();
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/about');
      expect(analyticsService.trackPageView).toHaveBeenCalledTimes(2);
    });

    it('track different pathnames', () => {
      const paths = ['/home', '/products', '/contact'];
      paths.forEach(pathname => {
        useLocation.mockReturnValue({ pathname });
        renderHook(() => useAnalytics());
      });

      paths.forEach(pathname => {
        expect(analyticsService.trackPageView).toHaveBeenCalledWith(pathname);
      });
    });
  });

  describe('return tracking methods', () => {
    beforeEach(() => {
      useLocation.mockReturnValue({ pathname: '/test' });
    });

    it('return trackButtonClick method', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.trackButtonClick).toBeDefined();
      expect(typeof result.current.trackButtonClick).toBe('function');
    });

    it('return trackFormSubmission method', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.trackFormSubmission).toBeDefined();
      expect(typeof result.current.trackFormSubmission).toBe('function');
    });

    it('return trackUserRegistration method', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.trackUserRegistration).toBeDefined();
      expect(typeof result.current.trackUserRegistration).toBe('function');
    });

    it('return trackLogin method', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.trackLogin).toBeDefined();
      expect(typeof result.current.trackLogin).toBe('function');
    });

    it('return trackEvent method', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.trackEvent).toBeDefined();
      expect(typeof result.current.trackEvent).toBe('function');
    });

    it('call analyticsService.trackButtonClick when trackButtonClick is called', () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.trackButtonClick('submit-button');
      expect(analyticsService.trackButtonClick).toHaveBeenCalledWith('submit-button');
    });

    it('call analyticsService.trackFormSubmission when trackFormSubmission is called', () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.trackFormSubmission('contact-form');
      expect(analyticsService.trackFormSubmission).toHaveBeenCalledWith('contact-form');
    });

    it('call analyticsService.trackUserRegistration when trackUserRegistration is called', () => {
      const { result } = renderHook(() => useAnalytics());
      const userData = { email: 'test@example.com' };
      result.current.trackUserRegistration(userData);
      expect(analyticsService.trackUserRegistration).toHaveBeenCalledWith(userData);
    });

    it('call analyticsService.trackLogin when trackLogin is called', () => {
      const { result } = renderHook(() => useAnalytics());
      const loginData = { userId: '123' };
      result.current.trackLogin(loginData);
      expect(analyticsService.trackLogin).toHaveBeenCalledWith(loginData);
    });

    it('call analyticsService.trackEvent when trackEvent is called', () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.trackEvent('custom-event', { data: 'value' });
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('custom-event', { data: 'value' });
    });

    it('maintain correct context when calling bound methods', () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.trackButtonClick('button1');
      result.current.trackButtonClick('button2');
      expect(analyticsService.trackButtonClick).toHaveBeenCalledTimes(2);
      expect(analyticsService.trackButtonClick).toHaveBeenNthCalledWith(1, 'button1');
      expect(analyticsService.trackButtonClick).toHaveBeenNthCalledWith(2, 'button2');
    });
  });

  describe('edge cases', () => {
    it('should handle root path', () => {
      useLocation.mockReturnValue({ pathname: '/' });
      renderHook(() => useAnalytics());
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/');
    });

    it('paths with query parameters in pathname', () => {
      useLocation.mockReturnValue({ pathname: '/products', search: '?id=123' });
      renderHook(() => useAnalytics());
      expect(analyticsService.trackPageView).toHaveBeenCalledWith('/products');
    });

    it('do not track page view again if location object changes but pathname stays the same', () => {
      useLocation.mockReturnValue({ pathname: '/home', search: '' });
      const { rerender } = renderHook(() => useAnalytics());
      useLocation.mockReturnValue({ pathname: '/home', search: '?tab=1' });
      rerender();
      expect(analyticsService.trackPageView).toHaveBeenCalledTimes(2);
    });
  });
});