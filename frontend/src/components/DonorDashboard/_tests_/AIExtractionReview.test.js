import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIExtractionReview from '../AIExtractionReview';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('@react-google-maps/api', () => ({
  Autocomplete: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-select', () => {
  return function MockSelect({ value, onChange, options, placeholder }) {
    return (
      <select
        data-testid="mock-select"
        value={value?.value || ''}
        onChange={e => {
          const selected = options.find(opt => opt.value === e.target.value);
          onChange(selected);
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
        type="text"
        value={selected || ''}
        onChange={e => onChange(e.target.value)}
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
    confidenceScores: {
      foodName: 0.95,
      foodCategories: 0.88,
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
});
