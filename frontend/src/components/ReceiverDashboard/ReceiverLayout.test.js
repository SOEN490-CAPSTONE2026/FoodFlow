import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// Mock non-JS assets and heavy modules before importing the component so Jest doesn't try to
// parse ESM node_modules (axios) or CSS/images during the test run.
jest.mock('../../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  profileAPI: { get: jest.fn(() => Promise.resolve({ data: {} })) },
  savedDonationAPI: {
    getSavedDonations: jest.fn(() => Promise.resolve({ data: [] })),
  },
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

describe('ReceiverLayout admin approval banner', () => {
  it('shows admin approval banner when accountStatus is PENDING_ADMIN_APPROVAL', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'PENDING_ADMIN_APPROVAL' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const banner = screen.getByText(/Account Pending Admin Approval/i);
    expect(banner).toBeInTheDocument();
  });

  it('does not show banner when accountStatus is PENDING_VERIFICATION', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'PENDING_VERIFICATION' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const results = screen.queryByText(/Account Pending Admin Approval/i);
    expect(results).toBeNull();
  });

  it('does not show banner when accountStatus is ACTIVE', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const results = screen.queryByText(/Account Pending Admin Approval/i);
    expect(results).toBeNull();
  });
});
