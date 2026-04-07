import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieBanner from '../components/CookieBanner';

// ─── Mock CSS import ─────────────────────────────────────────────────────────
jest.mock('../../CookieBanner.css', () => ({}), { virtual: true });

// ─── Mock ConsentContext ──────────────────────────────────────────────────────
const mockAccept = jest.fn();
const mockDecline = jest.fn();
let mockBannerVisible = true;

jest.mock('../contexts/ConsentContext', () => ({
  useConsent: () => ({
    bannerVisible: mockBannerVisible,
    accept: mockAccept,
    decline: mockDecline,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockBannerVisible = true;
});

// ─── Visibility ───────────────────────────────────────────────────────────────

describe('CookieBanner visibility', () => {
  test('renders the banner when bannerVisible is true', () => {
    render(<CookieBanner />);
    expect(
      screen.getByRole('region', { name: /cookie consent/i })
    ).toBeInTheDocument();
  });

  test('renders nothing when bannerVisible is false', () => {
    mockBannerVisible = false;
    const { container } = render(<CookieBanner />);
    expect(container.firstChild).toBeNull();
  });
});

// ─── Content ──────────────────────────────────────────────────────────────────

describe('CookieBanner content', () => {
  test('renders Accept button', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  test('renders Decline button', () => {
    render(<CookieBanner />);
    expect(
      screen.getByRole('button', { name: /decline/i })
    ).toBeInTheDocument();
  });

  test('renders a Privacy Policy link', () => {
    render(<CookieBanner />);
    expect(
      screen.getByRole('link', { name: /privacy policy/i })
    ).toBeInTheDocument();
  });

  test('Privacy Policy link points to /privacy-policy', () => {
    render(<CookieBanner />);
    expect(
      screen.getByRole('link', { name: /privacy policy/i })
    ).toHaveAttribute('href', '/privacy-policy');
  });

  test('banner text mentions cookies and analytics', () => {
    render(<CookieBanner />);
    expect(screen.getByText(/cookies and analytics/i)).toBeInTheDocument();
  });
});

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('CookieBanner interactions', () => {
  test('clicking Accept calls accept()', async () => {
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(mockAccept).toHaveBeenCalledTimes(1);
  });

  test('clicking Decline calls decline()', async () => {
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(mockDecline).toHaveBeenCalledTimes(1);
  });

  test('clicking Accept does not call decline()', async () => {
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(mockDecline).not.toHaveBeenCalled();
  });

  test('clicking Decline does not call accept()', async () => {
    render(<CookieBanner />);
    await userEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(mockAccept).not.toHaveBeenCalled();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('CookieBanner accessibility', () => {
  test('banner has role="region"', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  test('banner has aria-label for screen readers', () => {
    render(<CookieBanner />);
    expect(
      screen.getByRole('region', { name: /cookie consent/i })
    ).toBeInTheDocument();
  });

  test('both buttons are focusable elements', () => {
    render(<CookieBanner />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
