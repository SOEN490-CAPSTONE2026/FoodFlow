// src/components/ReceiverRegistration.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';

// Mock static imports used by the component
jest.mock('../assets/illustrations/receiver-ilustration.jpg', () => 'receiver.jpg');
jest.mock('../components/Registration.css', () => ({}), { virtual: true });

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock API
jest.mock('../services/api', () => ({
    authAPI: { 
        registerReceiver: jest.fn(),
        checkEmailExists: jest.fn(),
        checkPhoneExists: jest.fn(),
    },
}));
import { authAPI } from '../services/api';

import ReceiverRegistration from '../components/ReceiverRegistration';

const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

// Mock AuthContext value
const mockAuthContextValue = {
    isLoggedIn: false,
    role: null,
    userId: null,
    login: jest.fn(),
    logout: jest.fn(),
};

describe('ReceiverRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithAuth = (component) => {
        return render(
            <AuthContext.Provider value={mockAuthContextValue}>
                {component}
            </AuthContext.Provider>
        );
    };

    const fillAllFields = async (user) => {
        // Step 1: Account
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 2: Organization
        await waitFor(() => expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/organization name/i), 'Food Helpers');
        await user.selectOptions(screen.getByLabelText(/organization type/i), 'SHELTER');
        await user.type(screen.getByLabelText(/charity.*registration number/i), 'CRN-12345');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 3: Address
        await waitFor(() => expect(screen.getByLabelText(/street address/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/street address/i), '123 Main St');
        await user.type(screen.getByLabelText(/city/i), 'Montreal');
        await user.type(screen.getByLabelText(/postal code/i), 'H1A1A1');
        await user.type(screen.getByLabelText(/province/i), 'Quebec');
        await user.type(screen.getByLabelText(/country/i), 'Canada');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 4: Contact
        await waitFor(() => expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/contact person/i), 'Alex Doe');
        await user.type(screen.getByLabelText(/phone/i), '5145551234');
        await user.type(screen.getByLabelText(/daily capacity/i), '150');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 5: Review - check confirm accuracy checkbox
        await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument());
        await user.click(screen.getByRole('checkbox'));
    };

    test('shows error when passwords do not match and prevents submission', async () => {
        const user = userEvent.setup();
        renderWithAuth(<ReceiverRegistration />);

        await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'different');
        await user.click(screen.getByRole('button', { name: /next/i }));

        expect(await screen.findByText(/passwords do not match/i)).toBeTruthy();
        expect(authAPI.registerReceiver).not.toHaveBeenCalled();
    });

    test('renders the form with all required fields', async () => {
        const user = userEvent.setup();
        authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
        
        renderWithAuth(<ReceiverRegistration />);
        
        // Check step 1 fields
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        
        // Navigate through steps to verify all fields exist
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() => {
            expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/charity.*registration number/i)).toBeInTheDocument();
        });
    });

    test('updates form values', async () => {
        const user = userEvent.setup();
        authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
        
        renderWithAuth(<ReceiverRegistration />);
        
        const email = screen.getByLabelText(/email address/i);
        await user.type(email, 'test@example.com');
        expect(email).toHaveValue('test@example.com');

        const password = screen.getByLabelText(/^password$/i);
        await user.type(password, 'password123');
        expect(password).toHaveValue('password123');
        
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() => expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument());
        
        const org = screen.getByLabelText(/organization name/i);
        await user.type(org, 'Food Helpers');
        expect(org).toHaveValue('Food Helpers');
    });

    test('shows API error message from server and does not navigate', async () => {
        const user = userEvent.setup();
        authAPI.checkEmailExists.mockResolvedValue({ data: { exists: false } });
        authAPI.checkPhoneExists.mockResolvedValue({ data: { exists: false } });
        authAPI.registerReceiver.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } },
        });

        renderWithAuth(<ReceiverRegistration />);
        await fillAllFields(user);

        await user.click(screen.getByRole('button', { name: /submit registration/i }));

        expect(await screen.findByText(/email already exists/i)).toBeTruthy();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(setItemSpy).not.toHaveBeenCalled();
    }, 10000);

    test('Back button goes to /register', async () => {
        const user = userEvent.setup();
        renderWithAuth(<ReceiverRegistration />);
        await user.click(screen.getByRole('button', { name: /cancel/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    test('prevents proceeding to step 2 if email already exists', async () => {
        const user = userEvent.setup();
        
        authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: true } });
        
        renderWithAuth(<ReceiverRegistration />);
        
        await user.type(screen.getByLabelText(/^email address$/i), 'existing@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() =>
            expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument()
        );
        
        // Should still be on step 1
        expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    });

    test('proceeds to step 2 if email does not exist', async () => {
        const user = userEvent.setup();
        
        authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: false } });
        
        renderWithAuth(<ReceiverRegistration />);
        
        await user.type(screen.getByLabelText(/^email address$/i), 'new@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Wait for step 2 to render after email validation completes
        await waitFor(() => {
            expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    test('prevents proceeding if phone already exists', async () => {
        const user = userEvent.setup({ delay: null });
        
        authAPI.checkEmailExists.mockResolvedValueOnce({ data: { exists: false } });
        authAPI.checkPhoneExists.mockResolvedValueOnce({ data: { exists: true } });
        
        renderWithAuth(<ReceiverRegistration />);
        
        // Step 1
        await user.type(screen.getByLabelText(/^email address$/i), 'receiver@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password1234');
        await user.type(screen.getByLabelText(/^confirm password$/i), 'password1234');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 2
        await waitFor(() => expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/organization name/i), 'Receiver Org');
        await user.selectOptions(screen.getByLabelText(/organization type/i), 'FOOD_BANK');
        await user.type(screen.getByLabelText(/charity.*nonprofit registration number/i), 'CH-123456');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 3
        await waitFor(() => expect(screen.getByLabelText(/street address/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/street address/i), '123 Receiver St');
        await user.type(screen.getByLabelText(/city/i), 'Toronto');
        await user.type(screen.getByLabelText(/postal code/i), 'M1M1M1');
        await user.type(screen.getByLabelText(/province/i), 'Ontario');
        await user.type(screen.getByLabelText(/country/i), 'Canada');
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        // Step 4
        await waitFor(() => expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument());
        await user.type(screen.getByLabelText(/contact person/i), 'John Smith');
        await user.type(screen.getByLabelText(/phone number/i), '4165551234');
        await user.type(screen.getByLabelText(/daily capacity/i), '200');
        
        // Try to go to next step - should be blocked
        await user.click(screen.getByRole('button', { name: /next/i }));
        
        await waitFor(() =>
            expect(screen.getByText(/an account with this phone number already exists/i)).toBeInTheDocument()
        );
        
        // Should still be on step 4
        expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
    });
});
