import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FAQ from '../components/FAQ';

// Mock IntersectionObserver properly
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset the IntersectionObserver mock
  global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => {
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });
});

//React-icons are mocked
jest.mock('react-icons/fa', () => ({
  FaPlus: () => <span data-testid="plus-icon">+</span>,
  FaMinus: () => <span data-testid="minus-icon">-</span>,
}));

describe('FAQ Component', () => {
  test('renders FAQ component with title', () => {
    render(<FAQ />);
    
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  test('renders all FAQ questions from data', () => {
    render(<FAQ />);
    
    expect(screen.getByText('How can I use FoodFlow to donate my surplus food?')).toBeInTheDocument();
    expect(screen.getByText('What kind of organizations can receive food through FoodFlow?')).toBeInTheDocument();
    expect(screen.getByText('Is there any cost to use FoodFlow?')).toBeInTheDocument();
    expect(screen.getByText('How does FoodFlow ensure food safety?')).toBeInTheDocument();
  });

  test('initially shows plus icons for all FAQ items', () => {
    render(<FAQ />);
    
    const plusIcons = screen.getAllByTestId('plus-icon');
    expect(plusIcons).toHaveLength(4); 
  });

  test('toggles FAQ item when clicked', () => {
    render(<FAQ />);
    
    const firstQuestion = screen.getByText('How can I use FoodFlow to donate my surplus food?');
    
    // Initially, the answer content exists but might be hidden by CSS
    // Check if  FAQ item doesn't have the 'active' class initially
    const firstFAQItem = firstQuestion.closest('.faq-item');
    expect(firstFAQItem).not.toHaveClass('active');
    
    // Press to open
    fireEvent.click(firstQuestion);
    
    // FAQ item should have the 'active' class
    expect(firstFAQItem).toHaveClass('active');
    
    // Should show minus icon
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(firstQuestion);
    
    // FAQ item should not have 'active' class again
    expect(firstFAQItem).not.toHaveClass('active');
  });

  test('multiple FAQ items can be open simultaneously', () => {
    render(<FAQ />);
    
    const firstQuestion = screen.getByText('How can I use FoodFlow to donate my surplus food?');
    const secondQuestion = screen.getByText('What kind of organizations can receive food through FoodFlow?');
    
    const firstFAQItem = firstQuestion.closest('.faq-item');
    const secondFAQItem = secondQuestion.closest('.faq-item');
    
    // Open first FAQ
    fireEvent.click(firstQuestion);
    
    // Open second FAQ
    fireEvent.click(secondQuestion);
    
    // Both FAQ items should have 'active' class
    expect(firstFAQItem).toHaveClass('active');
    expect(secondFAQItem).toHaveClass('active');
    
    // Both should show minus icons
    const minusIcons = screen.getAllByTestId('minus-icon');
    expect(minusIcons).toHaveLength(2);
  });

  test('closes FAQ item when clicking on an open item', () => {
    render(<FAQ />);
    
    const question = screen.getByText('How can I use FoodFlow to donate my surplus food?');
    const faqItem = question.closest('.faq-item');
    
    // Open FAQ
    fireEvent.click(question);
    expect(faqItem).toHaveClass('active');
    
    // Close FAQ
    fireEvent.click(question);
    expect(faqItem).not.toHaveClass('active');
  });

  test('only toggles clicked FAQ item', () => {
    render(<FAQ />);
    
    const firstQuestion = screen.getByText('How can I use FoodFlow to donate my surplus food?');
    const secondQuestion = screen.getByText('What kind of organizations can receive food through FoodFlow?');
    
    const firstFAQItem = firstQuestion.closest('.faq-item');
    const secondFAQItem = secondQuestion.closest('.faq-item');
    
    // Open first FAQ only
    fireEvent.click(firstQuestion);
    
    // First FAQ item should be active, second should not
    expect(firstFAQItem).toHaveClass('active');
    expect(secondFAQItem).not.toHaveClass('active');
    
    // Should have one minus icon and three plus icons
    const minusIcons = screen.getAllByTestId('minus-icon');
    const plusIcons = screen.getAllByTestId('plus-icon');
    expect(minusIcons).toHaveLength(1);
    expect(plusIcons).toHaveLength(3);
  });

  test('shows correct icon based on active state', () => {
    render(<FAQ />);
    
    const question = screen.getByText('How can I use FoodFlow to donate my surplus food?');
    
    // Initially should show plus icon
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(4);
    expect(screen.queryByTestId('minus-icon')).not.toBeInTheDocument();
    
    // Click to open - should show minus icon
    fireEvent.click(question);
    expect(screen.getAllByTestId('minus-icon')).toHaveLength(1);
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(3);
    
    // Click to close - should show plus icon again
    fireEvent.click(question);
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(4);
    expect(screen.queryByTestId('minus-icon')).not.toBeInTheDocument();
  });
});

// Additional testsr
describe('FAQ IntersectionObserver Tests', () => {
  test('creates IntersectionObserver on mount', () => {
    render(<FAQ />);
    
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { 
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
      }
    );
  });

  test('calls observe on FAQ elements', () => {
    render(<FAQ />);
    
    expect(mockObserve).toHaveBeenCalled();
  });
});