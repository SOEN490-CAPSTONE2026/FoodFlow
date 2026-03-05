import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReceiverRegistration from '../ReceiverRegistration';
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

describe('ReceiverRegistration - Password Validation', () => {
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
    renderWithContext(<ReceiverRegistration />);
    const passwordInput = screen.getByPlaceholderText(
      'receiverRegistration.passwordPlaceholder'
    );
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(
      screen.getByLabelText('receiverRegistration.passwordLabel')
    ).toHaveValue('weak');
  });

  test('shows key error when passwords do not match', () => {
    renderWithContext(<ReceiverRegistration />);
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.passwordPlaceholder'),
      { target: { value: 'SecurePass123!' } }
    );
    const confirm = screen.getByPlaceholderText(
      'receiverRegistration.confirmPasswordPlaceholder'
    );
    fireEvent.change(confirm, { target: { value: 'DifferentPass456!' } });
    fireEvent.blur(confirm);
    expect(
      screen.getByText('receiverRegistration.passwordMismatch')
    ).toBeInTheDocument();
  });

  test('shows email validation error when email check fails', async () => {
    authAPI.checkEmailExists.mockRejectedValueOnce(new Error('network'));
    renderWithContext(<ReceiverRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.emailPlaceholder'),
      { target: { value: 'receiver@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText('receiverRegistration.emailValidationError')
      ).toBeInTheDocument();
    });
  });

  test('completes receiver registration and submits payload', async () => {
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
    authAPI.registerReceiver = jest.fn().mockResolvedValue({
      data: {
        token: 'token',
        role: 'RECEIVER',
        userId: 7,
        organizationName: 'Community Kitchen',
        verificationStatus: 'PENDING',
        accountStatus: 'PENDING_VERIFICATION',
      },
    });

    renderWithContext(<ReceiverRegistration />);

    // Step 1
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.emailPlaceholder'),
      { target: { value: 'receiver@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    // Step 2
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(
          'receiverRegistration.organizationNamePlaceholder'
        )
      ).toBeInTheDocument()
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.organizationNamePlaceholder'
      ),
      { target: { value: 'Community Kitchen' } }
    );
    fireEvent.change(screen.getByLabelText('receiverRegistration.organizationTypeLabel'), {
      target: { value: 'CHARITY' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.charityRegistrationPlaceholder'
      ),
      { target: { value: 'CRN-987' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    // Step 3
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('receiverRegistration.streetAddressPlaceholder')
      ).toBeInTheDocument()
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.streetAddressPlaceholder'),
      { target: { value: '456 Hope St' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.cityPlaceholder'),
      { target: { value: 'Montreal' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.postalCodePlaceholder'),
      { target: { value: 'H2H 2H2' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.provincePlaceholder'),
      { target: { value: 'QC' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.countryPlaceholder'),
      { target: { value: 'Canada' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    // Step 4
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('receiverRegistration.contactPersonPlaceholder')
      ).toBeInTheDocument()
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.contactPersonPlaceholder'),
      { target: { value: 'Jamie Receiver' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.phonePlaceholder'),
      { target: { value: '4385551212' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.capacityPlaceholder'),
      { target: { value: '120' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    // Step 5
    await waitFor(() =>
      expect(
        screen.getByText('receiverRegistration.reviewOperationsTitle')
      ).toBeInTheDocument()
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.registerButtonText',
      })
    );

    await waitFor(() => {
      expect(authAPI.registerReceiver).toHaveBeenCalledTimes(1);
    });
    expect(authAPI.registerReceiver).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'receiver@foodflow.org',
        organizationName: 'Community Kitchen',
        phone: '+14385551212',
      })
    );
    expect(mockLogin).toHaveBeenCalled();
  });

  test('keeps next disabled without verification method on organization step', async () => {
    renderWithContext(<ReceiverRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.emailPlaceholder'),
      { target: { value: 'receiver2@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(
          'receiverRegistration.organizationNamePlaceholder'
        )
      ).toBeInTheDocument()
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.organizationNamePlaceholder'
      ),
      { target: { value: 'No Doc Receiver' } }
    );
    fireEvent.change(screen.getByLabelText('receiverRegistration.organizationTypeLabel'), {
      target: { value: 'CHARITY' },
    });
    expect(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    ).toBeDisabled();
  });

  test('shows file size error for oversized upload', async () => {
    renderWithContext(<ReceiverRegistration />);

    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.emailPlaceholder'),
      { target: { value: 'receiver3@foodflow.org' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('receiverRegistration.passwordPlaceholder'),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'receiverRegistration.confirmPasswordPlaceholder'
      ),
      { target: { value: 'StrongPass1!' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'receiverRegistration.nextButtonText',
      })
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(
          'receiverRegistration.organizationNamePlaceholder'
        )
      ).toBeInTheDocument()
    );

    const bigFile = new File(['x'.repeat(1024)], 'big.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    const fileInput = document.getElementById('fileUpload');
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('receiverRegistration.fileSizeError')
      ).toBeInTheDocument();
    });
  });
});
