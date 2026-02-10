import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AdminImpactDashboard from '../components/AdminDashboard/AdminImpactDashboard';
import { impactDashboardAPI } from '../services/api';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div>TrendingUp Icon</div>,
  Leaf: () => <div>Leaf Icon</div>,
  Droplets: () => <div>Droplets Icon</div>,
  Users: () => <div>Users Icon</div>,
  Package: () => <div>Package Icon</div>,
  Award: () => <div>Award Icon</div>,
  Download: () => <div>Download Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  UserCheck: () => <div>UserCheck Icon</div>,
  Repeat: () => <div>Repeat Icon</div>,
}));

// Mock the API
jest.mock('../services/api', () => ({
  impactDashboardAPI: {
    getMetrics: jest.fn(),
    exportMetrics: jest.fn(),
  },
}));

describe('AdminImpactDashboard', () => {
  const mockMetrics = {
    totalFoodWeightKg: 1500.5,
    co2EmissionsAvoidedKg: 1200.75,
    estimatedMealsProvided: 3500,
    waterSavedLiters: 150000,
    peopleFedEstimate: 2000,
    totalPostsCreated: 450,
    totalDonationsCompleted: 380,
    totalClaimsMade: 375,
    donationCompletionRate: 84.4,
    activeDonors: 125,
    activeReceivers: 98,
    repeatDonors: 67,
    repeatReceivers: 54,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock window.URL methods for export functionality
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    global.alert = jest.fn();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('displays loading spinner when fetching data', () => {
      impactDashboardAPI.getMetrics.mockImplementation(() => new Promise(() => {}));
      
      render(<AdminImpactDashboard />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error message when API call fails', async () => {
      impactDashboardAPI.getMetrics.mockRejectedValueOnce(new Error('API Error'));
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('retry button refetches data', async () => {
      impactDashboardAPI.getMetrics.mockRejectedValueOnce(new Error('API Error'));
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });
      
      impactDashboardAPI.getMetrics.mockResolvedValueOnce({ data: mockMetrics });
      
      const retryButton = screen.getByText('Retry').closest('button');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('renders dashboard with metrics after successful fetch', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Total Food Saved')).toBeInTheDocument();
      expect(screen.getByText('Meals Provided')).toBeInTheDocument();
      expect(screen.getByText('CO₂ Emissions Avoided')).toBeInTheDocument();
      expect(screen.getByText('Water Saved')).toBeInTheDocument();
    });

    test('displays correct metric values', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('1500.50')).toBeInTheDocument(); // Food weight
      });
      
      expect(screen.getByText('3500')).toBeInTheDocument(); // Meals
      expect(screen.getByText('1200.75')).toBeInTheDocument(); // CO2
      expect(screen.getByText('150000')).toBeInTheDocument(); // Water
    });

    test('renders activity statistics section', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Activity')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Total Posts Created')).toBeInTheDocument();
      expect(screen.getByText('Donations Completed')).toBeInTheDocument();
      expect(screen.getByText('Total Claims Made')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    test('renders user engagement section', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('User Engagement')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Active Donors')).toBeInTheDocument();
      expect(screen.getByText('Active Receivers')).toBeInTheDocument();
      expect(screen.getByText('Repeat Donors')).toBeInTheDocument();
      expect(screen.getByText('Repeat Receivers')).toBeInTheDocument();
    });

    test('displays engagement metric values', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('125')).toBeInTheDocument(); // Active donors
      });
      
      expect(screen.getByText('98')).toBeInTheDocument(); // Active receivers
      expect(screen.getByText('67')).toBeInTheDocument(); // Repeat donors
      expect(screen.getByText('54')).toBeInTheDocument(); // Repeat receivers
    });

    test('renders platform impact message', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Summary 📊')).toBeInTheDocument();
      });
      
      expect(
        screen.getByText(/FoodFlow is making a real difference/i)
      ).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('renders date range selector with all options', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector).toBeInTheDocument();
      
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    test('fetches new data when date range changes', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'WEEKLY' } });
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('WEEKLY');
      });
    });

    test('refetches data for different date ranges', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('ALL_TIME');
      });
      
      const dateSelector = screen.getByRole('combobox');
      
      fireEvent.change(dateSelector, { target: { value: 'MONTHLY' } });
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('MONTHLY');
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
      impactDashboardAPI.exportMetrics.mockResolvedValue({ 
        data: 'Metric,Value\nFood Saved,1500 kg' 
      });
    });

    test('exports CSV when export button is clicked', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      // Store original Blob
      const OriginalBlob = global.Blob;
      global.Blob = jest.fn(function(parts, options) {
        return new OriginalBlob(parts, options);
      });
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const originalRemoveChild = document.body.removeChild.bind(document.body);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockLink;
        return originalCreateElement(tag);
      });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node === mockLink) return node;
        return originalAppendChild(node);
      });
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => {
        if (node === mockLink) return node;
        return originalRemoveChild(node);
      });

      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(impactDashboardAPI.exportMetrics).toHaveBeenCalledWith('ALL_TIME');
      });
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });

    test('shows error alert when export fails', async () => {
      impactDashboardAPI.exportMetrics.mockRejectedValueOnce(new Error('Export failed'));
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to export metrics');
      });
    });

    test('creates download link with correct filename', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      // Store original Blob
      const OriginalBlob = global.Blob;
      global.Blob = jest.fn(function(parts, options) {
        return new OriginalBlob(parts, options);
      });
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const originalRemoveChild = document.body.removeChild.bind(document.body);
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockLink;
        return originalCreateElement(tag);
      });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node === mockLink) return node;
        return originalAppendChild(node);
      });
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => {
        if (node === mockLink) return node;
        return originalRemoveChild(node);
      });

      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled();
      });
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });
  });

  describe('Metric Units Display', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('displays correct units for all metrics', async () => {
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      // Use text matcher function to handle whitespace
      const kgUnits = screen.getAllByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === 'kg';
      });
      expect(kgUnits.length).toBeGreaterThanOrEqual(2); // Food and CO2
      
      expect(screen.getByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === 'liters';
      })).toBeInTheDocument(); // Water
      
      expect(screen.getByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === 'meals';
      })).toBeInTheDocument(); // Meals
    });
  });

  describe('Component Lifecycle', () => {
    test('fetches metrics on mount', async () => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledTimes(1);
      });
    });

    test('refetches metrics when date range changes', async () => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledTimes(1);
      });
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'WEEKLY' } });
      
      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Null/Zero Metrics Handling', () => {
    test('handles null metrics gracefully', async () => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ 
        data: {
          totalFoodWeightKg: null,
          co2EmissionsAvoidedKg: null,
          estimatedMealsProvided: null,
          waterSavedLiters: null,
        } 
      });
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      // Should display default values (0.00 or 0) - use getAllByText since there are multiple
      const zeroDecimalValues = screen.getAllByText('0.00');
      expect(zeroDecimalValues.length).toBeGreaterThan(0);
    });

    test('displays 0 for undefined metrics', async () => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: {} });
      
      render(<AdminImpactDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Platform Impact Dashboard')).toBeInTheDocument();
      });
      
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThan(0);
    });
  });
});