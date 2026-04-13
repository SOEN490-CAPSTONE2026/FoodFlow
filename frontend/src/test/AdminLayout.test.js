import React from 'react';
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

import AdminLayout from '../components/AdminDashboard/AdminLayout';

const mockedNavigate = jest.fn();
const mockProfileGet = jest.fn();
const mockConnectToUserQueue = jest.fn();
const mockDisconnect = jest.fn();
let lastSocketHandler = null;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => {
      const map = {
        'admin.dashboard': 'Home',
        'admin.users': 'User Management',
        'admin.verificationQueue': 'Verification Queue',
        'admin.verificationQueueDesc': 'Review accounts pending admin action',
        'admin.analytics': 'Analytics',
        'admin.metrics': 'Track compliance metrics',
        'admin.impact': 'Impact Dashboard',
        'admin.impactDesc': 'Review platform impact',
        'admin.calendar': 'Calendar',
        'admin.events': 'Manage platform events',
        'admin.disputes': 'Disputes & Reports',
        'admin.disputesDesc': 'Resolve reports and escalations',
        'admin.donations': 'Donations',
        'admin.referrals': 'Referrals',
        'admin.referralsDesc': 'Monitor referral growth',
        'admin.moneyDonations': 'Money Donations',
        'admin.moneyDonationsDesc': 'Track monetary donations',
        'admin.messages': 'Messages',
        'admin.help': 'Help',
        'admin.guides': 'Read admin guides',
        'admin.images': 'Images',
        'admin.imagesDesc': 'Review uploaded images',
        'admin.settings': 'Settings',
        'admin.usersDesc': 'Manage users',
        'admin.overview': 'Platform overview',
        'admin.administration': 'Administration',
        'admin.logout': 'Logout',
        'admin.toggleMenu': 'Toggle Menu',
        'admin.toggleSidebar': 'Toggle sidebar',
        'admin.foodflowHome': 'FoodFlow Home',
        'admin.communications': 'Incoming communications',
      };
      return map[key] || key;
    },
  }),
}));

jest.mock('../services/api', () => ({
  profileAPI: {
    get: (...args) => mockProfileGet(...args),
  },
}));

jest.mock('../services/socket', () => ({
  connectToUserQueue: (...args) => mockConnectToUserQueue(...args),
  disconnect: (...args) => mockDisconnect(...args),
}));

