import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIDonationForm from '../AIDonationForm';
import api from '../../../services/api';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';
import { toast } from 'react-toastify';

let mockIsLoaded = true;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }),
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: mockIsLoaded, loadError: null }),
}));

jest.mock('../AIImageUpload', () => {
  return function MockAIImageUpload({ onImageSelect, onManualEntry }) {
    return (
      <div>
        <div>mock-upload-step</div>
        <button
          onClick={() =>
            onImageSelect(
              new File(['test'], 'upload.jpg', { type: 'image/jpeg' })
            )
          }
        >
          start-upload
        </button>
        <button onClick={onManualEntry}>manual-entry</button>
      </div>
    );
  };
});

jest.mock('../AIExtractionReview', () => {
  return function MockAIExtractionReview({
    onReUpload,
    onCancel,
    onSubmitStart,
    onSubmitError,
  }) {
    return (
      <div>
        <div>mock-review-step</div>
        <button onClick={onReUpload}>review-reupload</button>
        <button onClick={onCancel}>review-cancel</button>
        <button onClick={onSubmitStart}>review-submit-start</button>
        <button onClick={onSubmitError}>review-submit-error</button>
      </div>
    );
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <TimezoneProvider>
        <AIDonationForm />
      </TimezoneProvider>
    </MemoryRouter>
  );

describe('AIDonationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsLoaded = true;
    URL.createObjectURL = jest.fn(() => 'mock-url');
    api.get.mockResolvedValue({ data: { timezone: 'UTC' } });

    global.FileReader = jest.fn(() => ({
      result: 'data:image/jpeg;base64,dGVzdA==',
      onloadend: null,
      readAsDataURL: function () {
        if (this.onloadend) {
          this.onloadend();
        }
      },
    }));
  });

  test('renders key-based upload UI', () => {
    renderComponent();
    expect(screen.getByText('aiDonation.title')).toBeInTheDocument();
    expect(screen.getByText('aiDonation.steps.upload')).toBeInTheDocument();
    expect(screen.getByText('aiDonation.steps.review')).toBeInTheDocument();
    expect(screen.getByText('aiDonation.steps.submit')).toBeInTheDocument();
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
  });

  test('navigates with key-based buttons', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'aiDonation.backToDashboard' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');

    await user.click(screen.getByRole('button', { name: 'manual-entry' }));
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('uploads image and calls extraction API then shows review', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { success: true, extracted: {} } });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/ai/extract-donation',
        expect.any(FormData),
        expect.objectContaining({ timeout: 35000 })
      );
    });
    expect(toast.success).toHaveBeenCalledWith(
      'aiDonation.toast.extractionComplete'
    );
    expect(screen.getByText('mock-review-step')).toBeInTheDocument();
  });

  test('handles unsuccessful extraction with server error message', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: { success: false, errorMessage: 'bad-image-format' },
    });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('bad-image-format');
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
  });

  test('handles unsuccessful extraction with fallback message', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { success: false } });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('aiDonation.toast.aiFailed');
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
  });

  test('handles response error with explicit message', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.post.mockRejectedValue({
      response: { data: { errorMessage: 'analysis-service-failed' } },
    });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('analysis-service-failed');
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  test('handles response error with fallback analysis message', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.post.mockRejectedValue({ response: { data: {} } });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'aiDonation.toast.analysisFailed'
      );
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  test('handles timeout extraction error', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.post.mockRejectedValue({ code: 'ECONNABORTED' });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'aiDonation.toast.requestTimedOut'
      );
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  test('handles generic network extraction error', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.post.mockRejectedValue(new Error('network down'));

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('aiDonation.toast.networkError');
    });
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  test('shows loading maps state when review starts before maps are loaded', async () => {
    const user = userEvent.setup();
    mockIsLoaded = false;
    api.post.mockResolvedValue({ data: { success: true } });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(
        screen.getByText('aiDonation.processing.loadingMaps')
      ).toBeInTheDocument();
    });
  });

  test('review callbacks support cancel, reupload, submit start and submit error', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: { success: true, extracted: {} } });

    renderComponent();
    await user.click(screen.getByRole('button', { name: 'start-upload' }));

    await waitFor(() => {
      expect(screen.getByText('mock-review-step')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'review-submit-error' })
    );
    expect(screen.getByText('mock-review-step')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'review-cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');

    await user.click(screen.getByRole('button', { name: 'review-reupload' }));
    expect(screen.getByText('mock-upload-step')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'start-upload' }));
    await waitFor(() => {
      expect(screen.getByText('mock-review-step')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'review-submit-start' })
    );
    expect(screen.getByText('aiDonation.submitting.title')).toBeInTheDocument();
  });
});
