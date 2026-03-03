import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DonorHelp from '../DonorHelp';

jest.mock('react-i18next', () => {
  const en = require('../../../locales/en.json');
  const getValue = (obj, key) =>
    key.split('.').reduce((acc, part) => acc?.[part], obj);

  return {
    useTranslation: () => ({
      t: key => getValue(en, key) ?? key,
    }),
  };
});

// Wrapper component for Router context
const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DonorHelp Component', () => {
  describe('Rendering', () => {
    it('renders the Help page without crashing', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(
        screen.getByText('Frequently Asked Questions')
      ).toBeInTheDocument();
      expect(screen.getByText('Need More Help?')).toBeInTheDocument();
    });

    it('renders the welcome introduction text', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText(/Welcome to FoodFlow!/i)).toBeInTheDocument();
    });

    it('renders all four getting started steps', () => {
      renderWithRouter(<DonorHelp />);
      expect(
        screen.getByText('Create Your First Donation')
      ).toBeInTheDocument();
      expect(screen.getByText('Set Pickup Times')).toBeInTheDocument();
      expect(screen.getByText('Wait for Claims')).toBeInTheDocument();
      expect(screen.getByText('Confirm Pickup with OTP')).toBeInTheDocument();
    });

    it('renders step numbers 1 through 4', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders all FAQ questions', () => {
      renderWithRouter(<DonorHelp />);
      expect(
        screen.getByText('How do I create a donation?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('How does pickup confirmation work?')
      ).toBeInTheDocument();
      expect(screen.getByText('What is an OTP code?')).toBeInTheDocument();
      expect(
        screen.getByText('Can I edit or delete a donation?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('How do I message a receiver?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('What food types can I donate?')
      ).toBeInTheDocument();
    });

    it('FAQ answers are hidden by default', () => {
      renderWithRouter(<DonorHelp />);
      // The answer text should not be visible initially
      expect(
        screen.queryByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).not.toBeInTheDocument();
    });

    it('expands FAQ when question is clicked', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('How do I create a donation?');
      fireEvent.click(question);

      // After clicking, the answer should be visible
      expect(
        screen.getByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).toBeInTheDocument();
    });

    it('collapses FAQ when clicked again', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('How do I create a donation?');

      // First click - expand
      fireEvent.click(question);
      expect(
        screen.getByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).toBeInTheDocument();

      // Second click - collapse
      fireEvent.click(question);
      expect(
        screen.queryByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).not.toBeInTheDocument();
    });

    it('only one FAQ is open at a time', () => {
      renderWithRouter(<DonorHelp />);
      const firstQuestion = screen.getByText('How do I create a donation?');
      const secondQuestion = screen.getByText('What is an OTP code?');

      // Open first FAQ
      fireEvent.click(firstQuestion);
      expect(
        screen.getByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).toBeInTheDocument();

      // Open second FAQ - first should close
      fireEvent.click(secondQuestion);
      expect(
        screen.queryByText(/Navigate to 'Donate Now' from the sidebar/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/OTP stands for One-Time Password/i)
      ).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('renders email support contact', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('Email Support')).toBeInTheDocument();
      expect(screen.getByText('support@foodflow.com')).toBeInTheDocument();
    });

    it('renders phone support contact', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('Phone Support')).toBeInTheDocument();
      expect(screen.getByText('1-800-FOODFLOW')).toBeInTheDocument();
    });

    it('renders response time information', () => {
      renderWithRouter(<DonorHelp />);
      expect(screen.getByText('Response within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Mon-Fri, 9AM-6PM EST')).toBeInTheDocument();
    });

    it('email link has correct href', () => {
      renderWithRouter(<DonorHelp />);
      const emailLink = screen.getByRole('link', { name: /email support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@foodflow.com');
    });

    it('phone link has correct href', () => {
      renderWithRouter(<DonorHelp />);
      const phoneLink = screen.getByRole('link', { name: /phone support/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:1-800-FOODFLOW');
    });
  });

  describe('Accessibility', () => {
    it('FAQ buttons have aria-expanded attribute', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('How do I create a donation?');
      const button = question.closest('button');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('FAQ list has role="list"', () => {
      renderWithRouter(<DonorHelp />);
      const faqList = screen.getByRole('list');
      expect(faqList).toBeInTheDocument();
    });

    it('FAQ answers have role="region"', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('How do I create a donation?');
      fireEvent.click(question);

      const regions = screen.getAllByRole('region');
      expect(regions.length).toBeGreaterThan(0);
    });
  });

  describe('Content Accuracy', () => {
    it('OTP explanation is accurate', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('What is an OTP code?');
      fireEvent.click(question);

      expect(screen.getByText(/unique 6-digit code/i)).toBeInTheDocument();
    });

    it('mentions food types correctly', () => {
      renderWithRouter(<DonorHelp />);
      const question = screen.getByText('What food types can I donate?');
      fireEvent.click(question);

      expect(screen.getByText(/Prepared Food/i)).toBeInTheDocument();
      expect(screen.getByText(/Packaged Items/i)).toBeInTheDocument();
      expect(screen.getByText(/Fruits & Vegetables/i)).toBeInTheDocument();
    });
  });
});

describe('DonorHelp Component - Edge Cases', () => {
  it('handles rapid FAQ clicks without errors', () => {
    renderWithRouter(<DonorHelp />);

    const question = screen.getByText('How do I create a donation?');

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(question);
    }

    // Component should still render correctly
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('renders correctly with no initial state', () => {
    const { container } = renderWithRouter(<DonorHelp />);

    // No FAQ should be expanded initially
    const openFaqs = container.querySelectorAll('.faq-item.open');
    expect(openFaqs.length).toBe(0);
  });
});
