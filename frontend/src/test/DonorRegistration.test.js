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
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      const input = screen.getByLabelText(/choose file or drag here/i);
      const badFile = createFile('file.txt', 100, 'text/plain');
      await user.upload(input, badFile);
      // error message should mention PDF (part of localized string)
      expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    });

    it('shows error when file size exceeds limit via drop', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step 2
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      const area = screen.getByText(/choose file or drag here/i).parentElement;
      const largeFile = createFile(
        'big.pdf',
        11 * 1024 * 1024,
        'application/pdf'
      );
      fireEvent.dragOver(area);
      fireEvent.drop(area, { dataTransfer: { files: [largeFile] } });
      expect(
        await screen.findByText(/file size exceeds 10MB limit/i)
      ).toBeInTheDocument();
    });

    it('allows removing a selected file', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step2
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      const goodFile = createFile('doc.pdf', 1024, 'application/pdf');
      const input = screen.getByLabelText(/choose file or drag here/i);
      await user.upload(input, goodFile);
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /✕/i }));
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument();
    });

    it('adds dragging class during dragOver and removes on dragLeave', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step 2
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      const area = screen.getByText(/choose file or drag here/i).parentElement;
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
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/organization name/i);
      await user.type(screen.getByLabelText(/organization name/i), 'Org');
      // organizationType defaults to RESTAURANT, supply business license so step passes
      await user.type(screen.getByLabelText(/business license/i), 'BL1');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/street address/i);
      await user.type(screen.getByLabelText(/street address$/i), '123');
      await user.type(screen.getByLabelText(/city/i), 'City');
      const postal = screen.getByLabelText(/postal code/i);
      await user.type(postal, '###');
      await postal.blur();
      expect(
        await screen.findByText(/invalid postal code/i)
      ).toBeInTheDocument();
    });

    it('step indicator allows jumping back', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // complete step1
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      // click step indicator for step1 using testid
      const step1 = screen.getByTestId('step-item-1');
      await user.click(step1);
      expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    });
  });
});