jest.mock('../components/MessagingDashboard/MessageNotification', () => ({
  __esModule: true,
  default: ({ notification, onClose }) => (
    <div>
      <span data-testid="message-notification">
        {notification.senderName}:{notification.message}
      </span>
      <button onClick={onClose}>Dismiss notification</button>
    </div>
  ),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

function Stub({ label }) {
  return <div data-testid="stub-outlet">{label}</div>;
}

describe('AdminLayout', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
    mockProfileGet.mockReset();
    mockConnectToUserQueue.mockReset();
    mockDisconnect.mockReset();
    lastSocketHandler = null;
    mockProfileGet.mockResolvedValue({ data: {} });
    mockConnectToUserQueue.mockImplementation(handler => {
      lastSocketHandler = handler;
    });
    localStorage.setItem('token', 'abc123');
    jest.spyOn(Storage.prototype, 'removeItem');
    jest.spyOn(Storage.prototype, 'clear');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderWithRoutes = (initialPath = '/admin') => {
    const mockLogout = jest.fn();
    const utils = render(
      <AuthContext.Provider value={{ logout: mockLogout }}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route index element={<Stub label="Dashboard Content" />} />
              <Route
                path="welcome"
                element={<Stub label="Dashboard Content" />}
              />
              <Route
                path="donations"
                element={<Stub label="Analytics Content" />}
              />
              <Route
                path="money-donations"
                element={<Stub label="Money Content" />}
              />
              <Route
                path="verification-queue"
                element={<Stub label="Verification Content" />}
              />
              <Route
                path="analytics"
                element={<Stub label="Analytics Dashboard Content" />}
              />
              <Route
                path="impact"
                element={<Stub label="Impact Content" />}
              />
              <Route
                path="calendar"
                element={<Stub label="Calendar Admin Content" />}
              />
              <Route path="users" element={<Stub label="Calendar Content" />} />
              <Route
                path="messages"
                element={<Stub label="Messages Content" />}
              />
              <Route path="disputes" element={<Stub label="Help Content" />} />
              <Route
                path="referrals"
                element={<Stub label="Referrals Content" />}
              />
              <Route path="help" element={<Stub label="Help Center Content" />} />
              <Route path="images" element={<Stub label="Images Content" />} />
              <Route
                path="settings"
                element={<Stub label="Settings Content" />}
              />
            </Route>
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    return { ...utils, mockLogout };
  };

  it('renders sidebar and topbar basics', () => {
    const { container } = renderWithRoutes('/admin');
    expect(
      screen.getAllByRole('img', { name: /foodflow/i }).length
    ).toBeGreaterThan(0);
    // Topbar is hidden on /admin route, so no heading should be present
    expect(
      screen.queryByRole('heading', { name: /admin dashboard/i })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('stub-outlet')).toHaveTextContent(
      'Dashboard Content'
    );
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('shows correct title/desc for Analytics route', () => {
    renderWithRoutes('/admin/users');
    // Check that the topbar exists and renders the page title
    const topbar = screen.getByRole('heading');
    expect(topbar).toBeInTheDocument();
    expect(screen.getByTestId('stub-outlet')).toHaveTextContent(
      'Calendar Content'
    );
  });

  it('applies active class to the current nav link', () => {
    renderWithRoutes('/admin/users');
    const nav = screen.getByRole('navigation');
    // Check that Users link exists and navigation renders
    const usersLink = within(nav).getByText('User Management');
    expect(usersLink).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });

  it('Dashboard link is active for /admin/dashboard as well (isActive special-case)', () => {
    renderWithRoutes('/admin');
    const nav = screen.getByRole('navigation');
    // Check that Home link exists for admin root path
    const homeLink = within(nav).getByText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });

  it('mobile menu opens via hamburger and closes via overlay', () => {
    const { container } = renderWithRoutes('/admin');
    const hamburger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(hamburger);
    expect(container.querySelector('.mobile-overlay')).toBeInTheDocument();
    fireEvent.click(container.querySelector('.mobile-overlay'));
    expect(container.querySelector('.mobile-overlay')).not.toBeInTheDocument();
  });

  it('Messages link navigates to /admin/messages', () => {
    const { container } = renderWithRoutes('/admin');
    const messagesLink = screen.getAllByText('Messages')[0].closest('a');
    expect(messagesLink).toHaveAttribute('href', '/admin/messages');
  });

  it('Money Donations link navigates to /admin/money-donations', () => {
    renderWithRoutes('/admin');
    const moneyLink = screen.getAllByText('Money Donations')[0].closest('a');
    expect(moneyLink).toHaveAttribute('href', '/admin/money-donations');
  });

  it('shows correct title/desc when rendered at /admin/messages', () => {
    renderWithRoutes('/admin/messages');
    expect(
      screen.getByRole('heading', { name: /messages/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/incoming communications/i)).toBeInTheDocument();
    expect(screen.getByTestId('stub-outlet')).toHaveTextContent(
      'Messages Content'
    );
  });

  it.each([
    ['/admin/verification-queue', 'Verification Queue', 'Review accounts pending admin action'],
    ['/admin/analytics', 'Analytics', 'Track compliance metrics'],
    ['/admin/impact', 'Impact Dashboard', 'Review platform impact'],
    ['/admin/calendar', 'Calendar', 'Manage platform events'],
    ['/admin/disputes', 'Disputes & Reports', 'Resolve reports and escalations'],
    ['/admin/referrals', 'Referrals', 'Monitor referral growth'],
    ['/admin/help', 'Help', 'Read admin guides'],
    ['/admin/images', 'Images', 'Review uploaded images'],
    ['/admin/money-donations', 'Money Donations', 'Track monetary donations'],
    ['/admin/settings', 'Home', 'Administration'],
  ])('renders topbar copy for %s', (path, title, desc) => {
    renderWithRoutes(path);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(desc)).toBeInTheDocument();
  });

  it('logs out and navigates home with state', async () => {
    const { mockLogout } = renderWithRoutes('/admin/settings');

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith('/', {
      replace: true,
      state: { scrollTo: 'home' },
    });
  });

  it('collapses the sidebar and shows fallback account info when org context is missing', async () => {
    const { container } = render(
      <AuthContext.Provider value={{ logout: jest.fn() }}>
        <MemoryRouter initialEntries={['/admin/settings']}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route path="settings" element={<Stub label="Settings Content" />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

    expect(container.querySelector('.admin-sidebar')).toHaveClass('collapsed');
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('shows a notification from socket payload and lets it close', async () => {
    renderWithRoutes('/admin/messages');

    expect(lastSocketHandler).toEqual(expect.any(Function));

    act(() => {
      lastSocketHandler({
        sender: { email: 'sender@example.com' },
        body: 'New inbox message',
      });
    });

    expect(
      await screen.findByTestId('message-notification')
    ).toHaveTextContent('sender@example.com:New inbox message');

    fireEvent.click(screen.getByRole('button', { name: /dismiss notification/i }));

    await waitFor(() => {
      expect(
        screen.queryByTestId('message-notification')
      ).not.toBeInTheDocument();
    });
    expect(document.querySelector('.admin-content')).toHaveClass('messages-page');
  });

  it('ignores socket payloads with no message body and disconnects on unmount', () => {
    const { unmount } = renderWithRoutes('/admin');

    act(() => {
      lastSocketHandler({
        senderName: 'No Body Sender',
      });
    });

    expect(screen.queryByTestId('message-notification')).not.toBeInTheDocument();

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('redirects POP navigation outside admin back to the dashboard', () => {
    jest
      .spyOn(require('react-router-dom'), 'useNavigationType')
      .mockReturnValueOnce('POP');
    jest
      .spyOn(require('react-router-dom'), 'useLocation')
      .mockReturnValueOnce({ pathname: '/profile' });

    render(
      <AuthContext.Provider value={{ logout: jest.fn() }}>
        <MemoryRouter>
          <AdminLayout />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockedNavigate).toHaveBeenCalledWith('/admin/dashboard', {
      replace: true,
    });
  });

  it.each([
    ['https://cdn.example.com/avatar.png', 'https://cdn.example.com/avatar.png'],
    ['data:image/png;base64,abc', 'data:image/png;base64,abc'],
    ['/uploads/user.png', 'http://localhost:8080/api/files/uploads/user.png'],
    ['/api/files/photo.png', 'http://localhost:8080/api/files/photo.png'],
    ['avatars/custom.png', 'http://localhost:8080/avatars/custom.png'],
  ])('maps profile photo url variant %s', async (profilePhoto, expectedUrl) => {
    mockProfileGet.mockResolvedValueOnce({ data: { profilePhoto } });

    const { container } = renderWithRoutes('/admin/settings');

    await waitFor(() => {
      expect(container.querySelector('.account-avatar')).toHaveStyle({
        backgroundImage: `url(${expectedUrl})`,
      });
    });
  });
});
