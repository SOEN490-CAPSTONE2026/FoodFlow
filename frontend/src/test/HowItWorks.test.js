import React from 'react';
import { render, screen, act } from '@testing-library/react';
import HowItWorks from '../components/LandingPage/HowItWorks.js';

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaMobileAlt: () => <span data-testid="fa-mobile">FaMobileAlt-mock</span>,
  FaBell: () => <span data-testid="fa-bell">FaBell-mock</span>,
  FaShieldAlt: () => <span data-testid="fa-shield">FaShieldAlt-mock</span>,
}));

// Mock CSS import
jest.mock('../components/LandingPage/style/HowItWorks.css', () => ({}));

describe('HowItWorks Component', () => {
  let observerCallback;
  let observerInstance;

  beforeEach(() => {
    global.IntersectionObserver = jest.fn((callback, options) => {
      observerCallback = callback;
      observerInstance = {
        observe: jest.fn((element) => {
          callback([{ isIntersecting: true, target: element }]);
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      return observerInstance;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all static content correctly', () => {
    render(<HowItWorks />);

    // Check header content
    expect(screen.getByText('How FoodFlow Works')).toBeInTheDocument();
    expect(screen.getByText(/Surplus food reaches charities in minutes/)).toBeInTheDocument();

    // Check all step titles
    expect(screen.getByText('Post Surplus Instantly')).toBeInTheDocument();
    expect(screen.getByText('Smart Instant Matching')).toBeInTheDocument();
    expect(screen.getByText('Tracked Safe Pickup')).toBeInTheDocument();

    // Check step descriptions
    expect(screen.getByText(/Restaurants, events, and stores post surplus food/)).toBeInTheDocument();
    expect(screen.getByText(/Our algorithm instantly alerts the nearest verified charity/)).toBeInTheDocument();
    expect(screen.getByText(/Built-in food safety tracking logs temperature/)).toBeInTheDocument();

    // Check step numbers
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();

    // Check floating food elements 
    expect(screen.getByText('🍎')).toBeInTheDocument();
    expect(screen.getByText('🥖')).toBeInTheDocument();
    expect(screen.getByText('🥦')).toBeInTheDocument();
    expect(screen.getByText('🚚')).toBeInTheDocument();
  });

  test('renders all step icons', () => {
    render(<HowItWorks />);

    expect(screen.getByTestId('fa-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('fa-bell')).toBeInTheDocument();
    expect(screen.getByTestId('fa-shield')).toBeInTheDocument();
  });

  test('sets up IntersectionObserver on mount', () => {
    render(<HowItWorks />);

    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.3 }
    );
  });

  test('starts with first step active', () => {
    render(<HowItWorks />);

    const stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards[0]).toHaveClass('hiw-active');
    expect(stepCards[1]).not.toHaveClass('hiw-active');
    expect(stepCards[2]).not.toHaveClass('hiw-active');
  });

  test('maintains proper DOM structure', () => {
    render(<HowItWorks />);

    // Should have exactly 3 steps
    const stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards.length).toBe(3);

    // Should have progress bars between steps
    const progressBars = document.querySelectorAll('.hiw-progress-bar');
    expect(progressBars.length).toBe(3);

    // Should have step columns
    const stepColumns = document.querySelectorAll('.hiw-step-column');
    expect(stepColumns.length).toBe(3);

    // Should have proper container structure
    expect(document.querySelector('.hiw-container')).toBeInTheDocument();
    expect(document.querySelector('.hiw-header')).toBeInTheDocument();
    expect(document.querySelector('.hiw-steps-wrapper')).toBeInTheDocument();
    expect(document.querySelector('.hiw-steps-container')).toBeInTheDocument();
  });

  test('step cards have correct structure', () => {
    render(<HowItWorks />);

    const stepCards = document.querySelectorAll('.hiw-step-card');
    
    stepCards.forEach((card) => {
      expect(card.querySelector('.hiw-step-visual')).toBeInTheDocument();
      expect(card.querySelector('.hiw-step-icon')).toBeInTheDocument();
      expect(card.querySelector('.hiw-icon-circle')).toBeInTheDocument();
      expect(card.querySelector('.hiw-step-content')).toBeInTheDocument();
      expect(card.querySelector('.hiw-step-number')).toBeInTheDocument();
      expect(card.querySelector('h3')).toBeInTheDocument();
      expect(card.querySelector('p')).toBeInTheDocument();
    });
  });

  test('floating food elements are present', () => {
    render(<HowItWorks />);

    const floatingFoods = document.querySelectorAll('.hiw-floating-food');
    expect(floatingFoods.length).toBe(4);
    
    // Check they have the correct classes
    expect(document.querySelector('.hiw-food-1')).toBeInTheDocument();
    expect(document.querySelector('.hiw-food-2')).toBeInTheDocument();
    expect(document.querySelector('.hiw-food-3')).toBeInTheDocument();
    expect(document.querySelector('.hiw-food-4')).toBeInTheDocument();
  });
});

// Tests for the animation logic
describe('HowItWorks Component - Animation Behavior', () => {
  let observerCallback;

  beforeEach(() => {
    jest.useFakeTimers();
    
    global.IntersectionObserver = jest.fn((callback) => {
      observerCallback = callback;
      return {
        observe: jest.fn((element) => {
          callback([{ isIntersecting: true, target: element }]);
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('animates to second step after duration', () => {
    render(<HowItWorks />);

    // Initial state - first step active
    let stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards[0]).toHaveClass('hiw-active');

    // Advance to trigger step transition
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Second step should now be active
    stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards[1]).toHaveClass('hiw-active');
    expect(stepCards[0]).not.toHaveClass('hiw-active');
  });

  test('cycles back to first step after last step', () => {
    render(<HowItWorks />);

    // Advance through all steps
    act(() => {
      jest.advanceTimersByTime(3500); 
    });
    
    act(() => {
      jest.advanceTimersByTime(3500); 
    });
    
    act(() => {
      jest.advanceTimersByTime(3500); 
    });

    // Should be back at first step
    const stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards[0]).toHaveClass('hiw-active');
    expect(stepCards[1]).not.toHaveClass('hiw-active');
    expect(stepCards[2]).not.toHaveClass('hiw-active');
  });

  test('progress bar animates on active step', () => {
    render(<HowItWorks />);

    const progressBars = document.querySelectorAll('.hiw-progress-bar');
    
    // First progress bar should be animating
    expect(progressBars[0]).toHaveClass('hiw-animating');
  });

  test('component handles timer cleanup on unmount', () => {
    const { unmount } = render(<HowItWorks />);
    
    // Should not throw error when unmounting
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  test('component does not crash with rapid timer progression', () => {
    render(<HowItWorks />);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('How FoodFlow Works')).toBeInTheDocument();
    expect(screen.getByText('Post Surplus Instantly')).toBeInTheDocument();
  });

  test('animation does not start before component is in view', () => {
    // Create a mock that doesn't trigger intersection
    global.IntersectionObserver = jest.fn((callback) => ({
      observe: jest.fn(), // Don't call the callback
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    
    render(<HowItWorks />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should still be on first step since not in view
    const stepCards = document.querySelectorAll('.hiw-step-card');
    expect(stepCards[0]).toHaveClass('hiw-active');
  });
});

// Tests for specific step content
describe('HowItWorks Component - Step Content', () => {
  beforeEach(() => {
    global.IntersectionObserver = jest.fn((callback) => ({
      observe: jest.fn((element) => {
        callback([{ isIntersecting: true, target: element }]);
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('first step has correct content', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Post Surplus Instantly')).toBeInTheDocument();
    expect(screen.getByText(/Restaurants, events, and stores post surplus food/)).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  test('second step has correct content', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Smart Instant Matching')).toBeInTheDocument();
    expect(screen.getByText(/Our algorithm instantly alerts the nearest verified charity/)).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  test('third step has correct content', () => {
    render(<HowItWorks />);

    expect(screen.getByText('Tracked Safe Pickup')).toBeInTheDocument();
    expect(screen.getByText(/Built-in food safety tracking logs temperature/)).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });
});