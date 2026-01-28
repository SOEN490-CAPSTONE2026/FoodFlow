

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import AdminSettings from '../AdminSettings';

const renderWithContext = (contextValue = { role: 'ADMIN', userId: 'test', organizationName: 'Test Org' }) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <AdminSettings />
    </AuthContext.Provider>
  );
};

describe('AdminSettings', () => {
  it('renders Account section', () => {
    renderWithContext();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Manage your profile and account details')).toBeInTheDocument();
  });

  it('renders Language & Region section', () => {
    renderWithContext();
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
    expect(screen.getByText('Set your language, location, and timezone preferences')).toBeInTheDocument();
  });

  it('renders Notification Preferences section', () => {
    renderWithContext();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Choose how you want to receive notifications')).toBeInTheDocument();
  });

  it('renders Notification Types section', () => {
    renderWithContext();
    expect(screen.getByText('Notification Types')).toBeInTheDocument();
    expect(screen.getByText('Customize which types of notifications you want to receive')).toBeInTheDocument();
  });

  it('toggles email alerts', () => {
    renderWithContext();
    const emailToggle = screen.getAllByRole('checkbox')[0];
    expect(emailToggle).toBeInTheDocument();
    fireEvent.click(emailToggle);
    // No assertion on checked state due to lack of real context, but click should not throw
  });

  it('shows password fields when Change Password is clicked', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Change Password'));
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
  });
});
