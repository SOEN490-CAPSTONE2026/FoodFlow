import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DonorRegistration from '../DonorRegistration';
import { AuthContext } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

jest.mock('../../services/api');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithContext = component =>
  render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthContext.Provider>
  );

describe('DonorRegistration - Password Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authAPI.checkEmailExists = jest
      .fn()
      .mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists = jest
      .fn()
      .mockResolvedValue({ data: { exists: false } });
  });

  test('accepts typing weak password in key-based field', () => {
    renderWithContext(<DonorRegistration />);
    const passwordInput = screen.getByPlaceholderText(
      'donorRegistration.passwordPlaceholder'
    );
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(
      screen.getByLabelText('donorRegistration.passwordLabel')
    ).toHaveValue('weak');
  });

  test('shows key error when passwords do not match', () => {
    renderWithContext(<DonorRegistration />);
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'),
      { target: { value: 'SecurePass123!' } }
    );
    const confirm = screen.getByPlaceholderText(
      'donorRegistration.confirmPasswordPlaceholder'
    );
    fireEvent.change(confirm, { target: { value: 'DifferentPass456!' } });
    fireEvent.blur(confirm);
    expect(
      screen.getByText('donorRegistration.passwordMismatch')
    ).toBeInTheDocument();
  });

  test('shows email exists error when moving from step 1', async () => {
    authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: true } });
    renderWithContext(<DonorRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.emailPlaceholder'),
      { target: { value: 'existing@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    await waitFor(() => {
      expect(
        screen.getByText('donorRegistration.emailExistsError')
      ).toBeInTheDocument();
    });
  });

  test('completes registration flow and submits formatted payload', async () => {
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerDonor = jest.fn().mockResolvedValue({
      data: {
        token: 'token',
        role: 'DONOR',
        userId: 42,
        organizationName: 'Food Rescue Org',
        verificationStatus: 'PENDING',
        accountStatus: 'PENDING_VERIFICATION',
      },
    });

    renderWithContext(<DonorRegistration />);

    // Step 1
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.emailPlaceholder'),
      { target: { value: 'donor@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    // Step 2
    await screen.findByPlaceholderText(
      'donorRegistration.organizationNamePlaceholder'
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.organizationNamePlaceholder'
      ),
      { target: { value: 'Food Rescue Org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.businessLicensePlaceholder'
      ),
      { target: { value: 'BL-123' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    // Step 3
    await screen.findByPlaceholderText(
      'donorRegistration.streetAddressPlaceholder'
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.streetAddressPlaceholder'),
      { target: { value: '123 Main St' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.cityPlaceholder'),
      { target: { value: 'Montreal' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.postalCodePlaceholder'),
      { target: { value: 'H1H 1H1' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.provincePlaceholder'),
      { target: { value: 'QC' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.countryPlaceholder'),
      { target: { value: 'Canada' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    // Step 4
    await screen.findByPlaceholderText(
      'donorRegistration.contactPersonPlaceholder'
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.contactPersonPlaceholder'),
      { target: { value: 'Alex Donor' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.phonePlaceholder'),
      { target: { value: '5145551212' } }
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'donorRegistration.registerButtonText',
      })
    );

    await waitFor(() => {
      expect(authAPI.registerDonor).toHaveBeenCalledTimes(1);
    });

    expect(authAPI.registerDonor).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'donor@foodflow.org',
        organizationName: 'Food Rescue Org',
        phone: '+15145551212',
      })
    );
    expect(mockLogin).toHaveBeenCalled();
  });

  test('keeps next disabled when no license or document on step 2', async () => {
    renderWithContext(<DonorRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.emailPlaceholder'),
      { target: { value: 'donor2@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    await screen.findByPlaceholderText(
      'donorRegistration.organizationNamePlaceholder'
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.organizationNamePlaceholder'
      ),
      { target: { value: 'Org No Docs' } }
    );

    expect(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    ).toBeDisabled();
  });

  test('shows file type validation error for unsupported upload', async () => {
    renderWithContext(<DonorRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.emailPlaceholder'),
      { target: { value: 'donor3@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'donorRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'donorRegistration.nextButtonText' })
    );

    await screen.findByPlaceholderText(
      'donorRegistration.organizationNamePlaceholder'
    );

    const fileInput = document.getElementById('fileUpload');
    const invalidFile = new File(['x'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('donorRegistration.fileTypeError')
      ).toBeInTheDocument();
    });
  });
});
