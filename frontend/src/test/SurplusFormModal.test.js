import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurplusFormModal from '../components/SurplusFormModal';

// Simple mocks
jest.mock('axios', () => ({
    post: jest.fn(),
}));

jest.mock('@react-google-maps/api', () => ({
    Autocomplete: ({ children }) => children,
}));

// Mock localStorage
Storage.prototype.getItem = jest.fn(() => 'test-token');

describe('SurplusFormModal', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fills out all form fields', async () => {
        render(<SurplusFormModal isOpen={true} onClose={mockOnClose} />);

        // Food Name 
        const foodNameInput = screen.getByPlaceholderText('e.g., Vegetable Lasagna');
        await userEvent.type(foodNameInput, 'Test Pizza');
        expect(foodNameInput.value).toBe('Test Pizza');

        // Food Type
        const foodTypeSelect =
            screen.queryByRole('combobox', { name: /food type/i }) ??
            document.querySelector('select[name="foodType"]');
        await userEvent.selectOptions(foodTypeSelect, 'Prepared Meals');
        expect(foodTypeSelect.value).toBe('Prepared Meals');

        // Expiry Date 
        const expiryDateInput = document.querySelector('input[name="expiryDate"]');
        fireEvent.change(expiryDateInput, { target: { value: '2025-12-31' } });
        expect(expiryDateInput.value).toBe('2025-12-31');

        // Quantity 
        const quantityInput = screen.getByPlaceholderText('0');
        await userEvent.type(quantityInput, '10');
        expect(quantityInput.value).toBe('10');

        // Unit
        const unitSelect = document.querySelector('select[name="unit"]');
        expect(unitSelect.value).toBe('kg'); // Default value
        await userEvent.selectOptions(unitSelect, 'items');
        expect(unitSelect.value).toBe('items');

        // Pickup From 
        const pickupFromInput = document.querySelector('input[name="pickupFrom"]');
        fireEvent.change(pickupFromInput, { target: { value: '2025-10-10T10:00' } });
        expect(pickupFromInput.value).toBe('2025-10-10T10:00');

        // Pickup To 
        const pickupToInput = document.querySelector('input[name="pickupTo"]');
        fireEvent.change(pickupToInput, { target: { value: '15:00' } });
        expect(pickupToInput.value).toBe('15:00');

        // Location 
        const locationInput = screen.getByPlaceholderText('Start typing to search the location');
        await userEvent.type(locationInput, '123 Main Street');
        expect(locationInput.value).toBe('123 Main Street');

        // Food Description 
        const descriptionTextarea = screen.getByPlaceholderText(/e.g.,Vegetarian lasagna/i);
        await userEvent.type(descriptionTextarea, 'Fresh homemade pizza with cheese');
        expect(descriptionTextarea.value).toBe('Fresh homemade pizza with cheese');
    });

    test('renders all form sections using placeholders and text', () => {
        render(<SurplusFormModal isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Add New Donation')).toBeInTheDocument();

        // Check all fields exist using various methods
        expect(screen.getByPlaceholderText('e.g., Vegetable Lasagna')).toBeInTheDocument();
        expect(screen.getByText('Food Type')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
        expect(screen.getByText('Unit')).toBeInTheDocument();
        expect(screen.getByText('From')).toBeInTheDocument();
        expect(screen.getByText('To')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Start typing to search the location')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g.,Vegetarian lasagna/i)).toBeInTheDocument();

        // Check buttons
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Create Donation')).toBeInTheDocument();
    });

    test('cancel button shows confirmation', async () => {
        window.confirm = jest.fn(() => true);

        render(<SurplusFormModal isOpen={true} onClose={mockOnClose} />);

        await userEvent.click(screen.getByText('Cancel'));

        expect(window.confirm).toHaveBeenCalledWith(
            'Are you sure you want to cancel? All entered data will be lost.'
        );
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('does not close when cancel is rejected', async () => {
        window.confirm = jest.fn(() => false);

        render(<SurplusFormModal isOpen={true} onClose={mockOnClose} />);

        await userEvent.click(screen.getByText('Cancel'));

        expect(mockOnClose).not.toHaveBeenCalled();
    });
});