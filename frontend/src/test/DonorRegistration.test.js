import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { MemoryRouter } from 'react-router-dom';
import DonorRegistration from '../components/DonorRegistration';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../style/Registration.css', () => ({}), { virtual: true });

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

jest.mock('../services/api', () => ({
  authAPI: {
    registerDonor: jest.fn(),
    checkEmailExists: jest.fn(),
    checkPhoneExists: jest.fn(),
  },
}));

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

describe('DonorRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
    authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
  });

  test('renders key-based step 1 fields', () => {
    renderWithAuth(<DonorRegistration />);
    expect(
      screen.getByLabelText('donorRegistration.emailLabel')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('donorRegistration.passwordLabel')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel')
    ).toBeInTheDocument();
  });

  test('shows password mismatch key', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText('donorRegistration.emailLabel'),
      'donor@example.com'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.passwordLabel'),
      'SecurePass123!'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
      'WrongPass123!'
    );
    await user.click(screen.getByText('donorRegistration.nextButtonText'));

    expect(
      await screen.findByText('donorRegistration.passwordMismatch')
    ).toBeInTheDocument();
  });

  test('progresses to next step with valid step 1', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DonorRegistration />);

    await user.type(
      screen.getByLabelText('donorRegistration.emailLabel'),
      'donor@example.com'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.passwordLabel'),
      'SecurePass123!'
    );
    await user.type(
      screen.getByLabelText('donorRegistration.confirmPasswordLabel'),
      'SecurePass123!'
    );
    await user.click(screen.getByText('donorRegistration.nextButtonText'));

    await waitFor(() => {
      expect(
        screen.getByLabelText('donorRegistration.organizationNameLabel')
      ).toBeInTheDocument();
    });
  });
});
