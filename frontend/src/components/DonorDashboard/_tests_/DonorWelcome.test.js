import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DonorWelcome from '../DonorWelcome';

// Mock the API
jest.mock('../../../services/api', () => ({
  surplusAPI: {
    getMyPosts: jest.fn()
  }
}));

// Mock CSS
jest.mock('../Donor_Styles/DonorWelcome.css', () => ({}), { virtual: true });

import { surplusAPI } from '../../../services/api';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
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

describe('DonorWelcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    };
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <DonorWelcome />
      </MemoryRouter>
    );
  };

  test('renders welcome header with donor name from localStorage', async () => {
    window.localStorage.setItem('user', JSON.stringify({ 
      organizationName: 'Test Donor Org',
      name: 'Test User'
    }));

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element?.tagName?.toLowerCase() === 'h1' && 
               content.includes('Welcome back') && 
               content.includes('Test Donor Org');
      })).toBeInTheDocument();
    });
  });

  test('renders welcome header without name when user not in localStorage', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  test('renders all stats cards', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Total Donations')).toBeInTheDocument();
      expect(screen.getByText('Meals Served')).toBeInTheDocument();
      expect(screen.getByText(/CO₂ Saved/i)).toBeInTheDocument();
    });
  });

  test('calculates and displays correct stats from API data', async () => {
    const mockDonations = [
      { 
        id: 1, 
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED'
      },
      { 
        id: 2, 
        quantity: 5,
        quantityUnit: 'kg',
        status: 'COMPLETED'
      },
      { 
        id: 3, 
        quantity: 8,
        quantityUnit: 'kg',
        status: 'PENDING'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      // Total donations: 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    surplusAPI.getMyPosts.mockRejectedValueOnce(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Should still render with default values
    expect(screen.getByText('Total Donations')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('renders action cards with correct titles and descriptions', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Donate Food')).toBeInTheDocument();
      expect(screen.getByText('Impact Reports')).toBeInTheDocument();
    });
  });

  test('renders action buttons', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Donation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Reports/i })).toBeInTheDocument();
    });
  });

  test('navigates to list page when Create Donation button is clicked', async () => {
    const user = userEvent.setup();
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Donation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Create Donation/i }));
    
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('navigates to dashboard page when View Reports button is clicked', async () => {
    const user = userEvent.setup();
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Reports/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /View Reports/i }));
    
    expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
  });

  test('renders recent donations section', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recent Donations')).toBeInTheDocument();
    });
  });

  test('displays empty state when there are no donations', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No donations yet. Create your first donation to get started!/i)).toBeInTheDocument();
    });
  });

  test('displays recent donations when donations exist', async () => {
    const mockDonations = [
      {
        id: 1,
        foodType: 'Vegetables',
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      // Based on HTML output, it shows generic "Food donation" text
      expect(screen.getByText('Food donation')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('displays correct status text for donations', async () => {
    const mockDonations = [
      {
        id: 1,
        foodType: 'Food',
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        foodType: 'Food',
        quantity: 5,
        quantityUnit: 'kg',
        status: 'AVAILABLE',
        createdAt: '2024-01-14T09:00:00Z'
      },
      {
        id: 3,
        foodType: 'Food',
        quantity: 3,
        quantityUnit: 'kg',
        status: 'CLAIMED',
        createdAt: '2024-01-13T08:00:00Z'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      // Status displayed as: "Completed", "Available", "Claimed"
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Claimed')).toBeInTheDocument();
    });
  });

  test('renders View All button when donations exist', async () => {
    const mockDonations = [
      {
        id: 1,
        foodType: 'Food',
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View All/i })).toBeInTheDocument();
    });
  });

  test('does not render View All button when no donations', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /View All/i })).not.toBeInTheDocument();
    });
  });

  test('navigates when View All button is clicked', async () => {
    const user = userEvent.setup();
    const mockDonations = [
      {
        id: 1,
        foodType: 'Food',
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:00:00Z'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View All/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /View All/i }));
    
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('calls API on component mount', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(surplusAPI.getMyPosts).toHaveBeenCalledTimes(1);
    });
  });

  test('displays formatted dates in recent donations', async () => {
    const mockDonations = [
      {
        id: 1,
        foodType: 'Food',
        quantity: 10,
        quantityUnit: 'kg',
        status: 'COMPLETED',
        createdAt: '2024-01-15T10:30:45Z'
      }
    ];

    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: mockDonations });

    renderComponent();

    await waitFor(() => {
      // Date shown as "Jan 15" in the HTML
      expect(screen.getByText(/Jan 15/i)).toBeInTheDocument();
    });
  });

  test('displays default stats when no donations', async () => {
    surplusAPI.getMyPosts.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      const statValues = screen.getAllByText('0');
      expect(statValues.length).toBeGreaterThan(0); // Should have multiple zeros (totalDonations, mealsServed)
    });
  });
});