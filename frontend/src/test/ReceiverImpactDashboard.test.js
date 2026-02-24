import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReceiverImpactDashboard from '../components/ReceiverDashboard/ReceiverImpactDashboard';
import { impactDashboardAPI } from '../services/api';

jest.mock('../services/api', () => ({
  impactDashboardAPI: {
    getMetrics: jest.fn(),
    exportMetrics: jest.fn(),
  },
}));

const tMock = (key, defaultValue) => defaultValue || key;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

// Mock recharts
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar">Bar</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="grid">Grid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockMetrics = {
  totalFoodWeightKg: 58.73,
  co2EmissionsAvoidedKg: 52.48,
  estimatedMealsProvided: 146,
  waterSavedLiters: 58733,
  peopleFedEstimate: 73,
  totalDonationsCompleted: 171,
  totalClaimsMade: 171,
  donationCompletionRate: 100.0,
  activeDonationDays: 12,
  weightVsPreviousPct: 15.0,
  co2VsPreviousPct: 2.0,
  mealsVsPreviousPct: -4.0,
  waterVsPreviousPct: 12.0,
  foodSavedTimeSeries: [
    { label: 'Day 1', foodWeightKg: 8.5 },
    { label: 'Day 2', foodWeightKg: 12.3 },
    { label: 'Day 3', foodWeightKg: 6.1 },
  ],
};

const renderLoadedDashboard = async () => {
  render(<ReceiverImpactDashboard />);
  await screen.findByText('Customize Metrics');
};

