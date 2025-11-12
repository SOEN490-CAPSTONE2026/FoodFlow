import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReceiverPreferences from '../components/ReceiverDashboard/ReceiverPreferences';

describe('ReceiverPreferences', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders preferences panel when open', () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    expect(screen.getByText('Receiver Preferences')).toBeInTheDocument();
    expect(screen.getByText("Set your organization's needs to improve food matching.")).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    const { container } = render(
      <ReceiverPreferences 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('closes preferences when close button is clicked', () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('can open category dropdown and select a category', async () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const placeholder = screen.getByPlaceholderText('Select food categories...');
    // open dropdown
    fireEvent.click(placeholder);
    // select first category (label text)
    const optionLabel = await screen.findByText('Prepared Meals');
    fireEvent.click(optionLabel);

    // input value should reflect selected count
    expect(placeholder.value).toBe('1 categories selected');
  });

  test('handles storage capacity input', () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const storageInput = screen.getByPlaceholderText('Enter storage capacity');
    fireEvent.change(storageInput, { target: { value: '150' } });

    expect(storageInput.value).toBe('150');
  });

  test('handles quantity range inputs', () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const minInput = screen.getByPlaceholderText('Min');
    const maxInput = screen.getByPlaceholderText('Max');

    fireEvent.change(minInput, { target: { value: '5' } });
    fireEvent.change(maxInput, { target: { value: '100' } });

    expect(minInput.value).toBe('5');
    expect(maxInput.value).toBe('100');
  });

  test('saves preferences successfully', async () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // component no longer calls backend; it should call onSave with the current preferences
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('shows error when min quantity is greater than max quantity', async () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const minInput = screen.getByPlaceholderText('Min');
    const maxInput = screen.getByPlaceholderText('Max');

    fireEvent.change(minInput, { target: { value: '100' } });
    fireEvent.change(maxInput, { target: { value: '50' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Minimum quantity cannot be greater than maximum quantity')).toBeInTheDocument();
    });
  });

  test('toggles no strict preferences checkbox', () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    const checkbox = screen.getByText('No strict preferences (allow all food types)').previousSibling;
    
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
