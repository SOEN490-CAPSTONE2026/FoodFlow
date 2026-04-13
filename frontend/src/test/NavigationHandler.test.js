import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavigationHandler from '../components/NavigationHandler';

// ─── Mock navigation service ──────────────────────────────────────────────────
const mockSetNavigator = jest.fn();
const mockSetNavigationLocation = jest.fn();

jest.mock('../services/navigation', () => ({
  setNavigator: (...args) => mockSetNavigator(...args),
  setNavigationLocation: (...args) => mockSetNavigationLocation(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const renderInRouter = (initialEntry = '/') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NavigationHandler />
    </MemoryRouter>
  );

// ─── Render ───────────────────────────────────────────────────────────────────

describe('NavigationHandler render', () => {
  test('renders nothing into the DOM (returns null)', () => {
    const { container } = renderInRouter();
    expect(container.firstChild).toBeNull();
  });

  test('does not throw on mount', () => {
    expect(() => renderInRouter()).not.toThrow();
  });
});

// ─── Side-effects ─────────────────────────────────────────────────────────────

describe('NavigationHandler side-effects', () => {
  test('calls setNavigator on mount', () => {
    renderInRouter();
    expect(mockSetNavigator).toHaveBeenCalledTimes(1);
  });

  test('passes a function to setNavigator', () => {
    renderInRouter();
    expect(typeof mockSetNavigator.mock.calls[0][0]).toBe('function');
  });

  test('calls setNavigationLocation on mount', () => {
    renderInRouter();
    expect(mockSetNavigationLocation).toHaveBeenCalledTimes(1);
  });

  test('passes the current location object to setNavigationLocation', () => {
    renderInRouter('/donor/dashboard');
    const locationArg = mockSetNavigationLocation.mock.calls[0][0];
    expect(locationArg).toHaveProperty('pathname');
    expect(locationArg.pathname).toBe('/donor/dashboard');
  });

  test('setNavigationLocation receives an object with a search property', () => {
    renderInRouter('/');
    const locationArg = mockSetNavigationLocation.mock.calls[0][0];
    expect(locationArg).toHaveProperty('search');
  });

  test('setNavigationLocation receives an object with a hash property', () => {
    renderInRouter('/');
    const locationArg = mockSetNavigationLocation.mock.calls[0][0];
    expect(locationArg).toHaveProperty('hash');
  });
});

// ─── Multiple mounts ──────────────────────────────────────────────────────────

describe('NavigationHandler with different routes', () => {
  test('passes correct pathname for root route', () => {
    renderInRouter('/');
    const locationArg = mockSetNavigationLocation.mock.calls[0][0];
    expect(locationArg.pathname).toBe('/');
  });

  test('passes correct pathname for nested route', () => {
    renderInRouter('/receiver/browse');
    const locationArg = mockSetNavigationLocation.mock.calls[0][0];
    expect(locationArg.pathname).toBe('/receiver/browse');
  });
});
