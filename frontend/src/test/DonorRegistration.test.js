import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

// Mock static imports used by the component
jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../style/Registration.css', () => ({}), { virtual: true });

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock API
jest.mock('../services/api', () => ({
    authAPI: { registerDonor: jest.fn() },
}));

import DonorRegistration from '../components/DonorRegistration';

// Mock AuthContext value
const mockAuthContextValue = {
    isLoggedIn: false,
    role: null,
    userId: null,
    login: jest.fn(),
    logout: jest.fn(),
};

describe('DonorRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    const renderWithAuth = (component) => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                {component}
            </AuthContext.Provider>
        );
    };

    const fillAllFields = async (user) => {
        await user.type(screen.getByLabelText(/^email address$/i), 'donor@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/organization name/i), 'Donor Org');
        await user.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
        await user.type(screen.getByLabelText(/phone number/i), '1234567890');
        await user.type(screen.getByLabelText(/^address$/i), '456 Main St');
        await user.selectOptions(screen.getByLabelText(/organization type/i), 'RESTAURANT');
        await user.type(screen.getByLabelText(/business license/i), 'BL-123456');
    };

    it('renders the form with all required fields', () => {
        renderWithAuth(<DonorRegistration />);
        expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
    });

    it('renders the illustration and description', () => {
        renderWithAuth(<DonorRegistration />);
        expect(screen.getByAltText(/donor illustration/i)).toBeInTheDocument();
        expect(screen.getByText(/your generosity provides meals/i)).toBeInTheDocument();
    });

    it('updates form values correctly', async () => {
        const user = userEvent.setup({ delay: null });
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        expect(screen.getByLabelText(/^email address$/i)).toHaveValue('donor@example.com');
        expect(screen.getByLabelText(/^password$/i)).toHaveValue('password123');
        expect(screen.getByLabelText(/organization name/i)).toHaveValue('Donor Org');
        expect(screen.getByLabelText(/contact person/i)).toHaveValue('Jane Doe');
        expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
        expect(screen.getByLabelText(/^address$/i)).toHaveValue('456 Main St');
        expect(screen.getByLabelText(/organization type/i)).toHaveValue('RESTAURANT');
        expect(screen.getByLabelText(/business license/i)).toHaveValue('BL-123456');
    }, 10000);

    it('business license field accepts only text', async () => {
        const user = userEvent.setup({ delay: null });
        renderWithAuth(<DonorRegistration />);
        const licenseInput = screen.getByLabelText(/business license/i);
        
        await user.clear(licenseInput);
        await user.type(licenseInput, 'ABC123');
        expect(licenseInput).toHaveValue('ABC123');
        
        await user.clear(licenseInput);
        await user.type(licenseInput, '987XYZ');
        expect(licenseInput).toHaveValue('987XYZ');
    });

    it('renders organization type options', () => {
        renderWithAuth(<DonorRegistration />);
        
        const select = screen.getByLabelText(/organization type/i);
        const options = Array.from(select.options).map(opt => opt.value);
        
        expect(options).toContain('RESTAURANT');
        expect(options).toContain('GROCERY_STORE');
        expect(options).toContain('EVENT_ORGANIZER');
        expect(options).toHaveLength(3);
    });

    it('business license field is optional', () => {
        renderWithAuth(<DonorRegistration />);
        const licenseInput = screen.getByLabelText(/business license/i);
        expect(licenseInput).not.toBeRequired();
        expect(screen.getByText(/optional but recommended/i)).toBeInTheDocument();
    });

    it('password field has minimum length requirement', () => {
        renderWithAuth(<DonorRegistration />);
        const passwordInput = screen.getByLabelText(/^password$/i);
        expect(passwordInput).toHaveAttribute('minLength', '8');
        expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
    });

    it('successfully registers donor with token and redirects', async () => {
        const user = userEvent.setup({ delay: null });
        authAPI.registerDonor.mockResolvedValueOnce({
            data: { 
                token: 'fake-token-123',
                userId: 'user-123', 
                role: 'DONOR' 
            }
        });
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        // Check loading state
        await waitFor(() => {
            expect(screen.getByText(/registering.../i)).toBeInTheDocument();
        });

        // Wait for API call
        await waitFor(() => {
            expect(authAPI.registerDonor).toHaveBeenCalledWith({
                email: 'donor@example.com',
                password: 'password123',
                organizationName: 'Donor Org',
                contactPerson: 'Jane Doe',
                phone: '1234567890',
                address: '456 Main St',
                organizationType: 'RESTAURANT',
                businessLicense: 'BL-123456'
            });
        });
        
        // Check success message
        await waitFor(() => {
            expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
        });

        // Check login was called
        expect(mockAuthContextValue.login).toHaveBeenCalledWith('fake-token-123', 'DONOR', 'user-123');
        
        // Fast-forward timers to trigger navigation
        jest.advanceTimersByTime(2000);
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/donor');
        });
    });

    it('successfully registers donor without token', async () => {
        const user = userEvent.setup({ delay: null });
        authAPI.registerDonor.mockResolvedValueOnce({
            data: { 
                userId: 'user-123', 
                role: 'DONOR' 
                // No token provided
            }
        });
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        await waitFor(() => {
            expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
        });

        // Login should not be called when token is missing
        expect(mockAuthContextValue.login).not.toHaveBeenCalled();
        
        jest.advanceTimersByTime(2000);
        
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/donor');
        });
    });

    it('displays error message when registration fails with server error', async () => {
        const user = userEvent.setup({ delay: null });
        authAPI.registerDonor.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } }
        });
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
        });

        // Should not navigate on error
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockAuthContextValue.login).not.toHaveBeenCalled();
    });

    it('displays generic error message when registration fails without specific message', async () => {
        const user = userEvent.setup({ delay: null });
        authAPI.registerDonor.mockRejectedValueOnce(new Error('Network error'));
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
        });
    });

    it('clears error and success messages on new submission', async () => {
        const user = userEvent.setup({ delay: null });
        
        // First submission fails
        authAPI.registerDonor.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } }
        });
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
        });

        // Second submission should clear error
        authAPI.registerDonor.mockResolvedValueOnce({
            data: { 
                token: 'fake-token',
                userId: 'user-123', 
                role: 'DONOR' 
            }
        });

        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.queryByText(/email already exists/i)).not.toBeInTheDocument();
            expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
        });
    });

    it('disables submit button while submitting', async () => {
        const user = userEvent.setup({ delay: null });
        authAPI.registerDonor.mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
        );
        
        renderWithAuth(<DonorRegistration />);
        await fillAllFields(user);
        
        const submitButton = screen.getByRole('button', { name: /register as donor/i });
        await user.click(submitButton);
        
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/registering.../i)).toBeInTheDocument();
    });

    it('navigates back to register page when clicking back button', async () => {
        const user = userEvent.setup({ delay: null });
        renderWithAuth(<DonorRegistration />);
        
        const backButton = screen.getByRole('button', { name: /^back$/i });
        await user.click(backButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('handles form input changes correctly', async () => {
        const user = userEvent.setup({ delay: null });
        renderWithAuth(<DonorRegistration />);
        
        const emailInput = screen.getByLabelText(/^email address$/i);
        await user.type(emailInput, 'test@example.com');
        
        expect(emailInput).toHaveValue('test@example.com');
    });

    it('address field is a textarea', () => {
        renderWithAuth(<DonorRegistration />);
        const addressInput = screen.getByLabelText(/^address$/i);
        expect(addressInput.tagName).toBe('TEXTAREA');
        expect(addressInput).toHaveAttribute('rows', '3');
    });
});