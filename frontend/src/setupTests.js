// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios globally to handle ES module imports
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(url => {
        // Mock the user profile/region endpoint to prevent TimezoneContext from making API calls
        if (url === '/user/profile/region') {
          return Promise.resolve({
            data: { timezone: 'America/Toronto', region: 'CA' },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
    get: jest.fn(url => {
      if (url === '/user/profile/region') {
        return Promise.resolve({
          data: { timezone: 'America/Toronto', region: 'CA' },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));
