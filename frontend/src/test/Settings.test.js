import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from '../components/Settings';
import { AuthContext } from '../contexts/AuthContext';
import { notificationPreferencesAPI, profileAPI } from '../services/api';
import api from '../services/api';

// Mock the dependencies
jest.mock('../services/api');
jest.mock('../components/LanguageSwitcher', () => () => <div data-testid="language-switcher">Language Switcher</div>);
jest.mock('../components/RegionSelector', () => ({ value, onChange }) => (
  <div data-testid="region-selector" onClick={() => onChange({ country: 'CA', city: 'Toronto', timezone: 'America/Toronto' })}>
    Region Selector
  </div>
));
jest.mock('../components/ChangePasswordModal', () => ({ isOpen, onClose }) => (
  isOpen ? <div data-testid="change-password-modal" onClick={onClose}>Change Password Modal</div> : null
));

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
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
      if (typeof message === 'string' && message.includes('not wrapped in act')) {
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
    notificationPreferencesAPI.updatePreferences = jest.fn().mockResolvedValue({ data: {} });
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

  test('renders all main sections', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Language & Region')).toBeInTheDocument();
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Privacy & Data Consent')).toBeInTheDocument();
      expect(screen.getByText('Notification Types')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    renderSettings();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('loads and displays user profile data', async () => {
    renderSettings();

    await waitFor(() => {
      expect(profileAPI.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+11234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    });
  });

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
      const emailToggle = screen.getAllByRole('checkbox').find(cb => 
        cb.closest('.preference-item')?.textContent?.includes('Email Alerts')
      );
      expect(emailToggle).toBeChecked();
    });
  });

  test('handles input changes', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    expect(nameInput).toHaveValue('Jane Doe');
  });

  test('validates required full name', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  test('validates full name minimum length', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  test('validates required email', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('validates phone number format', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  test('clears field error when user starts typing', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });

    fireEvent.change(nameInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
    });
  });

  test('successfully saves profile changes', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  test('displays loading state while saving', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  test('handles profile update error', async () => {
    profileAPI.update.mockRejectedValue({
      response: { data: { message: 'Update failed' } },
    });

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  test('handles generic profile update error', async () => {
    profileAPI.update.mockRejectedValue(new Error('Network error'));

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  test('formats phone number to E.164 format', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileAPI.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+11234567890',
        })
      );
    });
  });

  test('handles profile image upload', async () => {
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockdata',
    };
    global.FileReader = jest.fn(() => mockFileReader);

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
  });

  test('validates profile image size', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]');

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText('Image size must be less than 5MB')).toBeInTheDocument();
    });
  });

  test('validates profile image type', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]');

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText('Please upload a valid image file')).toBeInTheDocument();
    });
  });

  test('opens change password modal', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);

    expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
  });

  test('closes change password modal', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);

    const modal = screen.getByTestId('change-password-modal');
    fireEvent.click(modal);

    await waitFor(() => {
      expect(screen.queryByTestId('change-password-modal')).not.toBeInTheDocument();
    });
  });

  test('toggles email alerts', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const emailToggle = checkboxes.find(cb => 
      cb.closest('.preference-item')?.textContent?.includes('Email Alerts')
    );

    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(notificationPreferencesAPI.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          emailNotificationsEnabled: true,
        })
      );
    });
  });

  test('toggles SMS alerts', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const smsToggle = checkboxes.find(cb => 
      cb.closest('.preference-item')?.textContent?.includes('SMS Alerts')
    );

    fireEvent.click(smsToggle);

    await waitFor(() => {
      expect(notificationPreferencesAPI.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          smsNotificationsEnabled: true,
        })
      );
    });
  });

  test('handles email alerts toggle error', async () => {
    notificationPreferencesAPI.updatePreferences.mockRejectedValue(new Error('Update failed'));

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const emailToggle = checkboxes.find(cb => 
      cb.closest('.preference-item')?.textContent?.includes('Email Alerts')
    );

    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByText('Failed to update email alerts. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles SMS alerts toggle error', async () => {
    notificationPreferencesAPI.updatePreferences.mockRejectedValue(new Error('Update failed'));

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const smsToggle = checkboxes.find(cb => 
      cb.closest('.preference-item')?.textContent?.includes('SMS Alerts')
    );

    fireEvent.click(smsToggle);

    await waitFor(() => {
      expect(screen.getByText('Failed to update SMS alerts. Please try again.')).toBeInTheDocument();
    });
  });

  test('toggles notification types', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    // Find a specific notification toggle
    const donationClaimedLabel = screen.getByText('Donation Claimed');
    const toggleContainer = donationClaimedLabel.closest('.notification-item');
    const toggle = toggleContainer.querySelector('input[type="checkbox"]');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(notificationPreferencesAPI.updatePreferences).toHaveBeenCalled();
    });
  });

  test('handles notification type toggle error', async () => {
    notificationPreferencesAPI.updatePreferences.mockRejectedValue(new Error('Update failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const donationClaimedLabel = screen.getByText('Donation Claimed');
    const toggleContainer = donationClaimedLabel.closest('.notification-item');
    const toggle = toggleContainer.querySelector('input[type="checkbox"]');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating notification type:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  test('auto-clears success message after 3 seconds', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Profile updated successfully!')).not.toBeInTheDocument();
    });
  });

  test('auto-clears preferences error after 3 seconds', async () => {
    notificationPreferencesAPI.updatePreferences.mockRejectedValue(new Error('Update failed'));

    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const emailToggle = checkboxes.find(cb => 
      cb.closest('.preference-item')?.textContent?.includes('Email Alerts')
    );

    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByText('Failed to update email alerts. Please try again.')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Failed to update email alerts. Please try again.')).not.toBeInTheDocument();
    });
  });

  test('renders RECEIVER role notifications', async () => {
    const receiverContext = { ...mockAuthContext, role: 'RECEIVER' };
    renderSettings(receiverContext);

    await waitFor(() => {
      expect(screen.getByText('New Donations')).toBeInTheDocument();
      expect(screen.getByText('New donation available matching your preferences')).toBeInTheDocument();
    });
  });

  test('renders ADMIN role notifications', async () => {
    const adminContext = { ...mockAuthContext, role: 'ADMIN' };
    renderSettings(adminContext);

    await waitFor(() => {
      expect(screen.getByText('Flagged Donations')).toBeInTheDocument();
      expect(screen.getByText('Suspicious Activity')).toBeInTheDocument();
    });
  });

  test('stores organization name in localStorage', async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('organizationName', 'Test Org');
    });
  });

  test('displays privacy policy link', () => {
    renderSettings();

    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    expect(privacyLink).toHaveAttribute('target', '_blank');
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

  test('handles profile fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    profileAPI.get.mockRejectedValue(new Error('Fetch failed'));

    renderSettings();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching profile from backend:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  test('handles notification preferences fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    notificationPreferencesAPI.getPreferences.mockRejectedValue(new Error('Fetch failed'));

    renderSettings();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching notification preferences:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

});
