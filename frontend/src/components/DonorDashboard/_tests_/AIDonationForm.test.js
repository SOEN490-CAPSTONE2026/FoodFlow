import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIDonationForm from '../AIDonationForm';
import api from '../../../services/api';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({
    isLoaded: true,
    loadError: null,
  }),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
  Autocomplete: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-select', () => {
  return function MockSelect() {
    return <select data-testid="mock-select" />;
  };
});

jest.mock('react-datepicker', () => {
  return function MockDatePicker() {
    return <input data-testid="mock-datepicker" />;
  };
});

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  Sparkles: () => <span>SparklesIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  Package: () => <span>PackageIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AIDonationForm', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <TimezoneProvider>
          <AIDonationForm {...props} />
        </TimezoneProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  test('renders upload interface initially', () => {
    renderComponent();

    expect(screen.getByText(/create donation with ai/i)).toBeInTheDocument();
    expect(screen.getByText(/upload food label photo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/drag & drop your food label image here/i)
    ).toBeInTheDocument();
  });

  test('renders back button', () => {
    renderComponent();

    const backButton = screen.getByRole('button', {
      name: /back to dashboard/i,
    });
    expect(backButton).toBeInTheDocument();
  });

  test('navigates back to dashboard when back button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const backButton = screen.getByRole('button', {
      name: /back to dashboard/i,
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
  });

  test('renders step indicator', () => {
    renderComponent();

    const stepIndicator = document.querySelector('.ai-step-indicator');
    expect(stepIndicator).toBeInTheDocument();

    const steps = stepIndicator.querySelectorAll('.step');
    expect(steps.length).toBe(3);
  });

  test('renders file input', () => {
    renderComponent();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute(
      'accept',
      'image/jpeg,image/jpg,image/png,image/heic'
    );
  });

  test('renders manual entry button', () => {
    renderComponent();

    const manualButton = screen.getByRole('button', {
      name: /use manual entry instead/i,
    });
    expect(manualButton).toBeInTheDocument();
  });

  test('navigates to manual entry when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const manualButton = screen.getByRole('button', {
      name: /use manual entry instead/i,
    });
    await user.click(manualButton);

    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('renders upload instructions', () => {
    renderComponent();

    expect(screen.getByText(/product name/i)).toBeInTheDocument();
    expect(screen.getByText(/nutrition facts/i)).toBeInTheDocument();
    expect(screen.getByText(/ingredients list/i)).toBeInTheDocument();
    expect(screen.getByText(/expiry\/best before date/i)).toBeInTheDocument();
  });

  test('renders tips section', () => {
    renderComponent();

    expect(screen.getByText(/tips for best results/i)).toBeInTheDocument();
    expect(screen.getByText(/ensure good lighting/i)).toBeInTheDocument();
    expect(
      screen.getByText(/keep the label flat and in focus/i)
    ).toBeInTheDocument();
  });

  test('renders file requirements', () => {
    renderComponent();

    expect(screen.getByText(/jpg, png, heic/i)).toBeInTheDocument();
    expect(screen.getByText(/max 5mb/i)).toBeInTheDocument();
  });

  test('step 1 is active initially', () => {
    renderComponent();

    const steps = document.querySelectorAll('.step');
    expect(steps[0]).toHaveClass('active');
    expect(steps[1]).not.toHaveClass('active');
    expect(steps[2]).not.toHaveClass('active');
  });

  test('renders choose file button', () => {
    renderComponent();

    const chooseFileLabel = screen.getByText(/choose file/i);
    expect(chooseFileLabel).toBeInTheDocument();
  });

  test('shows processing state after file upload', async () => {
    api.post.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: { success: true } }), 100)
        )
    );

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/ai is analyzing your image/i)
      ).toBeInTheDocument();
    });
  });

  test('calls API when image is submitted', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        foodName: 'Test Food',
        quantityValue: 5,
        quantityUnit: 'KILOGRAM',
      },
    });

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/ai/extract-donation',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 35000,
        })
      );
    });
  });

  test('shows review step after successful AI extraction', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        foodName: 'Test Food',
        foodCategories: ['FRUITS_VEGETABLES'],
        quantityValue: 5,
        quantityUnit: 'KILOGRAM',
        temperatureCategory: 'REFRIGERATED',
        packagingType: 'SEALED',
        description: 'Test description',
        confidenceScores: {},
      },
    });

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(
        screen.getByText(/review ai-extracted information/i)
      ).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const { toast } = require('react-toastify');
    api.post.mockRejectedValue({
      response: {
        data: { errorMessage: 'Failed to analyze image' },
      },
    });

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  test('disables back button during processing', async () => {
    api.post.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: { success: true } }), 200)
        )
    );

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const backButton = screen.getByRole('button', {
        name: /back to dashboard/i,
      });
      expect(backButton).toBeDisabled();
    });
  });

  test('shows processing steps during AI analysis', async () => {
    api.post.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: { success: true } }), 100)
        )
    );

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected image/i)).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /analyze with ai/i,
    });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/reading label/i)).toBeInTheDocument();
      expect(screen.getByText(/extracting data/i)).toBeInTheDocument();
      expect(screen.getByText(/preparing results/i)).toBeInTheDocument();
    });
  });
});
