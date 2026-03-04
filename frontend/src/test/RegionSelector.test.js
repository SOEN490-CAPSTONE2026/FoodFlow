import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegionSelector from '../components/RegionSelector';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

global.fetch = jest.fn();
const mockGeolocation = { getCurrentPosition: jest.fn() };
global.navigator.geolocation = mockGeolocation;

describe('RegionSelector', () => {
  const mockOnChange = jest.fn();
  const mockCountriesData = [
    { name: { common: 'Canada' }, cca2: 'CA', timezones: ['America/Toronto', 'America/Vancouver'] },
    { name: { common: 'United States' }, cca2: 'US', timezones: ['America/New_York'] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({ json: async () => mockCountriesData });
  });

  test('renders loading key initially', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    expect(screen.getByText('regionSelector.loadingCountries')).toBeInTheDocument();
  });

  test('opens country dropdown with key placeholder', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('regionSelector.loadingCountries')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('regionSelector.selectCountry'));
    expect(screen.getByPlaceholderText('regionSelector.searchCountries')).toBeInTheDocument();
  });

  test('shows detect location key button', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    expect(screen.getByText('regionSelector.autoDetect')).toBeInTheDocument();
  });
});
