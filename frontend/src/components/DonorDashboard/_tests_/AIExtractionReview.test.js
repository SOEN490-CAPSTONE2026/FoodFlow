import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIExtractionReview from '../AIExtractionReview';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';
import { surplusAPI } from '../../../services/api';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
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
  Autocomplete: ({ children }) => <div data-testid="autocomplete">{children}</div>,
}));

jest.mock('react-select', () => {
  return function MockSelect({ value, onChange, options, placeholder, isMulti }) {
    return (
      <select
        data-testid={`mock-select-${placeholder}`}
        value={isMulti ? JSON.stringify(value) : value?.value || ''}
        multiple={isMulti}
        onChange={e => {
          if (isMulti) {
            const selected = options.filter(opt =>
              JSON.parse(e.target.value || '[]').includes(opt.value)
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
  return function MockDatePicker({ selected, onChange, placeholder }) {
    return (
      <input
        data-testid={`date-picker-${placeholder}`}
        type="text"
        value={selected instanceof Date ? selected.toISOString() : selected || ''}
        onChange={e => onChange(new Date(e.target.value))}
        placeholder={placeholder}
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
      packagingType: 0.90,
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
        <TimezoneProvider>
          <AIExtractionReview {...defaultProps} {...props} />
        </TimezoneProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  test('renders review header', () => {
    renderComponent();
    expect(screen.getByText(/review ai-extracted information/i)).toBeInTheDocument();
  });

  test('renders re-upload button', () => {
    renderComponent();
    const reUploadButton = screen.getByRole('button', { name: /re-upload image/i });
    expect(reUploadButton).toBeInTheDocument();
  });

  test('calls onReUpload when re-upload button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const reUploadButton = screen.getByRole('button', { name: /re-upload image/i });
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
    const submitButton = screen.getByRole('button', { name: /create donation/i });
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
    expect(screen.getByText(/review ai-extracted information/i)).toBeInTheDocument();
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
    expect(screen.getByDisplayValue('Fresh organic apples')).toBeInTheDocument();
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
    const submitButton = screen.getByRole('button', { name: /create donation/i });
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
    expect(screen.getByText(/review ai-extracted information/i)).toBeInTheDocument();
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
});
