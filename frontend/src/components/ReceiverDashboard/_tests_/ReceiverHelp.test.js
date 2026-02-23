import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReceiverHelp from '../ReceiverHelp';

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

describe('ReceiverHelp Component', () => {
  describe('Rendering', () => {
    it('renders the Help page without crashing', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(
        screen.getByText('Frequently Asked Questions')
      ).toBeInTheDocument();
      expect(screen.getByText('Need More Help?')).toBeInTheDocument();
    });

    it('renders the welcome introduction text', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(
        screen.getByText(/Welcome to FoodFlow! As a receiver/i)
      ).toBeInTheDocument();
    });

    it('renders all four getting started steps', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(
        screen.getByText('Browse Available Donations')
      ).toBeInTheDocument();
      expect(screen.getByText('Claim & Schedule Pickup')).toBeInTheDocument();
      expect(screen.getByText('Pickup with OTP')).toBeInTheDocument();
      expect(screen.getByText('Set Your Preferences')).toBeInTheDocument();
    });

    it('renders step numbers 1 through 4', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders all FAQ questions', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(
        screen.getByText('How do I claim a donation?')
      ).toBeInTheDocument();
      expect(screen.getByText('How do I confirm pickup?')).toBeInTheDocument();
      expect(screen.getByText('What is the OTP code?')).toBeInTheDocument();
      expect(
        screen.getByText('What are food preferences?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('How do I set my food preferences?')
      ).toBeInTheDocument();
      expect(screen.getByText('How do I message a donor?')).toBeInTheDocument();
      expect(
        screen.getByText('What do the donation statuses mean?')
      ).toBeInTheDocument();
      expect(screen.getByText('Can I cancel a claim?')).toBeInTheDocument();
      expect(
        screen.getByText('How do I find donations near me?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('How is my organization verified?')
      ).toBeInTheDocument();
    });

    it('FAQ answers are hidden by default', () => {
      renderWithRouter(<ReceiverHelp />);
      // The answer text should not be visible initially
      expect(
        screen.queryByText(/Browse available donations on the main page/i)
      ).not.toBeInTheDocument();
    });

    it('expands FAQ when question is clicked', () => {
      renderWithRouter(<ReceiverHelp />);
      const firstQuestion = screen.getByText('How do I claim a donation?');
      fireEvent.click(firstQuestion);

      // Answer should now be visible
      expect(
        screen.getByText(/Browse available donations on the main page/i)
      ).toBeInTheDocument();
    });

    it('collapses FAQ when clicked again', () => {
      renderWithRouter(<ReceiverHelp />);
      const firstQuestion = screen.getByText('How do I claim a donation?');

      // Open
      fireEvent.click(firstQuestion);
      expect(
        screen.getByText(/Browse available donations on the main page/i)
      ).toBeInTheDocument();

      // Close
      fireEvent.click(firstQuestion);
      expect(
        screen.queryByText(/Browse available donations on the main page/i)
      ).not.toBeInTheDocument();
    });

    it('only one FAQ is open at a time', () => {
      renderWithRouter(<ReceiverHelp />);
      const firstQuestion = screen.getByText('How do I claim a donation?');
      const secondQuestion = screen.getByText('How do I confirm pickup?');

      // Open first FAQ
      fireEvent.click(firstQuestion);
      expect(
        screen.getByText(/Browse available donations on the main page/i)
      ).toBeInTheDocument();

      // Open second FAQ - first should close
      fireEvent.click(secondQuestion);
      expect(
        screen.queryByText(/Browse available donations on the main page/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/When you arrive at the donor's location/i)
      ).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('renders email support contact', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('Email Support')).toBeInTheDocument();
      expect(screen.getByText('support@foodflow.com')).toBeInTheDocument();
    });

    it('renders phone support contact', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('Phone Support')).toBeInTheDocument();
      expect(screen.getByText('1-800-FOODFLOW')).toBeInTheDocument();
    });

    it('renders response time information', () => {
      renderWithRouter(<ReceiverHelp />);
      expect(screen.getByText('Response within 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Mon-Fri, 9AM-6PM EST')).toBeInTheDocument();
    });

    it('email link has correct href', () => {
      renderWithRouter(<ReceiverHelp />);
      const emailLink = screen.getByRole('link', { name: /Email Support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@foodflow.com');
    });

    it('phone link has correct href', () => {
      renderWithRouter(<ReceiverHelp />);
      const phoneLink = screen.getByRole('link', { name: /Phone Support/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:1-800-FOODFLOW');
    });
  });

  describe('Accessibility', () => {
    it('FAQ buttons have aria-expanded attribute', () => {
      renderWithRouter(<ReceiverHelp />);
      const faqButtons = screen.getAllByRole('button');
      faqButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });

    it('FAQ list has role="list"', () => {
      renderWithRouter(<ReceiverHelp />);
      const faqList = screen.getByRole('list');
      expect(faqList).toBeInTheDocument();
    });

    it('FAQ answers have role="region"', () => {
      renderWithRouter(<ReceiverHelp />);
      const firstQuestion = screen.getByText('How do I claim a donation?');
      fireEvent.click(firstQuestion);

      const answerRegion = screen.getByRole('region');
      expect(answerRegion).toBeInTheDocument();
    });
  });

  describe('Content Accuracy', () => {
    it('OTP explanation is accurate', () => {
      renderWithRouter(<ReceiverHelp />);
      const otpQuestion = screen.getByText('What is the OTP code?');
      fireEvent.click(otpQuestion);

      // Verify OTP explanation contains key information
      const answer = screen.getByText(/One-Time Password/i);
      expect(answer).toBeInTheDocument();
      expect(screen.getByText(/6-digit/i)).toBeInTheDocument();
    });

    it('food preferences explanation is accurate', () => {
      renderWithRouter(<ReceiverHelp />);
      const preferencesQuestion = screen.getByText(
        'What are food preferences?'
      );
      fireEvent.click(preferencesQuestion);

      expect(
        screen.getByText(/customize what types of donations/i)
      ).toBeInTheDocument();
    });
  });
});

describe('ReceiverHelp Component - Edge Cases', () => {
  it('handles rapid FAQ clicks without errors', () => {
    renderWithRouter(<ReceiverHelp />);

    const firstQuestion = screen.getByText('How do I claim a donation?');

    // Rapid clicking
    for (let i = 0; i < 10; i++) {
      fireEvent.click(firstQuestion);
    }

    // Component should still be functional
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('renders correctly with no initial state', () => {
    renderWithRouter(<ReceiverHelp />);

    // All sections should render
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('Need More Help?')).toBeInTheDocument();
  });
});
