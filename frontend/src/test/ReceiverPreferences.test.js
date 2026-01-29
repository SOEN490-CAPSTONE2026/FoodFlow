import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReceiverPreferences from '../components/ReceiverDashboard/ReceiverPreferences';

// Import mocked api
import api from '../services/api';

// Mock foodTypeOptions to include 'Prepared Meals'
jest.mock('../constants/foodConstants', () => ({
  foodTypeOptions: [
    { value: 'PREPARED_MEALS', label: 'Prepared Meals' },
    { value: 'DAIRY', label: 'Dairy' },
  ]
}));

// Mock the api module to prevent axios import issues
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  }
}));

describe('ReceiverPreferences', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    api.get.mockResolvedValue({
      data: {
        preferredFoodTypes: [],
        preferredDonationSizes: ['SMALL', 'LARGE'],
        preferredPickupWindows: ['EVENING'],
        acceptRefrigerated: true,
        acceptFrozen: true
      }
    });
    
    api.put.mockResolvedValue({ data: { success: true } });
    api.post.mockResolvedValue({ data: { success: true } });
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

    // Uncheck 'No strict preferences'
    const noStrictCheckbox = screen.getByText('No strict preferences (allow all food types)').previousSibling;
    if (noStrictCheckbox.checked) {
      fireEvent.click(noStrictCheckbox);
    }

    // Open the dropdown
    fireEvent.click(screen.getByPlaceholderText('Select food categories...'));

    // Wait for checkboxes to appear
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1);
    });

    // Uncheck all food type checkboxes (skip 'No strict preferences')
    let checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => {
      const label = cb.parentElement && cb.parentElement.textContent;
      if (label && !label.includes('No strict preferences') && cb.checked) {
        fireEvent.click(cb);
      }
    });

    // Check only the first food type checkbox
    checkboxes = screen.getAllByRole('checkbox');
    const foodTypeCheckbox = checkboxes.find(cb => {
      const label = cb.parentElement && cb.parentElement.textContent;
      return label && !label.includes('No strict preferences');
    });
    expect(foodTypeCheckbox).toBeDefined();
    fireEvent.click(foodTypeCheckbox);

    // Assert only one food type checkbox is checked
    const checkedFoodTypes = checkboxes.filter(cb => {
      const label = cb.parentElement && cb.parentElement.textContent;
      return label && !label.includes('No strict preferences') && cb.checked;
    });
    expect(checkedFoodTypes.length).toBe(1);
  });


  test('renders and toggles donation size buttons', async () => {
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Should show all donation size buttons
    expect(screen.getByText('Small donations')).toBeInTheDocument();
    expect(screen.getByText('Medium donations')).toBeInTheDocument();
    expect(screen.getByText('Large donations')).toBeInTheDocument();
    expect(screen.getByText('Bulk donations')).toBeInTheDocument();

    // Should have SMALL and LARGE active by default

    // Wait for the UI to update and then check active donation size buttons
    await waitFor(() => {
      const activeBtns = document.querySelectorAll('.size-btn.active');
      expect(Array.from(activeBtns).map(btn => btn.textContent)).toEqual(
        expect.arrayContaining(['Small donations', 'Large donations'])
      );
    });

    // Toggle Medium
    const mediumBtn = screen.getByText('Medium donations');
    fireEvent.click(mediumBtn);
    expect(mediumBtn.className).toMatch(/active/);

    // Toggle Small off
    const smallBtn = screen.getByText('Small donations');
    fireEvent.click(smallBtn);
    expect(smallBtn.className).not.toMatch(/active/);
  });

  test('saves preferences successfully', async () => {
    jest.useFakeTimers();
    
    render(
      <ReceiverPreferences 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );

    // Wait for the component to finish loading preferences
    const saveButton = await screen.findByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    // Component waits 1.5 seconds before calling onClose
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });


  // Removed min/max quantity error test (fields no longer exist)

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
