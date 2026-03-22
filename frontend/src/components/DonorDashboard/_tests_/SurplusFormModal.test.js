import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurplusFormModal from '../SurplusFormModal';

jest.mock('../../../contexts/TimezoneContext', () => ({
  TimezoneProvider: ({ children }) => children,
  useTimezone: () => ({
    userTimezone: 'America/Toronto',
    isLoading: false,
    updateTimezone: jest.fn(),
    refreshTimezone: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        'surplusForm.title': 'Add New Donation',
        'surplusForm.editTitle': 'Edit Donation',
        'surplusForm.titleLabel': 'Title',
        'surplusForm.titlePlaceholder': 'e.g., Vegetable Lasagna',
        'surplusForm.foodCategoriesLabel': 'Food Categories',
        'surplusForm.foodCategoriesPlaceholder': 'Select categories',
        'surplusForm.temperatureCategoryLabel': 'Temperature Category',
        'surplusForm.temperatureCategoryPlaceholder':
          'Select temperature category',
        'surplusForm.temperatureCategoryHelp':
          'Select the storage temperature for food safety verification',
        'surplusForm.packagingTypeLabel': 'Packaging Type',
        'surplusForm.packagingTypePlaceholder': 'Select packaging type',
        'surplusForm.packagingTypeHelp':
          'Specify how the food is packaged for safety compliance',
        'surplusForm.quantityLabel': 'Quantity',
        'surplusForm.quantityPlaceholder': 'Enter quantity',
        'surplusForm.unitLabel': 'Unit',
        'surplusForm.unitPlaceholder': 'Select unit',
        'surplusForm.fabricationDateLabel': 'Fabrication/Production Date',
        'surplusForm.fabricationDatePlaceholder': 'When was it made?',
        'surplusForm.fabricationDateHelp':
          'System will auto-calculate expiry date based on food type',
        'surplusForm.expiryDateLabel': 'Expiry Date',
        'surplusForm.expiryDatePlaceholder': 'Select expiry date',
        'surplusForm.expiryDateAutoCalculated':
          '(Auto-calculated, you can edit)',
        'surplusForm.expiryDateSuggestion':
          'Suggested expiry: {{date}} (based on food category)',
        'surplusForm.pickupTimeSlotsLabel': 'Pickup Time Slots',
        'surplusForm.addAnotherSlot': 'Add Another Slot',
        'surplusForm.slot': 'Slot',
        'surplusForm.dateLabel': 'Date',
        'surplusForm.datePlaceholder': 'Select date',
        'surplusForm.startTimeLabel': 'Start Time',
        'surplusForm.startTimePlaceholder': 'Start',
        'surplusForm.endTimeLabel': 'End Time',
        'surplusForm.endTimePlaceholder': 'End',
        'surplusForm.notesLabel': 'Notes',
        'surplusForm.notesPlaceholder':
          'e.g., Use back entrance, Ask for manager',
        'surplusForm.pickupLocationLabel': 'Pickup Location',
        'surplusForm.pickupLocationPlaceholder': 'Start typing address...',
        'surplusForm.descriptionLabel': 'Description',
        'surplusForm.descriptionPlaceholder':
          'Describe the food (ingredients, freshness, etc.)',
        'surplusForm.dietaryTagsLabel': 'Dietary Tags',
        'surplusForm.dietaryTagsOptional': '(Optional)',
        'surplusForm.previous': 'Previous',
        'surplusForm.next': 'Next',
        'surplusForm.createDonation': 'Create Donation',
        'surplusForm.updateDonation': 'Update Donation',
        'surplusForm.cancelConfirm': 'Cancel donation creation?',
        'surplusForm.cancelEditConfirm':
          'Cancel editing? Your changes will be lost.',
        'surplusForm.validationError':
          'Please complete all required fields before continuing.',
        'surplusForm.loadingDetails': 'Loading donation details...',
        'surplusForm.successCreated': 'Success! Post created with ID: {{id}}',
        'surplusForm.successUpdated': 'Success! Donation updated successfully.',
        'surplusForm.failed': 'Failed to create surplus post',
        'surplusForm.failedToLoad': 'Failed to load post data',
        'surplusForm.maxDietaryTags': 'Maximum 10 dietary tags allowed.',
        'surplusForm.eligibilityEligible': 'Eligible for donation',
        'surplusForm.eligibilityNotEligible': 'Not eligible for donation',
        'surplusForm.confirmSafetyOverride':
          'I confirm this food is safe to donate.',
        // Step labels – now 4 steps: Basic Info, Food Details, Quantity & Dates, Pickup Info
        'surplusForm.steps.basicInfo': 'Basic Info',
        'surplusForm.steps.foodDetails': 'Food Details',
        'surplusForm.steps.quantityDates': 'Quantity & Dates',
        'surplusForm.steps.pickupInfo': 'Pickup Info',
      };
      // Handle interpolation
      let result = translations[key] || key;
      if (params) {
        result = result.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
          return params[p1] !== undefined ? params[p1] : match;
        });
      }
      return result;
    },
  }),
}));

