import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../components/LandingPage/Home';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the assets
jest.mock('../assets/illustrations/home-illustration.jpg', () => 'mock-image.jpg');

describe('Home Component - Core Functionality', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // Helper function to render component 
  const renderHome = () => {
    return render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
  };

  test('renders all critical elements correctly', () => {
    renderHome();

    // Main heading and subheading
    expect(screen.getByText('Connect surplus with')).toBeInTheDocument();
    expect(screen.getByText('those in need')).toBeInTheDocument();
    
    // Description paragraph
    expect(screen.getByText(/FoodFlow connects restaurants/i)).toBeInTheDocument();
    
    // CTA button
    const button = screen.getByRole('button', { name: /Donate Surplus Food now/i });
    expect(button).toBeInTheDocument();
    
    // Hero image
    const image = screen.getByAltText('Food donation community');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'mock-image.jpg');
    expect(image).toHaveAttribute('width', '700px');
    expect(image).toHaveAttribute('height', '550px');
  });

  test('typewriter animation progresses correctly through stages', () => {
    renderHome();

    const line1 = screen.getByText('Connect surplus with');
    const line2 = screen.getByText('those in need');

    // Initial state - no animations completed
    expect(line1).not.toHaveClass('completed');
    expect(line2).not.toHaveClass('completed');

    // After 2.5 seconds - first line completes
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(line1).toHaveClass('completed');
    expect(line2).not.toHaveClass('completed');

    // After 4.5 seconds - both lines complete
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(line1).toHaveClass('completed');
    expect(line2).toHaveClass('completed');
  });

  test('navigation works when CTA button is clicked', () => {
    renderHome();

    const button = screen.getByRole('button', { name: /Donate Surplus Food now/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('has correct visual styling elements', () => {
    renderHome();

    const floatingElements = document.querySelectorAll('.floating-element');
    expect(floatingElements.length).toBe(3);

    // Gradient text applied to second line
    const gradientText = document.querySelector('.gradient-text');
    expect(gradientText).toBeInTheDocument();
    expect(gradientText).toHaveTextContent('those in need');
  });

  test('cleans up properly on component unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHome();
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    clearTimeoutSpy.mockRestore();
  });

  test('handles rapid timer progression without errors', () => {
    renderHome();

    // Jump directly to final state
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const line1 = screen.getByText('Connect surplus with');
    const line2 = screen.getByText('those in need');

    expect(line1).toHaveClass('completed');
    expect(line2).toHaveClass('completed');
  });
});

// Additional tests for edge cases
describe('Home Component - Edge Cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('component is accessible with proper ARIA labels', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const image = screen.getByAltText('Food donation community');
    expect(image).toBeInTheDocument();

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
  });

  test('renders correctly with all timers completed immediately', () => {
    // Render and complete all animations immediately
    act(() => {
      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Connect surplus with')).toBeInTheDocument();
    expect(screen.getByText('those in need')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});