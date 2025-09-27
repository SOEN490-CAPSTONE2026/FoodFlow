import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { authAPI } from '../../services/api';

jest.mock('../../assets/illustrations/receiver-ilustration.jpg', () => 'receiver.jpg');
jest.mock('../Registration.css', () => ({}), { virtual: true });

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

jest.mock('../../services/api', () => ({
    authAPI: {
        registerReceiver: jest.fn(),
    },
}));

import ReceiverRegistration from '../ReceiverRegistration';

const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

describe('ReceiverRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const fillForm = async () => {
        await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.type(screen.getByLabelText(/organization name/i), 'Food Helpers');
        await userEvent.type(screen.getByLabelText(/contact person/i), 'Alex Doe');
        await userEvent.type(screen.getByLabelText(/phone number/i), '5145551234');
        await userEvent.type(screen.getByLabelText(/^address$/i), '123 Main St, Montreal, QC');
        await userEvent.selectOptions(screen.getByLabelText(/organization type/i), 'SHELTER');
        await userEvent.type(screen.getByLabelText(/daily capacity/i), '150');
    };

    test('renders the form', () => {
        render(<ReceiverRegistration />);
        expect(screen.getByRole('heading', { name: /register as receiver/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register as receiver/i })).toBeInTheDocument();
    });

    test('submits successfully, stores token, and navigates', async () => {
        jest.useFakeTimers();
        authAPI.registerReceiver.mockResolvedValueOnce({ data: { token: 'abc123' } });

        render(<ReceiverRegistration />);
        await fillForm();
        await userEvent.click(screen.getByRole('button', { name: /register as receiver/i }));

        await waitFor(() => {
            expect(authAPI.registerReceiver).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                    password: 'password123',
                    organizationName: 'Food Helpers',
                    contactPerson: 'Alex Doe',
                    phone: '5145551234',
                    address: '123 Main St, Montreal, QC',
                    organizationType: 'SHELTER',
                    capacity: 150,
                })
            );
        });

        expect(await screen.findByText(/registration successful!/i)).toBeInTheDocument();
        expect(setItemSpy).toHaveBeenCalledWith('token', 'abc123');

        jest.advanceTimersByTime(2000);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('shows API error message and does not navigate', async () => {
        authAPI.registerReceiver.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } },
        });

        render(<ReceiverRegistration />);
        await fillForm();
        await userEvent.click(screen.getByRole('button', { name: /register as receiver/i }));

        expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(setItemSpy).not.toHaveBeenCalled();
    });

    test('Back button navigates to /register', async () => {
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
