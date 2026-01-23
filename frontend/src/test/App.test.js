import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { AuthContext } from '../contexts/AuthContext';

// Mock all the components - FIX: Add ../ to all paths
jest.mock('../components/LandingPage/LandingPage', () => {
  return function MockLandingPage() {
    return <div data-testid="landing-page">Landing Page</div>;
  };
});

jest.mock('../components/RegisterType', () => {
  return function MockRegisterType() {
    return <div data-testid="register-type">Register Type</div>;
  };
});

jest.mock('../components/DonorRegistration', () => {
  return function MockDonorRegistration() {
    return <div data-testid="donor-registration">Donor Registration</div>;
  };
});

jest.mock('../components/ReceiverRegistration', () => {
  return function MockReceiverRegistration() {
    return <div data-testid="receiver-registration">Receiver Registration</div>;
  };
});

jest.mock('../components/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('../components/NavigationBar', () => {
  return function MockNavigationBar() {
    return <div data-testid="navigation-bar">Navigation Bar</div>;
  };
});

jest.mock('../components/PrivacyPolicy', () => {
  return function MockPrivacyPolicy() {
    return <div data-testid="privacy-policy">Privacy Policy</div>;
  };
});

jest.mock('../components/AdminDashboard/AdminDashboard', () => {
  return function MockAdminDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard</div>;
  };
});

jest.mock('../components/DonorDashboard/DonorDashboard', () => {
  return function MockDonorDashboard() {
    return <div data-testid="donor-dashboard">Donor Dashboard</div>;
  };
});

jest.mock('../components/ReceiverDashboard/ReceiverDashboard', () => {
  return function MockReceiverDashboard() {
    return <div data-testid="receiver-dashboard">Receiver Dashboard</div>;
  };
});

jest.mock('../components/DonorDashboard/SurplusFormModal', () => {
  return function MockSurplusForm() {
    return <div data-testid="surplus-form">Surplus Form</div>;
  };
});

jest.mock('../components/PrivateRoutes', () => {
  return function MockPrivateRoutes({ children, allowedRoles }) {
    return (
      <div data-testid={`private-route-${allowedRoles.join('-')}`}>
        {children}
      </div>
    );
  };
});

// Mock useAnalytics hook
jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

// Mock CSS
jest.mock('../App.css', () => ({}), { virtual: true });

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderApp = (initialRoute = '/') => {
    window.history.pushState({}, 'Test page', initialRoute);
    return render(<App />);
  };

  describe('Public Routes', () => {
    test('renders landing page at root path', () => {
      renderApp('/');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });

    test('renders register type page', () => {
      renderApp('/register');
      expect(screen.getByTestId('register-type')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders donor registration page', () => {
      renderApp('/register/donor');
      expect(screen.getByTestId('donor-registration')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders receiver registration page', () => {
      renderApp('/register/receiver');
      expect(screen.getByTestId('receiver-registration')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders login page', () => {
      renderApp('/login');
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders privacy policy page', () => {
      renderApp('/privacy-policy');
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });

    test('renders surplus form page', () => {
      renderApp('/surplus/create');
      expect(screen.getByTestId('surplus-form')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    test('renders admin dashboard with private route protection', () => {
      renderApp('/admin');
      expect(screen.getByTestId('private-route-ADMIN')).toBeInTheDocument();
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders admin dashboard with nested path', () => {
      renderApp('/admin/analytics');
      expect(screen.getByTestId('private-route-ADMIN')).toBeInTheDocument();
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    test('redirects old admin dashboard path to new path', async () => {
      renderApp('/dashboard/admin');

      await waitFor(() => {
        expect(window.location.pathname).toBe('/admin');
      });
    });

    test('renders donor dashboard with private route protection', () => {
      renderApp('/donor');
      expect(screen.getByTestId('private-route-DONOR')).toBeInTheDocument();
      expect(screen.getByTestId('donor-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders donor dashboard with nested path', () => {
      renderApp('/donor/list-food');
      expect(screen.getByTestId('private-route-DONOR')).toBeInTheDocument();
      expect(screen.getByTestId('donor-dashboard')).toBeInTheDocument();
    });

    test('renders receiver dashboard with private route protection', () => {
      renderApp('/receiver');
      expect(screen.getByTestId('private-route-RECEIVER')).toBeInTheDocument();
      expect(screen.getByTestId('receiver-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('renders receiver dashboard with nested path', () => {
      renderApp('/receiver/browse');
      expect(screen.getByTestId('private-route-RECEIVER')).toBeInTheDocument();
      expect(screen.getByTestId('receiver-dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation Bar Visibility', () => {
    test('shows navbar on landing page', () => {
      renderApp('/');
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });

    test('hides navbar on login page', () => {
      renderApp('/login');
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('hides navbar on register pages', () => {
      renderApp('/register');
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('hides navbar on donor dashboard', () => {
      renderApp('/donor');
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('hides navbar on admin dashboard', () => {
      renderApp('/admin');
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('hides navbar on receiver dashboard', () => {
      renderApp('/receiver');
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
    });

    test('shows navbar on privacy policy page', () => {
      renderApp('/privacy-policy');
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    test('calls useAnalytics hook on mount', () => {
      const { useAnalytics } = require('../hooks/useAnalytics');
      renderApp('/');
      expect(useAnalytics).toHaveBeenCalled();
    });
  });

  describe('App Structure', () => {
    test('renders with AuthProvider', () => {
      const { container } = renderApp('/');
      expect(container.querySelector('.App')).toBeInTheDocument();
    });

    test('renders Router wrapper', () => {
      renderApp('/');
      // If Router is working, navigation should work
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });
});
