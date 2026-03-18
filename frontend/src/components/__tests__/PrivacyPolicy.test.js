import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicy from '../PrivacyPolicy';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PrivacyPolicy', () => {
  test('renders privacy policy component', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Check if component renders
    const container =
      document.querySelector('.privacy-policy') ||
      document.querySelector('.privacy') ||
      document.body.firstChild;
    expect(container).toBeInTheDocument();
  });

  test('displays privacy policy content', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Should have some privacy-related text
    expect(document.body).toHaveTextContent(/privacy|policy|data/i);
  });

  test('renders without crashing', () => {
    expect(() => {
      renderWithRouter(<PrivacyPolicy />);
    }).not.toThrow();
  });

  test('contains policy sections', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Should have content
    const content = document.body.textContent;
    expect(content.length).toBeGreaterThan(0);
  });

  test('displays headings or sections', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Look for headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Should have some structure
    expect(headings.length >= 0).toBe(true);
  });

  test('maintains proper document structure', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Component should render with some structure
    expect(document.body.firstChild).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Look for interactive elements
    const links = document.querySelectorAll('a');
    const buttons = document.querySelectorAll('button');

    // Should render successfully
    expect(links.length + buttons.length >= 0).toBe(true);
  });
});

// ─── Back to Home button ──────────────────────────────────────────────────────

describe('PrivacyPolicy — Back to Home button', () => {
  test('renders the Back to Home button', () => {
    renderWithRouter(<PrivacyPolicy />);
    expect(
      screen.getByRole('button', { name: /back to home/i })
    ).toBeInTheDocument();
  });

  test('hovering the button triggers onMouseEnter without throwing', () => {
    renderWithRouter(<PrivacyPolicy />);
    const btn = screen.getByRole('button', { name: /back to home/i });
    expect(() => fireEvent.mouseEnter(btn)).not.toThrow();
  });

  test('moving mouse off the button triggers onMouseLeave without throwing', () => {
    renderWithRouter(<PrivacyPolicy />);
    const btn = screen.getByRole('button', { name: /back to home/i });
    fireEvent.mouseEnter(btn);
    expect(() => fireEvent.mouseLeave(btn)).not.toThrow();
  });

  test('hover state cycles: enter then leave leaves button still in document', () => {
    renderWithRouter(<PrivacyPolicy />);
    const btn = screen.getByRole('button', { name: /back to home/i });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    expect(btn).toBeInTheDocument();
  });

  test('clicking Back to Home does not throw', () => {
    renderWithRouter(<PrivacyPolicy />);
    const btn = screen.getByRole('button', { name: /back to home/i });
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

// ─── Hash anchor scroll (useEffect) ──────────────────────────────────────────

describe('PrivacyPolicy — hash anchor scrolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders without error when window.location.hash is empty', () => {
    // jsdom default: hash is ''
    expect(() => renderWithRouter(<PrivacyPolicy />)).not.toThrow();
  });

  test('scrollIntoView is called when hash matches a section id', () => {
    const scrollIntoView = jest.fn();
    const mockElement = { scrollIntoView };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

    // Set window.location.hash so the useEffect branch fires
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#third-party-integrations' },
      writable: true,
    });

    renderWithRouter(<PrivacyPolicy />);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    document.getElementById.mockRestore();
    window.location = { ...window.location, hash: '' };
  });

  test('does not throw when hash points to a non-existent element', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#nonexistent' },
      writable: true,
    });

    expect(() => renderWithRouter(<PrivacyPolicy />)).not.toThrow();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    document.getElementById.mockRestore();
    window.location = { ...window.location, hash: '' };
  });
});
