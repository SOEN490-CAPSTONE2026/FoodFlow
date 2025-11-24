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
    authAPI: { registerReceiver: jest.fn() },
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
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.type(screen.getByLabelText(/organization name/i), 'Food Helpers');
        await user.type(screen.getByLabelText(/contact person/i), 'Alex Doe');
        await user.type(screen.getByLabelText(/phone number/i), '5145551234');
        await user.type(screen.getByLabelText(/^address$/i), '123 Main St, Montreal, QC');
        await user.selectOptions(screen.getByLabelText(/organization type/i), 'SHELTER');
        await user.type(screen.getByLabelText(/charity registration number/i), 'CRN-12345');
        await user.type(screen.getByLabelText(/daily capacity/i), '150');
    };

    test('renders the form with all required fields', () => {
        renderWithAuth(<ReceiverRegistration />);
        expect(screen.getByRole('heading', { name: /register as receiver/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/charity registration number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/daily capacity/i)).toBeInTheDocument();
    });

    test('updates form values', async () => {
        renderWithAuth(<ReceiverRegistration />);
        const email = screen.getByLabelText(/email address/i);
        await userEvent.type(email, 'test@example.com');
        expect(email).toHaveValue('test@example.com');

        const password = screen.getByLabelText(/password/i);
        await userEvent.type(password, 'password123');
        expect(password).toHaveValue('password123');

        const org = screen.getByLabelText(/organization name/i);
        await userEvent.type(org, 'Food Helpers');
        expect(org).toHaveValue('Food Helpers');
    });


    test('shows API error message from server and does not navigate', async () => {
        const user = userEvent.setup();
        authAPI.registerReceiver.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } },
        });

        renderWithAuth(<ReceiverRegistration />);
        await fillAllFields(user);

        await user.click(screen.getByRole('button', { name: /register as receiver/i }));

        expect(await screen.findByText(/email already exists/i)).toBeTruthy();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(setItemSpy).not.toHaveBeenCalled();
    }, 10000);

    test('Back button goes to /register', async () => {
        renderWithAuth(<ReceiverRegistration />);
        await userEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    test('sends null for capacity when left blank', async () => {
        const user = userEvent.setup();
        authAPI.registerReceiver.mockResolvedValueOnce({ data: {} });

        renderWithAuth(<ReceiverRegistration />);

        await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.type(screen.getByLabelText(/organization name/i), 'Org');
        await user.type(screen.getByLabelText(/contact person/i), 'Person');
        await user.type(screen.getByLabelText(/phone number/i), '1112223333');
        await user.type(screen.getByLabelText(/^address$/i), 'Addr');
        
        // Clear capacity field if it has a value
        const capacityInput = screen.getByLabelText(/daily capacity/i);
        await user.clear(capacityInput);
        
        await user.click(screen.getByRole('button', { name: /register as receiver/i }));

        await waitFor(() => {
            expect(authAPI.registerReceiver).toHaveBeenCalledWith(
                expect.objectContaining({ capacity: null })
            );
        });
    });
});
