import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIExtractionReview from '../AIExtractionReview';
import { surplusAPI } from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/TimezoneContext', () => ({
  useTimezone: () => ({
    userTimezone: 'America/Toronto',
    isLoading: false,
    updateTimezone: jest.fn(),
    refreshTimezone: jest.fn(),
  }),
}));

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
        if (Number.isNaN(selected.getTime())) {
          return '';
        }
        return selected.toISOString();
      }
      return selected;
    };

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
      quantity: 0.92,
      temperatureCategory: 0.85,
      packagingType: 0.9,
      description: 0.8,
    },
  };

  const mockImageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockOnReUpload = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSubmitStart = jest.fn();
  const mockOnSubmitError = jest.fn();

  const renderComponent = (props = {}) => {
    const { authValue, ...componentProps } = props;

    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ accountStatus: 'ACTIVE', ...(authValue || {}) }}
        >
          <AIExtractionReview
            data={mockData}
            imageFile={mockImageFile}
            onReUpload={mockOnReUpload}
            onCancel={mockOnCancel}
            onSubmitStart={mockOnSubmitStart}
            onSubmitError={mockOnSubmitError}
            {...componentProps}
          />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  const completePickupStep = () => {
    fireEvent.change(screen.getByTestId('date-picker-Select date'), {
      target: { value: '2026-06-15T00:00:00.000Z' },
    });
    fireEvent.change(screen.getByTestId('date-picker-Start time'), {
      target: { value: '2026-06-15T10:00:00.000Z' },
    });
    fireEvent.change(screen.getByTestId('date-picker-End time'), {
      target: { value: '2026-06-15T14:00:00.000Z' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter pickup address/i), {
      target: { value: '123 Test Street, Test City' },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  test('renders initial step content', () => {
    renderComponent();

    expect(screen.getByText('Donate with AI')).toBeInTheDocument();
    expect(screen.getAllByText('Product Information').length).toBeGreaterThan(
      0
    );
    expect(
      screen.getByRole('button', { name: 'Re-upload Image' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue' })
    ).toBeInTheDocument();
  });

  test('calls onReUpload when re-upload button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Re-upload Image' }));

    expect(mockOnReUpload).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel on step 1 cancel', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('shows validation error on missing product info', async () => {
    const { toast } = require('react-toastify');
    renderComponent({ data: { ...mockData, foodName: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please enter a food name/title'
      );
    });
  });

  test('moves to pickup step and allows manual location entry', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const locationInput = screen.getByPlaceholderText(/enter pickup address/i);
    await user.type(locationInput, '456 Main St');

    expect(screen.getByDisplayValue('456 Main St')).toBeInTheDocument();
  });

  test('submits successfully with isAiAssisted flag', async () => {
    const { toast } = require('react-toastify');
    surplusAPI.create.mockResolvedValue({ data: { id: '12345' } });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    await waitFor(() => {
      expect(mockOnSubmitStart).toHaveBeenCalled();
      expect(surplusAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Fresh Apples',
          isAiAssisted: true,
        })
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('handles API error and calls onSubmitError', async () => {
    const { toast } = require('react-toastify');
    surplusAPI.create.mockRejectedValue({
      response: { data: { message: 'Database connection failed' } },
    });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    await waitFor(() => {
      expect(mockOnSubmitError).toHaveBeenCalledWith(
        'Database connection failed'
      );
      expect(toast.error).toHaveBeenCalledWith('Database connection failed');
    });
  });

  test('preserves edited values after submission failure', async () => {
    surplusAPI.create.mockRejectedValue({
      response: { data: { message: 'Database connection failed' } },
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter food name/i), {
      target: { value: 'Fresh Apple Boxes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    await waitFor(() => {
      expect(mockOnSubmitError).toHaveBeenCalled();
    });

    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(screen.getByDisplayValue('Fresh Apple Boxes')).toBeInTheDocument();
  });

  test('shows approval modal and skips AI donation submission when account is not approved', async () => {
    renderComponent({
      authValue: { accountStatus: 'PENDING_ADMIN_APPROVAL' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    await waitFor(() => {
      expect(surplusAPI.create).not.toHaveBeenCalled();
    });

    expect(
      screen.getByText('common.approvalRequired.createTitle')
    ).toBeInTheDocument();
  });

  test('shows approval modal when AI donation submission is rejected as unapproved', async () => {
    surplusAPI.create.mockRejectedValue({
      response: { data: { message: 'Account not approved yet' } },
    });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    expect(
      await screen.findByText('common.approvalRequired.createTitle')
    ).toBeInTheDocument();
  });

  test('navigates to donor list after successful submission', async () => {
    jest.useFakeTimers();
    surplusAPI.create.mockResolvedValue({ data: { id: '999' } });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    completePickupStep();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.click(screen.getByRole('button', { name: 'Submit Donation' }));

    await waitFor(() => {
      expect(surplusAPI.create).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
    });

    jest.useRealTimers();
  });
});
