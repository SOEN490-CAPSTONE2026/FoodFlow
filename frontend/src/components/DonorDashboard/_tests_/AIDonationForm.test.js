import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIDonationForm from '../AIDonationForm';
import api from '../../../services/api';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';

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
}));

jest.mock('../AIExtractionReview', () => {
  return function MockAIExtractionReview({ data, onReUpload }) {
    return (
      <div>
        <h2>Review AI-extracted information</h2>
        <div>{data?.foodName}</div>
        <button onClick={onReUpload}>Re-upload</button>
      </div>
    );
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AIDonationForm', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <TimezoneProvider>
          <AIDonationForm />
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
    expect(screen.getByText(/upload label image/i)).toBeInTheDocument();
    expect(
      screen.getByText(/drag and drop a label image/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue with manual entry/i })
    ).toBeInTheDocument();
  });

  test('navigates back to dashboard when back button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: /back to dashboard/i })
    );

    expect(mockNavigate).toHaveBeenCalledWith('/donor/dashboard');
  });

  test('navigates to manual entry when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: /continue with manual entry/i })
    );

    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('renders 3-step indicator', () => {
    renderComponent();

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(document.querySelectorAll('.ai-step-indicator .step').length).toBe(3);
  });

  test('calls extraction API and moves to review step', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        foodName: 'Test Food',
      },
    });

    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/selected file/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /continue to review/i })
    );

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

    expect(
      await screen.findByText(/review ai-extracted information/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Test Food')).toBeInTheDocument();
  });

  test('shows error toast and returns to upload when API fails', async () => {
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
      expect(screen.getByText(/selected file/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /continue to review/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to analyze image');
    });

    expect(screen.getByText(/upload label image/i)).toBeInTheDocument();
  });
});
