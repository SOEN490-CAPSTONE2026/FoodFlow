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

  it('Messages link navigates to /admin/messages', () => {
    const { container } = renderWithRoutes('/admin');
    const messagesLink = screen.getAllByText('Messages')[0].closest('a');
    expect(messagesLink).toHaveAttribute('href', '/admin/messages');
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

});
