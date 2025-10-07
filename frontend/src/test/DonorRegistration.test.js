import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock static imports used by the component
jest.mock('../assets/illustrations/donor-illustration.jpg', () => 'donor.jpg');
jest.mock('../components/Registration.css', () => ({}), { virtual: true });

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

describe('DonorRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const fillAllFields = async () => {
        await userEvent.type(screen.getByLabelText(/email address/i), 'donor@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.type(screen.getByLabelText(/organization name/i), 'Donor Org');
        await userEvent.type(screen.getByLabelText(/contact person/i), 'Jane Doe');
        await userEvent.type(screen.getByLabelText(/phone number/i), '1234567890');
        await userEvent.type(screen.getByLabelText(/^address$/i), '456 Main St');
        await userEvent.selectOptions(screen.getByLabelText(/organization type/i), 'RESTAURANT');
        await userEvent.type(screen.getByLabelText(/business license/i), 'BL-123456');
    };

    it('renders the form with all required fields', () => {
        render(<DonorRegistration />);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/organization type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
    });

    it('updates form values correctly', async () => {
        render(<DonorRegistration />);
        await fillAllFields();
        expect(screen.getByLabelText(/email address/i)).toHaveValue('donor@example.com');
        expect(screen.getByLabelText(/password/i)).toHaveValue('password123');
        expect(screen.getByLabelText(/organization name/i)).toHaveValue('Donor Org');
        expect(screen.getByLabelText(/contact person/i)).toHaveValue('Jane Doe');
        expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
        expect(screen.getByLabelText(/^address$/i)).toHaveValue('456 Main St');
        expect(screen.getByLabelText(/organization type/i)).toHaveValue('RESTAURANT');
        expect(screen.getByLabelText(/business license/i)).toHaveValue('BL-123456');
    });

    it('business license field accepts only text', async () => {
        render(<DonorRegistration />);
        const licenseInput = screen.getByLabelText(/business license/i);
        await userEvent.type(licenseInput, 'ABC123');
        expect(licenseInput).toHaveValue('ABC123');
        await userEvent.clear(licenseInput);
        await userEvent.type(licenseInput, '987XYZ');
        expect(licenseInput).toHaveValue('987XYZ');
    });
});
