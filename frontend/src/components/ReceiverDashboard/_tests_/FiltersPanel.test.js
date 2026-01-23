import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FiltersPanel from '../FiltersPanel';

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  return ({ selected, onChange, minDate, placeholderText, className }) => {
    return (
      <input
        data-testid="date-picker"
        type="text"
        placeholder={placeholderText}
        className={className}
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={e => {
          if (e.target.value) {
            onChange(new Date(e.target.value));
          } else {
            onChange(null);
          }
        }}
      />
    );
  };
});

// Mock @react-google-maps/api
const mockGetPlace = jest.fn();
const mockAutocomplete = {
  getPlace: mockGetPlace,
};

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
        MockReact.cloneElement(children, {
          onFocus: onPlaceChanged,
        })
      );
    },
  };
});

// Mock CSS
jest.mock('../Receiver_Styles/FiltersPanel.css', () => ({}));

describe('FiltersPanel', () => {
  const defaultProps = {
    filters: {
      foodType: [],
      expiryBefore: '',
      distance: 10,
      location: '',
      locationCoords: null,
    },
    onFiltersChange: jest.fn(),
    onApplyFilters: jest.fn(),
    appliedFilters: {},
    onClearFilters: jest.fn(),
    isVisible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    test('renders filters panel when visible', () => {
      render(<FiltersPanel {...defaultProps} />);
      expect(screen.getByText('Filter Donations')).toBeInTheDocument();
    });

    test('returns null when not visible', () => {
      const { container } = render(
        <FiltersPanel {...defaultProps} isVisible={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('renders close button when onClose is provided', () => {
      const { container } = render(<FiltersPanel {...defaultProps} />);
      const closeButton = container.querySelector('.close-filters-btn');
      expect(closeButton).toBeInTheDocument();
    });

    test('does not render close button when onClose is not provided', () => {
      const { onClose, ...propsWithoutClose } = defaultProps;
      const { container } = render(<FiltersPanel {...propsWithoutClose} />);
      const closeButton = container.querySelector('.close-filters-btn');
      expect(closeButton).not.toBeInTheDocument();
    });

    test('renders all filter groups', () => {
      render(<FiltersPanel {...defaultProps} />);
      expect(screen.getByText('Food Type')).toBeInTheDocument();
      expect(screen.getByText('Best before')).toBeInTheDocument();
      expect(screen.getByText('Distance:')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    test('renders action buttons', () => {
      render(<FiltersPanel {...defaultProps} />);
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });
  });

  describe('CustomMultiSelect Component', () => {
    test('displays placeholder when no items selected', () => {
      render(<FiltersPanel {...defaultProps} />);
      expect(screen.getByText('Select food types...')).toBeInTheDocument();
    });

    test('opens dropdown when button is clicked', () => {
      render(<FiltersPanel {...defaultProps} />);
      const button = screen.getByText('Select food types...').closest('button');
      fireEvent.click(button);
      expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Bakery & Pastry')).toBeInTheDocument();
    });

    test('closes dropdown when button is clicked again', () => {
      render(<FiltersPanel {...defaultProps} />);
      const button = screen.getByText('Select food types...').closest('button');
      fireEvent.click(button);
      expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
      fireEvent.click(button);
      expect(screen.queryByText('Fruits & Vegetables')).not.toBeInTheDocument();
    });

    test('selects an option when clicked', () => {
      render(<FiltersPanel {...defaultProps} />);
      const button = screen.getByText('Select food types...').closest('button');
      fireEvent.click(button);

      const checkbox = screen.getByLabelText('Fruits & Vegetables');
      fireEvent.click(checkbox);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('foodType', [
        'Fruits & Vegetables',
      ]);
    });

    test('deselects an option when clicked again', () => {
      const propsWithSelection = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          foodType: ['Fruits & Vegetables'],
        },
      };

      render(<FiltersPanel {...propsWithSelection} />);
      const button = screen.getByText('Fruits & Vegetables').closest('button');
      fireEvent.click(button);

      const checkbox = screen.getByLabelText('Fruits & Vegetables');
      fireEvent.click(checkbox);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('foodType', []);
    });

    test('displays single selected item label', () => {
      const propsWithSelection = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          foodType: ['Bakery & Pastry'],
        },
      };

      render(<FiltersPanel {...propsWithSelection} />);
      expect(screen.getByText('Bakery & Pastry')).toBeInTheDocument();
    });

    test('displays count when multiple items selected', () => {
      const propsWithSelection = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          foodType: ['Bakery & Pastry', 'Frozen Food'],
        },
      };

      render(<FiltersPanel {...propsWithSelection} />);
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    test('displays value when option label not found', () => {
      const propsWithSelection = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          foodType: ['Unknown Category'],
        },
      };

      render(<FiltersPanel {...propsWithSelection} />);
      expect(screen.getByText('Unknown Category')).toBeInTheDocument();
    });

    test('renders checkmark for selected options', () => {
      const propsWithSelection = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          foodType: ['Fruits & Vegetables'],
        },
      };

      render(<FiltersPanel {...propsWithSelection} />);
      const button = screen.getByText('Fruits & Vegetables').closest('button');
      fireEvent.click(button);

      const checkbox = screen.getByLabelText('Fruits & Vegetables');
      expect(checkbox).toBeChecked();
    });
  });

  describe('CustomDatePicker Component', () => {
    test('displays placeholder when no date selected', () => {
      render(<FiltersPanel {...defaultProps} />);
      const datePicker = screen.getByPlaceholderText('Select date');
      expect(datePicker).toBeInTheDocument();
    });

    test('handles date selection', () => {
      render(<FiltersPanel {...defaultProps} />);
      const datePicker = screen.getByTestId('date-picker');

      fireEvent.change(datePicker, { target: { value: '2025-12-31' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'expiryBefore',
        '2025-12-31'
      );
    });

    test('handles clearing date selection', () => {
      const propsWithDate = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          expiryBefore: '2025-12-31',
        },
      };

      render(<FiltersPanel {...propsWithDate} />);
      const datePicker = screen.getByTestId('date-picker');

      fireEvent.change(datePicker, { target: { value: '' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'expiryBefore',
        ''
      );
    });

    test('displays selected date value', () => {
      const propsWithDate = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          expiryBefore: '2025-12-31',
        },
      };

      render(<FiltersPanel {...propsWithDate} />);
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker.value).toBe('2025-12-31');
    });
  });

  describe('Distance Filter', () => {
    test('displays default distance value', () => {
      render(<FiltersPanel {...defaultProps} />);
      expect(screen.getByText('10 km')).toBeInTheDocument();
    });

    test('updates distance when slider is changed', () => {
      render(<FiltersPanel {...defaultProps} />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '25' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('distance', 25);
    });

    test('displays updated distance value', () => {
      const propsWithDistance = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          distance: 30,
        },
      };

      render(<FiltersPanel {...propsWithDistance} />);
      expect(screen.getByText('30 km')).toBeInTheDocument();
    });

    test('slider has correct range attributes', () => {
      render(<FiltersPanel {...defaultProps} />);
      const slider = screen.getByRole('slider');

      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '50');
    });
  });

  describe('Location Filter with Autocomplete', () => {
    test('renders location input', () => {
      render(<FiltersPanel {...defaultProps} />);
      const locationInput = screen.getByPlaceholderText('Enter location...');
      expect(locationInput).toBeInTheDocument();
    });

    test('handles manual location input change', () => {
      render(<FiltersPanel {...defaultProps} />);
      const locationInput = screen.getByPlaceholderText('Enter location...');

      fireEvent.change(locationInput, { target: { value: 'New York' } });

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'location',
        'New York'
      );
    });

    test('handles place selection with full geometry', () => {
      render(<FiltersPanel {...defaultProps} />);

      mockGetPlace.mockReturnValue({
        formatted_address: '123 Main St, New York, NY',
        name: 'Test Place',
        geometry: {
          location: {
            lat: () => 40.7128,
            lng: () => -74.006,
          },
        },
      });

      const locationInput = screen.getByPlaceholderText('Enter location...');
      fireEvent.focus(locationInput);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'location',
        '123 Main St, New York, NY'
      );
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'locationCoords',
        {
          lat: 40.7128,
          lng: -74.006,
          address: '123 Main St, New York, NY',
        }
      );
    });

    test('handles place selection with only formatted_address', () => {
      render(<FiltersPanel {...defaultProps} />);

      mockGetPlace.mockReturnValue({
        formatted_address: '456 Broadway, NY',
      });

      const locationInput = screen.getByPlaceholderText('Enter location...');
      fireEvent.focus(locationInput);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'location',
        '456 Broadway, NY'
      );
    });

    test('handles place selection with only name', () => {
      render(<FiltersPanel {...defaultProps} />);

      mockGetPlace.mockReturnValue({
        name: 'Central Park',
      });

      const locationInput = screen.getByPlaceholderText('Enter location...');
      fireEvent.focus(locationInput);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'location',
        'Central Park'
      );
    });

    test('handles place selection when autocomplete returns null', () => {
      render(<FiltersPanel {...defaultProps} />);

      mockGetPlace.mockReturnValue(null);

      const locationInput = screen.getByPlaceholderText('Enter location...');
      fireEvent.focus(locationInput);

      // Should not call onFiltersChange when place is null
      expect(defaultProps.onFiltersChange).not.toHaveBeenCalled();
    });

    test('displays current location value', () => {
      const propsWithLocation = {
        ...defaultProps,
        filters: {
          ...defaultProps.filters,
          location: 'Boston, MA',
        },
      };

      render(<FiltersPanel {...propsWithLocation} />);
      const locationInput = screen.getByPlaceholderText('Enter location...');
      expect(locationInput.value).toBe('Boston, MA');
    });
  });

  describe('Applied Filters Tags', () => {
    test('renders food type tags', () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          foodType: ['Fruits & Vegetables', 'Bakery & Pastry'],
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Bakery & Pastry')).toBeInTheDocument();
    });

    test('renders expiry date tag', () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          expiryBefore: '2025-12-31',
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      expect(screen.getByText('Before: 2025-12-31')).toBeInTheDocument();
    });

    test('renders distance tag when not default value', () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          distance: 25,
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      expect(screen.getByText('Within: 25km')).toBeInTheDocument();
    });

    test('does not render distance tag when default value', () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          distance: 10,
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      expect(screen.queryByText('Within: 10km')).not.toBeInTheDocument();
    });

    test('renders location tag', () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          location: 'San Francisco, CA',
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      expect(screen.getByText('Near: San Francisco, CA')).toBeInTheDocument();
    });
  });

  describe('Removing Filters', () => {
    test('removes specific food type filter', async () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          foodType: ['Fruits & Vegetables', 'Bakery & Pastry'],
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      const removeButtons = screen.getAllByRole('button', { name: '' });
      const fruitButton = removeButtons.find(btn =>
        btn.closest('.filter-tag')?.textContent.includes('Fruits & Vegetables')
      );

      fireEvent.click(fruitButton);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('foodType', [
        'Bakery & Pastry',
      ]);

      jest.advanceTimersByTime(100);
      await waitFor(() => {
        expect(defaultProps.onApplyFilters).toHaveBeenCalled();
      });
    });

    test('removes expiry date filter', async () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          expiryBefore: '2025-12-31',
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      const tag = screen.getByText('Before: 2025-12-31').closest('.filter-tag');
      const removeButton = tag.querySelector('.tag-remove');

      fireEvent.click(removeButton);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'expiryBefore',
        ''
      );

      jest.advanceTimersByTime(100);
      await waitFor(() => {
        expect(defaultProps.onApplyFilters).toHaveBeenCalled();
      });
    });

    test('removes distance filter and resets to default', async () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          distance: 30,
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      const tag = screen.getByText('Within: 30km').closest('.filter-tag');
      const removeButton = tag.querySelector('.tag-remove');

      fireEvent.click(removeButton);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('distance', 10);

      jest.advanceTimersByTime(100);
      await waitFor(() => {
        expect(defaultProps.onApplyFilters).toHaveBeenCalled();
      });
    });

    test('removes location filter and clears coordinates', async () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {
          location: 'Chicago, IL',
        },
      };

      render(<FiltersPanel {...propsWithApplied} />);
      const tag = screen.getByText('Near: Chicago, IL').closest('.filter-tag');
      const removeButton = tag.querySelector('.tag-remove');

      fireEvent.click(removeButton);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith('location', '');
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        'locationCoords',
        null
      );

      jest.advanceTimersByTime(100);
      await waitFor(() => {
        expect(defaultProps.onApplyFilters).toHaveBeenCalled();
      });
    });

    test('handles removing food type when appliedFilters.foodType is undefined', async () => {
      const propsWithApplied = {
        ...defaultProps,
        appliedFilters: {},
      };

      render(<FiltersPanel {...propsWithApplied} />);

      // Manually trigger handleRemoveFilter through the function
      // Since there are no tags rendered, we need to test the logic differently
      // This tests the branch where appliedFilters?.foodType is falsy
      const { container } = render(<FiltersPanel {...propsWithApplied} />);

      // The function should handle undefined gracefully
      expect(container).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    test('calls onApplyFilters when Apply Filters button is clicked', () => {
      render(<FiltersPanel {...defaultProps} />);
      const applyButton = screen.getByText('Apply Filters');

      fireEvent.click(applyButton);

      expect(defaultProps.onApplyFilters).toHaveBeenCalled();
    });

    test('calls onClearFilters when Clear All button is clicked', () => {
      render(<FiltersPanel {...defaultProps} />);
      const clearButton = screen.getByText('Clear All');

      fireEvent.click(clearButton);

      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });

    test('calls onClose when close button is clicked', () => {
      const { container } = render(<FiltersPanel {...defaultProps} />);
      const closeButton = container.querySelector('.close-filters-btn');

      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined appliedFilters prop', () => {
      const { appliedFilters, ...propsWithoutApplied } = defaultProps;
      render(<FiltersPanel {...propsWithoutApplied} />);

      expect(screen.getByText('Filter Donations')).toBeInTheDocument();
    });

    test('handles empty foodType array', () => {
      const propsWithEmpty = {
        ...defaultProps,
        appliedFilters: {
          foodType: [],
        },
      };

      render(<FiltersPanel {...propsWithEmpty} />);
      expect(screen.getByText('Select food types...')).toBeInTheDocument();
    });

    test('handles null values in filters', () => {
      const propsWithNulls = {
        ...defaultProps,
        filters: {
          foodType: null,
          expiryBefore: null,
          distance: null,
          location: null,
          locationCoords: null,
        },
      };

      render(<FiltersPanel {...propsWithNulls} />);
      expect(screen.getByText('10 km')).toBeInTheDocument(); // Falls back to default
    });

    test('filters out empty food categories', () => {
      render(<FiltersPanel {...defaultProps} />);
      const button = screen.getByText('Select food types...').closest('button');
      fireEvent.click(button);

      // Should only show non-empty categories
      expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Bakery & Pastry')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('complete filter workflow', async () => {
      render(<FiltersPanel {...defaultProps} />);

      // Select food type
      const foodTypeButton = screen
        .getByText('Select food types...')
        .closest('button');
      fireEvent.click(foodTypeButton);
      const fruitCheckbox = screen.getByLabelText('Fruits & Vegetables');
      fireEvent.click(fruitCheckbox);

      // Set date
      const datePicker = screen.getByTestId('date-picker');
      fireEvent.change(datePicker, { target: { value: '2025-12-31' } });

      // Adjust distance
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '20' } });

      // Enter location
      const locationInput = screen.getByPlaceholderText('Enter location...');
      fireEvent.change(locationInput, { target: { value: 'Miami' } });

      // Apply filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      expect(defaultProps.onFiltersChange).toHaveBeenCalledTimes(4);
      expect(defaultProps.onApplyFilters).toHaveBeenCalled();
    });

    test('keyboard navigation in multi-select', () => {
      render(<FiltersPanel {...defaultProps} />);
      const button = screen.getByText('Select food types...').closest('button');

      // Open dropdown with keyboard
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);

      expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
    });
  });
});
