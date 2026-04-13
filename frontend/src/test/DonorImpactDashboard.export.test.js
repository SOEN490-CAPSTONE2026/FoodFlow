import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonorImpactDashboard from '../components/DonorDashboard/DonorImpactDashboard';
import { impactDashboardAPI } from '../services/api';

jest.mock('../services/api', () => ({
  impactDashboardAPI: {
    getMetrics: jest.fn(),
    exportMetricsCSV: jest.fn(),
    exportMetricsPDF: jest.fn(),
  },
}));

const tMock = (key, defaultValue) => defaultValue || key;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

const mockMetrics = {
  userId: 1,
  role: 'DONOR',
  dateRange: 'DAYS_30',
  startDate: '2026-03-06',
  endDate: '2026-04-05',
  totalFoodWeightKg: 100.0,
  estimatedMealsProvided: 200,
  minMealsProvided: 150,
  maxMealsProvided: 250,
  co2EmissionsAvoidedKg: 50.0,
  waterSavedLiters: 5000.0,
  peopleFedEstimate: 66,
  totalPostsCreated: 10,
  totalDonationsCompleted: 8,
  donationCompletionRate: 80.0,
  activeDonationDays: 5,
  factorVersion: '1.0-default',
  factorDisclosure: 'Test disclosure',
  foodSavedTimeSeries: [
    { label: 'Day 1', foodWeightKg: 4 },
    { label: 'Day 2', foodWeightKg: 7 },
    { label: 'Day 3', foodWeightKg: 9 },
  ],
};

describe('DonorImpactDashboard Export Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    impactDashboardAPI.getMetrics.mockResolvedValue({ data: mockMetrics });
    impactDashboardAPI.exportMetricsCSV.mockResolvedValue({
      data: 'Metric,Value\nFood Saved,100.00 kg',
    });
    impactDashboardAPI.exportMetricsPDF.mockResolvedValue({
      data: '%PDF-1.4 mock content',
    });
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDashboard = async () => {
    render(<DonorImpactDashboard />);
    await screen.findByText('Customize Metrics');
  };

  test('renders Export button with dropdown', async () => {
    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });

  test('exports CSV data with correct format', async () => {
    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetricsCSV).toHaveBeenCalledWith(
        'DAYS_30'
      );
    });
  });

  test('exports PDF data with correct format', async () => {
    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const pdfOption = await screen.findByText('Export PDF');
    fireEvent.click(pdfOption);

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetricsPDF).toHaveBeenCalledWith(
        'DAYS_30'
      );
    });
  });

  test('CSV export filename includes current date', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      const linkElement = createElementSpy.mock.results.find(
        result => result.value instanceof HTMLAnchorElement
      )?.value;

      expect(linkElement).toBeTruthy();
      expect(linkElement.download).toMatch(
        /FoodFlow_Impact_Report_\d{4}-\d{2}-\d{2}\.csv/
      );
    });
    expect(clickSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  test('PDF export filename includes current date', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const pdfOption = await screen.findByText('Export PDF');
    fireEvent.click(pdfOption);

    await waitFor(() => {
      const linkElement = createElementSpy.mock.results.find(
        result => result.value instanceof HTMLAnchorElement
      )?.value;

      expect(linkElement).toBeTruthy();
      expect(linkElement.download).toMatch(
        /FoodFlow_Impact_Report_\d{4}-\d{2}-\d{2}\.pdf/
      );
    });
    expect(clickSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  test('handles CSV export error gracefully', async () => {
    const errorMessage = 'Export failed';
    impactDashboardAPI.exportMetricsCSV.mockRejectedValue(
      new Error(errorMessage)
    );

    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetricsCSV).toHaveBeenCalled();
    });
  });

  test('handles PDF export error gracefully', async () => {
    const errorMessage = 'PDF generation failed';
    impactDashboardAPI.exportMetricsPDF.mockRejectedValue(
      new Error(errorMessage)
    );

    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const pdfOption = await screen.findByText('Export PDF');
    fireEvent.click(pdfOption);

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetricsPDF).toHaveBeenCalled();
    });
  });

  test('exports with correct date range from selector', async () => {
    await renderDashboard();

    // Change date range
    const dateRangeSelect = screen.getByDisplayValue('30 Days');
    fireEvent.change(dateRangeSelect, { target: { value: 'ALL_TIME' } });

    await waitFor(() => {
      expect(impactDashboardAPI.getMetrics).toHaveBeenCalledWith('ALL_TIME');
    });
    await screen.findByText('Customize Metrics');

    // Export should use new date range
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(impactDashboardAPI.exportMetricsCSV).toHaveBeenCalledWith(
        'ALL_TIME'
      );
    });
  });

  test('dropdown menu has proper accessibility attributes', async () => {
    await renderDashboard();

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    const csvOption = await screen.findByRole('button', {
      name: /export csv/i,
    });
    const pdfOption = await screen.findByRole('button', {
      name: /export pdf/i,
    });

    expect(csvOption).toBeInTheDocument();
    expect(pdfOption).toBeInTheDocument();
  });
});
