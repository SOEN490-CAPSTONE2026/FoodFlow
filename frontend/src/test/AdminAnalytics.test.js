import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAnalytics from '../components/AdminDashboard/AdminAnalytics';
import { surplusAPI } from '../services/api';

const mockT = key => key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('../services/api', () => ({
  surplusAPI: { list: jest.fn() },
}));

jest.mock('../constants/foodConstants', () => ({
  getTemperatureCategoryLabel: jest.fn(category => category),
  getPackagingTypeLabel: jest.fn(type => type),
}));

describe('AdminAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders key-based title', async () => {
    surplusAPI.list.mockResolvedValue({ data: [] });
    render(<AdminAnalytics />);
    expect(screen.getByText('adminAnalytics.title')).toBeInTheDocument();
  });

  test('renders loading and error keys', async () => {
    surplusAPI.list.mockImplementation(() => new Promise(() => {}));
    render(<AdminAnalytics />);
    expect(screen.getByText('adminAnalytics.loading')).toBeInTheDocument();
  });

  test('renders data summary key when loaded', async () => {
    surplusAPI.list.mockResolvedValue({
      data: [{ temperatureCategory: 'FROZEN', packagingType: 'SEALED' }],
    });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText('adminAnalytics.totalAnalyzed')
      ).toBeInTheDocument();
    });
  });

  test('renders translated distribution rows with sorted counts', async () => {
    surplusAPI.list.mockResolvedValue({
      data: [
        { temperatureCategory: 'COLD', packagingType: 'BOX' },
        { temperatureCategory: 'FROZEN', packagingType: 'BAG' },
        { temperatureCategory: 'FROZEN', packagingType: 'BOX' },
      ],
    });

    const { container } = render(<AdminAnalytics />);

    await screen.findByText('adminAnalytics.totalAnalyzed');

    const categoryCounts = Array.from(
      container.querySelectorAll('.category-count')
    ).map(node => node.textContent);
    expect(categoryCounts).toEqual(
      expect.arrayContaining(['2 (66.7%)', '1 (33.3%)'])
    );
    expect(container.querySelectorAll('.bar-fill.temperature')).toHaveLength(2);
    expect(container.querySelectorAll('.bar-fill.packaging')).toHaveLength(2);
  });

  test('renders explicit error state when fetch fails', async () => {
    surplusAPI.list.mockRejectedValueOnce(new Error('fail'));
    render(<AdminAnalytics />);

    expect(
      await screen.findByText('adminAnalytics.errors.loadFailed')
    ).toBeInTheDocument();
  });

  test('renders no-data placeholders when categories are missing', async () => {
    surplusAPI.list.mockResolvedValue({
      data: [{ title: 'Untyped post' }],
    });
    render(<AdminAnalytics />);

    expect(
      await screen.findByText('adminAnalytics.noTemperatureData')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminAnalytics.noPackagingData')
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
