import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DonorWelcome from '../DonorWelcome';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock the API
jest.mock('../../../services/api', () => ({
  surplusAPI: {
    getMyPosts: jest.fn(() => Promise.resolve({ data: [] }))
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => {
      return store[key] || null;
    },
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  if (!global.IntersectionObserver) {
    global.IntersectionObserver = IO;
  }
});

test('renders welcome header with donor name', async () => {
  const mockAuthContext = {
    isLoggedIn: true,
    role: 'DONOR',
    userId: '1',
    organizationName: 'Test Donor',
    login: jest.fn(),
    logout: jest.fn()
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  await waitFor(() => {
    expect(screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'h1' &&
             element.textContent.includes('Welcome back') &&
             element.textContent.includes('Test Donor');
    })).toBeInTheDocument();
  });
});

test('renders stats cards', async () => {
  const mockAuthContext = {
    isLoggedIn: true,
    role: 'DONOR',
    userId: '1',
    organizationName: 'Test Donor',
    login: jest.fn(),
    logout: jest.fn()
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  await waitFor(() => {
    expect(screen.getByText('Total Donations')).toBeInTheDocument();
    expect(screen.getByText('Meals Served')).toBeInTheDocument();
    expect(screen.getByText(/CO₂ Saved/i)).toBeInTheDocument();
  });
});

test('renders action cards with buttons', async () => {
  const mockAuthContext = {
    isLoggedIn: true,
    role: 'DONOR',
    userId: '1',
    organizationName: 'Test Donor',
    login: jest.fn(),
    logout: jest.fn()
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  await waitFor(() => {
    expect(screen.getByText('Donate Food')).toBeInTheDocument();
    expect(screen.getByText('Impact Reports')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Donation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Reports/i })).toBeInTheDocument();
  });
});

test('renders recent donations section', async () => {
  const mockAuthContext = {
    isLoggedIn: true,
    role: 'DONOR',
    userId: '1',
    organizationName: 'Test Donor',
    login: jest.fn(),
    logout: jest.fn()
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  await waitFor(() => {
    expect(screen.getByText('Recent Donations')).toBeInTheDocument();
  });
});
