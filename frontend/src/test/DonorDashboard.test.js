import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DonorDashboard from '../components/DonorDashboard/DonorDashboard';

jest.mock('../components/onboarding/DonorOnboardingController', () => {
  return function MockDonorOnboardingController({ children }) {
    return <div data-testid="donor-onboarding-controller">{children}</div>;
  };
});

// Mock all the components
jest.mock('../components/DonorDashboard/DonorLayout', () => {
  const { Outlet } = require('react-router-dom');
  return function MockDonorLayout() {
    return (
      <div data-testid="donor-layout">
        <Outlet />
      </div>
    );
  };
});

jest.mock('../components/DonorDashboard/DonorWelcome', () => {
  return function MockDonorWelcome() {
    return <div data-testid="donor-welcome">Donor Welcome</div>;
  };
});

jest.mock('../components/DonorDashboard/DonorDashboardHome', () => {
  return function MockDonorDashboardHome() {
    return <div data-testid="donor-dashboard-home">Donor Dashboard Home</div>;
  };
});

jest.mock('../components/DonorDashboard/DonorListFood', () => {
  return function MockDonorListFood() {
    return <div data-testid="donor-list-food">Donor List Food</div>;
  };
});

jest.mock('../components/MessagingDashboard/MessagingDashboard', () => {
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
    expect(
      screen.getByTestId('donor-onboarding-controller')
    ).toBeInTheDocument();
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
    const routes = ['/', '/dashboard', '/list', '/messages'];

    routes.forEach(route => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId('donor-layout')).toBeInTheDocument();
      unmount();
    });
  });
});
