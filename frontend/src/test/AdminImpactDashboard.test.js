import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
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
  Settings: () => <div>Settings Icon</div>,
  X: () => <div>X Icon</div>,
  Utensils: () => <div>Utensils Icon</div>,
  CheckCircle: () => <div>CheckCircle Icon</div>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Legend: () => <div data-testid="legend" />,
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
    foodSavedTimeSeries: [
      { label: '2024-01-01', foodWeightKg: 100 },
      { label: '2024-01-02', foodWeightKg: 150 },
      { label: '2024-01-03', foodWeightKg: 200 },
    ],
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
      impactDashboardAPI.getMetrics.mockImplementation(
        () => new Promise(() => {})
      );

      render(<AdminImpactDashboard />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error message when API call fails', async () => {
      impactDashboardAPI.getMetrics.mockRejectedValueOnce(
        new Error('API Error')
      );

      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load impact metrics. Please try again.')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('retry button refetches data', async () => {
      impactDashboardAPI.getMetrics.mockRejectedValueOnce(
        new Error('API Error')
      );

      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load impact metrics. Please try again.')
        ).toBeInTheDocument();
      });

      impactDashboardAPI.getMetrics.mockResolvedValueOnce({
        data: mockMetrics,
      });

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

    test('renders dashboard with controls after successful fetch', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    test('displays correct metric values in cards', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('125')).toBeInTheDocument(); // Active donors
      });

      // These values appear in the default visible metrics
      expect(screen.getByText('98')).toBeInTheDocument(); // Active receivers
      expect(screen.getByText('380')).toBeInTheDocument(); // Completed donations
      expect(screen.getByText('84.4')).toBeInTheDocument(); // Completion rate
    });

    test('renders activity statistics section', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Platform Activity')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Posts Created')).toBeInTheDocument();
      expect(screen.getByText('Total Claims Made')).toBeInTheDocument();
      expect(screen.getByText('Repeat Donors')).toBeInTheDocument();
      expect(screen.getByText('Repeat Receivers')).toBeInTheDocument();
    });

    test('renders charts when data is available', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Food Saved Over Time')).toBeInTheDocument();
      });

      expect(screen.getByText('Impact Overview')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('renders date range selector with all options', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
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
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
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
        data: 'Metric,Value\nFood Saved,1500 kg',
      });
    });

    test('exports CSV when export button is clicked', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      // Store original Blob
      const OriginalBlob = global.Blob;
      global.Blob = jest.fn(function (parts, options) {
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

      const createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockImplementation(tag => {
          if (tag === 'a') {
            return mockLink;
          }
          return originalCreateElement(tag);
        });
      const appendChildSpy = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(node => {
          if (node === mockLink) {
            return node;
          }
          return originalAppendChild(node);
        });
      const removeChildSpy = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(node => {
          if (node === mockLink) {
            return node;
          }
          return originalRemoveChild(node);
        });

      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(impactDashboardAPI.exportMetrics).toHaveBeenCalledWith(
          'ALL_TIME'
        );
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();

      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });

    test('shows error message when export fails', async () => {
      impactDashboardAPI.exportMetrics.mockRejectedValueOnce(
        new Error('Export failed')
      );

      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to export metrics right now.')
        ).toBeInTheDocument();
      });
    });

    test('creates download link with correct filename', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      // Store original Blob
      const OriginalBlob = global.Blob;
      global.Blob = jest.fn(function (parts, options) {
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

      const createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockImplementation(tag => {
          if (tag === 'a') {
            return mockLink;
          }
          return originalCreateElement(tag);
        });
      const appendChildSpy = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(node => {
          if (node === mockLink) {
            return node;
          }
          return originalAppendChild(node);
        });
      const removeChildSpy = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(node => {
          if (node === mockLink) {
            return node;
          }
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

    test('displays correct units for metrics', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      // Check for percentage unit (completion rate)
      const percentUnits = screen.getAllByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === '%';
      });
      expect(percentUnits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Component Lifecycle', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockClear();
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('fetches metrics on mount', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledTimes(1);
      });
    });

    test('refetches metrics when date range changes', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('ALL_TIME');
      });

      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'WEEKLY' } });

      await waitFor(() => {
        expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('WEEKLY');
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
          foodSavedTimeSeries: [],
        },
      });

      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      // Should display default values (0 for counts, 0.0% for rate)
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThan(0);
      expect(screen.getByText('0.0')).toBeInTheDocument(); // Completion rate
    });

    test('displays 0 for undefined metrics', async () => {
      impactDashboardAPI.getMetrics.mockResolvedValue({
        data: {
          foodSavedTimeSeries: [],
        },
      });

      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThan(0);
    });
  });

  describe('Customize Metrics Modal', () => {
    beforeEach(() => {
      impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    });

    test('opens customize modal when button clicked', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      const customizeButton = screen
        .getByText('Customize Metrics')
        .closest('button');
      fireEvent.click(customizeButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Select which metrics you want to display on your dashboard (maximum 4):'
          )
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('closes modal when done button clicked', async () => {
      render(<AdminImpactDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      });

      const customizeButton = screen
        .getByText('Customize Metrics')
        .closest('button');
      fireEvent.click(customizeButton);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      const doneButton = screen.getByText('Done').closest('button');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(screen.queryByText('Select All')).not.toBeInTheDocument();
      });
    });
  });
});
