import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIDonationForm from '../AIDonationForm';
import api from '../../../services/api';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';

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
  useLoadScript: () => ({ isLoaded: true, loadError: null }),
}));

jest.mock('../AIExtractionReview', () => {
  return function MockAIExtractionReview() {
    return <div>aiExtractionReview.title</div>;
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
  });

  test('navigates with key-based buttons', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: 'aiDonation.backToDashboard' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');

    await user.click(
      screen.getByRole('button', { name: 'aiDonation.upload.manualEntry' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/donor/list');
  });

  test('uploads image and calls extraction API', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(document.querySelector('.proceed-button')).toBeInTheDocument();
    });

    fireEvent.click(document.querySelector('.proceed-button'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/ai/extract-donation',
        expect.any(FormData),
        expect.objectContaining({ timeout: 35000 })
      );
    });
  });
});
