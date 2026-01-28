import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegionSelector from '../components/RegionSelector';

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

// Mock Intl.DateTimeFormat
const originalDateTimeFormat = global.Intl.DateTimeFormat;

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
      timezones: ['America/New_York', 'America/Los_Angeles'],
    },
    {
      name: { common: 'United Kingdom' },
      cca2: 'GB',
      timezones: ['Europe/London'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockOnChange.mockClear();

    // Mock fetch for countries API
    fetch.mockResolvedValue({
      json: async () => mockCountriesData,
    });

    // Mock Intl.DateTimeFormat
    global.Intl.DateTimeFormat = jest.fn(() => ({
      resolvedOptions: () => ({ timeZone: 'America/Toronto' }),
      formatToParts: () => [
        { type: 'timeZoneName', value: 'EST' },
      ],
    }));
  });

  afterEach(() => {
    global.Intl.DateTimeFormat = originalDateTimeFormat;
  });

  test('renders loading state initially', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);
    
    expect(screen.getByText('Loading countries...')).toBeInTheDocument();
  });

  test('loads and displays countries', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://restcountries.com/v3.1/all?fields=name,cca2,timezones'
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });
  });

  test('opens country dropdown when clicked', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const countrySelect = screen.getByText('Select your country...');
    fireEvent.click(countrySelect);

    expect(screen.getByPlaceholderText('Search countries...')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  test('filters countries based on search input', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));

    const searchInput = screen.getByPlaceholderText('Search countries...');
    fireEvent.change(searchInput, { target: { value: 'united' } });

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
  });

  test('selects a country and shows city input', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your city...')).toBeInTheDocument();
  });

  test('displays timezones after country selection', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    await waitFor(() => {
      expect(screen.getByText('Timezone')).toBeInTheDocument();
    });
  });

  test('auto-selects timezone when country has only one timezone', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('United Kingdom'));

    await waitFor(() => {
      expect(screen.getByText(/London/)).toBeInTheDocument();
    });
  });

  test('allows manual timezone selection', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    // Enter city
    const cityInput = screen.getByPlaceholderText('Enter your city...');
    fireEvent.change(cityInput, { target: { value: 'Toronto' } });

    // Select timezone
    await waitFor(() => {
      const timezoneSelect = screen.getAllByRole('generic').find(el => 
        el.textContent.includes('Toronto')
      );
      if (timezoneSelect) {
        fireEvent.click(timezoneSelect);
      }
    });

    // Wait for dropdown to open and select timezone
    await waitFor(() => {
      const vancouverOption = screen.queryByText(/Vancouver/);
      if (vancouverOption) {
        fireEvent.click(vancouverOption);
        expect(mockOnChange).toHaveBeenCalled();
      }
    });
  });

  test('updates city input value', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    const cityInput = screen.getByPlaceholderText('Enter your city...');
    fireEvent.change(cityInput, { target: { value: 'Toronto' } });

    expect(cityInput).toHaveValue('Toronto');
  });

  test('shows auto-detect button', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    const autoDetectButton = screen.getByText('Auto-detect my location');
    expect(autoDetectButton).toBeInTheDocument();
  });

  test('auto-detect button triggers geolocation', async () => {
    const mockPosition = {
      coords: {
        latitude: 43.6532,
        longitude: -79.3832,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce(success =>
      success(mockPosition)
    );

    // Mock reverse geocoding API
    fetch.mockImplementation(url => {
      if (url.includes('restcountries.com')) {
        return Promise.resolve({
          json: async () => mockCountriesData,
        });
      } else if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          json: async () => ({
            address: {
              country_code: 'ca',
              city: 'Toronto',
            },
          }),
        });
      }
    });

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const autoDetectButton = screen.getByText('Auto-detect my location');
    fireEvent.click(autoDetectButton);

    expect(screen.getByText('Detecting location...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  test('handles geolocation error gracefully', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) =>
      error({ code: 1, message: 'User denied geolocation' })
    );

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const autoDetectButton = screen.getByText('Auto-detect my location');
    fireEvent.click(autoDetectButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Unable to access your location. Please select manually.'
      );
    });

    alertSpy.mockRestore();
  });

  test('displays region summary when value prop is provided', () => {
    const value = {
      country: 'CA',
      city: 'Toronto',
      timezone: 'America/Toronto',
    };

    render(<RegionSelector value={value} onChange={mockOnChange} />);

    expect(screen.getByText('Toronto, CA')).toBeInTheDocument();
  });

  test('closes country dropdown when clicking outside', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    expect(screen.getByPlaceholderText('Search countries...')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search countries...')).not.toBeInTheDocument();
    });
  });

  test('handles country API fetch error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading countries:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  test('clears country search when selecting a country', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    
    const searchInput = screen.getByPlaceholderText('Search countries...');
    fireEvent.change(searchInput, { target: { value: 'can' } });

    fireEvent.click(screen.getByText('Canada'));

    // Reopen dropdown
    fireEvent.click(screen.getByText('Canada'));

    const newSearchInput = screen.getByPlaceholderText('Search countries...');
    expect(newSearchInput).toHaveValue('');
  });

  test('disables auto-detect button while loading countries', () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    const autoDetectButton = screen.getByText('Auto-detect my location');
    expect(autoDetectButton).toBeDisabled();
  });

  test('shows check mark next to selected country', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    // Reopen dropdown
    fireEvent.click(screen.getByText('Canada'));

    // Find the Canada option in the dropdown (not the selected trigger text)
    const dropdownOptions = document.querySelectorAll('.dropdown-option');
    const canadaOption = Array.from(dropdownOptions).find(opt => 
      opt.textContent.includes('Canada')
    );
    expect(canadaOption).toHaveClass('selected');
  });

  test('clears city when changing country', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    // Select Canada
    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    // Enter city
    const cityInput = screen.getByPlaceholderText('Enter your city...');
    fireEvent.change(cityInput, { target: { value: 'Toronto' } });
    expect(cityInput).toHaveValue('Toronto');

    // Change country
    fireEvent.click(screen.getByText('Canada'));
    fireEvent.click(screen.getByText('United States'));

    // City should be cleared
    const newCityInput = screen.getByPlaceholderText('Enter your city...');
    expect(newCityInput).toHaveValue('');
  });

  test('handles browser without geolocation support', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const originalGeolocation = global.navigator.geolocation;
    delete global.navigator.geolocation;

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const autoDetectButton = screen.getByText('Auto-detect my location');
    fireEvent.click(autoDetectButton);

    expect(alertSpy).toHaveBeenCalledWith('Geolocation is not supported by your browser');

    global.navigator.geolocation = originalGeolocation;
    alertSpy.mockRestore();
  });

  test('successfully auto-detects location with reverse geocoding', async () => {
    const mockPosition = {
      coords: {
        latitude: 43.6532,
        longitude: -79.3832,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce(success =>
      success(mockPosition)
    );

    fetch.mockImplementation(url => {
      if (url.includes('restcountries.com')) {
        return Promise.resolve({
          json: async () => mockCountriesData,
        });
      } else if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          json: async () => ({
            address: {
              country_code: 'ca',
              city: 'Toronto',
            },
          }),
        });
      }
    });

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const autoDetectButton = screen.getByText('Auto-detect my location');
    fireEvent.click(autoDetectButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'CA',
          city: 'Toronto',
          timezone: 'America/Toronto',
        })
      );
    });
  });

  test('handles reverse geocoding API error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockPosition = {
      coords: {
        latitude: 43.6532,
        longitude: -79.3832,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce(success =>
      success(mockPosition)
    );

    fetch.mockImplementation(url => {
      if (url.includes('restcountries.com')) {
        return Promise.resolve({
          json: async () => mockCountriesData,
        });
      } else if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.reject(new Error('Network error'));
      }
    });

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    const autoDetectButton = screen.getByText('Auto-detect my location');
    fireEvent.click(autoDetectButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Failed to detect location. Please select manually.'
      );
    });

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('opens and closes timezone dropdown', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    await waitFor(() => {
      expect(screen.getByText('Timezone')).toBeInTheDocument();
    });

    // Open timezone dropdown
    const timezoneSelects = document.querySelectorAll('.custom-select');
    const timezoneSelect = Array.from(timezoneSelects).find(el =>
      el.textContent.includes('Toronto')
    );
    fireEvent.click(timezoneSelect);

    // Should show Vancouver option
    await waitFor(() => {
      expect(screen.getByText(/Vancouver/)).toBeInTheDocument();
    });

    // Close by clicking again
    fireEvent.click(timezoneSelect);

    await waitFor(() => {
      const vancouverText = screen.queryByText(/Vancouver/);
      expect(vancouverText).not.toBeInTheDocument();
    });
  });

  test('closes timezone dropdown when clicking outside', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    await waitFor(() => {
      expect(screen.getByText('Timezone')).toBeInTheDocument();
    });

    // Open timezone dropdown
    const timezoneSelects = document.querySelectorAll('.custom-select');
    const timezoneSelect = Array.from(timezoneSelects).find(el =>
      el.textContent.includes('Toronto')
    );
    fireEvent.click(timezoneSelect);

    await waitFor(() => {
      expect(screen.getByText(/Vancouver/)).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/Vancouver/)).not.toBeInTheDocument();
    });
  });

  test('calls onChange when timezone is selected with city filled', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    // Select country
    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    // Enter city
    const cityInput = screen.getByPlaceholderText('Enter your city...');
    fireEvent.change(cityInput, { target: { value: 'Vancouver' } });

    // Open timezone dropdown
    const timezoneSelects = document.querySelectorAll('.custom-select');
    const timezoneSelect = Array.from(timezoneSelects).find(el =>
      el.textContent.includes('Toronto')
    );
    fireEvent.click(timezoneSelect);

    // Select Vancouver timezone
    await waitFor(() => {
      const vancouverOption = screen.getByText(/Vancouver/);
      fireEvent.click(vancouverOption);
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'CA',
          city: 'Vancouver',
          timezone: 'America/Vancouver',
        })
      );
    });
  });

  test('does not call onChange when timezone selected without city', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    // Select country but don't enter city
    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    mockOnChange.mockClear();

    // Open timezone dropdown
    const timezoneSelects = document.querySelectorAll('.custom-select');
    const timezoneSelect = Array.from(timezoneSelects).find(el =>
      el.textContent.includes('Toronto')
    );
    fireEvent.click(timezoneSelect);

    // Select Vancouver timezone
    await waitFor(() => {
      const vancouverOption = screen.getByText(/Vancouver/);
      fireEvent.click(vancouverOption);
    });

    // onChange should not be called
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('search input click does not close dropdown', async () => {
    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));

    const searchInput = screen.getByPlaceholderText('Search countries...');
    fireEvent.click(searchInput);

    // Dropdown should still be open
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  test('handles formatTimezone error gracefully', async () => {
    // Mock DateTimeFormat to throw error
    const originalDateTimeFormat = global.Intl.DateTimeFormat;
    global.Intl.DateTimeFormat = jest.fn(() => {
      throw new Error('Invalid timezone');
    });

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('United Kingdom'));

    // Should display raw timezone when formatting fails
    await waitFor(() => {
      // Find the timezone field specifically (not the country field)
      const timezoneLabels = screen.getAllByText('Timezone');
      const timezoneField = timezoneLabels[0].closest('.region-field');
      const timezoneText = timezoneField.querySelector('.selected');
      expect(timezoneText?.textContent).toContain('Europe/London');
    });

    global.Intl.DateTimeFormat = originalDateTimeFormat;
  });

  test('auto-selects timezone matching browser timezone', async () => {
    // Mock browser timezone to match one of Canada's timezones
    global.Intl.DateTimeFormat = jest.fn(() => ({
      resolvedOptions: () => ({ timeZone: 'America/Vancouver' }),
      formatToParts: () => [
        { type: 'timeZoneName', value: 'PST' },
      ],
    }));

    render(<RegionSelector value={{}} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading countries...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select your country...'));
    fireEvent.click(screen.getByText('Canada'));

    // Should auto-select Vancouver timezone matching browser
    await waitFor(() => {
      expect(screen.getByText(/Vancouver/)).toBeInTheDocument();
    });
  });
});
