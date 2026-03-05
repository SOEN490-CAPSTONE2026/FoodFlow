import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAnalytics from '../AdminAnalytics';
import { surplusAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../../../services/api', () => ({
  surplusAPI: { list: jest.fn() },
}));

jest.mock('../../../constants/foodConstants', () => ({
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
});
