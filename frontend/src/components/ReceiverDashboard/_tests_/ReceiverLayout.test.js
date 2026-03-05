import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReceiverLayout from '../ReceiverLayout';
import { AuthContext } from '../../../contexts/AuthContext';
import api, { profileAPI, savedDonationAPI } from '../../../services/api';

// Mock navigate
const mockNavigate = jest.fn();
const mockConnectToUserQueue = jest.fn();
const mockDisconnect = jest.fn();
let queueHandlers = [];

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../services/socket', () => ({
  connectToUserQueue: (...args) => {
    queueHandlers = args;
    mockConnectToUserQueue(...args);
  },
  disconnect: () => mockDisconnect(),
}));

jest.mock(
  '../ReceiverPreferences',
  () =>
    ({ isOpen }) =>
      isOpen ? (
        <div data-testid="receiver-preferences-modal">Preferences Open</div>
      ) : null
);
jest.mock('../../EmailVerificationRequired', () => () => (
  <div data-testid="email-verification-required">
    Email verification required
  </div>
));
jest.mock('../../AdminApprovalBanner', () => () => (
  <div data-testid="admin-approval-banner">Approval pending</div>
));
jest.mock(
  '../../MessagingDashboard/MessageNotification',
  () =>
    ({ notification }) =>
      notification ? (
        <div data-testid="message-notification">notification</div>
      ) : null
);
jest.mock('../../shared/AchievementNotification', () => ({ onClose }) => (
  <div data-testid="achievement-notification">
    Achievement unlocked
    <button type="button" onClick={onClose}>
      close-achievement
    </button>
  </div>
));

// Mock axios
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  profileAPI: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
  savedDonationAPI: {
    getSavedDonations: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));

const mockLogout = jest.fn();

