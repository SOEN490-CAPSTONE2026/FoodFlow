import React from 'react';
import { render, screen } from '@testing-library/react';
import ReceiverLayoutContent from './ReceiverLayout';
import { AuthContext } from '../../contexts/AuthContext';

// We only test the banner rendering logic. Render the component with a mocked AuthContext

describe('ReceiverLayout verification banner', () => {
  it('shows pending verification banner for receiver role with PENDING status', () => {
    render(
      <AuthContext.Provider value={{ role: 'RECEIVER', organizationVerificationStatus: 'PENDING' }}>
        <ReceiverLayoutContent />
      </AuthContext.Provider>
    );

    const banner = screen.getByText(/Your account is pending verification/i);
    expect(banner).toBeInTheDocument();
  });

  it('does not show banner for non-receiver roles', () => {
    render(
      <AuthContext.Provider value={{ role: 'DONOR', organizationVerificationStatus: 'PENDING' }}>
        <ReceiverLayoutContent />
      </AuthContext.Provider>
    );

    const results = screen.queryByText(/Your account is pending verification/i);
    expect(results).toBeNull();
  });

  it('does not show banner when verification status is not PENDING', () => {
    render(
      <AuthContext.Provider value={{ role: 'RECEIVER', organizationVerificationStatus: 'VERIFIED' }}>
        <ReceiverLayoutContent />
      </AuthContext.Provider>
    );

    const results = screen.queryByText(/Your account is pending verification/i);
    expect(results).toBeNull();
  });
});
