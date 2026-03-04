import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    authAPI.checkEmailExists = jest.fn().mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists = jest.fn().mockResolvedValue({ data: { exists: false } });
  });

  test('accepts typing weak password in key-based field', () => {
    renderWithContext(<DonorRegistration />);
    const passwordInput = screen.getByPlaceholderText('donorRegistration.passwordPlaceholder');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByLabelText('donorRegistration.passwordLabel')).toHaveValue('weak');
  });

  test('shows key error when passwords do not match', () => {
    renderWithContext(<DonorRegistration />);
    fireEvent.change(screen.getByPlaceholderText('donorRegistration.passwordPlaceholder'), { target: { value: 'SecurePass123!' } });
    const confirm = screen.getByPlaceholderText('donorRegistration.confirmPasswordPlaceholder');
    fireEvent.change(confirm, { target: { value: 'DifferentPass456!' } });
    fireEvent.blur(confirm);
    expect(screen.getByText('donorRegistration.passwordMismatch')).toBeInTheDocument();
  });
});
