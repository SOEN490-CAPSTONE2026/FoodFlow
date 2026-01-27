import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

jest.mock('./App', () => () => <nav role="navigation" />);

// Mock axios so Jest doesn't parse its ESM build from node_modules
jest.mock('axios', () => {
  const handlers = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return { __esModule: true, default: { create: () => handlers, ...handlers } };
});
// Mock useAnalytics hook
jest.mock('./hooks/useAnalytics', () => ({ useAnalytics: () => {} }));

// Mock NavigationBar
jest.mock('./components/NavigationBar', () => () => <nav role="navigation" />);

let warnSpy, errorSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (String(msg).includes('React Router Future Flag Warning')) {
      return;
    }
  });
  errorSpy = jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
    if (String(msg).includes('React Router Future Flag Warning')) {
      return;
    }
  });
});
afterAll(() => {
  warnSpy && warnSpy.mockRestore();
  errorSpy && errorSpy.mockRestore();
});

test('App renders and shows navigation', () => {
  render(<App />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
