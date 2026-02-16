import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import AdminHome from '../AdminHome';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (key === 'admin.welcomeBack') {
        return `Welcome back, ${params.name}`;
      }
      return key;
    },
  }),
}));

// Mock the API module
jest.mock('../../../services/api', () => ({
  impactDashboardAPI: {
    getMetrics: jest.fn(),
  },
  adminVerificationAPI: {
    getPendingUsers: jest.fn(),
  },
  adminDonationAPI: {
    getAllDonations: jest.fn(),
  },
  adminDisputeAPI: {
    getAllDisputes: jest.fn(),
  },
}));

const mockAPI = require('../../../services/api');

describe('AdminHome', () => {
  const mockAuthContext = {
    organizationName: 'Evian',
  };

  beforeEach(() => {
    // Mock API calls
    mockAPI.impactDashboardAPI.getMetrics.mockResolvedValue({
      data: {
        totalPostsCreated: 3,
        totalDonationsCompleted: 1,
        totalClaimsMade: 2,
        activeDonors: 1,
      },
    });

    axios.get.mockResolvedValue({
      data: {
        totalElements: 4,
      },
    });

    mockAPI.adminVerificationAPI.getPendingUsers.mockResolvedValue({
      data: {
        totalElements: 1,
        content: [
          {
            userId: 1,
            organizationName: 'Test Org',
            email: 'test@example.com',
            userType: 'DONOR',
            registrationDate: new Date().toISOString(),
          },
        ],
      },
    });

    mockAPI.adminDonationAPI.getAllDonations.mockImplementation(params => {
      if (params?.flagged) {
        // Mock for flagged donations
        return Promise.resolve({
          data: {
            content: [],
          },
        });
      }
      // Mock for regular donations
      return Promise.resolve({
        data: {
          content: [
            {
              id: 1,
              title: 'Test Donation',
              donorOrganization: 'Test Donor',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    });

    mockAPI.adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [],
      },
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithContext = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminHome />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders Welcome heading with organization name', async () => {
    renderWithContext();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /welcome back, evian/i })
      ).toBeInTheDocument();
    });
  });

  it('renders Quick Actions section', async () => {
    renderWithContext();
    await waitFor(() => {
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument();
      expect(screen.getByText(/user management/i)).toBeInTheDocument();
      expect(screen.getByText(/review donations/i)).toBeInTheDocument();
    });
  });

  it('renders stats cards', async () => {
    renderWithContext();
    await waitFor(() => {
      expect(screen.getByText(/total users/i)).toBeInTheDocument();
      expect(screen.getByText(/total donations/i)).toBeInTheDocument();
      expect(screen.getByText(/ongoing claims/i)).toBeInTheDocument();
    });
  });

  it('renders without crashing and completes data loading', async () => {
    renderWithContext();
    // Wait for async data loading to complete by checking for stats
    await waitFor(
      () => {
        expect(screen.getByText(/total users/i)).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    // Verify component rendered successfully
    expect(screen.getByRole('heading', { name: /welcome back, evian/i })).toBeInTheDocument();
  });
});
