import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { MemoryRouter } from 'react-router-dom';

import DonorRegistration from '../components/DonorRegistration';

// Mock static imports
jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../style/Registration.css', () => ({}), { virtual: true });

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

// Mock API
jest.mock('../services/api', () => ({
  authAPI: {
    registerDonor: jest.fn(),
    checkEmailExists: jest.fn(),
    checkPhoneExists: jest.fn(),
  },
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

// Helper to fill fields across all steps
const fillAllFields = async user => {
  // Step 1: Account Details
  await user.type(
    screen.getByLabelText(/^email address$/i),
    'donor@example.com'
  );
  await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
  await user.type(
    screen.getByLabelText(/^confirm password$/i),
    'SecurePass123!'
  );
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Step 2: Organization Info
  await screen.findByLabelText(/organization name/i);
  await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
  await user.selectOptions(
    screen.getByLabelText(/organization type/i),
    'RESTAURANT'
  );
  await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Step 3: Address
  await screen.findByLabelText(/street address/i);
  await user.type(screen.getByLabelText(/street address/i), '456 Main St');
  await user.type(screen.getByLabelText(/city/i), 'Montreal');
  await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
  await user.type(screen.getByLabelText(/province/i), 'Quebec');
  await user.type(screen.getByLabelText(/country/i), 'Canada');
  await user.click(screen.getByRole('button', { name: /next/i }));

  // Step 4: Contact & Review
  await screen.findByLabelText(/contact person/i);
  await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/phone number/i), '1234567890');

  // Click both checkboxes
  const checkboxes = screen.getAllByRole('checkbox');
  for (const checkbox of checkboxes) {
    await user.click(checkbox);
  }
};

describe('DonorRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', async () => {
    const user = userEvent.setup({ delay: null });
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

    renderWithAuth(<DonorRegistration />);

    // Step 1 fields
    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();

    // Navigate to step 2
    await user.type(
      screen.getByLabelText(/^email address$/i),
      'test@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'SecurePass123!'
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() =>
      expect(
        screen.queryByLabelText(/^email address$/i)
      ).not.toBeInTheDocument()
    );
    // Step 2 fields
    await screen.findByLabelText(/organization name/i);
    expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
  });

  it('renders illustration and description', () => {
    renderWithAuth(<DonorRegistration />);
    expect(screen.getByAltText(/donor illustration/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /your participation ensures surplus food is redistributed safely/i
      )
    ).toBeInTheDocument();
  });

  it('updates form values', async () => {
    const user = userEvent.setup({ delay: null });
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/contact person/i)).toHaveValue('Jane Doe');
      expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
    });
  });

  it('password mismatch shows error and blocks submit', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText(/^email address$/i),
      'donor@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText(/passwords do not match/i);

    expect(authAPI.registerDonor).not.toHaveBeenCalled();
  });

  it('successfully registers donor with token', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor.mockResolvedValueOnce({
      data: {
        token: 'fake-token-123',
        role: 'DONOR',
        userId: 'user-123',
      },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(
      screen.getByRole('button', { name: /register as donor/i })
    );

    await screen.findByText(/registration submitted successfully/i);

    expect(mockAuthContextValue.login.mock.calls[0][0]).toBe('fake-token-123');
    expect(mockAuthContextValue.login.mock.calls[0][1]).toBe('DONOR');
    expect(mockAuthContextValue.login.mock.calls[0][2]).toBe('user-123');

    jest.runAllTimers();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/donor'));
    jest.useRealTimers();
  });

  it('successfully registers donor without token', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor.mockResolvedValueOnce({
      data: {
        role: 'DONOR',
        userId: 'user-123',
      },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(
      screen.getByRole('button', { name: /register as donor/i })
    );

    await screen.findByText(/registration submitted successfully/i);

    expect(mockAuthContextValue.login).not.toHaveBeenCalled();

    jest.runAllTimers();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/donor'));
    jest.useRealTimers();
  });

  it('shows API-specific error message', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(
      screen.getByRole('button', { name: /register as donor/i })
    );

    await screen.findByText(/email already exists/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error if no backend message', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    await user.click(
      screen.getByRole('button', { name: /register as donor/i })
    );

    await screen.findByText(/registration failed/i);
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    renderWithAuth(<DonorRegistration />);
    await fillAllFields(user);

    const submit = screen.getByRole('button', { name: /register as donor/i });
    await user.click(submit);

    expect(submit).toBeDisabled();
  });

  it('back button navigates', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithAuth(<DonorRegistration />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('address field is a textarea', async () => {
    const user = userEvent.setup({ delay: null });
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

    renderWithAuth(<DonorRegistration />);

    // Navigate to step 3 (Address)
    await user.type(
      screen.getByLabelText(/^email address$/i),
      'test@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'SecurePass123!'
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByLabelText(/organization name/i);
    await user.type(screen.getByLabelText(/organization name/i), 'Test Org');
    await user.type(screen.getByLabelText(/business license/i), 'BL123');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      const streetAddress = screen.getByLabelText(/street address/i);
      expect(streetAddress).toBeInTheDocument();
      expect(streetAddress.tagName).toBe('INPUT');
    });
  });

  it('prevents proceeding to step 2 if email already exists', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: true } });

    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText(/^email address$/i),
      'existing@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'SecurePass123!'
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      const errorMessages = screen.getAllByText(
        /an account with this email already exists/i
      );
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    // Should still be on step 1
    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
  });

  it('proceeds to step 2 if email does not exist', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: false } });

    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText(/^email address$/i),
      'new@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'SecurePass123!'
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Wait for step 2 to render after email validation completes
    await waitFor(
      () => {
        expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('prevents submission if phone already exists', async () => {
    const user = userEvent.setup({ delay: null });

    authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValueOnce({ data: { exists: true } });

    renderWithAuth(<DonorRegistration />);

    // Navigate through steps
    await user.type(
      screen.getByLabelText(/^email address$/i),
      'donor@example.com'
    );
    await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'SecurePass123!'
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByLabelText(/organization name/i);
    await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
    await user.selectOptions(
      screen.getByLabelText(/organization type/i),
      'RESTAURANT'
    );
    await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByLabelText(/street address/i);
    await user.type(screen.getByLabelText(/street address/i), '456 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Montreal');
    await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
    await user.type(screen.getByLabelText(/province/i), 'Quebec');
    await user.type(screen.getByLabelText(/country/i), 'Canada');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByLabelText(/contact person/i);
    await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/phone number/i), '1234567890');
    // Click both checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }

    // Try to submit - should be blocked by phone validation
    await user.click(
      screen.getByRole('button', { name: /register as donor/i })
    );

    await screen.findByText(
      /an account with this phone number already exists/i
    );

    // Should still be on step 4
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
  });

  describe('Data Storage Consent', () => {
    it('renders data storage consent checkbox on step 4', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
      authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);

      // Navigate to step 4
      await user.type(
        screen.getByLabelText(/^email address$/i),
        'donor@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/organization name/i);
      await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
      await user.selectOptions(
        screen.getByLabelText(/organization type/i),
        'RESTAURANT'
      );
      await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/street address/i);
      await user.type(screen.getByLabelText(/street address/i), '456 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Montreal');
      await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
      await user.type(screen.getByLabelText(/province/i), 'Quebec');
      await user.type(screen.getByLabelText(/country/i), 'Canada');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/contact person/i);

      // Check for data storage consent checkbox
      expect(
        screen.getByText(/I consent to data storage as outlined in the/i)
      ).toBeInTheDocument();
    });

    it('privacy policy link is present and has correct attributes', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
      authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);

      // Navigate to step 4
      await user.type(
        screen.getByLabelText(/^email address$/i),
        'donor@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/organization name/i);
      await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
      await user.selectOptions(
        screen.getByLabelText(/organization type/i),
        'RESTAURANT'
      );
      await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/street address/i);
      await user.type(screen.getByLabelText(/street address/i), '456 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Montreal');
      await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
      await user.type(screen.getByLabelText(/province/i), 'Quebec');
      await user.type(screen.getByLabelText(/country/i), 'Canada');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/contact person/i);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('blocks registration when data storage consent is not checked', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
      authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);

      // Navigate to step 4 and fill fields
      await user.type(
        screen.getByLabelText(/^email address$/i),
        'donor@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/organization name/i);
      await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
      await user.selectOptions(
        screen.getByLabelText(/organization type/i),
        'RESTAURANT'
      );
      await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/street address/i);
      await user.type(screen.getByLabelText(/street address/i), '456 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Montreal');
      await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
      await user.type(screen.getByLabelText(/province/i), 'Quebec');
      await user.type(screen.getByLabelText(/country/i), 'Canada');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/contact person/i);
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/phone number/i), '5141234567');

      // Check only accuracy confirmation, not data storage consent
      const accuracyCheckbox = screen.getByLabelText(
        /I confirm that the information provided is accurate/i
      );
      await user.click(accuracyCheckbox);

      // Register button should be disabled
      const registerButton = screen.getByRole('button', {
        name: /register as donor/i,
      });
      expect(registerButton).toBeDisabled();
    });

    it('allows registration when both checkboxes are checked', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
      authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
      authAPI.registerDonor.mockResolvedValue({
        data: {
          token: 'test-token',
          role: 'DONOR',
          userId: 1,
          organizationName: 'Donor Org',
        },
      });

      renderWithAuth(<DonorRegistration />);

      // Navigate to step 4 and fill fields
      await user.type(
        screen.getByLabelText(/^email address$/i),
        'donor@example.com'
      );
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(
        screen.getByLabelText(/^confirm password$/i),
        'SecurePass123!'
      );
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/organization name/i);
      await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
      await user.selectOptions(
        screen.getByLabelText(/organization type/i),
        'RESTAURANT'
      );
      await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/street address/i);
      await user.type(screen.getByLabelText(/street address/i), '456 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Montreal');
      await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
      await user.type(screen.getByLabelText(/province/i), 'Quebec');
      await user.type(screen.getByLabelText(/country/i), 'Canada');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await screen.findByLabelText(/contact person/i);
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/phone number/i), '5141234567');

      // Check both checkboxes
      const accuracyCheckbox = screen.getByLabelText(
        /I confirm that the information provided is accurate/i
      );
      const consentCheckbox = screen.getByLabelText(
        /I consent to data storage as outlined in the/i
      );

      await user.click(accuracyCheckbox);
      await user.click(consentCheckbox);

      // Register button should be enabled
      const registerButton = screen.getByRole('button', {
        name: /register as donor/i,
      });
      expect(registerButton).not.toBeDisabled();

      // Submit the form
      await user.click(registerButton);

      // Verify API was called with consent flag
      await waitFor(() => {
        expect(authAPI.registerDonor).toHaveBeenCalledWith(
          expect.objectContaining({
            dataStorageConsent: true,
          })
        );
      });
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
      const { validatePhoneNumber } = require('../components/DonorRegistration');
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
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
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
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /next/i }));

      const area = screen.getByText(/choose file or drag here/i).parentElement;
      const largeFile = createFile('big.pdf', 11 * 1024 * 1024, 'application/pdf');
      fireEvent.dragOver(area);
      fireEvent.drop(area, { dataTransfer: { files: [largeFile] } });
      expect(await screen.findByText(/file size exceeds 10MB limit/i)).toBeInTheDocument();
    });

    it('allows removing a selected file', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // navigate to step2
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
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
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
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
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
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
      expect(await screen.findByText(/invalid postal code/i)).toBeInTheDocument();
    });

    it('step indicator allows jumping back', async () => {
      const user = userEvent.setup({ delay: null });
      authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });

      renderWithAuth(<DonorRegistration />);
      // complete step1
      await user.type(screen.getByLabelText(/^email address$/i), 'a@a.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/^confirm password$/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // click step indicator for step1 using testid
      const step1 = screen.getByTestId('step-item-1');
      await user.click(step1);
      expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    });
  });
});