describe('ReceiverImpactDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    impactDashboardAPI.exportMetrics.mockResolvedValue({
      data: 'metric,value\nFood Claimed,58.73 kg',
    });
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  test('displays loading spinner when fetching data', () => {
    impactDashboardAPI.getMetrics.mockImplementation(
      () => new Promise(() => {})
    );
    render(<ReceiverImpactDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    impactDashboardAPI.getMetrics.mockRejectedValue(new Error('API Error'));
    render(<ReceiverImpactDashboard />);
    await waitFor(() => {
      expect(
        screen.getByText('Unable to load impact metrics. Please try again.')
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('renders dashboard controls and default metrics', async () => {
    await renderLoadedDashboard();

    expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Food Claimed')).toBeInTheDocument();

    const co2Elements = screen.getAllByText('CO₂ Avoided');
    expect(co2Elements.length).toBeGreaterThanOrEqual(1);

    const mealsElements = screen.getAllByText('Meals Provided');
    expect(mealsElements.length).toBeGreaterThanOrEqual(1);

    const waterElements = screen.getAllByText('Water Saved');
    expect(waterElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('58.73')).toBeInTheDocument();
    expect(screen.getByText('52.48')).toBeInTheDocument();
    expect(screen.getByText('146')).toBeInTheDocument();
    expect(screen.getByText('58733')).toBeInTheDocument();
  });

  test('supports date range selection and refetches metrics', async () => {
    await renderLoadedDashboard();

    const dateSelector = screen.getByRole('combobox');
    expect(dateSelector.value).toBe('DAYS_30');

    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();

    fireEvent.change(dateSelector, { target: { value: 'DAYS_7' } });

    await waitFor(() => {
      expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('DAYS_7');
    });
  });

  test('supports all time date range', async () => {
    await renderLoadedDashboard();

    const dateSelector = screen.getByRole('combobox');
    fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });

    await waitFor(() => {
      expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('ALL_TIME');
    });
  });

  test('exports CSV file via API', async () => {
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await renderLoadedDashboard();
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetrics).toHaveBeenCalledWith('DAYS_30');
    });
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');

    clickSpy.mockRestore();
  });

  test('shows error when export fails', async () => {
    impactDashboardAPI.exportMetrics.mockRejectedValueOnce(
      new Error('Export failed')
    );

    await renderLoadedDashboard();
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to export metrics right now.')
      ).toBeInTheDocument();
    });
  });

  test('opens customize modal and updates metric selection', async () => {
    await renderLoadedDashboard();

    fireEvent.click(screen.getByText('Customize Metrics'));
    expect(
      screen.getByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).toBeInTheDocument();

    // Verify all metric options are in the modal
    const foodClaimedElements = screen.getAllByText('Food Claimed');
    expect(foodClaimedElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('People Fed')).toBeInTheDocument();
    expect(screen.getByText('Claims Completed')).toBeInTheDocument();

    // Clear All
    fireEvent.click(screen.getByText('Clear All'));
    const checkedAfterClear = screen
      .getAllByRole('checkbox')
      .filter(checkbox => checkbox.checked).length;
    expect(checkedAfterClear).toBe(0);

    // Select All (selects first 4)
    fireEvent.click(screen.getByText('Select All'));
    const checkedAfterSelectAll = screen
      .getAllByRole('checkbox')
      .filter(checkbox => checkbox.checked).length;
    expect(checkedAfterSelectAll).toBe(4);

    // Done closes modal
    fireEvent.click(screen.getByText('Done'));
    expect(
      screen.queryByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).not.toBeInTheDocument();
  });

  test('closes modal when overlay is clicked', async () => {
    await renderLoadedDashboard();

    fireEvent.click(screen.getByText('Customize Metrics'));
    expect(
      screen.getByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).toBeInTheDocument();

    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay);

    expect(
      screen.queryByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).not.toBeInTheDocument();
  });

  test('does not close modal when modal content is clicked', async () => {
    await renderLoadedDashboard();

    fireEvent.click(screen.getByText('Customize Metrics'));

    const modalContent = document.querySelector('.modal-content');
    fireEvent.click(modalContent);

    expect(
      screen.getByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).toBeInTheDocument();
  });

  test('toggles metric visibility and enforces max 4 limit', async () => {
    await renderLoadedDashboard();

    fireEvent.click(screen.getByText('Customize Metrics'));

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    const initialChecked = firstCheckbox.checked;
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(!initialChecked);

    // Re-open fresh state
    fireEvent.click(screen.getByText('Select All'));
    const afterSelectAll = screen
      .getAllByRole('checkbox')
      .filter(cb => cb.checked).length;
    expect(afterSelectAll).toBe(4);

    // Unchecked metrics should be disabled when 4 are selected
    const disabledCount = screen
      .getAllByRole('checkbox')
      .filter(cb => !cb.checked && cb.disabled).length;
    expect(disabledCount).toBeGreaterThan(0);
  });

  test('renders chart and activity summary', async () => {
    await renderLoadedDashboard();

    expect(screen.getByText('Food Saved by Week')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Claims')).toBeInTheDocument();
    expect(screen.getByText('People Fed (estimate)')).toBeInTheDocument();

    // Activity summary values
    const claimValues = screen.getAllByText('171');
    expect(claimValues.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  test('shows empty chart message when no time series data', async () => {
    impactDashboardAPI.getMetrics.mockResolvedValue({
      data: { ...mockMetrics, foodSavedTimeSeries: [] },
    });
    render(<ReceiverImpactDashboard />);
    await waitFor(() => {
      expect(
        screen.getByText('No data for selected period')
      ).toBeInTheDocument();
    });
  });

  test('updates chart title when date range changes to weekly', async () => {
    await renderLoadedDashboard();

    const dateSelector = screen.getByRole('combobox');
    fireEvent.change(dateSelector, { target: { value: 'DAYS_7' } });

    await waitFor(() => {
      expect(screen.getByText('Food Saved by Day')).toBeInTheDocument();
    });
  });

  test('updates chart title when date range changes to all time', async () => {
    await renderLoadedDashboard();

    const dateSelector = screen.getByRole('combobox');
    fireEvent.change(dateSelector, { target: { value: 'ALL_TIME' } });

    await waitFor(() => {
      expect(screen.getByText('Food Saved by Month')).toBeInTheDocument();
    });
  });

  test('displays trend indicators with percentages', async () => {
    await renderLoadedDashboard();

    const positiveTrends = document.querySelectorAll('.metric-trend.positive');
    expect(positiveTrends.length).toBeGreaterThan(0);

    const negativeTrends = document.querySelectorAll('.metric-trend.negative');
    expect(negativeTrends.length).toBeGreaterThan(0);

    expect(screen.getByText('+15.0% vs previous period')).toBeInTheDocument();
    expect(screen.getByText('+2.0% vs previous period')).toBeInTheDocument();
    expect(screen.getByText('-4.0% vs previous period')).toBeInTheDocument();
  });

  test('displays correct metric units', async () => {
    await renderLoadedDashboard();

    const kgUnits = screen.getAllByText((content, element) => {
      return element?.className === 'metric-unit' && content.trim() === 'kg';
    });
    expect(kgUnits.length).toBeGreaterThanOrEqual(2);

    const literUnits = screen.getAllByText((content, element) => {
      return element?.className === 'metric-unit' && content.trim() === 'L';
    });
    expect(literUnits.length).toBeGreaterThanOrEqual(1);
  });

  test('displays only first 4 visible metrics in grid', async () => {
    await renderLoadedDashboard();

    const metricsGrid = document.querySelector('.metrics-cards-grid');
    expect(metricsGrid.children.length).toBe(4);
  });

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

    render(<ReceiverImpactDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
    });

    const zeroDecimalValues = screen.getAllByText('0.00');
    expect(zeroDecimalValues.length).toBeGreaterThan(0);
  });

  test('displays 0 for undefined metrics', async () => {
    impactDashboardAPI.getMetrics.mockResolvedValue({
      data: { foodSavedTimeSeries: [] },
    });

    render(<ReceiverImpactDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
    });

    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBeGreaterThan(0);
  });
});
