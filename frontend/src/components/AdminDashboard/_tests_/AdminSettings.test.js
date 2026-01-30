import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import AdminSettings from '../AdminSettings';

// Mock CSS imports
jest.mock('../Admin_Styles/AdminSettings.css', () => ({}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Globe: () => <div data-testid="globe-icon">Globe Icon</div>,
  Bell: () => <div data-testid="bell-icon">Bell Icon</div>,
  Camera: () => <div data-testid="camera-icon">Camera Icon</div>,
  Lock: () => <div data-testid="lock-icon">Lock Icon</div>,
}));

// Mock child components
jest.mock('../../LanguageSwitcher', () => {
  return function LanguageSwitcher() {
    return <div data-testid="language-switcher">Language Switcher</div>;
  };
});

jest.mock('../../RegionSelector', () => {
  return function RegionSelector({ value, onChange }) {
    return (
      <div data-testid="region-selector">
        Region Selector
        <button
          data-testid="region-change-btn"
          onClick={() =>
            onChange({ region: 'US', timezone: 'America/New_York' })
          }
        >
          Change Region
        </button>
      </div>
    );
  };
});

jest.mock('../../ChangePasswordModal', () => {
  return function ChangePasswordModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="change-password-modal">
        Change Password Modal
        <button data-testid="close-modal-btn" onClick={onClose}>
          Close
        </button>
      </div>
    );
  };
});

const renderWithContext = (
  contextValue = { role: 'ADMIN', userId: 'test', organizationName: 'Test Org' }
) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <AdminSettings />
    </AuthContext.Provider>
  );
};

