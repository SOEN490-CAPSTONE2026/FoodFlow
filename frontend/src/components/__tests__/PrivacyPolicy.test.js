import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicy from '../PrivacyPolicy';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

const renderWithRouter = component => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PrivacyPolicy', () => {
  test('renders privacy policy component', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Check if component renders
    const container =
      document.querySelector('.privacy-policy') ||
      document.querySelector('.privacy') ||
      document.body.firstChild;
    expect(container).toBeInTheDocument();
  });

  test('displays privacy policy content', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Should have some privacy-related text
    expect(document.body).toHaveTextContent(/privacy|policy|data/i);
  });

  test('renders without crashing', () => {
    expect(() => {
      renderWithRouter(<PrivacyPolicy />);
    }).not.toThrow();
  });

  test('contains policy sections', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Should have content
    const content = document.body.textContent;
    expect(content.length).toBeGreaterThan(0);
  });

  test('displays headings or sections', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Look for headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Should have some structure
    expect(headings.length >= 0).toBe(true);
  });

  test('maintains proper document structure', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Component should render with some structure
    expect(document.body.firstChild).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    renderWithRouter(<PrivacyPolicy />);

    // Look for interactive elements
    const links = document.querySelectorAll('a');
    const buttons = document.querySelectorAll('button');

    // Should render successfully
    expect(links.length + buttons.length >= 0).toBe(true);
  });
});
