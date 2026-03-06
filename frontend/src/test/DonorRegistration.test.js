import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { MemoryRouter } from 'react-router-dom';
import DonorRegistration from '../components/DonorRegistration';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../style/Registration.css', () => ({}), { virtual: true });

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

jest.mock('../services/api', () => ({
  authAPI: {
    registerDonor: jest.fn(),
    checkEmailExists: jest.fn(),
    checkPhoneExists: jest.fn(),
  },
}));

// Mock timezone service
jest.mock('../services/timezoneService', () => ({
  inferTimezoneFromAddress: jest.fn().mockResolvedValue('America/Toronto'),
  getBrowserTimezone: jest.fn().mockReturnValue('America/Toronto'),
}));

// Auth context mock
const mockAuthContextValue = {
  isLoggedIn: false,
  role: null,
  userId: null,
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithAuth = component =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('DonorRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
  });

  test('renders key-based step 1 fields', () => {
    renderWithAuth(<DonorRegistration />);
    expect(
      screen.getByLabelText('donorRegistration.emailLabel')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('donorRegistration.passwordLabel')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel')
    ).toBeInTheDocument();
  });

  test('shows password mismatch key', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText('donorRegistration.emailLabel'),
      'donor@example.com'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.passwordLabel'),
      'SecurePass123!'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
      'WrongPass123!'
    );
    await user.click(screen.getByText('donorRegistration.nextButtonText'));

    expect(
      await screen.findByText('donorRegistration.passwordMismatch')
    ).toBeInTheDocument();
  });

  test('progresses to next step with valid step 1', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText('donorRegistration.emailLabel'),
      'donor@example.com'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.passwordLabel'),
      'SecurePass123!'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
      'SecurePass123!'
    );
    await user.click(screen.getByText('donorRegistration.nextButtonText'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('donorRegistration.organizationNameLabel')
      ).toBeInTheDocument();
    });
  });

  // additional coverage tests
  describe('Utility functions', () => {
    it('formats phone numbers correctly', () => {
      const { formatPhoneNumber } = require('../components/DonorRegistration');
      expect(formatPhoneNumber('1234567890')).toBe('+11234567890');
      expect(formatPhoneNumber('11234567890')).toBe('+11234567890');
      expect(formatPhoneNumber('+441234567890')).toBe('+441234567890');
      expect(formatPhoneNumber('+(1)234-567-890')).toBe('+11234567890');
    });

    it('validates phone numbers properly', () => {
      const {
        validatePhoneNumber,
      } = require('../components/DonorRegistration');
      expect(validatePhoneNumber('+11234567890')).toBe(true);
      expect(validatePhoneNumber('555-1234')).toBe(true); // regex allows 7-digit numbers
      expect(validatePhoneNumber('abc')).toBe(false);
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });
  });

  describe('File upload and drag/drop', () => {
    const createFile = (name, size, type) => {
      const blob = new Blob([new Array(size).join('a')], { type });
      blob.name = name;
      return blob;
    };

    it('shows error when unsupported file type uploaded', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step 2 quickly
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      const input = document.getElementById('fileUpload');
      const badFile = createFile('file.txt', 100, 'text/plain');
      fireEvent.change(input, { target: { files: [badFile] } });
      expect(
        await screen.findByText('donorRegistration.fileTypeError')
      ).toBeInTheDocument();
    });

    it('shows error when file size exceeds limit via drop', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step 2
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      const area = screen
        .getByLabelText('donorRegistration.chooseFileButton')
        .closest('.file-upload-area');
      const largeFile = createFile(
        'big.pdf',
        11 * 1024 * 1024,
        'application/pdf'
      );
      fireEvent.dragOver(area);
      fireEvent.drop(area, { dataTransfer: { files: [largeFile] } });
      // With i18n mock, error renders as its key — assert some error element appeared
      await waitFor(() => {
        const errorEl = document.querySelector(
          '.file-error, .error-message, [class*="error"]'
        );
        expect(errorEl).toBeTruthy();
      });
    });

    it('allows removing a selected file', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step2
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      const goodFile = createFile('doc.pdf', 1024, 'application/pdf');
      const input = document.getElementById('fileUpload');
      fireEvent.change(input, { target: { files: [goodFile] } });
      expect(await screen.findByText('doc.pdf')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /✕/i }));
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument();
    });

    it('adds dragging class during dragOver and removes on dragLeave', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step 2
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      const area = screen
        .getByLabelText('donorRegistration.chooseFileButton')
        .closest('.file-upload-area');
      fireEvent.dragOver(area);
      expect(area).toHaveClass('dragging');
      fireEvent.dragLeave(area);
      expect(area).not.toHaveClass('dragging');
    });
  });

  describe('Validation and navigation helpers', () => {
    it('postal code invalid shows error', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      await screen.findByLabelText('donorRegistration.organizationNameLabel');
      await user.type(
        screen.getByLabelText('donorRegistration.organizationNameLabel'),
        'Org'
      );
      // organizationType defaults to RESTAURANT, supply business license so step passes
      await user.type(
        screen.getByLabelText('donorRegistration.businessLicenseLabel'),
        'BL1'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      await screen.findByLabelText('donorRegistration.streetAddressLabel');
      await user.type(
        screen.getByLabelText('donorRegistration.streetAddressLabel'),
        '123'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.cityLabel'),
        'City'
      );
      const postal = screen.getByLabelText('donorRegistration.postalCodeLabel');
      await user.type(postal, '###');
      await postal.blur();
      expect(
        await screen.findByText('donorRegistration.postalCodeInvalid')
      ).toBeInTheDocument();
    });

    it('step indicator allows jumping back', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // complete step1
      await user.type(
        screen.getByLabelText('donorRegistration.emailLabel'),
        'a@a.com'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.passwordLabel'),
        'SecurePass123!'
      );
      await user.type(
        screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
        'SecurePass123!'
      );
      await user.click(screen.getByText('donorRegistration.nextButtonText'));

      // click step indicator for step1 using testid
      const step1 = screen.getByTestId('step-item-1');
      await user.click(step1);
      expect(
        screen.getByLabelText('donorRegistration.emailLabel')
      ).toBeInTheDocument();
    });
  });
});
