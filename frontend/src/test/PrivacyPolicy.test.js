import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrivacyPolicy from '../components/PrivacyPolicy';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PrivacyPolicy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the privacy policy title', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders the last updated date', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText(/last updated: october 2025/i)).toBeInTheDocument();
  });

  it('renders all section headings', () => {
    render(<PrivacyPolicy />);

    expect(screen.getByText('1. Introduction')).toBeInTheDocument();
    expect(screen.getByText('2. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('3. How We Use Your Information')).toBeInTheDocument();
    expect(screen.getByText('4. Data Sharing')).toBeInTheDocument();
    expect(screen.getByText('5. Third-Party Integrations')).toBeInTheDocument();
    expect(screen.getByText('6. Data Retention')).toBeInTheDocument();
    expect(screen.getByText('7. Your Rights')).toBeInTheDocument();
    expect(screen.getByText('8. Security')).toBeInTheDocument();
    expect(screen.getByText('9. Changes to This Policy')).toBeInTheDocument();
    expect(screen.getByText('10. Contact Us')).toBeInTheDocument();
  });

  it('renders introduction section content', () => {
    render(<PrivacyPolicy />);
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          content.includes('FoodFlow') &&
          content.includes('respects your privacy')
        );
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/respects your privacy and is committed to protecting/i)
    ).toBeInTheDocument();
  });

  it('renders information collection list items', () => {
    render(<PrivacyPolicy />);

    expect(screen.getByText(/Account Information:/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Name, email, and phone number provided during registration/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Donation Details:/i)).toBeInTheDocument();
    expect(screen.getByText(/Usage Data:/i)).toBeInTheDocument();
    expect(screen.getByText(/Device Data:/i)).toBeInTheDocument();
  });

  it('renders how we use your information list', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/To connect donors with nearby receivers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To manage your account and improve your experience/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To maintain safety and prevent fraudulent activity/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To comply with legal and regulatory obligations/i)
    ).toBeInTheDocument();
  });

  it('renders data sharing section', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/We never sell your personal data/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Service providers \(hosting, analytics\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Authorities when required by law/i)
    ).toBeInTheDocument();
  });

  it('renders data retention section with email link', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/We retain your information only as long as necessary/i)
    ).toBeInTheDocument();

    const emailLinks = screen.getAllByText('support@foodflow.ca');
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0].closest('a')).toHaveAttribute(
      'href',
      'mailto:support@foodflow.ca'
    );
  });

  it('renders your rights section', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(
        /You have the right to access, correct, or delete your data/i
      )
    ).toBeInTheDocument();
  });

  it('renders security section', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/We apply technical and organizational measures/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/encryption and restricted access/i)
    ).toBeInTheDocument();
  });

  it('renders changes to policy section', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/We may update this Privacy Policy periodically/i)
    ).toBeInTheDocument();
  });

  it('renders contact information with email and address', () => {
    render(<PrivacyPolicy />);

    expect(
      screen.getByText(/If you have any questions or concerns/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Address:/i)).toBeInTheDocument();
    expect(screen.getByText(/Montréal, QC, Canada/i)).toBeInTheDocument();
  });

  it('applies fade-in animation after mounting', async () => {
    render(<PrivacyPolicy />);

    const container = screen.getByText('Privacy Policy').closest('div');

    // Initially should have opacity 0
    expect(container).toHaveStyle({ opacity: 0 });

    // Fast-forward the setTimeout
    jest.advanceTimersByTime(50);

    // After timeout, should have opacity 1
    await waitFor(() => {
      expect(container).toHaveStyle({ opacity: 1 });
    });
  });

  it('applies correct transform on fade-in', async () => {
    render(<PrivacyPolicy />);

    const container = screen.getByText('Privacy Policy').closest('div');

    // Initially should be translated down
    expect(container).toHaveStyle({ transform: 'translateY(15px)' });

    // Fast-forward the setTimeout
    jest.advanceTimersByTime(50);

    // After timeout, should be at normal position
    await waitFor(() => {
      expect(container).toHaveStyle({ transform: 'translateY(0)' });
    });
  });

  it('renders all email links with correct href', () => {
    render(<PrivacyPolicy />);

    const emailLinks = screen.getAllByRole('link', {
      name: /support@foodflow.ca/i,
    });

    emailLinks.forEach(link => {
      expect(link).toHaveAttribute('href', 'mailto:support@foodflow.ca');
    });
  });
});
