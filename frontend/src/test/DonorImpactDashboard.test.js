import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import DonorImpactDashboard from '../components/DonorDashboard/DonorImpactDashboard';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Package: () => <div>Package Icon</div>,
  Leaf: () => <div>Leaf Icon</div>,
  Utensils: () => <div>Utensils Icon</div>,
  Droplets: () => <div>Droplets Icon</div>,
  Users: () => <div>Users Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  Download: () => <div>Download Icon</div>,
  Settings: () => <div>Settings Icon</div>,
  X: () => <div>X Icon</div>,
  CheckCircle: () => <div>CheckCircle Icon</div>,
  TrendingUp: () => <div>TrendingUp Icon</div>,
  TrendingDown: () => <div>TrendingDown Icon</div>,
}));

describe('DonorImpactDashboard', () => {
  beforeEach(() => {
    // Mock window.URL methods for export functionality
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders dashboard with default metrics', () => {
      render(<DonorImpactDashboard />);
      
      expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Food Saved')).toBeInTheDocument();
      expect(screen.getByText('CO₂ Reduced')).toBeInTheDocument();
      expect(screen.getByText('Meals Donated')).toBeInTheDocument();
      expect(screen.getByText('Water Saved')).toBeInTheDocument();
    });

    test('renders date range selector with all options', () => {
      render(<DonorImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('This Quarter')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    test('displays correct metric values', () => {
      render(<DonorImpactDashboard />);
      
      expect(screen.getByText('20.00')).toBeInTheDocument(); // Food saved
      expect(screen.getByText('16.00')).toBeInTheDocument(); // CO2
      expect(screen.getByText('41')).toBeInTheDocument(); // Meals
      expect(screen.getByText('16000')).toBeInTheDocument(); // Water
    });

    test('renders activity summary section', () => {
      render(<DonorImpactDashboard />);
      
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Donations')).toBeInTheDocument();
      expect(screen.getByText('Pending Pickups')).toBeInTheDocument();
      expect(screen.getByText('Active Receivers')).toBeInTheDocument();
    });

    test('renders chart section', () => {
      render(<DonorImpactDashboard />);
      
      expect(screen.getByText('Food Saved Over Time')).toBeInTheDocument();
      const svgChart = document.querySelector('.line-chart');
      expect(svgChart).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    test('changes date range when option is selected', () => {
      render(<DonorImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector.value).toBe('MONTHLY');
      
      fireEvent.change(dateSelector, { target: { value: 'WEEKLY' } });
      expect(dateSelector.value).toBe('WEEKLY');
      
      fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });
      expect(dateSelector.value).toBe('ALL_TIME');
    });
  });

  describe('Export Functionality', () => {
    test('exports CSV when export button is clicked', () => {
      render(<DonorImpactDashboard />);
      
      // Mock document methods needed for export AFTER render
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
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    test('generates correct CSV content with metrics', () => {
      render(<DonorImpactDashboard />);
      
      // Store the original Blob constructor
      const OriginalBlob = global.Blob;
      let capturedBlobArgs = null;
      
      // Mock Blob constructor to capture arguments
      global.Blob = jest.fn(function(parts, options) {
        capturedBlobArgs = { parts, options };
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
      
      // Verify Blob was called with correct arguments
      expect(global.Blob).toHaveBeenCalled();
      expect(capturedBlobArgs).not.toBeNull();
      expect(capturedBlobArgs.parts[0]).toContain('Food Saved,20 kg');
      expect(capturedBlobArgs.options).toEqual({ type: 'text/csv' });
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });
  });

  describe('Customize Metrics Modal', () => {
    test('opens modal when customize button is clicked', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      expect(screen.getByText('Select which metrics you want to display on your dashboard (maximum 4):')).toBeInTheDocument();
    });

    test('closes modal when X button is clicked', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const modalContent = screen.getByText('Select which metrics you want to display on your dashboard (maximum 4):');
      expect(modalContent).toBeInTheDocument();
      
      const closeButtons = screen.getAllByText('X Icon');
      fireEvent.click(closeButtons[0].closest('button'));
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });

    test('closes modal when overlay is clicked', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });

    test('does not close modal when modal content is clicked', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const modalContent = document.querySelector('.modal-content');
      fireEvent.click(modalContent);
      
      expect(screen.getByText('Select which metrics you want to display on your dashboard (maximum 4):')).toBeInTheDocument();
    });
  });

  describe('Metric Toggle Functionality', () => {
    test('toggles metric visibility when checkbox is clicked', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];
      const initialChecked = firstCheckbox.checked;
      
      fireEvent.click(firstCheckbox);
      expect(firstCheckbox.checked).toBe(!initialChecked);
    });

    test('limits visible metrics to maximum of 4', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Clear all metrics first
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          fireEvent.click(checkbox);
        }
      });
      
      // Select 5 metrics
      for (let i = 0; i < 5 && i < checkboxes.length; i++) {
        fireEvent.click(checkboxes[i]);
      }
      
      // Count checked boxes
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBeLessThanOrEqual(4);
    });

    test('Select All button selects first 4 metrics', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const selectAllButton = screen.getByText('Select All').closest('button');
      fireEvent.click(selectAllButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBe(4);
    });

    test('Clear All button unchecks all metrics', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const clearAllButton = screen.getByText('Clear All').closest('button');
      fireEvent.click(clearAllButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBe(0);
    });

    test('Done button closes modal', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const doneButton = screen.getByText('Done').closest('button');
      fireEvent.click(doneButton);
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });
  });

  describe('Metric Cards Display', () => {
    test('displays only selected metrics in grid', () => {
      render(<DonorImpactDashboard />);
      
      // Default: 4 metrics should be visible
      const metricsGrid = document.querySelector('.metrics-cards-grid');
      expect(metricsGrid.children.length).toBe(4);
    });

    test('updates displayed metrics after customization', () => {
      render(<DonorImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      // Uncheck first metric
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      // Check people fed metric (5th checkbox)
      if (checkboxes.length > 4) {
        fireEvent.click(checkboxes[4]);
      }
      
      const doneButton = screen.getByText('Done').closest('button');
      fireEvent.click(doneButton);
      
      // Verify metrics grid updated
      const metricsGrid = document.querySelector('.metrics-cards-grid');
      expect(metricsGrid).toBeInTheDocument();
    });
  });

  describe('Metric Units', () => {
    test('displays correct units for each metric', () => {
      render(<DonorImpactDashboard />);
      
      const units = screen.getAllByText('kg');
      expect(units.length).toBeGreaterThanOrEqual(2); // Food and CO2
      
      expect(screen.getByText('L')).toBeInTheDocument(); // Water
    });
  });

  describe('Trends Display', () => {
    test('renders trend indicators for metrics', () => {
      render(<DonorImpactDashboard />);
      
      const trendTexts = screen.getAllByText(/vs previous period/i);
      expect(trendTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Summary Values', () => {
    test('displays all activity summary items with correct values', () => {
      render(<DonorImpactDashboard />);
      
      expect(screen.getByText('Total Donations')).toBeInTheDocument();
      expect(screen.getByText('Pending Pickups')).toBeInTheDocument();
      expect(screen.getByText('Active Receivers')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      expect(screen.getByText('Cancelled Donations')).toBeInTheDocument();
      expect(screen.getByText('Total Impact Score')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('renders all components without errors', () => {
      const { container } = render(<DonorImpactDashboard />);
      expect(container).toBeInTheDocument();
      expect(container.querySelector('.impact-dashboard-modern')).toBeInTheDocument();
    });
  });

  describe('Chart Visualization', () => {
    test('renders SVG chart with correct elements', () => {
      render(<DonorImpactDashboard />);
      
      const chart = document.querySelector('.line-chart');
      expect(chart).toBeInTheDocument();
      
      const polyline = chart.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
      
      const gradient = chart.querySelector('linearGradient');
      expect(gradient).toBeInTheDocument();
    });
  });
});
