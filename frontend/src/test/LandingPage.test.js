import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../components/LandingPage/LandingPage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock child components
jest.mock('../components/Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('../components/LandingPage/Home', () => () => <div data-testid="home">Home</div>);
jest.mock('../components/LandingPage/AboutUs', () => () => <div data-testid="about-us">AboutUs</div>);
jest.mock('../components/LandingPage/FAQ', () => () => <div data-testid="faq">FAQ</div>);

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
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockUseLocation.mockReturnValue({ state: null });
    window.scrollTo = jest.fn();
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
    expect(screen.getByTestId('home').closest('section')).toHaveAttribute('id', 'home');
    expect(screen.getByTestId('how-it-works').closest('section')).toHaveAttribute('id', 'how-it-works');
    expect(screen.getByTestId('about-us').closest('section')).toHaveAttribute('id', 'about');
    expect(screen.getByTestId('faq').closest('section')).toHaveAttribute('id', 'faqs');
    expect(screen.getByTestId('footer').closest('section')).toHaveAttribute('id', 'contact');
  });

  test('scrolls to section when location.state.scrollTo is provided', async () => {
    // Mock location with scrollTo state
    mockUseLocation.mockReturnValue({
      state: { scrollTo: 'about' }
    });

    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = jest.fn().mockReturnValue({
      top: 500
    });
    
    // Store original getElementById
    const originalGetElementById = document.getElementById;
    
    // Mock getElementById to return an element with getBoundingClientRect
    document.getElementById = jest.fn((id) => {
      if (id === 'about') {
        return {
          getBoundingClientRect: mockGetBoundingClientRect
        };
      }
      return originalGetElementById.call(document, id);
    });

    // Mock pageYOffset
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 100
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers to trigger the setTimeout
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(document.getElementById).toHaveBeenCalledWith('about');
      expect(mockGetBoundingClientRect).toHaveBeenCalled();
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 520, // 500 (elementPosition) + 100 (pageYOffset) - 80 (navbarHeight)
        behavior: 'smooth'
      });
    });

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  test('does not scroll when location.state.scrollTo is not provided', () => {
    mockUseLocation.mockReturnValue({
      state: null
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers
    jest.advanceTimersByTime(300);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test('handles case when scrollTo element does not exist', async () => {
    mockUseLocation.mockReturnValue({
      state: { scrollTo: 'non-existent-section' }
    });

    // Store original getElementById
    const originalGetElementById = document.getElementById;
    
    // Mock getElementById to return null for non-existent section
    document.getElementById = jest.fn((id) => {
      if (id === 'non-existent-section') {
        return null;
      }
      return originalGetElementById.call(document, id);
    });

    renderWithRouter(<LandingPage />);

    // Fast-forward timers
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(document.getElementById).toHaveBeenCalledWith('non-existent-section');
    });

    // scrollTo should not be called if element doesn't exist
    expect(window.scrollTo).not.toHaveBeenCalled();

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  test('scrolls to different sections based on scrollTo value', async () => {
    const testCases = ['home', 'how-it-works', 'faqs', 'contact'];

    for (const sectionId of testCases) {
      jest.clearAllMocks();
      
      mockUseLocation.mockReturnValue({
        state: { scrollTo: sectionId }
      });

      const mockGetBoundingClientRect = jest.fn().mockReturnValue({
        top: 300
      });

      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn((id) => {
        if (id === sectionId) {
          return {
            getBoundingClientRect: mockGetBoundingClientRect
          };
        }
        return originalGetElementById.call(document, id);
      });

      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        value: 50
      });

      const { unmount } = renderWithRouter(<LandingPage />);

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith(sectionId);
        expect(window.scrollTo).toHaveBeenCalledWith({
          top: 270, // 300 + 50 - 80
          behavior: 'smooth'
        });
      });

      document.getElementById = originalGetElementById;
      unmount();
    }
  });
});