import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DonorImpactDashboard from '../components/DonorDashboard/DonorImpactDashboard';
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

const mockMetrics = {
  totalFoodWeightKg: 20,
  co2EmissionsAvoidedKg: 16,
  estimatedMealsProvided: 41,
  waterSavedLiters: 16000,
  weightVsPreviousPct: 5.5,
  co2VsPreviousPct: 3.2,
  mealsVsPreviousPct: 7.1,
  waterVsPreviousPct: 4.4,
  peopleFedEstimate: 26,
  totalDonationsCompleted: 9,
  donationCompletionRate: 90,
  activeDonationDays: 18,
  totalPostsCreated: 12,
  pendingPickups: 2,
  activeReceivers: 4,
  avgResponseTime: 3,
  cancelledDonations: 1,
  impactScore: 88,
  foodSavedTimeSeries: [
    { label: 'Day 1', foodWeightKg: 4 },
    { label: 'Day 2', foodWeightKg: 7 },
    { label: 'Day 3', foodWeightKg: 9 },
  ],
};

const renderLoadedDashboard = async () => {
  render(<DonorImpactDashboard />);
  await screen.findByText('Customize Metrics');
};

describe('DonorImpactDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    impactDashboardAPI.exportMetrics.mockResolvedValue({
      data: 'metric,value\nFood Saved,20 kg',
    });
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  test('renders dashboard controls and default metrics', async () => {
    await renderLoadedDashboard();

    expect(screen.getByText('Customize Metrics')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Food Saved')).toBeInTheDocument();
    expect(screen.getByText('CO₂ Reduced')).toBeInTheDocument();
    expect(screen.getByText('Meals Donated')).toBeInTheDocument();
    expect(screen.getByText('Water Saved')).toBeInTheDocument();
    expect(screen.getByText('20.00')).toBeInTheDocument();
    expect(screen.getByText('16.00')).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('16000')).toBeInTheDocument();
  });

  test('supports date range selection and refetches metrics', async () => {
    await renderLoadedDashboard();

    const dateSelector = screen.getByRole('combobox');
    expect(dateSelector.value).toBe('DAYS_30');

    fireEvent.change(dateSelector, { target: { value: 'DAYS_7' } });

    await waitFor(() => {
      expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('DAYS_7');
    });
  });

  test('exports csv file', async () => {
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

  test('opens customize modal and updates metric selection', async () => {
    await renderLoadedDashboard();

    fireEvent.click(screen.getByText('Customize Metrics'));
    expect(
      screen.getByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear All'));
    const checkedAfterClear = screen
      .getAllByRole('checkbox')
      .filter(checkbox => checkbox.checked).length;
    expect(checkedAfterClear).toBe(0);

    fireEvent.click(screen.getByText('Select All'));
    const checkedAfterSelectAll = screen
      .getAllByRole('checkbox')
      .filter(checkbox => checkbox.checked).length;
    expect(checkedAfterSelectAll).toBe(4);

    fireEvent.click(screen.getByText('Done'));
    expect(
      screen.queryByText(
        'Select which metrics you want to display on your dashboard (maximum 4):'
      )
    ).not.toBeInTheDocument();
  });

  test('renders chart and activity summary', async () => {
    await renderLoadedDashboard();

    expect(screen.getByText('Food Saved Over Time')).toBeInTheDocument();
    expect(document.querySelector('.line-chart')).toBeInTheDocument();

    expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Donations')).toBeInTheDocument();
    expect(screen.getByText('Pending Pickups')).toBeInTheDocument();
    expect(screen.getByText('Active Receivers')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
  });
});
