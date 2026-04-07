import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFound from '../components/NotFound';

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/SEOHead', () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Render ───────────────────────────────────────────────────────────────────

describe('NotFound render', () => {
  test('renders without throwing', () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });

  test('displays the 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('displays "Page Not Found" heading', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { name: /page not found/i })
    ).toBeInTheDocument();
  });

  test('displays descriptive message text', () => {
    render(<NotFound />);
    expect(
      screen.getByText(/doesn.*t exist or has been moved/i)
    ).toBeInTheDocument();
  });

  test('renders the Go to Homepage button', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('button', { name: /go to homepage/i })
    ).toBeInTheDocument();
  });
});

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('NotFound navigation', () => {
  test('clicking Go to Homepage calls navigate("/")', async () => {
    render(<NotFound />);
    await userEvent.click(
      screen.getByRole('button', { name: /go to homepage/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('clicking Go to Homepage calls navigate exactly once', async () => {
    render(<NotFound />);
    await userEvent.click(
      screen.getByRole('button', { name: /go to homepage/i })
    );
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test('navigate is not called on initial render', () => {
    render(<NotFound />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ─── Visual structure ─────────────────────────────────────────────────────────

describe('NotFound structure', () => {
  test('renders exactly one button', () => {
    render(<NotFound />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('renders two headings (404 and Page Not Found)', () => {
    render(<NotFound />);
    // h1 = 404, h2 = Page Not Found
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });
});
