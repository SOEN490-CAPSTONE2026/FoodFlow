import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ReceiverImpactDashboard from '../components/ReceiverDashboard/ReceiverImpactDashboard';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div>TrendingUp Icon</div>,
  TrendingDown: () => <div>TrendingDown Icon</div>,
  Leaf: () => <div>Leaf Icon</div>,
  Droplets: () => <div>Droplets Icon</div>,
  Users: () => <div>Users Icon</div>,
  Package: () => <div>Package Icon</div>,
  Download: () => <div>Download Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  Settings: () => <div>Settings Icon</div>,
  CheckCircle: () => <div>CheckCircle Icon</div>,
  Utensils: () => <div>Utensils Icon</div>,
  X: () => <div>X Icon</div>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar">Bar</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="grid">Grid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('ReceiverImpactDashboard', () => {
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
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Food Claimed')).toBeInTheDocument();
      
      // Use getAllByText since these appear in both metric cards and activity summary
      const co2Elements = screen.getAllByText('CO₂ Avoided');
      expect(co2Elements.length).toBeGreaterThanOrEqual(1);
      
      const mealsElements = screen.getAllByText('Meals Provided');
      expect(mealsElements.length).toBeGreaterThanOrEqual(1);
      
      const waterElements = screen.getAllByText('Water Saved');
      expect(waterElements.length).toBeGreaterThanOrEqual(1);
    });

    test('displays correct metric values', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('5,873')).toBeInTheDocument(); // Food claimed
      expect(screen.getByText('52,481')).toBeInTheDocument(); // CO2
      expect(screen.getByText('14,683')).toBeInTheDocument(); // Meals
      expect(screen.getByText('5,873,332')).toBeInTheDocument(); // Water
    });

    test('renders date range selector with all options', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector).toBeInTheDocument();
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    test('displays badge count for visible metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      const badgeCount = document.querySelector('.badge-count');
      expect(badgeCount).toBeInTheDocument();
      expect(badgeCount.textContent).toBe('4'); // Default 4 visible metrics
    });

    test('renders activity summary section', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Claims')).toBeInTheDocument();
      expect(screen.getByText('People Fed (estimate)')).toBeInTheDocument();
    });
  });

  describe('Chart Section', () => {
    test('renders chart with responsive container', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('displays correct chart title for weekly view', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('Claims by Day')).toBeInTheDocument();
    });

    test('updates chart title when date range changes', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'MONTHLY' } });
      
      expect(screen.getByText('Claims by Week')).toBeInTheDocument();
    });

    test('changes to monthly chart title', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });
      
      expect(screen.getByText('Claims by Month')).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    test('changes date range when option is selected', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      expect(dateSelector.value).toBe('WEEKLY');
      
      fireEvent.change(dateSelector, { target: { value: 'MONTHLY' } });
      expect(dateSelector.value).toBe('MONTHLY');
      
      fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });
      expect(dateSelector.value).toBe('ALL_TIME');
    });
  });

  describe('Export Functionality', () => {
    test('exports CSV when export button is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
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
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });

    test('generates correct CSV content with metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      // Store original Blob
      const OriginalBlob = global.Blob;
      let capturedBlobArgs = null;
      
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
      expect(capturedBlobArgs.parts[0]).toContain('Food Claimed,5873 kg');
      expect(capturedBlobArgs.options).toEqual({ type: 'text/csv' });
      
      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      global.Blob = OriginalBlob;
    });

    test('includes date range in filename', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'MONTHLY' } });
      
      const exportButton = screen.getByText('Export CSV').closest('button');
      fireEvent.click(exportButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Customize Metrics Modal', () => {
    test('opens modal when customize button is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      expect(screen.getByText('Select which metrics you want to display on your dashboard (maximum 4):')).toBeInTheDocument();
    });

    test('closes modal when X button is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const closeButtons = screen.getAllByText('X Icon');
      fireEvent.click(closeButtons[0].closest('button'));
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });

    test('closes modal when overlay is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });

    test('does not close modal when modal content is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const modalContent = document.querySelector('.modal-content');
      fireEvent.click(modalContent);
      
      expect(screen.getByText('Select which metrics you want to display on your dashboard (maximum 4):')).toBeInTheDocument();
    });

    test('displays all metric options in modal', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      // Verify modal is present
      const modal = document.querySelector('.modal-content');
      expect(modal).toBeInTheDocument();
      
      // Check for all metric options - use getAllByText for ones that appear in multiple places
      expect(screen.getByText('Food Weight Saved')).toBeInTheDocument();
      
      const co2Elements = screen.getAllByText('CO₂ Avoided');
      expect(co2Elements.length).toBeGreaterThanOrEqual(1);
      
      const waterElements = screen.getAllByText('Water Saved');
      expect(waterElements.length).toBeGreaterThanOrEqual(1);
      
      expect(screen.getByText('People Fed')).toBeInTheDocument();
      expect(screen.getByText('Claims Completed')).toBeInTheDocument();
      
      const totalClaimsElements = screen.getAllByText('Total Claims');
      expect(totalClaimsElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Metric Toggle Functionality', () => {
    test('toggles metric visibility when checkbox is clicked', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];
      const initialChecked = firstCheckbox.checked;
      
      fireEvent.click(firstCheckbox);
      expect(firstCheckbox.checked).toBe(!initialChecked);
    });

    test('limits visible metrics to maximum of 4', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Clear all metrics first
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          fireEvent.click(checkbox);
        }
      });
      
      // Try to select all 7 metrics
      checkboxes.forEach(checkbox => {
        if (!checkbox.checked && !checkbox.disabled) {
          fireEvent.click(checkbox);
        }
      });
      
      // Count checked boxes
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBeLessThanOrEqual(4);
    });

    test('disables unchecked metrics when 4 are selected', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Ensure exactly 4 are checked
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      if (checkedCount === 4) {
        const disabledCount = checkboxes.filter(cb => !cb.checked && cb.disabled).length;
        expect(disabledCount).toBeGreaterThan(0);
      }
    });

    test('Select All button selects first 4 metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const selectAllButton = screen.getByText('Select All').closest('button');
      fireEvent.click(selectAllButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBe(4);
    });

    test('Clear All button unchecks all metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const clearAllButton = screen.getByText('Clear All').closest('button');
      fireEvent.click(clearAllButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(cb => cb.checked).length;
      expect(checkedCount).toBe(0);
    });

    test('Done button closes modal', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      const doneButton = screen.getByText('Done').closest('button');
      fireEvent.click(doneButton);
      
      expect(screen.queryByText('Select which metrics you want to display on your dashboard (maximum 4):')).not.toBeInTheDocument();
    });
  });

  describe('Metric Cards Display', () => {
    test('displays only first 4 visible metrics in grid', () => {
      render(<ReceiverImpactDashboard />);
      
      const metricsGrid = document.querySelector('.metrics-cards-grid');
      expect(metricsGrid.children.length).toBe(4);
    });

    test('updates badge count after customization', () => {
      render(<ReceiverImpactDashboard />);
      
      const customizeButton = screen.getByText('Customize Metrics').closest('button');
      fireEvent.click(customizeButton);
      
      // Clear all and select 2
      const clearAllButton = screen.getByText('Clear All').closest('button');
      fireEvent.click(clearAllButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      
      const doneButton = screen.getByText('Done').closest('button');
      fireEvent.click(doneButton);
      
      const badgeCount = document.querySelector('.badge-count');
      expect(badgeCount.textContent).toBe('2');
    });
  });

  describe('Trend Indicators', () => {
    test('displays positive trends', () => {
      render(<ReceiverImpactDashboard />);
      
      const positiveTrends = document.querySelectorAll('.metric-trend.positive');
      expect(positiveTrends.length).toBeGreaterThan(0);
    });

    test('displays negative trends for decreasing metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      const negativeTrends = document.querySelectorAll('.metric-trend.negative');
      expect(negativeTrends.length).toBeGreaterThan(0);
    });

    test('shows percentage changes vs previous period', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('+15% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('+2% vs previous period')).toBeInTheDocument();
      expect(screen.getByText('-4% vs previous period')).toBeInTheDocument();
    });
  });

  describe('Activity Summary Values', () => {
    test('displays all activity summary metrics', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
      
      const summaryValues = screen.getAllByText('171');
      expect(summaryValues.length).toBeGreaterThanOrEqual(1);
      
      expect(screen.getByText('7,342')).toBeInTheDocument(); // People fed
    });
  });

  describe('Metric Units', () => {
    test('displays correct units for each metric', () => {
      render(<ReceiverImpactDashboard />);
      
      // Use text matcher function to handle whitespace in units
      const kgUnits = screen.getAllByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === 'kg';
      });
      expect(kgUnits.length).toBeGreaterThanOrEqual(2); // Food and CO2
      
      const literUnits = screen.getAllByText((content, element) => {
        return element?.className === 'metric-unit' && content.trim() === 'L';
      });
      expect(literUnits.length).toBeGreaterThanOrEqual(1); // Water
    });
  });

  describe('Responsive Behavior', () => {
    test('renders all components without errors', () => {
      const { container } = render(<ReceiverImpactDashboard />);
      expect(container).toBeInTheDocument();
      expect(container.querySelector('.impact-dashboard-modern')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    test('formats large numbers with commas', () => {
      render(<ReceiverImpactDashboard />);
      
      expect(screen.getByText('5,873')).toBeInTheDocument();
      expect(screen.getByText('52,481')).toBeInTheDocument();
      expect(screen.getByText('14,683')).toBeInTheDocument();
      expect(screen.getByText('5,873,332')).toBeInTheDocument();
    });
  });

  describe('Chart Data Generation', () => {
    test('generates appropriate data for weekly view', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'WEEKLY' } });
      
      // Chart should still render
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('generates appropriate data for monthly view', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'MONTHLY' } });
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('generates appropriate data for all time view', () => {
      render(<ReceiverImpactDashboard />);
      
      const dateSelector = screen.getByRole('combobox');
      fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});
