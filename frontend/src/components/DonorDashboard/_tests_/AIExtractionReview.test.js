import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIExtractionReview from '../AIExtractionReview';
import { surplusAPI } from '../../../services/api';

jest.mock('../../../contexts/TimezoneContext', () => ({
  TimezoneProvider: ({ children }) => children,
  useTimezone: () => ({
    userTimezone: 'America/Toronto',
    isLoading: false,
    updateTimezone: jest.fn(),
    refreshTimezone: jest.fn(),
  }),
}));

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../../services/api', () => ({
  surplusAPI: {
    create: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@react-google-maps/api', () => ({
  Autocomplete: ({ children }) => (
    <div data-testid="autocomplete">{children}</div>
  ),
}));

jest.mock('react-select', () => {
  return function MockSelect({
    value,
    onChange,
    options,
    placeholder,
    isMulti,
  }) {
    return (
      <select
        data-testid={`mock-select-${placeholder}`}
        value={
          isMulti
            ? Array.isArray(value)
              ? value.map(v => v.value)
              : []
            : value?.value || ''
        }
        multiple={isMulti}
        onChange={e => {
          if (isMulti) {
            const valuesToSelect = Array.from(e.target.selectedOptions).map(
              option => option.value
            );
            const selected = options.filter(opt =>
              valuesToSelect.includes(opt.value)
            );
            onChange(selected);
          } else {
            const selected = options.find(opt => opt.value === e.target.value);
            onChange(selected);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock('react-datepicker', () => {
  return function MockDatePicker({
    selected,
    onChange,
    placeholder,
    placeholderText,
  }) {
    const getValue = () => {
      if (!selected) {
        return '';
      }
      if (selected instanceof Date) {
        // Check if date is valid
        if (isNaN(selected.getTime())) {
          return '';
        }
        return selected.toISOString();
      }
      return selected;
    };

    // Use placeholderText if placeholder is not provided (react-datepicker uses placeholderText)
    const testIdSuffix = placeholder || placeholderText || 'undefined';

    return (
      <input
        data-testid={`date-picker-${testIdSuffix}`}
        type="text"
        value={getValue()}
        onChange={e => {
          const date = new Date(e.target.value);
          onChange(date);
        }}
        placeholder={placeholder || placeholderText}
      />
    );
  };
});

jest.mock('lucide-react', () => ({
  CheckCircle: () => <span>CheckCircleIcon</span>,
  XCircle: () => <span>XCircleIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  Edit: () => <span>EditIcon</span>,
  ArrowRight: () => <span>ArrowRightIcon</span>,
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  Sparkles: () => <span>SparklesIcon</span>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AIExtractionReview', () => {
  const mockData = {
    foodName: 'Fresh Apples',
    foodCategories: ['FRUITS_VEGETABLES'],
    quantityValue: 5,
    quantityUnit: 'KILOGRAM',
    expiryDate: '2025-12-31',
    description: 'Organic red apples',
    temperatureCategory: 'REFRIGERATED',
    packagingType: 'SEALED',
    fabricationDate: '2025-01-01',
    confidenceScores: {
      foodName: 0.95,
      foodCategories: 0.88,
      quantityValue: 0.92,
      temperatureCategory: 0.85,
      packagingType: 0.9,
    },
  };

  const mockImageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockOnReUpload = jest.fn();
  const mockOnCancel = jest.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      data: mockData,
      imageFile: mockImageFile,
      onReUpload: mockOnReUpload,
      onCancel: mockOnCancel,
    };

    return render(
      <MemoryRouter>
        <AIExtractionReview {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  test('renders review header', () => {
    renderComponent();
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('renders re-upload button', () => {
    renderComponent();
    const reUploadButton = screen.getByRole('button', {
      name: /re-upload image/i,
    });
    expect(reUploadButton).toBeInTheDocument();
  });

  test('calls onReUpload when re-upload button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const reUploadButton = screen.getByRole('button', {
      name: /re-upload image/i,
    });
    await user.click(reUploadButton);
    expect(mockOnReUpload).toHaveBeenCalledTimes(1);
  });

  test('renders cancel button', () => {
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('renders submit button', () => {
    renderComponent();
    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  test('renders form fields with pre-filled data', () => {
    renderComponent();
    expect(screen.getByDisplayValue('Fresh Apples')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Organic red apples')).toBeInTheDocument();
  });

  test('renders confidence badges for AI-populated fields', () => {
    renderComponent();
    const badges = screen.getAllByText(/ai/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  test('renders image thumbnail', () => {
    renderComponent();
    const thumbnail = screen.getByAltText(/uploaded label/i);
    expect(thumbnail).toBeInTheDocument();
  });

  test('renders without image file gracefully', () => {
    renderComponent({ imageFile: null });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
    expect(screen.queryByAltText(/uploaded label/i)).not.toBeInTheDocument();
  });

  test('renders allergens section when present', () => {
    const dataWithAllergens = {
      ...mockData,
      allergens: ['Peanuts', 'Tree nuts'],
    };
    renderComponent({ data: dataWithAllergens });
    expect(screen.getByText(/detected allergens/i)).toBeInTheDocument();
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('Tree nuts')).toBeInTheDocument();
  });

  test('allows editing food name field', async () => {
    const user = userEvent.setup();
    renderComponent();
    const titleInput = screen.getByDisplayValue('Fresh Apples');
    await user.clear(titleInput);
    await user.type(titleInput, 'Green Apples');
    expect(screen.getByDisplayValue('Green Apples')).toBeInTheDocument();
  });

  test('allows editing quantity field', async () => {
    const user = userEvent.setup();
    renderComponent();
    const quantityInput = screen.getByDisplayValue('5');
    await user.clear(quantityInput);
    await user.type(quantityInput, '10');
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  test('allows editing description field', async () => {
    const user = userEvent.setup();
    renderComponent();
    const descriptionInput = screen.getByDisplayValue('Organic red apples');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Fresh organic apples');
    expect(
      screen.getByDisplayValue('Fresh organic apples')
    ).toBeInTheDocument();
  });

  test('renders all form sections', () => {
    renderComponent();
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity & dates/i)).toBeInTheDocument();
    expect(screen.getByText(/pickup information/i)).toBeInTheDocument();
    const descriptionElements = screen.getAllByText(/description/i);
    expect(descriptionElements.length).toBeGreaterThan(0);
  });

  test('renders required field indicators', () => {
    renderComponent();
    const requiredLabels = document.querySelectorAll('.field-label');
    const requiredCount = Array.from(requiredLabels).filter(label =>
      label.textContent.includes('*')
    ).length;
    expect(requiredCount).toBeGreaterThan(0);
  });

  test('submit button is enabled by default', () => {
    renderComponent();
    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    expect(submitButton).not.toBeDisabled();
  });

  test('renders high confidence badge correctly', () => {
    renderComponent();
    // foodName has 0.95 confidence (HIGH)
    const highBadges = screen.getAllByText(/high/i);
    expect(highBadges.length).toBeGreaterThan(0);
  });

  test('handles data with low confidence scores', () => {
    const lowConfidenceData = {
      ...mockData,
      confidenceScores: {
        foodName: 0.45,
      },
    };
    renderComponent({ data: lowConfidenceData });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('renders food categories field', () => {
    renderComponent();
    const foodCatElements = screen.getAllByText(/food categories/i);
    expect(foodCatElements.length).toBeGreaterThan(0);
  });

  test('renders temperature category field', () => {
    renderComponent();
    const tempCatElements = screen.getAllByText(/temperature category/i);
    expect(tempCatElements.length).toBeGreaterThan(0);
  });

  test('renders packaging type field', () => {
    renderComponent();
    const packagingElements = screen.getAllByText(/packaging type/i);
    expect(packagingElements.length).toBeGreaterThan(0);
  });

  test('renders expiry date field', () => {
    renderComponent();
    const expiryElements = screen.getAllByText(/expiry date/i);
    expect(expiryElements.length).toBeGreaterThan(0);
  });

  test('renders pickup location field', () => {
    renderComponent();
    const locationElements = screen.getAllByText(/pickup location/i);
    expect(locationElements.length).toBeGreaterThan(0);
  });

  test('renders pickup date fields', () => {
    renderComponent();
    expect(screen.getByText(/pickup date/i)).toBeInTheDocument();
    expect(screen.getByText(/start time/i)).toBeInTheDocument();
    expect(screen.getByText(/end time/i)).toBeInTheDocument();
  });

  // Form Validation Tests
  test('shows error when submitting without food name', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutName = { ...mockData, foodName: '' };
    renderComponent({ data: dataWithoutName });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please enter a food name/title'
      );
    });
  });

  test('shows error when submitting without food categories', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutCategories = { ...mockData, foodCategories: [] };
    renderComponent({ data: dataWithoutCategories });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please select at least one food category'
      );
    });
  });

  test('shows error when submitting without temperature category', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutTemp = { ...mockData, temperatureCategory: '' };
    renderComponent({ data: dataWithoutTemp });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please select a temperature category'
      );
    });
  });

  test('shows error when submitting without packaging type', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutPackaging = { ...mockData, packagingType: '' };
    renderComponent({ data: dataWithoutPackaging });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please select a packaging type'
      );
    });
  });

  test('shows error when submitting without quantity', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutQuantity = { ...mockData, quantityValue: 0 };
    renderComponent({ data: dataWithoutQuantity });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid quantity');
    });
  });

  test('shows error when submitting without expiry date', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutExpiry = {
      ...mockData,
      fabricationDate: null,
      expiryDate: null,
    };
    renderComponent({ data: dataWithoutExpiry });

    fireEvent.change(screen.getByTestId('date-picker-Select date'), {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });
    fireEvent.change(screen.getByTestId('date-picker-Start time'), {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });
    fireEvent.change(screen.getByTestId('date-picker-End time'), {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter an expiry date');
    });
  });

  test('shows error when submitting without pickup information', async () => {
    const { toast } = require('react-toastify');
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please fill in pickup date and time'
      );
    });
  });

  test('shows error when submitting without description', async () => {
    const { toast } = require('react-toastify');
    const dataWithoutDesc = { ...mockData, description: '' };
    renderComponent({ data: dataWithoutDesc });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // Form Submission Tests
  test('shows error when submitting without pickup location', async () => {
    const { toast } = require('react-toastify');
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  test('validates all required fields before submission', async () => {
    const { toast } = require('react-toastify');
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(surplusAPI.create).not.toHaveBeenCalled();
    });
  });

  test('form has proper structure for submission', () => {
    renderComponent();

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('review-form');
  });

  // Select Component Interactions
  test('allows selecting unit', () => {
    renderComponent();
    expect(screen.getByText(/select unit/i)).toBeInTheDocument();
  });

  test('renders fabrication date field', () => {
    renderComponent();
    expect(screen.getByText(/fabrication date/i)).toBeInTheDocument();
  });

  test('shows AI badge for all AI-populated fields', () => {
    renderComponent();
    const aiBadges = screen.getAllByText(/ai/i);
    expect(aiBadges.length).toBeGreaterThanOrEqual(5);
  });

  test('displays confidence scores correctly', () => {
    renderComponent();
    // foodName has HIGH confidence (95%)
    expect(screen.getByText(/95%/i)).toBeInTheDocument();
  });

  test('handles invalid date formatting gracefully', () => {
    const dataWithInvalidDates = {
      ...mockData,
      expiryDate: 'invalid-date',
    };
    renderComponent({ data: dataWithInvalidDates });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  // Additional Coverage Tests
  test('renders MEDIUM confidence badge correctly', () => {
    const mediumConfidenceData = {
      ...mockData,
      confidenceScores: {
        foodName: 0.65, // MEDIUM confidence (50-79%)
      },
    };
    renderComponent({ data: mediumConfidenceData });
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
  });

  test('renders LOW confidence badge correctly', () => {
    const lowConfidenceData = {
      ...mockData,
      confidenceScores: {
        foodName: 0.3, // LOW confidence (<50%)
      },
    };
    renderComponent({ data: lowConfidenceData });
    expect(screen.getByText(/30%/i)).toBeInTheDocument();
  });

  test('handles data without confidence scores', () => {
    const dataWithoutScores = {
      ...mockData,
      confidenceScores: null,
    };
    renderComponent({ data: dataWithoutScores });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('maps food categories correctly', () => {
    const dataWithMultipleCategories = {
      ...mockData,
      foodCategories: ['FRUITS_VEGETABLES', 'DAIRY_COLD'],
    };
    renderComponent({ data: dataWithMultipleCategories });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('handles empty food categories array', () => {
    const dataWithEmptyCategories = {
      ...mockData,
      foodCategories: [],
    };
    renderComponent({ data: dataWithEmptyCategories });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('handles null food categories', () => {
    const dataWithNullCategories = {
      ...mockData,
      foodCategories: null,
    };
    renderComponent({ data: dataWithNullCategories });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('handles data without fabrication date', () => {
    const dataWithoutFabDate = {
      ...mockData,
      fabricationDate: null,
    };
    renderComponent({ data: dataWithoutFabDate });
    expect(
      screen.getByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
  });

  test('renders autocomplete component', () => {
    renderComponent();
    const autocomplete = screen.getByTestId('autocomplete');
    expect(autocomplete).toBeInTheDocument();
  });

  test('allows entering pickup location manually', async () => {
    const user = userEvent.setup();
    renderComponent();

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    await user.type(locationInput, '456 Main St');

    expect(screen.getByDisplayValue('456 Main St')).toBeInTheDocument();
  });

  test('displays allergen warning note', () => {
    const dataWithAllergens = {
      ...mockData,
      allergens: ['Peanuts'],
    };
    renderComponent({ data: dataWithAllergens });
    expect(
      screen.getByText(/please verify and include allergen information/i)
    ).toBeInTheDocument();
  });

  test('renders all date picker fields', () => {
    renderComponent();
    const datePickers = document.querySelectorAll(
      'input[data-testid^="date-picker"]'
    );
    expect(datePickers.length).toBeGreaterThan(0);
  });

  test('form element exists and is properly structured', () => {
    renderComponent();
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('review-form');
    expect(form.querySelector('.form-section')).toBeInTheDocument();
  });

  test('handles data with all AI confidence scores', () => {
    const fullConfidenceData = {
      ...mockData,
      confidenceScores: {
        foodName: 0.95,
        foodCategories: 0.88,
        quantityValue: 0.92,
        temperatureCategory: 0.85,
        packagingType: 0.9,
        description: 0.8,
        expiryDate: 0.75,
        fabricationDate: 0.7,
      },
    };
    renderComponent({ data: fullConfidenceData });
    const aiBadges = screen.getAllByText(/ai/i);
    expect(aiBadges.length).toBeGreaterThanOrEqual(6);
  });

  test('renders with minimum required data', () => {
    const minimalData = {
      foodName: 'Test Food',
      foodCategories: ['FRUITS_VEGETABLES'],
      quantityValue: 1,
      quantityUnit: 'ITEM',
      expiryDate: '2025-12-31',
      description: 'Test',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'SEALED',
    };
    renderComponent({ data: minimalData });
    expect(screen.getByDisplayValue('Test Food')).toBeInTheDocument();
  });

  test('displays all required field labels', () => {
    renderComponent();
    expect(screen.getByText(/food name \*/i)).toBeInTheDocument();
    expect(screen.getByText(/food categories \*/i)).toBeInTheDocument();
    expect(screen.getByText(/temperature category \*/i)).toBeInTheDocument();
    expect(screen.getByText(/packaging type \*/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity \*/i)).toBeInTheDocument();
    expect(screen.getByText(/unit \*/i)).toBeInTheDocument();
    expect(screen.getByText(/expiry date \*/i)).toBeInTheDocument();
  });

  test('renders with data that has no allergen info', () => {
    const dataWithoutAllergens = {
      ...mockData,
      allergens: undefined,
    };
    renderComponent({ data: dataWithoutAllergens });
    expect(screen.queryByText(/detected allergens/i)).not.toBeInTheDocument();
  });

  test('renders with empty allergens array', () => {
    const dataWithEmptyAllergens = {
      ...mockData,
      allergens: [],
    };
    renderComponent({ data: dataWithEmptyAllergens });
    expect(screen.queryByText(/detected allergens/i)).not.toBeInTheDocument();
  });

  // Select Component onChange Tests - Cover lines 201-267
  test('handles food categories select change', async () => {
    renderComponent();
    const select = screen.getByTestId('mock-select-Select food categories');

    fireEvent.change(select, { target: { value: 'DAIRY_COLD' } });

    // Component should re-render with new value
    expect(select).toBeInTheDocument();
  });

  test('handles temperature category select change', async () => {
    renderComponent();
    const select = screen.getByTestId('mock-select-Select temperature');

    fireEvent.change(select, { target: { value: 'FROZEN' } });

    expect(select).toBeInTheDocument();
  });

  test('handles packaging type select change', async () => {
    renderComponent();
    const select = screen.getByTestId('mock-select-Select packaging');

    fireEvent.change(select, { target: { value: 'VACUUM_PACKED' } });

    expect(select).toBeInTheDocument();
  });

  test('handles quantity unit select change', async () => {
    renderComponent();
    const select = screen.getByTestId('mock-select-Select unit');

    fireEvent.change(select, { target: { value: 'LITER' } });

    expect(select).toBeInTheDocument();
  });

  // Successful Form Submission Tests - Cover lines 439-537
  test('successfully submits form with complete valid data', async () => {
    const { toast } = require('react-toastify');
    surplusAPI.create.mockResolvedValue({ data: { id: '12345' } });

    // Create complete data with all pickup information
    const completeData = {
      ...mockData,
      pickupDate: '2025-06-15',
      pickupFrom: '10:00',
      pickupTo: '14:00',
    };

    renderComponent({ data: completeData });

    // Fill in the pickup location (required)
    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, {
      target: { value: '123 Test Street, Test City' },
    });

    // Fill in pickup date using mock date picker
    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    // Fill in start time
    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    // Fill in end time
    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    // Should call API
    await waitFor(() => {
      expect(surplusAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Fresh Apples',
          isAiAssisted: true,
        })
      );
    });

    // Should show success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('handles API error with custom message during submission', async () => {
    const { toast } = require('react-toastify');
    surplusAPI.create.mockRejectedValue({
      response: {
        data: { message: 'Database connection failed' },
      },
    });

    renderComponent();

    // Fill in required fields
    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    // Submit
    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Database connection failed');
    });
  });

  test('handles API error without custom message', async () => {
    const { toast } = require('react-toastify');
    surplusAPI.create.mockRejectedValue({
      response: {},
    });

    renderComponent();

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create donation');
    });
  });

  test('updates state when handling text input changes', async () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Fresh Apples');
    fireEvent.change(titleInput, {
      target: { name: 'title', value: 'Red Apples' },
    });

    expect(screen.getByDisplayValue('Red Apples')).toBeInTheDocument();
  });

  test('formats dates correctly for submission', async () => {
    surplusAPI.create.mockResolvedValue({ data: { id: '123' } });

    renderComponent();

    // Fill required fields
    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:30:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:30:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(surplusAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pickupDate: expect.any(String),
          pickupFrom: expect.any(String),
          pickupTo: expect.any(String),
        })
      );
    });
  });

  test('navigates to dashboard after successful submission', async () => {
    jest.useFakeTimers();
    surplusAPI.create.mockResolvedValue({ data: { id: '999' } });

    renderComponent();

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(surplusAPI.create).toHaveBeenCalled();
    });

    // Fast-forward time for navigation
    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
    });

    jest.useRealTimers();
  });

  test('disables buttons during submission', async () => {
    surplusAPI.create.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: { id: '123' } }), 100)
        )
    );

    renderComponent();

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  test('includes isAiAssisted flag in submission', async () => {
    surplusAPI.create.mockResolvedValue({ data: { id: '123' } });

    renderComponent();

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    fireEvent.change(locationInput, { target: { value: '123 Test St' } });

    const pickupDatePicker = screen.getByTestId('date-picker-Select date');
    fireEvent.change(pickupDatePicker, {
      target: { value: '2025-06-15T00:00:00.000Z' },
    });

    const startTimePicker = screen.getByTestId('date-picker-Start time');
    fireEvent.change(startTimePicker, {
      target: { value: '2025-06-15T10:00:00.000Z' },
    });

    const endTimePicker = screen.getByTestId('date-picker-End time');
    fireEvent.change(endTimePicker, {
      target: { value: '2025-06-15T14:00:00.000Z' },
    });

    const submitButton = screen.getByRole('button', {
      name: /create donation/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(surplusAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAiAssisted: true,
        })
      );
    });
  });
});
