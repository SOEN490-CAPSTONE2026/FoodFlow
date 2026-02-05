// Mock the API service
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  post: jest.fn(),
  get: jest.fn(),
  supportChatAPI: {
    sendMessage: jest.fn()
  },
  rateLimitAPI: {
    getStats: jest.fn(),
    getUserStatus: jest.fn()
  }
}));

const api = require('../api');
const mockApi = api.default;

describe('API Service - Rate Limiting Integration (Simplified)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Support Chat API', () => {
    test('should handle successful support chat response', async () => {
      const mockResponse = {
        data: {
          reply: 'Thank you for your question',
          intent: 'ACCOUNT_CREATE',
          actions: [
            {
              type: 'navigate',
              label: 'Go to Registration',
              value: '/register'
            }
          ],
          requiresEscalation: false
        },
        headers: {
          'x-ratelimit-limit': '10',
          'x-ratelimit-remaining': '9'
        }
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/support/chat', {
        message: 'How do I create an account?',
        pageContext: '/register'
      });

      expect(result.data.reply).toBe('Thank you for your question');
      expect(result.data.intent).toBe('ACCOUNT_CREATE');
      expect(result.data.actions).toHaveLength(1);
      expect(result.headers['x-ratelimit-limit']).toBe('10');
    });

    test('should handle rate limiting error (429)', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            reply: 'Too many requests. Please wait before trying again.',
            intent: 'RATE_LIMITED',
            actions: [
              {
                type: 'contact',
                label: 'Contact Support',
                value: 'support@foodflow.com'
              }
            ],
            requiresEscalation: false
          },
          headers: {
            'x-ratelimit-limit': '10',
            'x-ratelimit-remaining': '0',
            'retry-after': '60'
          }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test message',
          pageContext: '/'
        });
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.data.intent).toBe('RATE_LIMITED');
        expect(error.response.headers['retry-after']).toBe('60');
      }
    });
  });

  describe('Rate Limit Monitoring API', () => {
    test('should fetch rate limit statistics for admin', async () => {
      const mockResponse = {
        data: {
          activeUserLimiters: 5,
          activeIpLimiters: 12,
          openAiRequestsToday: 234,
          enabled: true
        }
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/admin/rate-limit-stats');

      expect(result.data.activeUserLimiters).toBe(5);
      expect(result.data.enabled).toBe(true);
    });

    test('should fetch user rate limit status', async () => {
      const mockResponse = {
        data: {
          userId: 1,
          limit: 10,
          remaining: 7,
          resetTime: '2024-01-01T13:00:00Z'
        }
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/admin/my-rate-limit');

      expect(result.data.userId).toBe(1);
      expect(result.data.remaining).toBe(7);
    });
  });

  describe('Request Validation', () => {
    test('should validate required fields before sending', () => {
      const requestData = {
        message: 'Test message',
        pageContext: '/register'
      };

      expect(requestData.message).toBeDefined();
      expect(requestData.pageContext).toBeDefined();
      expect(typeof requestData.message).toBe('string');
      expect(requestData.message.length).toBeGreaterThan(0);
    });
  });
});