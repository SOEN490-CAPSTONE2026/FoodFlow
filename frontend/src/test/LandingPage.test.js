import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../components/LandingPage/LandingPage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock child components
jest.mock('../components/Footer', () => () => (
  <div data-testid="footer">Footer</div>
));
jest.mock('../components/LandingPage/Home', () => () => (
  <div data-testid="home">Home</div>
));
jest.mock('../components/LandingPage/AboutUs', () => () => (
  <div data-testid="about-us">AboutUs</div>
));
jest.mock('../components/LandingPage/FAQ', () => () => (
  <div data-testid="faq">FAQ</div>
));

jest.mock('../components/LandingPage/HowItWorks', () => () => (
  <section id="how-it-works">
    <div data-testid="how-it-works">HowItWorks</div>
  </section>
));

// Mock useLocation
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockUseLocation(),
}));

describe('LandingPage', () => {
  const renderWithRouter = component => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  beforeEach(() => {
    mockUseLocation.mockReturnValue({ state: null });
    Element.prototype.scrollIntoView = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders all sections correctly', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('about-us')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders sections with correct IDs', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByTestId('home').closest('section')).toHaveAttribute(
      'id',
      'home'
    );
    expect(
      screen.getByTestId('how-it-works').closest('section')
    ).toHaveAttribute('id', 'how-it-works');
    expect(screen.getByTestId('about-us').closest('section')).toHaveAttribute(
      'id',
      'about'
    );
    expect(screen.getByTestId('faq').closest('section')).toHaveAttribute(
      'id',
      'faqs'
    );
    expect(screen.getByTestId('footer').closest('section')).toHaveAttribute(
      'id',
      'contact'
    );
  });

  test('scrolls to section when location.state.scrollTo is provided', async () => {
    // Mock location with scrollTo state
    mockUseLocation.mockReturnValue({
      state: { scrollTo: 'about' },
    });

    // Store original getElementById
    const originalGetElementById = document.getElementById;

    const mockSection = {
      scrollIntoView: jest.fn(),
    };

    // Mock getElementById to return a scrollable element
    document.getElementById = jest.fn(id => {
      if (id === 'about') {
        return mockSection;
      }
      return originalGetElementById.call(document, id);
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers to trigger the setTimeout
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(document.getElementById).toHaveBeenCalledWith('about');
      expect(mockSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  test('does not scroll when location.state.scrollTo is not provided', () => {
    mockUseLocation.mockReturnValue({
      state: null,
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers
    jest.advanceTimersByTime(300);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  test('handles case when scrollTo element does not exist', async () => {
    mockUseLocation.mockReturnValue({
      state: { scrollTo: 'non-existent-section' },
    });

    // Store original getElementById
    const originalGetElementById = document.getElementById;

    // Mock getElementById to return null for non-existent section
    document.getElementById = jest.fn(id => {
      if (id === 'non-existent-section') {
        return null;
      }
      return originalGetElementById.call(document, id);
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(document.getElementById).toHaveBeenCalledWith(
        'non-existent-section'
      );
    });

    // scrollIntoView should not be called if element doesn't exist
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  test('scrolls to different sections based on scrollTo value', async () => {
    const testCases = ['home', 'how-it-works', 'faqs', 'contact'];

    for (const sectionId of testCases) {
      jest.clearAllMocks();

      mockUseLocation.mockReturnValue({
        state: { scrollTo: sectionId },
      });

      const originalGetElementById = document.getElementById;
      const mockSection = {
        scrollIntoView: jest.fn(),
      };
      document.getElementById = jest.fn(id => {
        if (id === sectionId) {
          return mockSection;
        }
        return originalGetElementById.call(document, id);
      });

      const { unmount } = renderWithRouter(<LandingPage />);

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith(sectionId);
        expect(mockSection.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        });
      });

      document.getElementById = originalGetElementById;
      unmount();
    }
  });
});
