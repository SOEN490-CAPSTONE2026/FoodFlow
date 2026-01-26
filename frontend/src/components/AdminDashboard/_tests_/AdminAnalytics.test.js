import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAnalytics from '../AdminAnalytics';
import { surplusAPI } from '../../../services/api';

// Mock the API module
jest.mock('../../../services/api', () => ({
  surplusAPI: {
    list: jest.fn(),
  },
}));

// Mock the constants module
jest.mock('../../../constants/foodConstants', () => ({
  getTemperatureCategoryLabel: jest.fn(category => category),
  getPackagingTypeLabel: jest.fn(type => type),
}));

describe('AdminAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Analytics heading', async () => {
    surplusAPI.list.mockResolvedValue({ data: [] });

    render(<AdminAnalytics />);

    expect(
      screen.getByRole('heading', { name: /Food Safety Compliance Analytics/i })
    ).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    surplusAPI.list.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AdminAnalytics />);

    expect(screen.getByText(/Loading compliance data/i)).toBeInTheDocument();
  });

  test('displays error message when API fails', async () => {
    surplusAPI.list.mockRejectedValue(new Error('API Error'));

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load compliance data/i)
      ).toBeInTheDocument();
    });
  });

  test('displays analytics data when loaded successfully', async () => {
    const mockData = [
      { temperatureCategory: 'FROZEN', packagingType: 'SEALED' },
      { temperatureCategory: 'COLD', packagingType: 'SEALED' },
      { temperatureCategory: 'FROZEN', packagingType: 'OPEN' },
    ];

    surplusAPI.list.mockResolvedValue({ data: mockData });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText(/Total donations analyzed:/i)
      ).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
