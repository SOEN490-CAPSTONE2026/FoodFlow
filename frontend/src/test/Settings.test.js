import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from '../components/Settings';
import { AuthContext } from '../contexts/AuthContext';

import { notificationPreferencesAPI, profileAPI } from '../services/api';
import api from '../services/api';

// Mock the dependencies
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
  profileAPI: {
    get: jest.fn(),
    update: jest.fn(),
  },
  notificationPreferencesAPI: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  },
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

jest.mock('../components/LanguageSwitcher', () => () => (
  <div data-testid="language-switcher">Language Switcher</div>
));
jest.mock('../components/RegionSelector', () => ({ value, onChange }) => (
  <div
    data-testid="region-selector"
    onClick={() =>
      onChange({
        country: 'US',
        city: 'New York',
        timezone: 'America/New_York',
      })
    }
  >
    Region Selector
  </div>
));
jest.mock(
  '../components/ChangePasswordModal',
  () =>
    ({ isOpen, onClose }) =>
      isOpen ? (
        <div data-testid="change-password-modal" onClick={onClose}>
          Change Password Modal
        </div>
      ) : null
);

describe('Settings', () => {
  const mockAuthContext = {
    userId: 'user123',
    organizationName: 'Test Org',
    role: 'DONOR',
  };

  const mockProfileData = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+11234567890',
    phoneNumber: '+11234567890',
    organizationName: 'Test Org',
    organizationAddress: '123 Main St',
    address: '123 Main St',
    profilePhoto: 'http://example.com/photo.jpg',
  };

  const mockRegionData = {
    country: 'CA',
    city: 'Toronto',
    timezone: 'America/Toronto',
  };

  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    Storage.prototype.setItem = jest.fn();

    // Suppress act() warnings
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(message => {
        if (
          typeof message === 'string' &&
          message.includes('not wrapped in act')
        ) {
          return;
        }
        console.warn(message);
      });

    // Mock API responses
    profileAPI.get = jest.fn().mockResolvedValue({ data: mockProfileData });
    profileAPI.update = jest.fn().mockResolvedValue({ data: mockProfileData });
    api.get = jest.fn().mockResolvedValue({ data: mockRegionData });
    api.put = jest.fn().mockResolvedValue({ data: {} });
    notificationPreferencesAPI.getPreferences = jest.fn().mockResolvedValue({
      data: {
        emailNotificationsEnabled: false,
        smsNotificationsEnabled: false,
        notificationTypes: {},
      },
    });
    notificationPreferencesAPI.updatePreferences = jest
      .fn()
      .mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  const renderSettings = (authContextValue = mockAuthContext) => {
    return render(
      <AuthContext.Provider value={authContextValue}>
        <Settings />
      </AuthContext.Provider>
    );
  };

  describe('Component Rendering', () => {
    test('renders all main sections', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('settings.account.title')).toBeInTheDocument();
        expect(
          screen.getByText('settings.languageRegion.title')
        ).toBeInTheDocument();
        expect(
          screen.getByText('settings.notificationPreferences.title')
        ).toBeInTheDocument();
        expect(screen.getByText('Privacy & Data Consent')).toBeInTheDocument();
        expect(
          screen.getByText('settings.notificationTypes.title')
        ).toBeInTheDocument();
      });
    });

    test('displays loading state initially', () => {
      renderSettings();
      expect(
        screen.getByText('settings.account.loadingProfile')
      ).toBeInTheDocument();
    });

    test('renders LanguageSwitcher component', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      });
    });

    test('renders RegionSelector component', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByTestId('region-selector')).toBeInTheDocument();
      });
    });

    test('displays privacy policy link', () => {
      renderSettings();

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Profile Data Management', () => {
    test('loads and displays user profile data', async () => {
      renderSettings();

      await waitFor(() => {
        expect(profileAPI.get).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('john@example.com')
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('+11234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
      });
    });

    test('handles input changes', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(
        'settings.account.fullNamePlaceholder'
      );
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      expect(nameInput).toHaveValue('Jane Doe');
    });

    test('handles profile fetch error gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      profileAPI.get.mockRejectedValue(new Error('Fetch failed'));

      renderSettings();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching profile from backend:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('stores organization name in localStorage on save', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'organizationName',
          'Test Org'
        );
      });
    });
  });

  describe('Form Validation', () => {
    test('validates required full name', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(
        'settings.account.fullNamePlaceholder'
      );
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });
    });

    test('validates full name minimum length', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(
        'settings.account.fullNamePlaceholder'
      );
      fireEvent.change(nameInput, { target: { value: 'A' } });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Full name must be at least 2 characters')
        ).toBeInTheDocument();
      });
    });

    test('validates required email', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText(
        'settings.account.emailPlaceholder'
      );
      fireEvent.change(emailInput, { target: { value: '' } });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText(
        'settings.account.emailPlaceholder'
      );
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      });
    });

    test('validates phone number format', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const phoneInput = screen.getByPlaceholderText(
        'settings.account.phonePlaceholder'
      );
      fireEvent.change(phoneInput, { target: { value: 'abc' } });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid phone number')
        ).toBeInTheDocument();
      });
    });

    test('successfully saves valid profile', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(profileAPI.update).toHaveBeenCalled();
        expect(
          screen.getByText('settings.account.profileUpdated')
        ).toBeInTheDocument();
      });
    });

    test('handles profile update error', async () => {
      profileAPI.update.mockRejectedValue(new Error('Update failed'));

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('settings.account.updateFailed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Password Management', () => {
    test('opens change password modal', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const changePasswordButton = screen.getByText(
        'settings.account.changePassword'
      );
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
      });
    });

    test('closes change password modal', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const changePasswordButton = screen.getByText(
        'settings.account.changePassword'
      );
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('change-password-modal');
      fireEvent.click(modal);

      await waitFor(() => {
        expect(
          screen.queryByTestId('change-password-modal')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Image Management', () => {
    test('handles profile image upload', async () => {
      const { container } = renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const file = new File(['dummy content'], 'profile.jpg', {
        type: 'image/jpeg',
      });
      const imageInput = container.querySelector('input[type="file"]');

      Object.defineProperty(imageInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(imageInput);

      // Image is loaded into state but not saved until "Save Changes" is clicked
      await waitFor(() => {
        const img = screen.getByAltText('Profile');
        expect(img).toBeInTheDocument();
      });
    });

    test('validates image file size', async () => {
      const { container } = renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const imageInput = container.querySelector('input[type="file"]');

      Object.defineProperty(imageInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(imageInput);

      await waitFor(() => {
        expect(
          screen.getByText('Image size must be less than 5MB')
        ).toBeInTheDocument();
      });
    });

    test('validates image file type', async () => {
      const { container } = renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const textFile = new File(['dummy content'], 'document.txt', {
        type: 'text/plain',
      });
      const imageInput = container.querySelector('input[type="file"]');

      Object.defineProperty(textFile, 'size', {
        value: 1024,
        writable: false,
      });

      Object.defineProperty(imageInput, 'files', {
        value: [textFile],
        writable: false,
      });

      fireEvent.change(imageInput);

      await waitFor(() => {
        expect(
          screen.getByText('Please upload a valid image file')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Region Settings', () => {
    test('loads region data', async () => {
      renderSettings();

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/profile/region');
      });
    });

    test('handles region change', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Wait for region data to load first
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/profile/region');
      });

      const regionSelector = screen.getByTestId('region-selector');
      fireEvent.click(regionSelector);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/profile/region',
          expect.objectContaining({
            country: 'US',
            city: 'New York',
            timezone: 'America/New_York',
          })
        );
      });
    });

    test('handles region update error', async () => {
      const localErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.put.mockRejectedValueOnce(new Error('Update failed'));

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Wait for region data to load first
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/profile/region');
      });

      const regionSelector = screen.getByTestId('region-selector');
      fireEvent.click(regionSelector);

      await waitFor(() => {
        expect(localErrorSpy).toHaveBeenCalledWith(
          'Error saving region:',
          expect.any(Error)
        );
      });

      localErrorSpy.mockRestore();
    });
  });

  describe('Notification Preferences', () => {
    test('loads notification preferences', async () => {
      notificationPreferencesAPI.getPreferences.mockResolvedValue({
        data: {
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: true,
          notificationTypes: {},
        },
      });

      renderSettings();

      await waitFor(() => {
        const emailToggle = screen
          .getAllByRole('checkbox')
          .find(cb =>
            cb
              .closest('.preference-item')
              ?.textContent?.includes(
                'settings.notificationPreferences.emailAlerts'
              )
          );
        expect(emailToggle).toBeChecked();
      });
    });

    test('toggles email alerts', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const emailToggle = checkboxes.find(cb =>
        cb
          .closest('.preference-item')
          ?.textContent?.includes(
            'settings.notificationPreferences.emailAlerts'
          )
      );

      fireEvent.click(emailToggle);

      await waitFor(() => {
        expect(
          notificationPreferencesAPI.updatePreferences
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            emailNotificationsEnabled: true,
          })
        );
      });
    });

    test('toggles SMS alerts', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const smsToggle = checkboxes.find(cb =>
        cb
          .closest('.preference-item')
          ?.textContent?.includes('settings.notificationPreferences.smsAlerts')
      );

      fireEvent.click(smsToggle);

      await waitFor(() => {
        expect(
          notificationPreferencesAPI.updatePreferences
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            smsNotificationsEnabled: true,
          })
        );
      });
    });

    test('handles email alerts toggle error', async () => {
      notificationPreferencesAPI.updatePreferences.mockRejectedValue(
        new Error('Update failed')
      );

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const emailToggle = checkboxes.find(cb =>
        cb
          .closest('.preference-item')
          ?.textContent?.includes(
            'settings.notificationPreferences.emailAlerts'
          )
      );

      fireEvent.click(emailToggle);

      await waitFor(() => {
        expect(
          screen.getByText('settings.notificationPreferences.updateFailed')
        ).toBeInTheDocument();
      });
    });

    test('handles SMS alerts toggle error', async () => {
      notificationPreferencesAPI.updatePreferences.mockRejectedValue(
        new Error('Update failed')
      );

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const smsToggle = checkboxes.find(cb =>
        cb
          .closest('.preference-item')
          ?.textContent?.includes('settings.notificationPreferences.smsAlerts')
      );

      fireEvent.click(smsToggle);

      await waitFor(() => {
        expect(
          screen.getByText('settings.notificationPreferences.updateFailed')
        ).toBeInTheDocument();
      });
    });

    test('handles notification preferences fetch error gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      notificationPreferencesAPI.getPreferences.mockRejectedValue(
        new Error('Fetch failed')
      );

      renderSettings();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching notification preferences:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Notification Types', () => {
    test('toggles notification types', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Find a specific notification toggle
      const donationClaimedLabel = screen.getByText(
        'settings.notificationTypes.donor.donationClaimed'
      );
      const toggleContainer =
        donationClaimedLabel.closest('.notification-item');
      const toggle = toggleContainer.querySelector('input[type="checkbox"]');

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(notificationPreferencesAPI.updatePreferences).toHaveBeenCalled();
      });
    });

    test('handles notification type toggle error', async () => {
      notificationPreferencesAPI.updatePreferences.mockRejectedValue(
        new Error('Update failed')
      );
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const donationClaimedLabel = screen.getByText(
        'settings.notificationTypes.donor.donationClaimed'
      );
      const toggleContainer =
        donationClaimedLabel.closest('.notification-item');
      const toggle = toggleContainer.querySelector('input[type="checkbox"]');

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error updating notification type:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('renders DONOR role notifications', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.getByText('settings.notificationTypes.donor.donationClaimed')
        ).toBeInTheDocument();
        expect(
          screen.getByText('settings.notificationTypes.donor.claimCanceled')
        ).toBeInTheDocument();
      });
    });

    test('renders RECEIVER role notifications', async () => {
      const receiverContext = { ...mockAuthContext, role: 'RECEIVER' };
      renderSettings(receiverContext);

      await waitFor(() => {
        expect(
          screen.getByText(
            'settings.notificationTypes.receiver.newDonationAvailable'
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'settings.notificationTypes.receiver.donationReadyForPickup'
          )
        ).toBeInTheDocument();
      });
    });

    test('renders ADMIN role notifications', async () => {
      const adminContext = { ...mockAuthContext, role: 'ADMIN' };
      renderSettings(adminContext);

      await waitFor(() => {
        expect(
          screen.getByText('settings.notificationTypes.admin.donationFlagged')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'settings.notificationTypes.admin.suspiciousActivity'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('UI State Management', () => {
    test('auto-clears success message after 3 seconds', async () => {
      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('settings.account.profileUpdated')
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.profileUpdated')
        ).not.toBeInTheDocument();
      });
    });

    test('auto-clears preferences error after 3 seconds', async () => {
      notificationPreferencesAPI.updatePreferences.mockRejectedValue(
        new Error('Update failed')
      );

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const emailToggle = checkboxes.find(cb =>
        cb
          .closest('.preference-item')
          ?.textContent?.includes(
            'settings.notificationPreferences.emailAlerts'
          )
      );

      fireEvent.click(emailToggle);

      await waitFor(() => {
        expect(
          screen.getByText('settings.notificationPreferences.updateFailed')
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText('settings.notificationPreferences.updateFailed')
        ).not.toBeInTheDocument();
      });
    });

    test('displays loading indicator during save', async () => {
      profileAPI.update.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ data: mockProfileData }), 100)
          )
      );

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('settings.account.saveChanges');
      fireEvent.click(saveButton);

      expect(screen.getByText('settings.account.saving')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing userId gracefully', () => {
      const noUserContext = { ...mockAuthContext, userId: null };
      renderSettings(noUserContext);

      expect(profileAPI.get).not.toHaveBeenCalled();
    });

    test('handles missing organization name', () => {
      const noOrgContext = { ...mockAuthContext, organizationName: null };
      renderSettings(noOrgContext);

      expect(screen.queryByDisplayValue('Test Org')).not.toBeInTheDocument();
    });

    test('handles empty profile data response', async () => {
      profileAPI.get.mockResolvedValue({ data: {} });

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getByText('settings.account.title')).toBeInTheDocument();
    });

    test('handles invalid profile photo URL', async () => {
      profileAPI.get.mockResolvedValue({
        data: {
          ...mockProfileData,
          profilePhoto: 'invalid-url',
        },
      });

      renderSettings();

      await waitFor(() => {
        expect(
          screen.queryByText('settings.account.loadingProfile')
        ).not.toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getByText('settings.account.title')).toBeInTheDocument();
    });
  });
});
