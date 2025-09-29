import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AboutUs from './AboutUs';

// Proper IntersectionObserver mock
const mockIntersectionObserver = jest.fn();
let observerCallback;

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback) => {
    observerCallback = callback;
    return {
      observe: jest.fn((element) => {
        // Simulate intersection immediately
        setTimeout(() => {
          callback([{ 
            isIntersecting: true, 
            target: element,
            classList: {
              add: jest.fn()
            }
          }]);
        }, 0);
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });
  window.IntersectionObserver = mockIntersectionObserver;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AboutUs Component', () => {
  test('renders AboutUs component with title', () => {
    render(<AboutUs />);
    expect(screen.getByText('About FoodFlow')).toBeInTheDocument();
  });

  test('renders all carousel cards', () => {
    render(<AboutUs />);
    expect(screen.getByText('Verified Organizations')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Notifications')).toBeInTheDocument();
    expect(screen.getByText('Smart Matching')).toBeInTheDocument();
  });

  test('carousel navigation works', () => {
    render(<AboutUs />);
    
    // Test next button
    const nextButton = screen.getByLabelText('Next slide');
    fireEvent.click(nextButton);
    
    // Test previous button
    const prevButton = screen.getByLabelText('Previous slide');
    fireEvent.click(prevButton);
    
    // Test dot navigation
    const dots = screen.getAllByRole('button', { name: /go to slide/i });
    fireEvent.click(dots[1]); //Press the second dot
  });

  test('renders carousel content correctly', () => {
    render(<AboutUs />);
    
    // Check for card content
    expect(screen.getByText(/thorough verification and background checks/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant alerts when food donations become available/i)).toBeInTheDocument();
    expect(screen.getByText(/intelligent algorithm matches food type/i)).toBeInTheDocument();
  });

  test('renders all carousel dots', () => {
    render(<AboutUs />);
    const dots = screen.getAllByRole('button', { name: /go to slide/i });
    expect(dots).toHaveLength(3); 
  });
});