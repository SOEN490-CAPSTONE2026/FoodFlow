import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

// Mock the logo import
jest.mock("../assets/Logo.png", () => "mock-logo.png");

describe('Footer Component', () => {
  test('renders footer without crashing', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });

  test('displays the logo with correct alt text', () => {
    render(<Footer />);
    const logo = screen.getByAltText('FoodFlow Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mock-logo.png');
  });

  test('displays company description', () => {
    render(<Footer />);
    const description = screen.getByText(/Discover a charity shop platform designed to revolutionize food distribution/i);
    expect(description).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    render(<Footer />);
    
    const homeLink = screen.getByText('Home');
    const howItWorksLink = screen.getByText('How it works');
    const aboutLink = screen.getByText('About Us');
    const faqsLink = screen.getByText('FAQs');
    
    expect(homeLink).toBeInTheDocument();
    expect(howItWorksLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();
    expect(faqsLink).toBeInTheDocument();
  });

  test('displays contact information correctly', () => {
    render(<Footer />);
    
    const email = screen.getByText('foodflow.group@gmail.com');
    const phone = screen.getByText('1-800-122-4567');
    
    expect(email).toBeInTheDocument();
    expect(phone).toBeInTheDocument();
  });

  test('renders contact icons', () => {
    render(<Footer />);
    
    // Looking for the presence of icons
    const emailIcon = document.querySelector('.contact-icon');
    const phoneIcon = document.querySelectorAll('.contact-icon')[1];
    
    expect(emailIcon).toBeInTheDocument();
    expect(phoneIcon).toBeInTheDocument();
  });

  test('displays copyright information', () => {
    render(<Footer />);
    const copyright = screen.getByText(/Copyright © 2025. All right reserved to FoodFlow/i);
    expect(copyright).toBeInTheDocument();
  });

  test('renders legal links', () => {
    render(<Footer />);
    
    const privacyPolicy = screen.getByText('Privacy Policy');
    const termsConditions = screen.getByText('Terms & Conditions');
    
    expect(privacyPolicy).toBeInTheDocument();
    expect(termsConditions).toBeInTheDocument();
  });

  test('has correct section headings', () => {
    render(<Footer />);
    
    const companyHeading = screen.getByText('Company');
    const contactHeading = screen.getByText('Contact');
    
    expect(companyHeading).toBeInTheDocument();
    expect(contactHeading).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    render(<Footer />);
    
    const homeLink = screen.getByText('Home').closest('a');
    const howItWorksLink = screen.getByText('How it works').closest('a');
    const aboutLink = screen.getByText('About Us').closest('a');
    const faqsLink = screen.getByText('FAQs').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '#home');
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
    expect(aboutLink).toHaveAttribute('href', '#about');
    expect(faqsLink).toHaveAttribute('href', '#faqs');
  });

  test('legal links have correct href attributes', () => {
    render(<Footer />);
    
    const privacyLink = screen.getByText('Privacy Policy').closest('a');
    const termsLink = screen.getByText('Terms & Conditions').closest('a');
    
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    expect(termsLink).toHaveAttribute('href', '/terms-conditions');
  });
});

describe('Footer Structure', () => {
  test('has proper semantic HTML structure', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer.tagName).toBe('FOOTER');
    
    // Check for main content sections
    const footerContent = document.querySelector('.footer-content');
    const footerBottom = document.querySelector('.footer-bottom');
    
    expect(footerContent).toBeInTheDocument();
    expect(footerBottom).toBeInTheDocument();
  });

  test('has correct class names applied', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('footer');
    
    const logoSection = document.querySelector('.logo-section');
    expect(logoSection).toBeInTheDocument();
    
    const footerGrid = document.querySelector('.footer-grid');
    expect(footerGrid).toBeInTheDocument();
  });
});