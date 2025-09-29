// src/components/ReceiverRegistration.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

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

describe('ReceiverRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const fillAllFields = async () => {
        await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.type(screen.getByLabelText(/organization name/i), 'Food Helpers');
        await userEvent.type(screen.getByLabelText(/contact person/i), 'Alex Doe');
        await userEvent.type(screen.getByLabelText(/phone number/i), '5145551234');
        await userEvent.type(screen.getByLabelText(/^address$/i), '123 Main St, Montreal, QC');
        await userEvent.selectOptions(screen.getByLabelText(/organization type/i), 'SHELTER');
        await userEvent.type(screen.getByLabelText(/daily capacity/i), '150');
    };

    test('renders the form with all required fields', () => {
        render(<ReceiverRegistration />);
        expect(screen.getByRole('heading', { name: /register as receiver/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/daily capacity/i)).toBeInTheDocument();
    });

    test('updates form values', async () => {
        render(<ReceiverRegistration />);
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
        authAPI.registerReceiver.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } },
        });

        render(<ReceiverRegistration />);
        await fillAllFields();

        await userEvent.click(screen.getByRole('button', { name: /register as receiver/i }));

        expect(await screen.findByText(/email already exists/i)).toBeTruthy();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(setItemSpy).not.toHaveBeenCalled();
    });

    test('Back button goes to /register', async () => {
        render(<ReceiverRegistration />);
        await userEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    test('sends null for capacity when left blank', async () => {
        authAPI.registerReceiver.mockResolvedValueOnce({ data: {} });

        render(<ReceiverRegistration />);

        await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.type(screen.getByLabelText(/organization name/i), 'Org');
        await userEvent.type(screen.getByLabelText(/contact person/i), 'Person');
        await userEvent.type(screen.getByLabelText(/phone number/i), '1112223333');
        await userEvent.type(screen.getByLabelText(/^address$/i), 'Addr');
        await userEvent.click(screen.getByRole('button', { name: /register as receiver/i }));

        await waitFor(() => {
            expect(authAPI.registerReceiver).toHaveBeenCalledWith(
                expect.objectContaining({ capacity: null })
            );
        });
    });
});
