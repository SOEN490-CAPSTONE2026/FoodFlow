import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import AdminSettings from '../components/AdminDashboard/AdminSettings';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../components/AdminDashboard/Admin_Styles/AdminSettings.css', () => ({}));

jest.mock('../components/LanguageSwitcher', () => () => (
  <div data-testid="language-switcher" />
));
jest.mock('../components/RegionSelector', () => ({ onChange }) => (
  <div data-testid="region-selector">
    <button type="button" onClick={() => onChange?.({ timezone: 'UTC' })}>
      trigger-region-change
    </button>
  </div>
));
jest.mock(
  '../../ChangePasswordModal',
  () =>
    ({ isOpen, onClose }) =>
      isOpen ? <div data-testid="change-password-modal" /> : null
);

const renderWithContext = (
  contextValue = { role: 'ADMIN', userId: 'u1', organizationName: 'Org' }
) =>
  render(
    <AuthContext.Provider value={contextValue}>
      <AdminSettings />
    </AuthContext.Provider>
  );

describe('AdminSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders key-based sections', () => {
    renderWithContext();
    expect(
      screen.getByText('adminSettings.sections.account')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminSettings.sections.languageRegion')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminSettings.sections.notificationPreferences')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminSettings.sections.notificationTypes')
    ).toBeInTheDocument();
  });

  test('renders key-based placeholders and organization default', () => {
    renderWithContext();
    const orgInput = screen.getByPlaceholderText(
      'adminSettings.placeholders.organization'
    );
    expect(orgInput).toHaveValue('Org');
    expect(
      screen.getByPlaceholderText('adminSettings.placeholders.fullName')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('adminSettings.placeholders.email')
    ).toBeInTheDocument();
  });

  test('opens change password modal via key button', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('adminSettings.changePassword'));
    expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
  });

  test('shows validation errors when save is clicked with empty required fields', async () => {
    renderWithContext();

    fireEvent.click(screen.getByText('adminSettings.saveChanges'));

    expect(
      await screen.findByText('adminSettings.validation.fullNameRequired')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminSettings.validation.emailRequired')
    ).toBeInTheDocument();
  });

  test('validates invalid email and phone format', async () => {
    renderWithContext();

    fireEvent.change(
      screen.getByPlaceholderText('adminSettings.placeholders.fullName'),
      { target: { value: 'Admin User' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('adminSettings.placeholders.email'),
      {
        target: { value: 'bad-email' },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText('adminSettings.placeholders.phone'),
      {
        target: { value: 'invalid-phone' },
      }
    );

    fireEvent.click(screen.getByText('adminSettings.saveChanges'));

    expect(
      await screen.findByText('adminSettings.validation.emailInvalid')
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminSettings.validation.phoneInvalid')
    ).toBeInTheDocument();
  });

  test('shows success message after valid save flow', async () => {
    jest.useFakeTimers();
    renderWithContext();

    fireEvent.change(
      screen.getByPlaceholderText('adminSettings.placeholders.fullName'),
      { target: { value: 'Admin User' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('adminSettings.placeholders.email'),
      {
        target: { value: 'admin@example.com' },
      }
    );

    fireEvent.click(screen.getByText('adminSettings.saveChanges'));
    expect(screen.getByText('adminSettings.saving')).toBeInTheDocument();

    jest.advanceTimersByTime(500);

    expect(
      await screen.findByText('adminSettings.messages.profileUpdated')
    ).toBeInTheDocument();
  });

  test('shows image size error for files larger than 5MB', async () => {
    renderWithContext();
    const fileInput = document.querySelector('input[type="file"]');
    const largeFile = new File([new Uint8Array(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      await screen.findByText('adminSettings.validation.imageSize')
    ).toBeInTheDocument();
  });

  test('shows image file type error for non-image uploads', async () => {
    renderWithContext();
    const fileInput = document.querySelector('input[type="file"]');
    const nonImage = new File(['hello'], 'note.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [nonImage] } });

    expect(
      await screen.findByText('adminSettings.validation.imageFile')
    ).toBeInTheDocument();
  });

  test('toggles alert preferences and toggles admin notification type', async () => {
    renderWithContext();

    const checkboxes = screen.getAllByRole('checkbox');
    const emailToggle = checkboxes[0];
    const smsToggle = checkboxes[1];
    const firstAdminToggle = checkboxes[2];

    expect(emailToggle).not.toBeChecked();
    expect(smsToggle).not.toBeChecked();
    expect(firstAdminToggle).toBeChecked();

    fireEvent.click(emailToggle);
    fireEvent.click(smsToggle);
    fireEvent.click(firstAdminToggle);

    await waitFor(() => {
      expect(emailToggle).toBeChecked();
      expect(smsToggle).toBeChecked();
      expect(firstAdminToggle).not.toBeChecked();
    });
  });

  test('handles region selector callback without crashing', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('trigger-region-change'));
    expect(screen.getByTestId('region-selector')).toBeInTheDocument();
  });
});
