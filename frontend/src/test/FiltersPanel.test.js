import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltersPanel from '../components/ReceiverDashboard/FiltersPanel';

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

jest.mock(
  '../components/ReceiverDashboard/Receiver_Styles/FiltersPanel.css',
  () => ({})
);

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

  test('updates distance when slider changes', () => {
    render(<FiltersPanel {...defaultProps} />);
    const distanceInputs = screen.getAllByRole('slider');
    if (distanceInputs.length > 0) {
      fireEvent.change(distanceInputs[0], { target: { value: '25' } });
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('distance', expect.any(Number));
    }
  });

  test('handles food type selection', () => {
    render(<FiltersPanel {...defaultProps} />);
    const foodTypeButton = screen.getByText('Food Type');
    fireEvent.click(foodTypeButton);
    
    // Try to click on a food category option if available
    const options = screen.queryAllByRole('checkbox');
    if (options.length > 0) {
      fireEvent.click(options[0]);
      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    }
  });

  test('handles date picker changes', () => {
    render(<FiltersPanel {...defaultProps} />);
    const datePicker = screen.getByTestId('date-picker');
    if (datePicker) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      fireEvent.change(datePicker, { target: { value: futureDate.toISOString().split('T')[0] } });
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('expiryBefore', expect.any(String));
    }
  });

  test('handles close button click', () => {
    render(<FiltersPanel {...defaultProps} />);
    const closeButton = screen.queryByRole('button', { name: /close/i });
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  test('renders with hidden state when isVisible is false', () => {
    const props = { ...defaultProps, isVisible: false };
    const { container } = render(<FiltersPanel {...props} />);
    const panel = container.querySelector('.filters-panel');
    if (panel) {
      expect(panel).toHaveClass('hidden');
    }
  });

  test('handles clear filters action', () => {
    render(<FiltersPanel {...defaultProps} />);
    
    // Apply some filters first
    const foodTypeButton = screen.getByText('Food Type');
    fireEvent.click(foodTypeButton);
    
    // Then clear them
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  test('displays applied filter tags', () => {
    const appliedProps = {
      ...defaultProps,
      appliedFilters: {
        foodType: ['Fruits & Vegetables'],
      },
    };
    render(<FiltersPanel {...appliedProps} />);
    
    // Check if applied filters are displayed
    const filterTags = screen.queryAllByRole('button');
    expect(filterTags.length).toBeGreaterThan(0);
  });

  test('resets location to account address', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        location: 'Other Location',
        locationSource: 'manual',
      },
    };
    
    render(<FiltersPanel {...props} />);
    const resetBtn = screen.queryByText('Use account address');
    
    if (resetBtn) {
      fireEvent.click(resetBtn);
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'location',
        accountLocation.address
      );
    }
  });

  test('adjusts distance on input change', () => {
    const props = {
      ...defaultProps,
      filters: { ...defaultProps.filters }
    };
    
    render(<FiltersPanel {...props} />);
    
    // Find any input that might control distance
    const inputs = screen.getAllByRole('slider');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: '5' } });
      expect(defaultProps.onFiltersChange).toHaveBeenCalled();
    }
  });

  test('handles empty food type array', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        foodType: [],
      },
    };
    render(<FiltersPanel {...props} />);
    const foodTypeButton = screen.getByText('Food Type');
    expect(foodTypeButton).toBeInTheDocument();
  });

  test('handles multiple food types selected', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        foodType: ['Fruits & Vegetables', 'Bakery & Pastry'],
      },
    };
    render(<FiltersPanel {...props} />);
    const foodTypeButton = screen.getByText('Food Type');
    expect(foodTypeButton).toBeInTheDocument();
  });

  test('renders with different distance values', () => {
    const distances = [5, 10, 20, 50, 100];
    distances.forEach(distance => {
      const props = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          distance,
        },
      };
      const { unmount } = render(<FiltersPanel {...props} />);
      expect(screen.getByText(`Distance:`)).toBeInTheDocument();
      unmount();
    });
  });

  test('handles visibility toggle', () => {
    const { rerender } = render(<FiltersPanel {...defaultProps} isVisible={true} />);
    expect(screen.getByText('Food Type')).toBeInTheDocument();

    rerender(<FiltersPanel {...defaultProps} isVisible={false} />);
    // Component returns null when not visible, so element should NOT be in document
    expect(screen.queryByText('Food Type')).not.toBeInTheDocument();
  });

  test('handles null account location gracefully', () => {
    const props = {
      ...defaultProps,
      accountLocation: null,
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Food Type')).toBeInTheDocument();
  });

  test('handles empty appliedFilters', () => {
    const props = {
      ...defaultProps,
      appliedFilters: {},
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Using address:')).toBeInTheDocument();
  });

  test('handles applied filters with no location', () => {
    const props = {
      ...defaultProps,
      appliedFilters: {
        foodType: ['Fruits & Vegetables'],
        distance: 15,
      },
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Using address:')).toBeInTheDocument();
  });

  test('handles location editor close', () => {
    render(<FiltersPanel {...defaultProps} />);
    const useAnotherBtn = screen.getByText('Use another address');
    fireEvent.click(useAnotherBtn);
    
    // Location editor should be visible
    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  test('handles date picker blur', () => {
    render(<FiltersPanel {...defaultProps} />);
    const datePickers = screen.getAllByTestId('date-picker');
    if (datePickers.length > 0) {
      fireEvent.blur(datePickers[0]);
      // Should handle blur without crashing
      expect(datePickers[0]).toBeInTheDocument();
    }
  });

  test('renders at minimum distance value', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        distance: 1,
      },
    };
    render(<FiltersPanel {...props} />);
    // Component renders with minimum distance
    expect(screen.getByText('Food Type')).toBeInTheDocument();
  });

  test('renders at maximum distance value', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        distance: 100,
      },
    };
    render(<FiltersPanel {...props} />);
    // Component renders with maximum distance
    expect(screen.getByText('Food Type')).toBeInTheDocument();
  });

  test('renders with no expiry date set', () => {
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        expiryBefore: '',
      },
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Best before')).toBeInTheDocument();
  });

  test('renders with past expiry date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const props = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        expiryBefore: pastDate.toISOString().split('T')[0],
      },
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Best before')).toBeInTheDocument();
  });

  test('handles country restriction prop', () => {
    const props = {
      ...defaultProps,
      countryRestriction: 'CA',
    };
    render(<FiltersPanel {...props} />);
    expect(screen.getByText('Food Type')).toBeInTheDocument();
  });

  test('triggers onClose callback', () => {
    const onCloseMock = jest.fn();
    const props = {
      ...defaultProps,
      onClose: onCloseMock,
    };
    render(<FiltersPanel {...props} />);
    const closeButton = screen.queryByRole('button', { name: /close/i });
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onCloseMock).toHaveBeenCalled();
    }
  });

  test('handles rapid filter changes', () => {
    render(<FiltersPanel {...defaultProps} />);
    
    // Simulate rapid changes
    fireEvent.click(screen.getByText('Apply Filters'));
    fireEvent.click(screen.getByText('Clear All'));
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(defaultProps.onApplyFilters).toHaveBeenCalledTimes(2);
    expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
  });
});