// Mock the surplusAPI and imageAPI
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { timezone: 'America/Toronto' } }),
  },
  surplusAPI: {
    create: jest.fn(),
    update: jest.fn(),
    getPost: jest.fn(),
  },
  imageAPI: {
    upload: jest.fn().mockResolvedValue({ data: { image: { id: 1 } } }),
  },
}));

// Import the mocked module after the mock is set up
// eslint-disable-next-line import/first
import { surplusAPI as mockSurplusAPI } from '../../../services/api';

// Helper function to render with required providers
const renderWithProviders = (ui, options = {}) => {
  return render(ui, options);
};

// Mock @react-google-maps/api with autocomplete simulation
jest.mock('@react-google-maps/api', () => {
  const React = require('react');

  const MockAutocomplete = ({ children, onLoad, onPlaceChanged }) => {
    React.useEffect(() => {
      if (onLoad) {
        const mockAutocomplete = {
          getPlace: jest.fn(() => ({
            geometry: {
              location: {
                lat: () => 45.4215,
                lng: () => -75.6972,
              },
              formatted_address: '123 Test Street, Ottawa, ON',
              name: 'Test Location',
              address_components: [
                {
                  long_name: '123',
                  short_name: '123',
                  types: ['street_number'],
                },
                {
                  long_name: 'Test Street',
                  short_name: 'Test St',
                  types: ['route'],
                },
                {
                  long_name: 'Ottawa',
                  short_name: 'Ottawa',
                  types: ['locality', 'political'],
                },
                {
                  long_name: 'Ontario',
                  short_name: 'ON',
                  types: ['administrative_area_level_1', 'political'],
                },
              ],
            })),
            setOptions: jest.fn(),
          };
          onLoad(mockAutocomplete);
        }
      }, []);
      return mockReact.cloneElement(children, {
        onBlur: onPlaceChanged,
      });
    },
  };
});

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  const mockReact = require('react');
  return function MockDatePicker({
    selected,
    onChange,
    customInput,
    placeholderText,
    minDate,
    showTimeSelect,
  }) {
    const handleClick = () => {
      if (onChange) {
        onChange(new Date('2024-01-01T10:00:00'));
      }
    };
    if (customInput) {
      return mockReact.cloneElement(customInput, {
        value: selected ? selected.toString() : '',
        onClick: handleClick,
        placeholder: placeholderText,
      });
    }
    return mockReact.createElement('input', {
      type: 'text',
      value: selected ? selected.toString() : '',
      onChange: e => onChange && onChange(new Date(e.target.value)),
      onClick: handleClick,
      placeholder: placeholderText,
      'data-testid': showTimeSelect ? 'time-picker' : 'date-picker',
    });
  };
});

// Mock lucide-react icons – includes all icons used in the new component
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">&#8249;</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">&#8250;</span>,
  Sparkles: () => <span data-testid="sparkles-icon">&#10024;</span>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

