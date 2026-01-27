import AnalyticsService from '../analyticsService';

jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { success: true } }))
}));

const axios = require('axios');

describe('AnalyticsService', () => {
  let originalLocation;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();    
    originalLocation = window.location;
    delete window.location;
    window.location = { pathname: '/test-page' };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    axios.post.mockResolvedValue({ data: { success: true } });
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    window.location = originalLocation;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should generate a session ID on initialization', () => {
      expect(AnalyticsService.sessionId).toBeDefined();
      expect(AnalyticsService.sessionId).toMatch(/^session_.*_\d+$/);
    });

    it('set start time on initialization', () => {
      expect(AnalyticsService.startTime).toBeDefined();
      expect(typeof AnalyticsService.startTime).toBe('number');
    });
  });

  describe('generateSessionId', () => {
    it('should generate a unique session ID with correct format', () => {
      const sessionId = AnalyticsService.generateSessionId();
      expect(sessionId).toMatch(/^session_[a-z0-9]+_\d+$/);
    });

    it('generate different session IDs', () => {
      Math.random.mockRestore();
      const id1 = AnalyticsService.generateSessionId();
      const id2 = AnalyticsService.generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('trackEvent', () => {
    it('should send event data to the backend', async () => {
      await AnalyticsService.trackEvent('test_action', 'test_component');
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/analytics/track',
        expect.objectContaining({
          action: 'test_action',
          component: 'test_component',
          sessionId: AnalyticsService.sessionId,
          timestamp: 1234567890,
          url: '/test-page'
        })
      );
    });

    it('include additional data in the event', async () => {
      const additionalData = { customField: 'customValue', count: 5 };
      await AnalyticsService.trackEvent('test_action', 'test_component', additionalData);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/analytics/track',
        expect.objectContaining({
          action: 'test_action',
          component: 'test_component',
          customField: 'customValue',
          count: 5
        })
      );
    });

    it('log event', async () => {
      await AnalyticsService.trackEvent('test_action', 'test_component');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Analytics Event:',
        expect.objectContaining({
          action: 'test_action',
          component: 'test_component'
        })
      );
    });

    it('handle API errors', async () => {
      const error = new Error('Network error');
      axios.post.mockRejectedValue(error);
      await AnalyticsService.trackEvent('test_action', 'test_component');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to track analytics event:',
        error
      );
    });

    it('use custom API base URL from environment variable', async () => {
      const originalEnv = process.env.REACT_APP_API_BASE_URL;
      process.env.REACT_APP_API_BASE_URL = 'https://api.example.com/api';
      jest.resetModules();
      jest.doMock('axios', () => ({
        post: jest.fn(() => Promise.resolve({ data: { success: true } }))
      }));
      const freshAxios = require('axios');      
      const { default: NewAnalyticsService } = require('../analyticsService');
      await NewAnalyticsService.trackEvent('test_action', 'test_component');
      expect(freshAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/api/analytics/track',
        expect.any(Object)
      );
      process.env.REACT_APP_API_BASE_URL = originalEnv;
      jest.dontMock('axios');
    });
  });

  describe('trackPageView', () => {
    it('track page view with correct parameters', async () => {
      await AnalyticsService.trackPageView('Home Page');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'page_view',
          component: 'navigation',
          pageName: 'Home Page'
        })
      );
    });
  });

  describe('trackButtonClick', () => {
    it('track button click with name and location', async () => {
      await AnalyticsService.trackButtonClick('Submit Button', 'header');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'button_click',
          component: 'Submit Button',
          location: 'header'
        })
      );
    });
  });

  describe('trackFormSubmission', () => {
    it('track successful form submission', async () => {
      await AnalyticsService.trackFormSubmission('Contact Form', true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'form_submission',
          component: 'Contact Form',
          success: true
        })
      );
    });

    it('track failed form submission', async () => {
      await AnalyticsService.trackFormSubmission('Contact Form', false);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'form_submission',
          component: 'Contact Form',
          success: false
        })
      );
    });

    it('default to success=true when not specified', async () => {
      await AnalyticsService.trackFormSubmission('Contact Form');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('trackUserRegistration', () => {
    it('track user registration with user type', async () => {
      await AnalyticsService.trackUserRegistration('premium');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'user_registration',
          component: 'registration_form',
          userType: 'premium'
        })
      );
    });
  });

  describe('trackLogin', () => {
    it('track successful login', async () => {
      await AnalyticsService.trackLogin(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'login',
          component: 'login_form',
          success: true
        })
      );
    });

    it('track failed login', async () => {
      await AnalyticsService.trackLogin(false);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'login',
          component: 'login_form',
          success: false
        })
      );
    });

    it('default to success=true when not specified', async () => {
      await AnalyticsService.trackLogin();
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('trackNavigation', () => {
    it('track navigation between pages', async () => {
      await AnalyticsService.trackNavigation('/home', '/about');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'navigation',
          component: 'router',
          from: '/home',
          to: '/about'
        })
      );
    });
  });
});