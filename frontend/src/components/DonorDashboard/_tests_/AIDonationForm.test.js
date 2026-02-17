import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIDonationForm from '../AIDonationForm';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../../services/api', () => ({
  surplusAPI: {
    createPost: jest.fn(),
  },
}));

jest.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({
    isLoaded: true,
    loadError: null,
  }),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  Marker: () => <div data-testid="marker" />,
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  Sparkles: () => <span>SparklesIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  Package: () => <span>PackageIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
}));

describe('AIDonationForm', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <AIDonationForm {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload interface initially', () => {
    renderComponent();

    expect(screen.getByText(/create donation with ai/i)).toBeInTheDocument();
    expect(screen.getByText(/upload food label photo/i)).toBeInTheDocument();
    expect(screen.getByText(/drag & drop your food label image here/i)).toBeInTheDocument();
  });

  test('renders back button', () => {
    renderComponent();

    const backButton = screen.getByRole('button', { name: /back to dashboard/i });
    expect(backButton).toBeInTheDocument();
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
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/heic');
  });

  test('renders manual entry button', () => {
    renderComponent();

    const manualButton = screen.getByRole('button', { name: /use manual entry instead/i });
    expect(manualButton).toBeInTheDocument();
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
    expect(screen.getByText(/keep the label flat and in focus/i)).toBeInTheDocument();
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
});