// Mock react-select
jest.mock('react-select', () => {
  return function MockSelect({
    options,
    value,
    onChange,
    placeholder,
    classNamePrefix,
    isMulti,
    name,
  }) {
    const handleChange = e => {
      if (onChange) {
        if (isMulti) {
          const selectedOptions = Array.from(e.target.selectedOptions)
            .map(opt => options.find(option => option.value === opt.value))
            .filter(Boolean);
          onChange(selectedOptions);
        } else {
          const selectedOption = options.find(
            opt => opt.value === e.target.value
          );
          // Only call onChange if we found an option (not empty value)
          if (selectedOption) {
            onChange(selectedOption);
          }
        }
      }
    };
    return (
      <select
        multiple={isMulti}
        name={name}
        value={
          isMulti
            ? value
              ? value.map(v => v.value)
              : []
            : value
              ? value.value
              : ''
        }
        onChange={handleChange}
        data-testid={`mock-select-${name || 'default'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

describe('SurplusFormModal', () => {
  jest.setTimeout(15000);
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
    mockConfirm.mockReturnValue(true);
  });

  /**
   * Step layout in the new component (totalSteps = 4):
   *   Step 1 – Basic Info:      title, food categories, description
   *   Step 2 – Food Details:    dietary tags, temperature category, packaging type, photo
   *   Step 3 – Quantity & Dates: quantity value/unit, fabrication date, expiry date
   *   Step 4 – Pickup Info:     pickup time slots + pickup location
   */

  // Helper: fill Step 1 – Basic Info
  const fillStep1 = async () => {
    await userEvent.type(
      screen.getByPlaceholderText('e.g., Vegetable Lasagna'),
      'Test Food'
    );
    await userEvent.type(
      screen.getByPlaceholderText(
        'Describe the food (ingredients, freshness, etc.)'
      ),
      'Test description'
    );
    const categoriesSelect = screen.getByTestId('mock-select-default');
    await userEvent.selectOptions(categoriesSelect, ['PREPARED']);
  };

  // Helper: fill Step 2 – Food Details (temperature category + packaging type)
  const fillStep2 = async () => {
    await waitFor(() => {
      expect(screen.getByText('Food Details')).toBeInTheDocument();
    });

    const tempSelect = screen.getByTestId('mock-select-temperatureCategory');
    fireEvent.change(tempSelect, { target: { value: 'REFRIGERATED' } });

    const packagingSelect = screen.getByTestId('mock-select-packagingType');
    fireEvent.change(packagingSelect, { target: { value: 'SEALED' } });
  };

  // Helper: fill Step 3 – Quantity & Dates
  const fillStep3 = async () => {
    await waitFor(() => {
      expect(screen.getByText('Quantity & Dates')).toBeInTheDocument();
    });

    const quantityInput = document.querySelector('input[name="quantityValue"]');
    await userEvent.type(quantityInput, '10');

    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.click(datePickers[0]); // Fabrication date
    fireEvent.click(datePickers[1]); // Expiry date
  };

  // Helper: fill Step 4 – Pickup Info
  const fillStep4 = async () => {
    await waitFor(() => {
      expect(screen.getByText('Pickup Info')).toBeInTheDocument();
    });

    const datePickers = screen.getAllByTestId('date-picker');
    const timePickers = screen.getAllByTestId('time-picker');

    fireEvent.click(datePickers[0]); // Pickup date
    fireEvent.click(timePickers[0]); // Start time
    fireEvent.click(timePickers[1]); // End time

    const addressInput = screen.getByPlaceholderText('Start typing address...');
    await userEvent.type(addressInput, 'Test Location');
    fireEvent.blur(addressInput);
  };

  // Component renders when isOpen is true
  test('renders modal when isOpen is true', () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);
    expect(screen.getByText('Add New Donation')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('e.g., Vegetable Lasagna')
    ).toBeInTheDocument();
    // Step labels from the progress bar
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Food Details')).toBeInTheDocument();
  });

  // Component doesn't render when isOpen is false
  test('does not render modal when isOpen is false', () => {
    const { container } = renderWithProviders(
      <SurplusFormModal {...defaultProps} isOpen={false} />
    );
    expect(screen.queryByText('Add New Donation')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  // Multi-step navigation through all 4 steps
  test('navigates through all steps correctly', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    // Step 1 – Basic Info
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    // Step 2 – Food Details
    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    // Step 3 – Quantity & Dates
    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    // Step 4 – Pickup Info (last step shows submit button)
    await waitFor(() => {
      expect(screen.getByText('Pickup Info')).toBeInTheDocument();
    });
    expect(screen.getByText('Create Donation')).toBeInTheDocument();
  });

  // Step validation prevents moving forward
  test('prevents moving to next step without completing required fields', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    // Try to go to next step without filling anything
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(
        screen.getByText(/Please complete all required fields/)
      ).toBeInTheDocument();
    });

    // Should still be on step 1
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
  });

  // Previous button navigation
  test('navigates back to previous step', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Food Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Previous'));

    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
    });
  });

  // Form submission with valid data through all steps
  test('submits form with valid data through all steps', async () => {
    const mockResponse = { data: { id: 123 } };
    mockSurplusAPI.create.mockResolvedValue(mockResponse);

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(mockSurplusAPI.create).toHaveBeenCalled();
    });

    const apiCall = mockSurplusAPI.create.mock.calls[0];
    expect(apiCall[0]).toMatchObject({
      title: 'Test Food',
      quantity: { value: 10, unit: 'KILOGRAM' },
      temperatureCategory: 'REFRIGERATED',
      packagingType: 'SEALED',
      description: 'Test description',
    });
  });

  // Temperature category is required (Step 2)
  test('requires temperature category in step 2', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Food Details')).toBeInTheDocument();
    });

    // Fill packaging but NOT temperature
    const packagingSelect = screen.getByTestId('mock-select-packagingType');
    fireEvent.change(packagingSelect, { target: { value: 'SEALED' } });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(
        screen.getByText(/Please complete all required fields/)
      ).toBeInTheDocument();
    });
  });

  // Packaging type is required (Step 2)
  test('requires packaging type in step 2', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Food Details')).toBeInTheDocument();
    });

    // Fill temperature but NOT packaging
    const tempSelect = screen.getByTestId('mock-select-temperatureCategory');
    fireEvent.change(tempSelect, { target: { value: 'REFRIGERATED' } });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(
        screen.getByText(/Please complete all required fields/)
      ).toBeInTheDocument();
    });
  });

  // API error handling
  test('handles API errors correctly', async () => {
    const errorMessage = 'Network Error';
    mockSurplusAPI.create.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // Cancel button functionality
  test('cancels form and resets data when cancel button is clicked', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText('e.g., Vegetable Lasagna'),
      'Test Food'
    );

    const closeButton = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Success message after successful submission
  test('shows success message after successful submission', async () => {
    const mockResponse = { data: { id: 123 } };
    mockSurplusAPI.create.mockResolvedValue(mockResponse);

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(
        screen.getByText(/Success! Post created with ID: 123/)
      ).toBeInTheDocument();
    });
  });

  // Verify API is called with correct endpoint
  test('calls the correct API endpoint on form submission', async () => {
    const mockResponse = { data: { id: 123 } };
    mockSurplusAPI.create.mockResolvedValue(mockResponse);

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(mockSurplusAPI.create).toHaveBeenCalled();
    });
  });

  test('closes modal when close button is clicked', () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);
    const closeButton = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Input field changes update form state
  test('updates form state when input fields change', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    // Step 1
    const titleInput = screen.getByPlaceholderText('e.g., Vegetable Lasagna');
    await userEvent.type(titleInput, 'Banana Bread');
    expect(titleInput.value).toBe('Banana Bread');

    const categoriesSelect = screen.getByTestId('mock-select-default');
    await userEvent.selectOptions(categoriesSelect, ['PREPARED']);

    const descriptionInput = screen.getByPlaceholderText(
      'Describe the food (ingredients, freshness, etc.)'
    );
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Fresh banana bread');
    expect(descriptionInput.value).toBe('Fresh banana bread');

    fireEvent.click(screen.getByText('Next'));

    // Step 2
    expect(await screen.findByText('Food Details')).toBeInTheDocument();
    const tempSelect = screen.getByTestId('mock-select-temperatureCategory');
    fireEvent.change(tempSelect, { target: { value: 'REFRIGERATED' } });
    const packagingSelect = screen.getByTestId('mock-select-packagingType');
    fireEvent.change(packagingSelect, { target: { value: 'SEALED' } });

    fireEvent.click(screen.getByText('Next'));

    // Step 3
    expect(await screen.findByText('Quantity & Dates')).toBeInTheDocument();
    const quantityInput = document.querySelector('input[name="quantityValue"]');
    await userEvent.type(quantityInput, '5');
    expect(quantityInput.value).toBe('5');

    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.click(datePickers[0]); // Fabrication date
    fireEvent.click(datePickers[1]); // Expiry date
    fireEvent.click(screen.getByText('Next'));

    // Step 4
    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();
    const pickupDatePickers = screen.getAllByTestId('date-picker');
    const timePickers = screen.getAllByTestId('time-picker');
    fireEvent.click(pickupDatePickers[0]);
    fireEvent.click(timePickers[0]);
    fireEvent.click(timePickers[1]);
    const addressInput = screen.getByPlaceholderText('Start typing address...');
    await userEvent.type(addressInput, 'Test Location');
    fireEvent.blur(addressInput);
  });

  // Modal closes after successful submission
  test('closes modal after successful submission', async () => {
    const mockResponse = { data: { id: 123 } };
    mockSurplusAPI.create.mockResolvedValue(mockResponse);

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(
        screen.getByText(/Success! Post created with ID: 123/)
      ).toBeInTheDocument();
    });

    // Check that onClose is called after delay
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  // Multi-select food categories
  test('handles multi-select food categories', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    const categoriesSelect = screen.getByTestId('mock-select-default');
    await userEvent.selectOptions(categoriesSelect, ['PREPARED', 'BAKERY']);
    expect(categoriesSelect).toBeInTheDocument();
    expect(categoriesSelect.value).toContain('PREPARED');
  });

  // Unit selection change (Step 3)
  test('changes quantity unit selection', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Quantity & Dates')).toBeInTheDocument();

    const unitSelect = screen.getByTestId('mock-select-quantityUnit');
    fireEvent.change(unitSelect, { target: { value: 'ITEM' } });
    expect(unitSelect.value).toBe('ITEM');
  });

  // Expiry date selection (Step 3)
  test('selects expiry date', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Quantity & Dates')).toBeInTheDocument();

    const datePickers = screen.getAllByTestId('date-picker');
    const expiryDatePicker = datePickers[1]; // Second date picker is expiry date

    fireEvent.click(expiryDatePicker);
    expect(expiryDatePicker).toBeInTheDocument();
  });

  // Add multiple pickup slots (Step 4)
  test('adds multiple pickup slots', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const addButton = screen.getByText('Add Another Slot');
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByText('Slot 1')).toBeInTheDocument();
    expect(screen.getByText('Slot 2')).toBeInTheDocument();
    expect(screen.getByText('Slot 3')).toBeInTheDocument();
  });

  // Remove pickup slot (Step 4)
  test('removes a pickup slot', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const addButton = screen.getByText('Add Another Slot');
    fireEvent.click(addButton);
    expect(screen.getByText('Slot 2')).toBeInTheDocument();

    const trashIcons = screen.getAllByTestId('trash-icon');
    fireEvent.click(trashIcons[0].closest('button'));

    await waitFor(() => {
      expect(screen.queryByText('Slot 2')).not.toBeInTheDocument();
    });
  });

  // Cannot remove last pickup slot
  test('does not remove the last remaining pickup slot', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    // With only one slot, no trash icon should be rendered
    const trashIcons = screen.queryAllByTestId('trash-icon');
    expect(trashIcons.length).toBe(0);
  });

  // Update pickup slot date (Step 4)
  test('updates pickup slot date', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const datePickers = screen.getAllByTestId('date-picker');
    const slotDatePicker = datePickers[0];
    fireEvent.click(slotDatePicker);
    expect(slotDatePicker).toBeInTheDocument();
  });

  // Update pickup slot start time (Step 4)
  test('updates pickup slot start time', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const timePickers = screen.getAllByTestId('time-picker');
    const startTimePicker = timePickers[0];
    fireEvent.click(startTimePicker);
    expect(startTimePicker).toBeInTheDocument();
  });

  // Update pickup slot end time (Step 4)
  test('updates pickup slot end time', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const timePickers = screen.getAllByTestId('time-picker');
    const endTimePicker = timePickers[1];
    fireEvent.click(endTimePicker);
    expect(endTimePicker).toBeInTheDocument();
  });

  // Update pickup slot notes (Step 4)
  test('updates pickup slot notes', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const notesInput = screen.getByPlaceholderText(
      'e.g., Use back entrance, Ask for manager'
    );
    await userEvent.type(notesInput, 'Ring the doorbell');
    expect(notesInput.value).toBe('Ring the doorbell');
  });

  // Google Places Autocomplete address selection (Step 4)
  test('handles Google Places autocomplete selection', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const addressInput = screen.getByPlaceholderText('Start typing address...');
    fireEvent.blur(addressInput);

    await waitFor(() => {
      expect(addressInput.value).toContain('123 Test Street');
    });
  });

  // Manual address input without autocomplete (Step 4)
  test('handles manual address input', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    const addressInput = screen.getByPlaceholderText('Start typing address...');
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, '456 Manual Street');
    expect(addressInput.value).toBe('456 Manual Street');
  });

  // Multiple pickup slots submission
  test('submits form with multiple pickup slots', async () => {
    const mockResponse = { data: { id: 456 } };
    mockSurplusAPI.create.mockResolvedValue(mockResponse);

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Pickup Info')).toBeInTheDocument();

    // Fill first slot
    let datePickers = screen.getAllByTestId('date-picker');
    let timePickers = screen.getAllByTestId('time-picker');
    fireEvent.click(datePickers[0]);
    fireEvent.click(timePickers[0]);
    fireEvent.click(timePickers[1]);

    const addressInput = screen.getByPlaceholderText('Start typing address...');
    await userEvent.type(addressInput, 'Test Location');
    fireEvent.blur(addressInput);

    // Add second slot
    fireEvent.click(screen.getByText('Add Another Slot'));
    await waitFor(() => {
      expect(screen.getByText('Slot 2')).toBeInTheDocument();
    });

    datePickers = screen.getAllByTestId('date-picker');
    timePickers = screen.getAllByTestId('time-picker');
    fireEvent.click(datePickers[1]);
    fireEvent.click(timePickers[2]);
    fireEvent.click(timePickers[3]);

    const notesInputs = screen.getAllByPlaceholderText(
      'e.g., Use back entrance, Ask for manager'
    );
    await userEvent.type(notesInputs[0], 'First slot notes');
    await userEvent.type(notesInputs[1], 'Second slot notes');

    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(mockSurplusAPI.create).toHaveBeenCalled();
    });

    const apiCall = mockSurplusAPI.create.mock.calls[0];
    expect(apiCall[0].pickupSlots).toHaveLength(2);
  });

  // Quantity with decimal values (Step 3)
  test('handles decimal quantity values', async () => {
    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    expect(await screen.findByText('Quantity & Dates')).toBeInTheDocument();

    const quantityInput = document.querySelector('input[name="quantityValue"]');
    await userEvent.type(quantityInput, '5.5');
    expect(quantityInput.value).toBe('5.5');
  });

  // API error without response message
  test('handles API error without response message', async () => {
    mockSurplusAPI.create.mockRejectedValue({});

    renderWithProviders(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText('Next'));

    await fillStep2();
    fireEvent.click(screen.getByText('Next'));

    await fillStep3();
    fireEvent.click(screen.getByText('Next'));

    await fillStep4();
    fireEvent.click(screen.getByText('Create Donation'));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to create surplus post')
      ).toBeInTheDocument();
    });
  });
});
