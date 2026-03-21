import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltersPanel from '../FiltersPanel';

jest.mock('react-datepicker', () => {
  return ({ selected, onChange, placeholderText, className }) => (
    <input
      data-testid="date-picker"
      type="text"
      placeholder={placeholderText}
      className={className}
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={e => onChange(e.target.value ? new Date(e.target.value) : null)}
    />
  );
});

const mockGetPlace = jest.fn();
const mockAutocomplete = { getPlace: mockGetPlace };

jest.mock('@react-google-maps/api', () => {
  const MockReact = require('react');
  return {
    Autocomplete: ({ children, onLoad, onPlaceChanged }) => {
      MockReact.useEffect(() => {
        if (onLoad) {
          onLoad(mockAutocomplete);
        }
      }, [onLoad]);
      return MockReact.createElement(
        'div',
        { 'data-testid': 'autocomplete-wrapper' },
        MockReact.cloneElement(children, { onFocus: onPlaceChanged })
      );
    },
  };
});

jest.mock('../Receiver_Styles/FiltersPanel.css', () => ({}));

describe('FiltersPanel', () => {
  const accountLocation = {
    lat: 45.5017,
    lng: -73.5673,
    address: '123 Main St, Montreal, QC',
  };

  const defaultProps = {
    filters: {
      foodType: [],
      expiryBefore: '',
      distance: 10,
      location: accountLocation.address,
      locationCoords: accountLocation,
      locationSource: 'account',
    },
    onFiltersChange: jest.fn(),
    onApplyFilters: jest.fn(),
    appliedFilters: {},
    onClearFilters: jest.fn(),
    isVisible: true,
    onClose: jest.fn(),
    accountLocation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders three primary filters without standalone location field', () => {
    render(<FiltersPanel {...defaultProps} />);
    expect(screen.getByText('Food Type')).toBeInTheDocument();
    expect(screen.getByText('Best before')).toBeInTheDocument();
    expect(screen.getByText('Distance:')).toBeInTheDocument();
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Enter location...')
    ).not.toBeInTheDocument();
  });

  test('shows account address summary and override button', () => {
    render(<FiltersPanel {...defaultProps} />);
    expect(screen.getByText('Using address:')).toBeInTheDocument();
    expect(screen.getByText(accountLocation.address)).toBeInTheDocument();
    expect(screen.getByText('Use another address')).toBeInTheDocument();
  });

  test('opens location editor and handles place selection', () => {
    render(<FiltersPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Use another address'));

    mockGetPlace.mockReturnValue({
      formatted_address: '456 Broadway, New York, NY',
      place_id: 'test-place-id',
      address_components: [{ long_name: 'New York' }],
      geometry: {
        location: {
          lat: () => 40.7128,
          lng: () => -74.006,
        },
      },
    });

    const input = screen.getByPlaceholderText('Search another address...');
    fireEvent.focus(input);

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'location',
      '456 Broadway, New York, NY'
    );
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'locationSource',
      'manual'
    );
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'locationCoords',
      expect.objectContaining({
        lat: 40.7128,
        lng: -74.006,
        address: '456 Broadway, New York, NY',
        placeId: 'test-place-id',
      })
    );
  });

  test('shows use account address button for non-account source and resets location', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        location: 'Current location',
        locationSource: 'current',
      },
    };

    render(<FiltersPanel {...props} />);
    const useAccountBtn = screen.getByText('Use account address');
    fireEvent.click(useAccountBtn);

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'location',
      accountLocation.address
    );
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'locationCoords',
      accountLocation
    );
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
      'locationSource',
      'account'
    );
  });

  test('hides location tag when applied location source is account', () => {
    const props = {
      ...defaultProps,
      appliedFilters: {
        location: accountLocation.address,
        locationSource: 'account',
      },
    };
    render(<FiltersPanel {...props} />);
    expect(screen.queryByText(/Near:/)).not.toBeInTheDocument();
  });

  test('shows location tag when applied location source is manual', () => {
    const props = {
      ...defaultProps,
      appliedFilters: {
        location: 'Miami, FL',
        locationSource: 'manual',
      },
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Near: Miami, FL')).toBeInTheDocument();
  });

  test('still triggers apply and clear actions', () => {
    render(<FiltersPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Apply Filters'));
    fireEvent.click(screen.getByText('Clear All'));

    expect(defaultProps.onApplyFilters).toHaveBeenCalled();
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });
});