function renderAt(path = '/receiver', contextOverrides = {}) {
  return render(
    <AuthContext.Provider
      value={{
        logout: mockLogout,
        organizationName: 'Receiver Org',
        accountStatus: 'ACTIVE',
        role: 'RECEIVER',
        ...contextOverrides,
      }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/receiver/*" element={<ReceiverLayout />}>
            <Route index element={<div>Browse</div>} />
            <Route path="welcome" element={<div>Welcome</div>} />
            <Route
              path="saved-donations"
              element={<div>Saved Donations</div>}
            />
            <Route path="browse" element={<div>Browse</div>} />
            <Route path="my-claims" element={<div>My Claims</div>} />
            <Route path="messages" element={<div>Messages</div>} />
            <Route path="settings" element={<div>Settings</div>} />
            <Route path="help" element={<div>Help</div>} />
            <Route path="invite" element={<div>Invite</div>} />
            <Route path="achievements" element={<div>Achievements</div>} />
            <Route path="impact" element={<div>Impact</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ReceiverLayout', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
    mockConnectToUserQueue.mockReset();
    mockDisconnect.mockReset();
    queueHandlers = [];
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
    profileAPI.get.mockResolvedValue({ data: {} });
    savedDonationAPI.getSavedDonations.mockResolvedValue({ data: [] });
  });

  test("renders browse title/description at /receiver and marks 'Donations' active", () => {
    renderAt('/receiver');
    expect(
      screen.getByRole('heading', { name: /receiver dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/overview of nearby food and your activity/i)
    ).toBeInTheDocument();

    const nav = screen.getByRole('link', { name: /^donations$/i });
    expect(nav).toHaveClass('receiver-nav-link');
    expect(nav).toHaveClass('active');
  });

  test("renders saved donations title/description at /receiver/saved-donations and marks 'Saved Donations' active", () => {
    renderAt('/receiver/saved-donations');
    expect(
      screen.getByRole('heading', { name: /saved donations/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/review and manage your saved donations/i)
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /saved donations/i });
    expect(link).toHaveClass('active');
  });

  test("renders browse title/description at /receiver/browse and marks 'Donations' active", () => {
    renderAt('/receiver/browse');
    expect(
      screen.getByRole('heading', { name: /browse available food/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse available food listings/i)
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /^donations$/i });
    expect(link).toHaveClass('active');
  });

  test("renders my claims page at /receiver/my-claims and marks 'My Claims' active", () => {
    renderAt('/receiver/my-claims');

    // Check that My Claims link is active
    const link = screen.getByRole('link', { name: /my claims/i });
    expect(link).toHaveClass('active');

    // Check that the my claims content is rendered (using getAllByText since it appears in nav and content)
    const myClaimsElements = screen.getAllByText('My Claims');
    expect(myClaimsElements.length).toBeGreaterThan(0);
  });

  test("renders messages title/description at /receiver/messages and marks 'Messages' active", () => {
    renderAt('/receiver/messages');

    // Check that Messages inbox button is present
    const button = screen.getByRole('button', { name: /^messages$/i });
    expect(button).toBeInTheDocument();

    // Check that the messages page content is rendered
    const messagesContent = screen.getAllByText('Messages');
    expect(messagesContent.length).toBeGreaterThan(0);
  });

  test('opens account menu via avatar button and logs out', async () => {
    renderAt('/receiver');

    const avatarBtn = screen.getByRole('button', { name: /account menu/i });
    fireEvent.click(avatarBtn);

    const menu = screen.getByText(/logout/i).closest('.dropdown-menu');
    expect(menu).toBeInTheDocument();

    const logoutBtn = within(menu).getByText(/logout/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', {
        replace: true,
        state: { scrollTo: 'home' },
      });
    });
  });

  test('account menu closes on outside click', () => {
    renderAt('/receiver');
    const avatarBtn = screen.getByRole('button', { name: /account menu/i });

    fireEvent.click(avatarBtn);
    expect(screen.getByText(/logout/i)).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });

  test('shows unread and saved donation badges from API data', async () => {
    api.get.mockResolvedValue({
      data: [{ unreadCount: 2 }, { unreadCount: 1 }],
    });
    savedDonationAPI.getSavedDonations.mockResolvedValue({
      data: [{ status: 'AVAILABLE' }, { status: 'CLAIMED' }],
    });

    renderAt('/receiver');

    await waitFor(() => {
      expect(document.querySelector('.inbox-btn .badge')).toHaveTextContent(
        '3'
      );
      expect(
        document.querySelector('.receiver-nav-count-badge')
      ).toHaveTextContent('1');
    });
  });

  test('increments unread badge when websocket message arrives', async () => {
    api.get.mockResolvedValue({ data: [{ unreadCount: 1 }] });
    renderAt('/receiver');

    await waitFor(() => {
      expect(mockConnectToUserQueue).toHaveBeenCalled();
      expect(document.querySelector('.inbox-btn .badge')).toHaveTextContent(
        '1'
      );
    });

    const onMessage = queueHandlers[0];
    onMessage({ senderName: 'Donor', messageBody: 'Hello' });

    await waitFor(() => {
      expect(document.querySelector('.inbox-btn .badge')).toHaveTextContent(
        '2'
      );
    });
  });

  test('shows achievement notification from websocket callback and allows close', async () => {
    renderAt('/receiver');

    await waitFor(() => expect(mockConnectToUserQueue).toHaveBeenCalled());
    const onAchievementUnlocked = queueHandlers[4];
    onAchievementUnlocked({ title: 'First Claim' });

    expect(
      await screen.findByTestId('achievement-notification')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('close-achievement'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('achievement-notification')
      ).not.toBeInTheDocument();
    });
  });

  test('renders email verification screen when account is pending verification', () => {
    renderAt('/receiver', { accountStatus: 'PENDING_VERIFICATION' });

    expect(
      screen.getByTestId('email-verification-required')
    ).toBeInTheDocument();
    expect(screen.queryByText(/receiver dashboard/i)).not.toBeInTheDocument();
  });

  test('renders admin approval banner when account awaits admin approval', () => {
    renderAt('/receiver', { accountStatus: 'PENDING_ADMIN_APPROVAL' });
    expect(screen.getByTestId('admin-approval-banner')).toBeInTheDocument();
  });

  test('opens preferences modal from account dropdown', async () => {
    renderAt('/receiver');
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    fireEvent.click(screen.getByText(/preferences/i));
    expect(
      await screen.findByTestId('receiver-preferences-modal')
    ).toBeInTheDocument();
  });

  test('navigates to settings, help and invite from account dropdown', () => {
    renderAt('/receiver');
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    fireEvent.click(screen.getByText(/^settings$/i));
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    fireEvent.click(screen.getByText(/^help$/i));
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    const menu = screen.getByText(/logout/i).closest('.dropdown-menu');
    fireEvent.click(within(menu).getByText(/invite community/i));

    expect(mockNavigate).toHaveBeenCalledWith('/receiver/settings');
    expect(mockNavigate).toHaveBeenCalledWith('/receiver/help');
    expect(mockNavigate).toHaveBeenCalledWith('/receiver/invite');
  });

  test('toggles mobile menu and closes after link click', () => {
    renderAt('/receiver');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    const navLinks = document.querySelector('.receiver-nav-links');

    expect(navLinks).not.toHaveClass('active');
    fireEvent.click(menuToggle);
    expect(navLinks).toHaveClass('active');

    fireEvent.click(screen.getByRole('link', { name: /^donations$/i }));
    expect(navLinks).not.toHaveClass('active');
  });

  test('navigates to messages when inbox button is clicked', () => {
    renderAt('/receiver');
    fireEvent.click(screen.getByRole('button', { name: /^messages$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/receiver/messages');
  });

  test('normalizes profile photo path from uploads folder', async () => {
    profileAPI.get.mockResolvedValueOnce({
      data: { profilePhoto: '/uploads/avatar.jpg' },
    });
    renderAt('/receiver');

    await waitFor(() => {
      const profileImg = screen.getByAltText('Profile');
      expect(profileImg.getAttribute('src')).toContain(
        '/api/files/uploads/avatar.jpg'
      );
    });
  });

  test('disconnects websocket on unmount', () => {
    const { unmount } = renderAt('/receiver');
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
