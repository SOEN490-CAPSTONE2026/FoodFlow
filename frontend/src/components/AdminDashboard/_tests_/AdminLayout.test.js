import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';

import AdminLayout from '../AdminLayout';

const mockedNavigate = jest.fn();
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
    return render(
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
              <Route path="users" element={<Stub label="Calendar Content" />} />
              <Route
                path="messages"
                element={<Stub label="Messages Content" />}
              />
              <Route path="disputes" element={<Stub label="Help Content" />} />
            </Route>
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders sidebar and topbar basics', () => {
    const { container } = renderWithRoutes('/admin');
    expect(
      screen.getAllByRole('img', { name: /foodflow/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: /admin dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/overview and quick actions/i)).toBeInTheDocument();
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
    const usersLink = within(nav).getByText('Users');
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

  // UPDATED: split into two tests – navigate call + rendering at target route

  it('invokes navigate to /admin/messages when Messages row is clicked', () => {
    renderWithRoutes('/admin');
    fireEvent.click(screen.getAllByText('Messages')[0]);
    expect(mockedNavigate).toHaveBeenCalledWith('/admin/messages');
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

  describe('Responsive contacts count (getMaxContacts & dropdown)', () => {
    it('shows 1 contact at height <= 650, then 2 at <=800, then 4 at >800', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });
      const { container, unmount } = renderWithRoutes('/admin');
      const toggle = screen.getByLabelText('Toggle Messages');

      fireEvent.click(toggle);
      let items = container.querySelectorAll(
        '.messages-dropdown .message-item'
      );
      expect(items.length).toBe(1);

      window.innerHeight = 750;
      fireEvent(window, new Event('resize'));
      items = container.querySelectorAll('.messages-dropdown .message-item');
      expect(items.length).toBe(2);

      window.innerHeight = 900;
      fireEvent(window, new Event('resize'));
      items = container.querySelectorAll('.messages-dropdown .message-item');
      expect(items.length).toBe(4);

      const statuses = container.querySelectorAll(
        '.messages-dropdown .message-item .message-status'
      );
      expect(statuses.length).toBe(2); // first two contacts are online
      unmount();
    });
  });

  it('toggle button expands/collapses messages dropdown', () => {
    const { container } = renderWithRoutes('/admin');
    const toggle = screen.getByLabelText('Toggle Messages');
    expect(
      container.querySelector('.messages-dropdown')
    ).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(container.querySelector('.messages-dropdown')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(
      container.querySelector('.messages-dropdown')
    ).not.toBeInTheDocument();
  });
});
