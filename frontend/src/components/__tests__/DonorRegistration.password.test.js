import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DonorRegistration from '../DonorRegistration';
import { AuthContext } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api');

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
    }),
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const renderWithContext = (component) => {
    return render(
        <AuthContext.Provider value={{ login: mockLogin }}>
            <BrowserRouter>
                {component}
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('DonorRegistration - Password Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authAPI.checkEmailExists = jest.fn().mockResolvedValue({ data: { exists: false } });
        authAPI.checkPhoneExists = jest.fn().mockResolvedValue({ data: { exists: false } });
    });

    test('should show error for password shorter than 10 characters', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'Short1!' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
        });
    });

    test('should show error for password without uppercase letter', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'lowercase123!' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
        });
    });

    test('should show error for password without lowercase letter', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'UPPERCASE123!' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
        });
    });

    test('should show error for password without digit', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'NoDigitsHere!' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/contain at least one digit/i)).toBeInTheDocument();
        });
    });

    test('should show error for password without special character', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'NoSpecial123' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/contain at least one special character/i)).toBeInTheDocument();
        });
    });

    test('should show error for common password', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'password' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            expect(screen.getByText(/too common/i)).toBeInTheDocument();
        });
    });

    test('should accept valid password', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
            const errorElements = screen.queryAllByText(/password must/i);
            expect(errorElements.length).toBe(0);
        });
    });

    test('should show error when passwords do not match', async () => {
        renderWithContext(<DonorRegistration />);

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const confirmPasswordInput = screen.getByPlaceholderText('Re-enter your password');

        fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass456!' } });
        fireEvent.blur(confirmPasswordInput);

        await waitFor(() => {
            expect(screen.getByText(/donorRegistration.passwordMismatch/i)).toBeInTheDocument();
        });
    });

    test('should display password policy hint', () => {
        renderWithContext(<DonorRegistration />);

        expect(screen.getByText(/minimum 10 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
        expect(screen.getByText(/lowercase/i)).toBeInTheDocument();
        expect(screen.getByText(/digit/i)).toBeInTheDocument();
        expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });

    test('should prevent form submission with weak password', async () => {
        authAPI.registerDonor = jest.fn();
        renderWithContext(<DonorRegistration />);

        // Fill in all required fields
        fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'weak' }
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
            target: { value: 'weak' }
        });

        // Try to proceed to next step
        const nextButton = screen.getByText(/next/i);
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(authAPI.registerDonor).not.toHaveBeenCalled();
        });
    });

    test('should allow form submission with strong password', async () => {
        authAPI.registerDonor = jest.fn().mockResolvedValue({
            data: {
                token: 'test-token',
                role: 'DONOR',
                userId: 1,
                organizationName: 'Test Org',
                verificationStatus: 'verified',
                accountStatus: 'ACTIVE'
            }
        });

        renderWithContext(<DonorRegistration />);

        // Fill in step 1 - Account Credentials
        fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'SecurePass123!' }
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
            target: { value: 'SecurePass123!' }
        });

        // Click next
        const nextButton = screen.getByText(/next/i);
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(authAPI.checkEmailExists).toHaveBeenCalledWith('test@example.com');
        });
    });
});
