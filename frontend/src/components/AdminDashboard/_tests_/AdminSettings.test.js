import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import AdminSettings from '../AdminSettings';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../Admin_Styles/AdminSettings.css', () => ({}));

jest.mock('../../LanguageSwitcher', () => () => (
  <div data-testid="language-switcher" />
));
jest.mock('../../RegionSelector', () => () => (
  <div data-testid="region-selector" />
));
jest.mock(
  '../../ChangePasswordModal',
  () =>
    ({ isOpen }) =>
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
});
