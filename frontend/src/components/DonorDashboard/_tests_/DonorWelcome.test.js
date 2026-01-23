import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DonorWelcome from '../DonorWelcome';
import { AuthContext } from '../../../contexts/AuthContext';
import { surplusAPI } from '../../../services/api';

// Mock API - import from the global mock
import { surplusAPI } from '../../../services/api';

// Mock CSS
jest.mock('../Donor_Styles/DonorWelcome.css', () => ({}), { virtual: true });

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Minimal localStorage stub
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: k => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const defaultCtx = {
  isLoggedIn: true,
  role: 'DONOR',
  userId: '1',
  organizationName: 'Test Donor Org',
  login: jest.fn(),
  logout: jest.fn(),
};

function renderWithProviders(ctxValue = defaultCtx) {
  return render(
    <AuthContext.Provider value={ctxValue}>
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('DonorWelcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    // IntersectionObserver mock
    global.IntersectionObserver = class {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    };
  });

  test('renders welcome header with donor name from localStorage/context', async () => {
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        organizationName: 'Test Donor Org',
        name: 'Test User',
      })
    );
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByText(
          (content, el) =>
            el?.tagName?.toLowerCase() === 'h1' &&
            content.includes('Welcome back') &&
            content.includes('Test Donor Org')
        )
      ).toBeInTheDocument();
    });
  });

  test('renders welcome header without name when context is empty (fallback)', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders({}); // provide empty context instead of no provider
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  test('renders all stats cards', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Total Donations')).toBeInTheDocument();
      expect(screen.getByText('Meals Served')).toBeInTheDocument();
      expect(screen.getByText(/CO₂ Saved/i)).toBeInTheDocument();
    });
  });

  test('calculates and displays correct stats from API data', async () => {
    const mockDonations = [
      { id: 1, quantity: 10, quantityUnit: 'kg', status: 'COMPLETED' },
      { id: 2, quantity: 5, quantityUnit: 'kg', status: 'COMPLETED' },
      { id: 3, quantity: 8, quantityUnit: 'kg', status: 'PENDING' },
    ];
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    surplusAPI.getMyPosts.mockRejectedValueOnce(new Error('API Error'));
    renderWithProviders();
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByText('Total Donations')).toBeInTheDocument();
    spy.mockRestore();
  });

  test('renders action cards and buttons', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Donate Food')).toBeInTheDocument();
      expect(screen.getByText('Impact Reports')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Create Donation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /View Reports/i })
      ).toBeInTheDocument();
    });
  });

  test('navigates to list on Create Donation', async () => {
    const user = userEvent.setup();
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await screen.findByRole('button', { name: /Create Donation/i });
    await user.click(screen.getByRole('button', { name: /Create Donation/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('navigates to dashboard on View Reports', async () => {
    const user = userEvent.setup();
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await screen.findByRole('button', { name: /View Reports/i });
    await user.click(screen.getByRole('button', { name: /View Reports/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
  });

  test('recent donations section and empty state', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Recent Donations')).toBeInTheDocument();
      expect(
        screen.getByText(
          /No donations yet\. Create your first donation to get started!/i
        )
      ).toBeInTheDocument();
    });
  });

  test('renders recent donation when present', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          foodType: 'Vegetables',
          quantity: 10,
          quantityUnit: 'kg',
          status: 'COMPLETED',
          createdAt: '2024-01-15T10:00:00Z',
        },
      ],
    });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Food donation')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('formats date in recent donations', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          quantity: 1,
          quantityUnit: 'kg',
          status: 'COMPLETED',
          createdAt: '2024-01-15T10:30:45Z',
        },
      ],
    });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Jan 15/i)).toBeInTheDocument();
    });
  });

  test('defaults stats to zero when no donations', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });
});
