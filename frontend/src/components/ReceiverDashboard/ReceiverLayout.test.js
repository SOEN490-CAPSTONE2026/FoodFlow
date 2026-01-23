import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// Mock non-JS assets and heavy modules before importing the component so Jest doesn't try to
// parse ESM node_modules (axios) or CSS/images during the test run.
jest.mock('../../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
}));
jest.mock('../../services/socket', () => ({
  connectToUserQueue: jest.fn(),
  disconnect: jest.fn(),
}));
jest.mock('../MessagingDashboard/MessageNotification', () => () => null);
jest.mock('./ReceiverPreferences', () => () => null);
jest.mock('./Receiver_Styles/ReceiverLayout.css', () => ({}), {
  virtual: true,
});
jest.mock('../../assets/Logo.png', () => 'logo.png');
jest.mock('./pfp.png', () => 'pfp.png');

const ReceiverLayoutContent = require('./ReceiverLayout').default;

// We only test the banner rendering logic. Render the component with a mocked AuthContext

describe('ReceiverLayout verification banner', () => {
  it('shows pending verification banner for receiver role with PENDING status', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            role: 'RECEIVER',
            organizationVerificationStatus: 'PENDING',
          }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const banner = screen.getByText(/Your account is pending verification/i);
    expect(banner).toBeInTheDocument();
  });

  it('does not show banner for non-receiver roles', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'DONOR', organizationVerificationStatus: 'PENDING' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const results = screen.queryByText(/Your account is pending verification/i);
    expect(results).toBeNull();
  });

  it('does not show banner when verification status is not PENDING', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            role: 'RECEIVER',
            organizationVerificationStatus: 'VERIFIED',
          }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const results = screen.queryByText(/Your account is pending verification/i);
    expect(results).toBeNull();
  });
});
