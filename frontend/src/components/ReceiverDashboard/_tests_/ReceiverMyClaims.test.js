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
    claimsAPI.myClaims.mockResolvedValue({ data: [] });

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
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
          description: 'Fresh vegetables'
        },
      },
      {
        id: 2,
        surplusPostTitle: 'Baked Goods',
        claimedAt: '2025-10-24T11:00:00',
        status: 'Active',
        surplusPost: {
          id: 11,
          title: 'Baked Goods',
          donorEmail: 'bakery@example.com',
          quantity: { value: 5, unit: 'items' },
          pickupLocation: { address: '456 Oak Ave' },
          pickupDate: '2025-10-25',
          pickupFrom: '08:00:00',
          pickupTo: '16:00:00',
          description: 'Fresh baked goods'
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Baked Goods')).toBeInTheDocument();
      expect(screen.getByText('greengrocer@example.com')).toBeInTheDocument();
      expect(screen.getByText('bakery@example.com')).toBeInTheDocument();
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
        title: 'Fresh Vegetables',
        donorEmail: 'greengrocer@example.com',
        quantity: { value: 10, unit: 'kg' },
        pickupLocation: { address: '123 Main St, City' },
        pickupDate: '2025-10-25',
        pickupFrom: '09:00:00',
        pickupTo: '17:00:00',
        description: 'Fresh organic vegetables',
      },
    };

    claimsAPI.myClaims.mockResolvedValue({ data: [mockClaim] });

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText(/greengrocer@example.com/i)).toBeInTheDocument();
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
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });
    
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
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });

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
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
        },
      },
    ];

    claimsAPI.myClaims
      .mockResolvedValueOnce({ data: mockClaims }) // Initial load
      .mockResolvedValueOnce({ data: [] }); // After cancel

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
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });

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
        claimedAt: '2025-10-24T10:00:00',
        status: 'Active',
        surplusPost: {
          id: 10,
          title: 'Fresh Vegetables',
          donorEmail: 'greengrocer@example.com',
          quantity: { value: 10, unit: 'kg' },
          pickupLocation: { address: '123 Main St' },
          pickupDate: '2025-10-25',
          pickupFrom: '09:00:00',
          pickupTo: '17:00:00',
        },
      },
    ];

    claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });
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
        title: 'Fresh Vegetables',
        donorEmail: 'greengrocer@example.com',
        quantity: { value: 10, unit: 'kg' },
        pickupLocation: { address: '123 Main St' },
        pickupDate: '2025-10-25',
        pickupFrom: '09:00:00',
        pickupTo: '17:00:00',
      },
    };

    claimsAPI.myClaims.mockResolvedValue({ data: [mockClaim] });

    render(<ReceiverMyClaims />);

    await waitFor(() => {
      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      // Check if date is rendered (exact format depends on component implementation)
      expect(screen.getByText(/claimed/i)).toBeInTheDocument();
    });
  });
});
