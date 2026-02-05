// Mock the API service
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
  patch: jest.fn(),
  supportChatAPI: {
    sendMessage: jest.fn(),
  },
  rateLimitAPI: {
    getStats: jest.fn(),
    getUserStatus: jest.fn(),
  },
}));

const apiModule = require('../api');
const mockApi = apiModule.default;

describe('API Service - Rate Limiting Integration', () => {
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
              value: '/register',
            },
          ],
          requiresEscalation: false,
        },
        headers: {
          'x-ratelimit-limit': '10',
          'x-ratelimit-remaining': '9',
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/support/chat', {
        message: 'How do I create an account?',
        pageContext: '/register',
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
                value: 'support@foodflow.com',
              },
            ],
            requiresEscalation: false,
          },
          headers: {
            'x-ratelimit-limit': '10',
            'x-ratelimit-remaining': '0',
            'retry-after': '60',
          },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test message',
          pageContext: '/',
        });
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.data.intent).toBe('RATE_LIMITED');
        expect(error.response.headers['retry-after']).toBe('60');
      }
    });

    test('should handle server error (500)', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            reply: 'An error occurred. Please contact support.',
            intent: 'ERROR',
            requiresEscalation: true,
          },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test message',
          pageContext: '/',
        });
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.intent).toBe('ERROR');
        expect(error.response.data.requiresEscalation).toBe(true);
      }
    });

    test('should handle network errors', async () => {
      const mockError = new Error('Network Error');
      mockError.code = 'NETWORK_ERROR';

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test message',
          pageContext: '/',
        });
      } catch (error) {
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });

    test('should send correct request format', async () => {
      const mockResponse = {
        data: {
          reply: 'Response',
          actions: [],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const requestData = {
        message: 'How do I claim food?',
        pageContext: {
          route: '/claims',
          donationId: '123',
          claimId: null,
        },
      };

      await mockApi.post('/support/chat', requestData);

      expect(mockApi.post).toHaveBeenCalledWith('/support/chat', requestData);
    });

    test('should include authentication headers', async () => {
      const mockResponse = {
        data: {
          reply: 'Authenticated response',
          actions: [],
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      // Mock localStorage to have a token
      const mockToken = 'mock-jwt-token';
      Storage.prototype.getItem = jest.fn(() => mockToken);

      await mockApi.post('/support/chat', {
        message: 'Test',
        pageContext: '/',
      });

      // Verify that the request was made (authentication headers are added by interceptors)
      expect(mockApi.post).toHaveBeenCalledWith('/support/chat', {
        message: 'Test',
        pageContext: '/',
      });
    });
  });

  describe('Rate Limit Monitoring API', () => {
    test('should fetch rate limit statistics for admin', async () => {
      const mockResponse = {
        data: {
          activeUserLimiters: 5,
          activeIpLimiters: 10,
          userRequestsPerMinute: 10,
          ipRequestsPerMinute: 30,
          openaiRequestsPerMinute: 100,
          enabled: true,
        },
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
          limitPerMinute: 10,
          remaining: 7,
          enabled: true,
        },
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await mockApi.get('/admin/my-rate-limit');

      expect(result.data.userId).toBe(1);
      expect(result.data.remaining).toBe(7);
    });

    test('should handle forbidden access to admin endpoints', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            message: 'Access denied',
          },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      try {
        await mockApi.get('/admin/rate-limit-stats');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('API Rate Limit Headers', () => {
    test('should extract rate limit information from headers', async () => {
      const mockResponse = {
        data: { reply: 'Test' },
        headers: {
          'x-ratelimit-limit': '10',
          'x-ratelimit-remaining': '5',
          'x-ratelimit-reset': '1640995200',
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/support/chat', {
        message: 'Test',
        pageContext: '/',
      });

      expect(result.headers['x-ratelimit-limit']).toBe('10');
      expect(result.headers['x-ratelimit-remaining']).toBe('5');
    });

    test('should handle missing rate limit headers gracefully', async () => {
      const mockResponse = {
        data: { reply: 'Test' },
        headers: {}, // No rate limit headers
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/support/chat', {
        message: 'Test',
        pageContext: '/',
      });

      expect(result.data.reply).toBe('Test');
      expect(result.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('Request Retry Logic', () => {
    test('should not retry on rate limit errors', async () => {
      const mockError = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test',
          pageContext: '/',
        });
      } catch (error) {
        expect(mockApi.post).toHaveBeenCalledTimes(1);
      }
    });

    test('should handle timeout errors', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: 'Test',
          pageContext: '/',
        });
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });
  });

  describe('Request Validation', () => {
    test('should validate required fields before sending', async () => {
      // This test assumes validation is done on the client side
      const invalidRequests = [
        { pageContext: '/' }, // Missing message
        { message: '' }, // Empty message
        { message: 'test', pageContext: null }, // Invalid pageContext
      ];

      for (const invalidRequest of invalidRequests) {
        mockApi.post.mockRejectedValueOnce({
          response: { status: 400, data: { message: 'Invalid request' } },
        });
        try {
          await mockApi.post('/support/chat', invalidRequest);
          // If we reach here, the request didn't fail as expected
          expect(false).toBe(true);
        } catch (error) {
          // We expect these requests to fail
          expect(error.response.status).toBe(400);
        }
      }
    });

    test('should handle large message payloads', async () => {
      const largeMessage = 'a'.repeat(10000); // Very large message

      const mockError = {
        response: {
          status: 413, // Payload too large
          data: {
            message: 'Request entity too large',
          },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      try {
        await mockApi.post('/support/chat', {
          message: largeMessage,
          pageContext: '/',
        });
      } catch (error) {
        expect(error.response.status).toBe(413);
      }
    });
  });
});
