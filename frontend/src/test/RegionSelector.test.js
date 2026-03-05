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
global.alert = jest.fn();

describe('RegionSelector', () => {
  const mockOnChange = jest.fn();
  const mockCountriesData = [
    {
      name: { common: 'Canada' },
      cca2: 'CA',
      timezones: ['America/Toronto', 'America/Vancouver'],
    },
    {
      name: { common: 'United States' },
      cca2: 'US',
      timezones: ['America/New_York'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.navigator.geolocation = mockGeolocation;
    fetch.mockResolvedValue({ json: async () => mockCountriesData });
  });

  test('renders loading key initially', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    expect(
      screen.getByText('regionSelector.loadingCountries')
    ).toBeInTheDocument();
  });

  test('opens country dropdown with key placeholder', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(
        screen.queryByText('regionSelector.loadingCountries')
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('regionSelector.selectCountry'));
    expect(
      screen.getByPlaceholderText('regionSelector.searchCountries')
    ).toBeInTheDocument();
  });

  test('shows detect location key button', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    expect(screen.getByText('regionSelector.autoDetect')).toBeInTheDocument();
  });

  test('shows unsupported geolocation alert', async () => {
    const previousGeo = global.navigator.geolocation;
    delete global.navigator.geolocation;

    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    await waitFor(() =>
      expect(
        screen.queryByText('regionSelector.loadingCountries')
      ).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('regionSelector.autoDetect'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'regionSelector.geolocationUnsupported'
      );
    });

    global.navigator.geolocation = previousGeo;
  });

  test('auto-detect location calls onChange with detected data', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(success =>
      success({ coords: { latitude: 45.5, longitude: -73.5 } })
    );
    fetch
      .mockResolvedValueOnce({ json: async () => mockCountriesData })
      .mockResolvedValueOnce({
        json: async () => ({
          address: { country_code: 'ca', city: 'Montreal' },
        }),
      });

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() =>
      expect(
        screen.queryByText('regionSelector.loadingCountries')
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('regionSelector.autoDetect'));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'CA',
          city: 'Montreal',
        })
      );
    });
  });

  test('manual country + city + timezone selection triggers onChange', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() =>
      expect(
        screen.queryByText('regionSelector.loadingCountries')
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('regionSelector.selectCountry'));
    fireEvent.click(screen.getByText('Canada'));

    const cityInput = await screen.findByPlaceholderText(
      'regionSelector.enterCity'
    );
    fireEvent.change(cityInput, { target: { value: 'Toronto' } });

    fireEvent.click(screen.getByText(/Toronto/i));
    fireEvent.click(screen.getByText(/Vancouver/i));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'CA',
          city: 'Toronto',
          timezone: 'America/Vancouver',
        })
      );
    });
  });
});
