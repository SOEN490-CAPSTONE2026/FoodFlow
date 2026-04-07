import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsentProvider, useConsent } from '../contexts/ConsentContext';

// ─── Mock ga4Service ──────────────────────────────────────────────────────────

const mockSetConsent = jest.fn();
const mockHasConsent = jest.fn(() => false);
const mockIsConsentPending = jest.fn(() => true);

jest.mock('../services/ga4Service', () => ({
  __esModule: true,
  default: {
    setConsent: (...args) => mockSetConsent(...args),
    hasConsent: () => mockHasConsent(),
    isConsentPending: () => mockIsConsentPending(),
    applyConsent: jest.fn(),
  },
}));

// ─── Test component that reads from ConsentContext ────────────────────────────

const TestConsumer = () => {
  const { bannerVisible, accept, decline } = useConsent();
  return (
    <div>
      <span data-testid="banner-visible">{String(bannerVisible)}</span>
      <button onClick={accept}>Accept</button>
      <button onClick={decline}>Decline</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <ConsentProvider>
      <TestConsumer />
    </ConsentProvider>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConsentProvider initial state', () => {
  test('bannerVisible is true when isConsentPending() returns true', () => {
    mockIsConsentPending.mockReturnValue(true);
    renderWithProvider();
    expect(screen.getByTestId('banner-visible').textContent).toBe('true');
  });

  test('bannerVisible is false when isConsentPending() returns false', () => {
    mockIsConsentPending.mockReturnValue(false);
    renderWithProvider();
    expect(screen.getByTestId('banner-visible').textContent).toBe('false');
  });
});

describe('accept()', () => {
  test('calls ga4Service.setConsent(true)', async () => {
    mockIsConsentPending.mockReturnValue(true);
    renderWithProvider();
    await userEvent.click(screen.getByText('Accept'));
    expect(mockSetConsent).toHaveBeenCalledWith(true);
  });

  test('hides the banner after accepting', async () => {
    mockIsConsentPending.mockReturnValue(true);
    renderWithProvider();
    await userEvent.click(screen.getByText('Accept'));
    expect(screen.getByTestId('banner-visible').textContent).toBe('false');
  });
});

describe('decline()', () => {
  test('calls ga4Service.setConsent(false)', async () => {
    mockIsConsentPending.mockReturnValue(true);
    renderWithProvider();
    await userEvent.click(screen.getByText('Decline'));
    expect(mockSetConsent).toHaveBeenCalledWith(false);
  });

  test('hides the banner after declining', async () => {
    mockIsConsentPending.mockReturnValue(true);
    renderWithProvider();
    await userEvent.click(screen.getByText('Decline'));
    expect(screen.getByTestId('banner-visible').textContent).toBe('false');
  });
});

describe('useConsent hook', () => {
  test('exposes hasConsent function from ga4Service', () => {
    mockIsConsentPending.mockReturnValue(false);
    mockHasConsent.mockReturnValue(true);

    let contextValue;
    const Spy = () => {
      contextValue = useConsent();
      return null;
    };

    render(
      <ConsentProvider>
        <Spy />
      </ConsentProvider>
    );

    expect(typeof contextValue.hasConsent).toBe('function');
  });

  test('throws or returns undefined when used outside ConsentProvider', () => {
    // useContext returns undefined when provider is missing — graceful degradation
    const Spy = () => {
      const ctx = useConsent();
      return <span>{String(ctx)}</span>;
    };
    render(<Spy />);
    expect(screen.getByText('undefined')).toBeInTheDocument();
  });
});