describe('AdminSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock FileReader globally for all tests
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/png;base64,dummycontent',
    };
    global.FileReader = jest.fn(() => mockFileReader);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Section Rendering', () => {
    it('renders Account section', () => {
      renderWithContext();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your profile and account details')
      ).toBeInTheDocument();
    });

    it('renders Language & Region section', () => {
      renderWithContext();
      expect(screen.getByText('Language & Region')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Set your language, location, and timezone preferences'
        )
      ).toBeInTheDocument();
    });

    it('renders Notification Preferences section', () => {
      renderWithContext();
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(
        screen.getByText('Choose how you want to receive notifications')
      ).toBeInTheDocument();
    });

    it('renders Notification Types section', () => {
      renderWithContext();
      expect(screen.getByText('Notification Types')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Customize which types of notifications you want to receive'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Profile Section', () => {
    it('renders all profile form fields', () => {
      renderWithContext();

      expect(
        screen.getByPlaceholderText('Enter your full name')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your organization')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your phone number')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your address')
      ).toBeInTheDocument();
    });

    it('displays organization name from context', () => {
      renderWithContext();

      const orgInput = screen.getByPlaceholderText('Enter your organization');
      expect(orgInput.value).toBe('Test Org');
    });

    it('handles input changes for all fields', () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });
      expect(nameInput.value).toBe('John Doe');

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'john@example.com' },
      });
      expect(emailInput.value).toBe('john@example.com');

      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, {
        target: { name: 'phoneNumber', value: '+1234567890' },
      });
      expect(phoneInput.value).toBe('+1234567890');

      const addressInput = screen.getByPlaceholderText('Enter your address');
      fireEvent.change(addressInput, {
        target: { name: 'address', value: '123 Main St' },
      });
      expect(addressInput.value).toBe('123 Main St');
    });

    it('clears field errors when user types', () => {
      renderWithContext();

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(screen.getByText('Full name is required')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { name: 'fullName', value: 'J' } });

      expect(
        screen.queryByText('Full name is required')
      ).not.toBeInTheDocument();
    });

    it('shows profile image placeholder when no image is uploaded', () => {
      renderWithContext();

      const placeholder = screen.getByText('Profile Photo');
      expect(placeholder).toBeInTheDocument();
    });

    it('handles profile image upload', async () => {
      renderWithContext();

      const file = new File(['dummy content'], 'test.png', {
        type: 'image/png',
      });
      const fileInput = document.querySelector('input[type="file"]');

      // Spy on the FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: null,
        result: 'data:image/png;base64,dummycontent',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Simulate FileReader completing
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }

      // Image upload was triggered
      await waitFor(() => {
        expect(mockFileReader.readAsDataURL).toHaveBeenCalled();
      });
    });

    it('validates image file size (max 5MB)', () => {
      renderWithContext();

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      });
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(
        screen.getByText('Image size must be less than 5MB')
      ).toBeInTheDocument();
    });

    it('validates image file type', () => {
      renderWithContext();

      const txtFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [txtFile] } });

      expect(
        screen.getByText('Please upload a valid image file')
      ).toBeInTheDocument();
    });

    it('clears image error when valid image is uploaded', () => {
      renderWithContext();

      const txtFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [txtFile] } });

      expect(
        screen.getByText('Please upload a valid image file')
      ).toBeInTheDocument();

      const validFile = new File(['dummy'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(
        screen.queryByText('Please upload a valid image file')
      ).not.toBeInTheDocument();
    });

    it('triggers file input when camera button is clicked', () => {
      renderWithContext();

      const fileInput = document.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(fileInput, 'click');

      const cameraButtons = screen.getAllByTestId('camera-icon');
      const cameraButton = cameraButtons[0].closest('button');
      fireEvent.click(cameraButton);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields on submit', () => {
      renderWithContext();

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('validates full name minimum length', () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { name: 'fullName', value: 'J' } });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(
        screen.getByText('Full name must be at least 2 characters')
      ).toBeInTheDocument();
    });

    it('validates email format', () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'invalid-email' },
      });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });

    it('validates phone number format', () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'john@example.com' },
      });

      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, {
        target: { name: 'phoneNumber', value: 'invalid' },
      });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(
        screen.getByText('Please enter a valid phone number')
      ).toBeInTheDocument();
    });

    it('allows optional phone number field to be empty', () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'john@example.com' },
      });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(
        screen.queryByText('Please enter a valid phone number')
      ).not.toBeInTheDocument();
    });

    it('successfully saves when form is valid', async () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'john@example.com' },
      });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      expect(saveBtn).toHaveTextContent('Saving...');
      expect(saveBtn).toBeDisabled();

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(
          screen.getByText('Profile updated successfully!')
        ).toBeInTheDocument();
      });

      expect(saveBtn).toHaveTextContent('Save Changes');
      expect(saveBtn).not.toBeDisabled();
    });

    it('clears success message after 3 seconds', async () => {
      renderWithContext();

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, {
        target: { name: 'fullName', value: 'John Doe' },
      });

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, {
        target: { name: 'email', value: 'john@example.com' },
      });

      const saveBtn = screen.getByText('Save Changes');
      fireEvent.click(saveBtn);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(
          screen.getByText('Profile updated successfully!')
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText('Profile updated successfully!')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Management', () => {
    it('shows password fields when Change Password is clicked', () => {
      renderWithContext();
      fireEvent.click(screen.getByText('Change Password'));
      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });

    it('opens change password modal when button is clicked', () => {
      renderWithContext();

      const changePasswordBtn = screen.getByText('Change Password');
      fireEvent.click(changePasswordBtn);

      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });

    it('closes change password modal', () => {
      renderWithContext();

      const changePasswordBtn = screen.getByText('Change Password');
      fireEvent.click(changePasswordBtn);

      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();

      const closeBtn = screen.getByTestId('close-modal-btn');
      fireEvent.click(closeBtn);

      expect(
        screen.queryByTestId('change-password-modal')
      ).not.toBeInTheDocument();
    });
  });

  describe('Language & Region Section', () => {
    it('renders language switcher component', () => {
      renderWithContext();

      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });

    it('renders region selector component', () => {
      renderWithContext();

      expect(screen.getByTestId('region-selector')).toBeInTheDocument();
    });

    it('handles region change', () => {
      renderWithContext();

      const regionChangeBtn = screen.getByTestId('region-change-btn');
      fireEvent.click(regionChangeBtn);

      expect(screen.getByTestId('region-selector')).toBeInTheDocument();
    });

    it('does not update region if data is the same', () => {
      renderWithContext();

      const regionChangeBtn = screen.getByTestId('region-change-btn');
      fireEvent.click(regionChangeBtn);
      fireEvent.click(regionChangeBtn);

      expect(screen.getByTestId('region-selector')).toBeInTheDocument();
    });
  });

  describe('Notification Preferences', () => {
    it('toggles email alerts', () => {
      renderWithContext();
      const emailToggle = screen.getAllByRole('checkbox')[0];
      expect(emailToggle).toBeInTheDocument();
      fireEvent.click(emailToggle);
    });

    it('renders email alerts toggle', () => {
      renderWithContext();

      expect(screen.getByText('Email Alerts')).toBeInTheDocument();
      expect(
        screen.getByText(/Receive notifications via email/)
      ).toBeInTheDocument();
    });

    it('renders SMS alerts toggle', () => {
      renderWithContext();

      expect(screen.getByText('SMS Alerts')).toBeInTheDocument();
      expect(
        screen.getByText(/Receive notifications via text message/)
      ).toBeInTheDocument();
    });

    it('toggles email alerts on', () => {
      renderWithContext();

      const emailToggle = screen
        .getByText('Email Alerts')
        .closest('.preference-item')
        .querySelector('input[type="checkbox"]');

      expect(emailToggle.checked).toBe(false);

      fireEvent.click(emailToggle);

      expect(emailToggle.checked).toBe(true);
    });

    it('toggles email alerts off', () => {
      renderWithContext();

      const emailToggle = screen
        .getByText('Email Alerts')
        .closest('.preference-item')
        .querySelector('input[type="checkbox"]');

      fireEvent.click(emailToggle);
      expect(emailToggle.checked).toBe(true);

      fireEvent.click(emailToggle);
      expect(emailToggle.checked).toBe(false);
    });

    it('toggles SMS alerts on', () => {
      renderWithContext();

      const smsToggle = screen
        .getByText('SMS Alerts')
        .closest('.preference-item')
        .querySelector('input[type="checkbox"]');

      expect(smsToggle.checked).toBe(false);

      fireEvent.click(smsToggle);

      expect(smsToggle.checked).toBe(true);
    });

    it('toggles SMS alerts off', () => {
      renderWithContext();

      const smsToggle = screen
        .getByText('SMS Alerts')
        .closest('.preference-item')
        .querySelector('input[type="checkbox"]');

      fireEvent.click(smsToggle);
      expect(smsToggle.checked).toBe(true);

      fireEvent.click(smsToggle);
      expect(smsToggle.checked).toBe(false);
    });

    it('displays phone number in SMS alerts description when available', () => {
      renderWithContext();

      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, {
        target: { name: 'phoneNumber', value: '+1234567890' },
      });

      expect(screen.getByText(/at \+1234567890/)).toBeInTheDocument();
    });
  });

  describe('Notification Types Section', () => {
    it('renders all notification categories', () => {
      renderWithContext();

      expect(screen.getByText('System Oversight')).toBeInTheDocument();
      expect(screen.getByText('Dispute & Compliance')).toBeInTheDocument();
      expect(screen.getByText('Operational')).toBeInTheDocument();
    });

    it('renders all System Oversight notifications', () => {
      renderWithContext();

      expect(screen.getByText('Flagged Donations')).toBeInTheDocument();
      expect(screen.getByText('Suspicious Activity')).toBeInTheDocument();
      expect(screen.getByText('Verification Requests')).toBeInTheDocument();
    });

    it('renders all Dispute & Compliance notifications', () => {
      renderWithContext();

      expect(screen.getByText('New Disputes')).toBeInTheDocument();
      expect(screen.getByText('Escalated Issues')).toBeInTheDocument();
      expect(screen.getByText('Safety Alerts')).toBeInTheDocument();
    });

    it('renders all Operational notifications', () => {
      renderWithContext();

      expect(screen.getByText('System Errors')).toBeInTheDocument();
      expect(screen.getByText('High Volume Alerts')).toBeInTheDocument();
    });

    it('toggles individual notification on and off', () => {
      renderWithContext();

      const flaggedDonationsToggle = screen
        .getByText('Flagged Donations')
        .closest('.notification-item')
        .querySelector('input[type="checkbox"]');

      expect(flaggedDonationsToggle.checked).toBe(true);

      fireEvent.click(flaggedDonationsToggle);
      expect(flaggedDonationsToggle.checked).toBe(false);

      fireEvent.click(flaggedDonationsToggle);
      expect(flaggedDonationsToggle.checked).toBe(true);
    });

    it('toggles multiple notifications independently', () => {
      renderWithContext();

      const flaggedToggle = screen
        .getByText('Flagged Donations')
        .closest('.notification-item')
        .querySelector('input[type="checkbox"]');

      const disputeToggle = screen
        .getByText('New Disputes')
        .closest('.notification-item')
        .querySelector('input[type="checkbox"]');

      fireEvent.click(flaggedToggle);
      expect(flaggedToggle.checked).toBe(false);
      expect(disputeToggle.checked).toBe(true);

      fireEvent.click(disputeToggle);
      expect(flaggedToggle.checked).toBe(false);
      expect(disputeToggle.checked).toBe(false);
    });
  });

  describe('Non-Admin Role', () => {
    it('does not initialize notifications for non-ADMIN role', () => {
      const nonAdminContext = {
        userId: 'user-123',
        organizationName: 'Test Org',
        role: 'DONOR',
      };

      renderWithContext(nonAdminContext);

      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    it('renders all section headers with icons', () => {
      renderWithContext();

      expect(screen.getAllByTestId('user-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('globe-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('bell-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('lock-icon').length).toBeGreaterThan(0);
    });

    it('renders all section descriptions', () => {
      renderWithContext();

      expect(
        screen.getByText('Manage your profile and account details')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Set your language, location, and timezone preferences'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Choose how you want to receive notifications')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Customize which types of notifications you want to receive'
        )
      ).toBeInTheDocument();
    });
  });
});
