import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DonorDashboard from '../DonorDashboard';

// Mock all the components
jest.mock('../DonorLayout', () => {
  const { Outlet } = require('react-router-dom');
  return function MockDonorLayout() {
    return (
      <div data-testid="donor-layout">
        <Outlet />
      </div>
    );
  };
});

jest.mock('../DonorWelcome', () => {
  return function MockDonorWelcome() {
    return <div data-testid="donor-welcome">Donor Welcome</div>;
  };
});

jest.mock('../DonorDashboardHome', () => {
  return function MockDonorDashboardHome() {
    return <div data-testid="donor-dashboard-home">Donor Dashboard Home</div>;
  };
});

jest.mock('../DonorListFood', () => {
  return function MockDonorListFood() {
    return <div data-testid="donor-list-food">Donor List Food</div>;
  };
});

jest.mock('../DonorRequests', () => {
  return function MockDonorRequests() {
    return <div data-testid="donor-requests">Donor Requests</div>;
  };
});

jest.mock('../DonorSearch', () => {
  return function MockDonorSearch() {
    return <div data-testid="donor-search">Donor Search</div>;
  };
});

jest.mock('../../MessagingDashboard/MessagingDashboard', () => {
  return function MockMessagingDashboard() {
    return <div data-testid="messaging-dashboard">Messaging Dashboard</div>;
  };
});

describe('DonorDashboard', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <DonorDashboard />
      </MemoryRouter>
    );
  };

  test('renders DonorLayout wrapper', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('donor-layout')).toBeInTheDocument();
  });

  test('renders DonorWelcome at index route', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('donor-welcome')).toBeInTheDocument();
  });

  test('renders DonorDashboardHome at /dashboard route', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByTestId('donor-dashboard-home')).toBeInTheDocument();
  });

  test('renders DonorListFood at /list route', () => {
    renderWithRouter('/list');
    expect(screen.getByTestId('donor-list-food')).toBeInTheDocument();
  });

  test('renders DonorRequests at /requests route', () => {
    renderWithRouter('/requests');
    expect(screen.getByTestId('donor-requests')).toBeInTheDocument();
  });

  test('renders DonorSearch at /search route', () => {
    renderWithRouter('/search');
    expect(screen.getByTestId('donor-search')).toBeInTheDocument();
  });

  test('renders MessagingDashboard at /messages route', () => {
    renderWithRouter('/messages');
    expect(screen.getByTestId('messaging-dashboard')).toBeInTheDocument();
  });

  test('redirects unknown routes to index', () => {
    renderWithRouter('/unknown-route');
    expect(screen.getByTestId('donor-welcome')).toBeInTheDocument();
  });

  test('redirects deeply nested unknown routes to index', () => {
    renderWithRouter('/some/nested/unknown/path');
    expect(screen.getByTestId('donor-welcome')).toBeInTheDocument();
  });

  test('all routes render within DonorLayout', () => {
    const routes = [
      '/',
      '/dashboard',
      '/list',
      '/requests',
      '/search',
      '/messages',
    ];

    routes.forEach(route => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId('donor-layout')).toBeInTheDocument();
      unmount();
    });
  });
});
