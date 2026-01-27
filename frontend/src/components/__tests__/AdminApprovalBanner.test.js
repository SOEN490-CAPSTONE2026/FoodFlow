import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminApprovalBanner from '../AdminApprovalBanner';

// Mock the CSS
jest.mock('../../style/AdminApprovalBanner.css', () => ({}), { virtual: true });

describe('AdminApprovalBanner', () => {
  it('renders the banner with correct heading', () => {
    render(<AdminApprovalBanner />);
    expect(
      screen.getByText(/account pending admin approval/i)
    ).toBeInTheDocument();
  });

  it('displays email verification confirmation message', () => {
    render(<AdminApprovalBanner />);
    expect(
      screen.getByText(/your email has been verified/i)
    ).toBeInTheDocument();
  });

  it('displays approval timeline information', () => {
    render(<AdminApprovalBanner />);
    expect(
      screen.getByText(/typically takes up to 48 hours/i)
    ).toBeInTheDocument();
  });

  it('mentions email notification will be sent', () => {
    render(<AdminApprovalBanner />);
    expect(
      screen.getByText(
        /you'll receive an email notification once your account is approved/i
      )
    ).toBeInTheDocument();
  });

  it('displays thank you message', () => {
    render(<AdminApprovalBanner />);
    expect(
      screen.getByText(/thank you for your patience/i)
    ).toBeInTheDocument();
  });

  it('renders the hourglass icon', () => {
    const { container } = render(<AdminApprovalBanner />);
    const icon = container.querySelector('.admin-approval-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('⏳');
  });

  it('has proper semantic structure', () => {
    const { container } = render(<AdminApprovalBanner />);

    // Check for main container
    expect(
      container.querySelector('.admin-approval-banner')
    ).toBeInTheDocument();

    // Check for content container
    expect(
      container.querySelector('.admin-approval-content')
    ).toBeInTheDocument();

    // Check for heading
    expect(container.querySelector('h3')).toBeInTheDocument();

    // Check for paragraphs
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('has the thank you note with special styling', () => {
    const { container } = render(<AdminApprovalBanner />);
    const thankYouNote = container.querySelector('.admin-approval-note');
    expect(thankYouNote).toBeInTheDocument();
    expect(thankYouNote).toHaveTextContent(/thank you for your patience/i);
  });
});
