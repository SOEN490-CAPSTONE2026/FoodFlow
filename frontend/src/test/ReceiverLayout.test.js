import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

// Mock non-JS assets and heavy modules before importing the component so Jest doesn't try to
// parse ESM node_modules (axios) or CSS/images during the test run.
jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  profileAPI: { get: jest.fn(() => Promise.resolve({ data: {} })) },
  savedDonationAPI: {
    getSavedDonations: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));
jest.mock('../services/socket', () => ({
  connectToUserQueue: jest.fn(),
  disconnect: jest.fn(),
}));
jest.mock(
  '../components/MessagingDashboard/MessageNotification',
  () => () => null
);
jest.mock(
  '../components/ReceiverDashboard/ReceiverPreferences',
  () => () => null
);
jest.mock('../components/AdminApprovalBanner', () => () => (
  <div data-testid="admin-approval-banner">Approval banner</div>
));
jest.mock(
  '../components/ReceiverDashboard/Receiver_Styles/ReceiverLayout.css',
  () => ({}),
  {
    virtual: true,
  }
);
jest.mock('../assets/Logo.png', () => 'logo.png');
jest.mock('../components/ReceiverDashboard/pfp.png', () => 'pfp.png');

const ReceiverLayoutContent =
  require('../components/ReceiverDashboard/ReceiverLayout').default;

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

    const banner = screen.getByTestId('admin-approval-banner');
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

    const results = screen.queryByTestId('admin-approval-banner');
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

    const results = screen.queryByTestId('admin-approval-banner');
    expect(results).toBeNull();
  });

  it('renders with different account statuses', () => {
    const statuses = [
      'PENDING_ADMIN_APPROVAL',
      'PENDING_VERIFICATION',
      'ACTIVE',
      'SUSPENDED',
    ];

    statuses.forEach(status => {
      const { unmount } = render(
        <MemoryRouter>
          <AuthContext.Provider
            value={{ role: 'RECEIVER', accountStatus: status }}
          >
            <ReceiverLayoutContent />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // Component should render without crashing
      if (status === 'PENDING_ADMIN_APPROVAL') {
        expect(screen.getByTestId('admin-approval-banner')).toBeInTheDocument();
      } else {
        expect(
          screen.queryByTestId('admin-approval-banner')
        ).not.toBeInTheDocument();
      }
      unmount();
    });
  });

  it('handles context without accountStatus gracefully', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ role: 'RECEIVER' }}>
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Should render without throwing error when banner is not shown
    expect(
      screen.queryByTestId('admin-approval-banner')
    ).not.toBeInTheDocument();
  });

  it('maintains banner visibility for PENDING_ADMIN_APPROVAL status', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'PENDING_ADMIN_APPROVAL' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    let banner = screen.getByTestId('admin-approval-banner');
    expect(banner).toBeInTheDocument();

    // Verify it's still present after rerender
    rerender(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'PENDING_ADMIN_APPROVAL' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    banner = screen.getByTestId('admin-approval-banner');
    expect(banner).toBeInTheDocument();
  });

  it('handles transition from PENDING_ADMIN_APPROVAL to ACTIVE', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'PENDING_ADMIN_APPROVAL' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    let banner = screen.queryByTestId('admin-approval-banner');
    expect(banner).toBeInTheDocument();

    // Update to ACTIVE status
    rerender(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    banner = screen.queryByTestId('admin-approval-banner');
    expect(banner).not.toBeInTheDocument();
  });
});

describe('ReceiverLayout Navigation', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Donations')).toBeInTheDocument();
    expect(screen.getByText('My Claims')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const avatarButton = screen.getByRole('button', { name: 'Account menu' });
    expect(avatarButton).toBeInTheDocument();
  });

  it('renders menu toggle button', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const menuToggle = screen.getByRole('button', { name: 'Toggle menu' });
    expect(menuToggle).toBeInTheDocument();
  });

  it('renders inbox button for messages', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const inboxButton = screen.getByRole('button', { name: 'Messages' });
    expect(inboxButton).toBeInTheDocument();
  });

  it('renders sidebar with logo', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ role: 'RECEIVER', accountStatus: 'ACTIVE' }}
        >
          <ReceiverLayoutContent />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const logo = screen.getByAltText('FoodFlow');
    expect(logo).toBeInTheDocument();
  });
});
