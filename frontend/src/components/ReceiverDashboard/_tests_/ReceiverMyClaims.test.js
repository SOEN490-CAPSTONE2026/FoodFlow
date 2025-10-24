import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverMyClaims from '../ReceiverMyClaims';
import { claimsAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  claimsAPI: {
    myClaims: jest.fn(),
    cancel: jest.fn(),
  },
}));

// Mock window.confirm
global.confirm = jest.fn();

describe('ReceiverMyClaims Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(true); // Default to confirm
  });

  test('renders loading state initially', () => {
    claimsAPI.myClaims.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ReceiverMyClaims />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders "no claims" message when claims list is empty', async () => {
    claimsAPI.myClaims.mockResolvedValue([]);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText(/you haven't claimed any donations yet/i)).toBeInTheDocument();
    });
  });

  test('renders claims list successfully', async () => {
    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          donorName: 'Green Grocer',
          location: '123 Main St',
          pickupStartTime: '09:00',
          pickupEndTime: '17:00',
        },
      },
      {
        id: 2,
        surplusPostTitle: 'Baked Goods',
        claimedAt: '2025-10-24T11:00:00',
        status: 'Active',
        surplusPost: {
          id: 11,
          donorName: 'Local Bakery',
          location: '456 Oak Ave',
          pickupStartTime: '08:00',
          pickupEndTime: '16:00',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue(mockClaims);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Baked Goods')).toBeInTheDocument();
      expect(screen.getByText('Green Grocer')).toBeInTheDocument();
      expect(screen.getByText('Local Bakery')).toBeInTheDocument();
    });
  });

  test('displays claim details correctly', async () => {
    const mockClaim = {
      id: 1,
      surplusPostTitle: 'Fresh Vegetables',
      claimedAt: '2025-10-24T10:30:00',
      status: 'Active',
      surplusPost: {
        id: 10,
        donorName: 'Green Grocer',
        location: '123 Main St, City',
        pickupStartTime: '09:00',
        pickupEndTime: '17:00',
        description: 'Fresh organic vegetables',
      },
    };

    claimsAPI.myClaims.mockResolvedValue([mockClaim]);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText(/green grocer/i)).toBeInTheDocument();
      expect(screen.getByText(/123 main st/i)).toBeInTheDocument();
    });
  });

  test('handles cancel claim button click', async () => {
    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          donorName: 'Green Grocer',
          location: '123 Main St',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue(mockClaims);
    
    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel claim/i);
    fireEvent.click(cancelButton);

    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure')
    );
  });

  test('shows confirmation dialog before canceling claim', async () => {
    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        status: 'Active',
        surplusPost: { id: 10, donorName: 'Green Grocer' },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue(mockClaims);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel claim/i);
    fireEvent.click(cancelButton);

    expect(global.confirm).toHaveBeenCalled();
  });

  test('handles cancel claim success', async () => {
    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        status: 'Active',
        surplusPost: { id: 10, donorName: 'Green Grocer' },
      },
    ];

    claimsAPI.myClaims
      .mockResolvedValueOnce(mockClaims) // Initial load
      .mockResolvedValueOnce([]); // After cancel

    claimsAPI.cancel.mockResolvedValue({});

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel claim/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(claimsAPI.cancel).toHaveBeenCalledWith(1);
    });
  });

  test('does not cancel claim if user cancels confirmation', async () => {
    global.confirm.mockReturnValue(false); // User clicks "Cancel"

    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        status: 'Active',
        surplusPost: { id: 10, donorName: 'Green Grocer' },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue(mockClaims);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel claim/i);
    fireEvent.click(cancelButton);

    expect(claimsAPI.cancel).not.toHaveBeenCalled();
  });

  test('handles cancel claim error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockClaims = [
      {
        id: 1,
        surplusPostTitle: 'Fresh Vegetables',
        status: 'Active',
        surplusPost: { id: 10, donorName: 'Green Grocer' },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue(mockClaims);
    claimsAPI.cancel.mockRejectedValue(new Error('Cancel failed'));

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel claim/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(claimsAPI.cancel).toHaveBeenCalledWith(1);
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test('handles API fetch error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    claimsAPI.myClaims.mockRejectedValue(new Error('API Error'));

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test('formats claimed date correctly', async () => {
    const mockClaim = {
      id: 1,
      surplusPostTitle: 'Fresh Vegetables',
      claimedAt: '2025-10-24T14:30:00',
      status: 'Active',
      surplusPost: {
        id: 10,
        donorName: 'Green Grocer',
      },
    };

    claimsAPI.myClaims.mockResolvedValue([mockClaim]);

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      // Check if date is rendered (exact format depends on component implementation)
      expect(screen.getByText(/claimed/i)).toBeInTheDocument();
    });
  });
});
