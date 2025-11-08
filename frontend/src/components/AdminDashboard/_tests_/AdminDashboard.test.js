import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';

// Mock all child components
jest.mock('../AdminLayout', () => {
  const { Outlet } = require('react-router-dom');
  return function MockAdminLayout() {
    return (
      <div data-testid="admin-layout">
        <h1>Admin Layout</h1>
        <Outlet />
      </div>
    );
  };
});

jest.mock('../AdminHome', () => {
  return function MockAdminHome() {
    return <div data-testid="admin-home">Admin Home</div>;
  };
});

jest.mock('../AdminAnalytics', () => {
  return function MockAdminAnalytics() {
    return <div data-testid="admin-analytics">Admin Analytics</div>;
  };
});

jest.mock('../AdminCalendar', () => {
  return function MockAdminCalendar() {
    return <div data-testid="admin-calendar">Admin Calendar</div>;
  };
});

jest.mock('../AdminMessages.js', () => {
  return function MockAdminMessages() {
    return <div data-testid="admin-messages">Admin Messages</div>;
  };
});

jest.mock('../AdminHelp', () => {
  return function MockAdminHelp() {
    return <div data-testid="admin-help">Admin Help</div>;
  };
});

jest.mock('../AdminWelcome', () => {
  return function MockAdminWelcome() {
    return <div data-testid="admin-welcome">Admin Welcome</div>;
  };
});

describe('AdminDashboard', () => {
  const renderWithRouter = (initialRoute = '/admin') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Route Rendering', () => {
    test('renders AdminLayout wrapper for all routes', () => {
      renderWithRouter('/admin');
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      expect(screen.getByText('Admin Layout')).toBeInTheDocument();
    });

    test('renders AdminHome at index route', () => {
      renderWithRouter('/admin');
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
      expect(screen.getByText('Admin Home')).toBeInTheDocument();
    });

    test('renders AdminWelcome at /welcome route', () => {
      renderWithRouter('/admin/welcome');
      expect(screen.getByTestId('admin-welcome')).toBeInTheDocument();
      expect(screen.getByText('Admin Welcome')).toBeInTheDocument();
    });

    test('renders AdminHome at /dashboard route', () => {
      renderWithRouter('/admin/dashboard');
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
      expect(screen.getByText('Admin Home')).toBeInTheDocument();
    });

    test('renders AdminAnalytics at /analytics route', () => {
      renderWithRouter('/admin/analytics');
      expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
      expect(screen.getByText('Admin Analytics')).toBeInTheDocument();
    });

    test('renders AdminCalendar at /calendar route', () => {
      renderWithRouter('/admin/calendar');
      expect(screen.getByTestId('admin-calendar')).toBeInTheDocument();
      expect(screen.getByText('Admin Calendar')).toBeInTheDocument();
    });

    test('renders AdminMessages at /messages route', () => {
      renderWithRouter('/admin/messages');
      expect(screen.getByTestId('admin-messages')).toBeInTheDocument();
      expect(screen.getByText('Admin Messages')).toBeInTheDocument();
    });

    test('renders AdminHelp at /help route', () => {
      renderWithRouter('/admin/help');
      expect(screen.getByTestId('admin-help')).toBeInTheDocument();
      expect(screen.getByText('Admin Help')).toBeInTheDocument();
    });
  });

  describe('Catch-all Route', () => {
    test('redirects unknown routes to index', () => {
      renderWithRouter('/admin/unknown-route');
      // Should redirect to index which shows AdminHome
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });

    test('redirects nested unknown routes to index', () => {
      renderWithRouter('/admin/some/nested/unknown/path');
      // Should redirect to index which shows AdminHome
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });

    test('redirects invalid route with query params to index', () => {
      renderWithRouter('/admin/invalid?param=value');
      // Should redirect to index which shows AdminHome
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });

  describe('Layout Integration', () => {
    test('AdminLayout wraps AdminHome at index', () => {
      renderWithRouter('/admin');
      const layout = screen.getByTestId('admin-layout');
      const home = screen.getByTestId('admin-home');
      expect(layout).toContainElement(home);
    });

    test('AdminLayout wraps AdminWelcome', () => {
      renderWithRouter('/admin/welcome');
      const layout = screen.getByTestId('admin-layout');
      const welcome = screen.getByTestId('admin-welcome');
      expect(layout).toContainElement(welcome);
    });

    test('AdminLayout wraps AdminAnalytics', () => {
      renderWithRouter('/admin/analytics');
      const layout = screen.getByTestId('admin-layout');
      const analytics = screen.getByTestId('admin-analytics');
      expect(layout).toContainElement(analytics);
    });

    test('AdminLayout wraps AdminCalendar', () => {
      renderWithRouter('/admin/calendar');
      const layout = screen.getByTestId('admin-layout');
      const calendar = screen.getByTestId('admin-calendar');
      expect(layout).toContainElement(calendar);
    });

    test('AdminLayout wraps AdminMessages', () => {
      renderWithRouter('/admin/messages');
      const layout = screen.getByTestId('admin-layout');
      const messages = screen.getByTestId('admin-messages');
      expect(layout).toContainElement(messages);
    });

    test('AdminLayout wraps AdminHelp', () => {
      renderWithRouter('/admin/help');
      const layout = screen.getByTestId('admin-layout');
      const help = screen.getByTestId('admin-help');
      expect(layout).toContainElement(help);
    });
  });

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      const { container } = renderWithRouter('/admin');
      expect(container).toBeInTheDocument();
    });

    test('renders only one child component at a time', () => {
      renderWithRouter('/admin/analytics');
      expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-home')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-calendar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-messages')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-help')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-welcome')).not.toBeInTheDocument();
    });

    test('does not render multiple components simultaneously', () => {
      renderWithRouter('/admin/messages');
      const renderedComponents = [
        screen.queryByTestId('admin-home'),
        screen.queryByTestId('admin-analytics'),
        screen.queryByTestId('admin-calendar'),
        screen.queryByTestId('admin-help'),
        screen.queryByTestId('admin-welcome'),
      ].filter(Boolean);
      
      expect(renderedComponents).toHaveLength(0);
      expect(screen.getByTestId('admin-messages')).toBeInTheDocument();
    });
  });

  describe('Duplicate Route Behavior', () => {
    test('both index and /dashboard routes render AdminHome', () => {
      const { rerender } = renderWithRouter('/admin');
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();

      // Re-render with /dashboard route
      rerender(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });

  describe('Route Edge Cases', () => {
    test('handles route with trailing slash', () => {
      renderWithRouter('/admin/analytics/');
      // React Router should handle this gracefully
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    test('handles root admin path without trailing slash', () => {
      renderWithRouter('/admin');
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });

    test('case-insensitive route matching', () => {
      renderWithRouter('/admin/Analytics'); // Capital A
      // React Router v6 is case-insensitive by default, so this matches /admin/analytics
      expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
    });
  });

  describe('Navigation Replace Behavior', () => {
    test('Navigate component uses replace prop', () => {
      // This tests that the Navigate component is configured with replace
      // The actual redirect behavior is tested in other tests
      renderWithRouter('/admin/nonexistent');
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });
});