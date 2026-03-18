import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => {
      const translations = {
        'footer.description':
          'Connecting those with extra food to those in need.',
        'footer.company': 'Company',
        'footer.home': 'Home',
        'footer.howItWorks': 'How It Works',
        'footer.about': 'About',
        'footer.faqs': 'FAQs',
        'footer.contact': 'Contact',
        'footer.email': 'foodflow.group@gmail.com',
        'footer.phone': '1-800-122-4567',
        'footer.copyright': '© 2024 FoodFlow. All rights reserved.',
        'footer.privacyPolicy': 'Privacy Policy',
        'footer.termsConditions': 'Terms & Conditions',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaEnvelope: () => <div data-testid="envelope-icon">Envelope</div>,
  FaPhone: () => <div data-testid="phone-icon">Phone</div>,
}));

describe('Footer', () => {
  test('renders footer component', () => {
    render(<Footer />);

    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });

  test('displays company logo', () => {
    render(<Footer />);

    const logo = screen.getByAltText('FoodFlow Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('footer-logo');
  });

  test('displays footer description', () => {
    render(<Footer />);

    const description = screen.getByText(
      'Connecting those with extra food to those in need.'
    );
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('footer-description');
  });

  test('displays company navigation links', () => {
    render(<Footer />);

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('FAQs')).toBeInTheDocument();
  });

  test('displays contact information', () => {
    render(<Footer />);

    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByTestId('envelope-icon')).toBeInTheDocument();
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
  });

  test('displays email link with correct attributes', () => {
    render(<Footer />);

    const emailLink = screen.getByText('foodflow.group@gmail.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest('a')).toHaveAttribute(
      'href',
      'mailto:foodflow.group@gmail.com'
    );
    expect(emailLink.closest('a')).toHaveClass('contact-email');
  });

  test('displays phone link with correct attributes', () => {
    render(<Footer />);

    const phoneLink = screen.getByText('1-800-122-4567');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:18001224567');
    expect(phoneLink.closest('a')).toHaveClass('contact-phone');
  });

  test('displays copyright information', () => {
    render(<Footer />);

    const copyright = screen.getByText('© 2024 FoodFlow. All rights reserved.');
    expect(copyright).toBeInTheDocument();
    expect(copyright).toHaveClass('copyright');
  });

  test('displays legal links', () => {
    render(<Footer />);

    const privacyLink = screen.getByText('Privacy Policy');
    const termsLink = screen.getByText('Terms & Conditions');

    expect(privacyLink).toBeInTheDocument();
    expect(termsLink).toBeInTheDocument();

    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy-policy');
    expect(termsLink.closest('a')).toHaveAttribute('href', '/terms-conditions');
  });

  test('displays legal links separator', () => {
    render(<Footer />);

    const separator = screen.getByText('|');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('separator');
  });

  test('has proper footer structure', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toHaveClass('footer');

    const footerContent = document.querySelector('.footer-content');
    const footerBottom = document.querySelector('.footer-bottom');

    expect(footerContent).toBeInTheDocument();
    expect(footerBottom).toBeInTheDocument();
  });

  test('renders navigation links with proper href attributes', () => {
    render(<Footer />);

    const homeLink = screen.getByText('Home').closest('a');
    const howItWorksLink = screen.getByText('How It Works').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    const faqsLink = screen.getByText('FAQs').closest('a');

    expect(homeLink).toHaveAttribute('href', '#home');
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
    expect(aboutLink).toHaveAttribute('href', '#about');
    expect(faqsLink).toHaveAttribute('href', '#faqs');
  });
});
