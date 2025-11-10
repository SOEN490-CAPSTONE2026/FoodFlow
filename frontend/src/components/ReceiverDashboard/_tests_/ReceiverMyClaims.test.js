import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverMyClaims from '../ReceiverMyClaims';
import { claimsAPI } from '../../../services/api';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock the API
jest.mock('../../../services/api', () => ({
  claimsAPI: {
    myClaims: jest.fn(),
    cancel: jest.fn(),
  },
}));

// Mock images
jest.mock('../../../assets/foodtypes/Pastry&Bakery.jpg', () => 'bakery.jpg');
jest.mock('../../../assets/foodtypes/Fruits&Vegetables.jpg', () => 'fruits.jpg');
jest.mock('../../../assets/foodtypes/PackagedItems.jpg', () => 'packaged.jpg');
jest.mock('../../../assets/foodtypes/Dairy.jpg', () => 'dairy.jpg');
jest.mock('../../../assets/foodtypes/FrozenFood.jpg', () => 'frozen.jpg');
jest.mock('../../../assets/foodtypes/PreparedFood.jpg', () => 'prepared.jpg');

// Mock ClaimDetailModal
jest.mock('../ClaimDetailModal.js', () => {
  return function MockClaimDetailModal({ isOpen, onClose, claim }) {
    if (!isOpen) return null;
    return (
      <div data-testid="claim-detail-modal">
        <h2>Claim Details</h2>
        <p>{claim?.surplusPost?.title}</p>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

global.confirm = jest.fn();

const createMockClaim = (overrides = {}) => ({
  id: 1,
  surplusPostTitle: 'Fresh Vegetables',
  claimedAt: '2025-10-24T10:00:00',
  status: 'Active',
  surplusPost: {
    id: 10,
    title: 'Fresh Vegetables',
    donorEmail: 'greengrocer@example.com',
    quantity: { value: 10, unit: 'KILOGRAM' },
    pickupLocation: { address: '123 Main St' },
    pickupDate: '2025-10-25',
    pickupFrom: '09:00:00',
    pickupTo: '17:00:00',
    foodCategories: ['FRUITS_VEGETABLES'],
    status: 'CLAIMED',
  },
  ...overrides,
});

describe('ReceiverMyClaims Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Rendering & Loading', () => {
    test('renders loading state initially', () => {
      claimsAPI.myClaims.mockImplementation(() => new Promise(() => {}));
      
      render(
        <NotificationProvider>
          <ReceiverMyClaims />
        </NotificationProvider>
      );
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders "no claims" message when claims list is empty', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/you haven't claimed any donations yet/i)).toBeInTheDocument();
      });
    });

    test('handles API fetch error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      claimsAPI.myClaims.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load your claimed donations/i)).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test('polls for updates every 10 seconds', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      expect(claimsAPI.myClaims).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(claimsAPI.myClaims).toHaveBeenCalledTimes(2);
    });
  });

  describe('Claims Display', () => {
    test('renders claims list successfully', async () => {
      const mockClaims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, title: 'Fresh Vegetables' } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, title: 'Baked Goods', donorEmail: 'bakery@example.com' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Baked Goods')).toBeInTheDocument();
      });
    });

    test('displays claim details correctly', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
        expect(screen.getByText('greengrocer@example.com')).toBeInTheDocument();
        expect(screen.getByText(/10 Kilograms/i)).toBeInTheDocument();
      });
    });

    test('handles null/missing surplusPost fields', async () => {
      const claimWithNulls = createMockClaim({
        surplusPost: {
          title: null,
          donorEmail: null,
          quantity: null,
          pickupDate: null,
          pickupFrom: null,
          pickupTo: null,
          foodCategories: null,
        }
      });

      claimsAPI.myClaims.mockResolvedValue({ data: [claimWithNulls] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Untitled Donation')).toBeInTheDocument();
        expect(screen.getByText('Not specified')).toBeInTheDocument();
        expect(screen.getByText('0 Items')).toBeInTheDocument();
      });
    });
  });

  describe('Food Categories & Images', () => {
    const categories = [
      { enum: 'FRUITS_VEGETABLES', display: 'Fruits & Vegetables', image: 'fruits.jpg' },
      { enum: 'BAKERY_PASTRY', display: 'Bakery & Pastry', image: 'bakery.jpg' },
      { enum: 'PACKAGED_PANTRY', display: 'Packaged / Pantry Items', image: 'packaged.jpg' },
      { enum: 'DAIRY', display: 'Dairy & Cold Items', image: 'dairy.jpg' },
      { enum: 'FROZEN', display: 'Frozen Food', image: 'frozen.jpg' },
      { enum: 'PREPARED_MEALS', display: 'Prepared Meals', image: 'prepared.jpg' },
    ];

    categories.forEach(({ enum: cat, image }) => {
      test(`displays correct image for ${cat}`, async () => {
        const claim = createMockClaim({ surplusPost: { ...createMockClaim().surplusPost, foodCategories: [cat] } });
        claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

        await act(async () => {
          render(
            <NotificationProvider>
              <ReceiverMyClaims />
            </NotificationProvider>
          );
        });

        await waitFor(() => {
          const img = screen.getByAltText(/Fresh Vegetables|Donation/);
          expect(img).toHaveAttribute('src', image);
        });
      });
    });

    test('displays default image for unknown category', async () => {
      const claim = createMockClaim({ surplusPost: { ...createMockClaim().surplusPost, foodCategories: ['UNKNOWN'] } });
      claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        const img = screen.getByAltText('Fresh Vegetables');
        expect(img).toHaveAttribute('src', 'prepared.jpg');
      });
    });
  });

  describe('Status Display & Filtering', () => {
    test('displays correct status badges', async () => {
      const claims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, status: 'CLAIMED' } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, status: 'READY_FOR_PICKUP' } }),
        createMockClaim({ id: 3, surplusPost: { ...createMockClaim().surplusPost, status: 'COMPLETED' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: claims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        // Find status badges specifically by their class
        const statusBadges = document.querySelectorAll('.status-badge');
        const badgeTexts = Array.from(statusBadges).map(el => el.textContent.trim());
        
        expect(badgeTexts).toContain('Claimed');
        expect(badgeTexts).toContain('Ready for Pickup');
        expect(badgeTexts).toContain('Completed');
      });
    });

    test('filters by status', async () => {
      const claims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, title: 'Claimed Item', status: 'CLAIMED' } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, title: 'Ready Item', status: 'READY_FOR_PICKUP' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: claims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Claimed Item')).toBeInTheDocument();
        expect(screen.getByText('Ready Item')).toBeInTheDocument();
      });

      // Find the Ready filter button specifically in the filter buttons section
      const filterButtons = screen.getAllByRole('button');
      const readyFilter = filterButtons.find(btn => 
        btn.textContent.includes('Ready') && btn.className.includes('filter-btn')
      );
      
      await act(async () => {
        fireEvent.click(readyFilter);
      });

      await waitFor(() => {
        expect(screen.getByText('Ready Item')).toBeInTheDocument();
        expect(screen.queryByText('Claimed Item')).not.toBeInTheDocument();
      });
    });

    test('shows empty state for filtered results', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      const completedFilter = screen.getByText(/Completed/).closest('button');
      await act(async () => {
        fireEvent.click(completedFilter);
      });

      await waitFor(() => {
        expect(screen.getByText(/No donations found for the "Completed" filter/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    test('sorts by date (ascending)', async () => {
      const claims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, title: 'Later', pickupDate: '2025-10-27' } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, title: 'Earlier', pickupDate: '2025-10-25' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: claims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Earlier');
        expect(titles[1]).toHaveTextContent('Later');
      });
    });

    test('sorts by status priority', async () => {
      const claims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, title: 'Completed', status: 'COMPLETED' } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, title: 'Ready', status: 'READY_FOR_PICKUP' } }),
        createMockClaim({ id: 3, surplusPost: { ...createMockClaim().surplusPost, title: 'Claimed', status: 'CLAIMED' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: claims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      // Click sort dropdown to change to status sort
      const sortDropdown = screen.getByText('Sort by Date').closest('.react-select__control');
      await act(async () => {
        fireEvent.mouseDown(sortDropdown);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sort by Status'));
      });

      await waitFor(() => {
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Ready');
        expect(titles[1]).toHaveTextContent('Claimed');
        expect(titles[2]).toHaveTextContent('Completed');
      });
    });

    test('handles missing pickup dates in sorting', async () => {
      const claims = [
        createMockClaim({ id: 1, surplusPost: { ...createMockClaim().surplusPost, title: 'No Date', pickupDate: null } }),
        createMockClaim({ id: 2, surplusPost: { ...createMockClaim().surplusPost, title: 'Has Date', pickupDate: '2025-10-25' } }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: claims });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Has Date');
        expect(titles[1]).toHaveTextContent('No Date');
      });
    });
  });

  describe('Pickup Time Formatting', () => {
    test('formats pickup time correctly', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Oct 25, 2025/i)).toBeInTheDocument();
        expect(screen.getByText(/9:00 AM-5:00 PM/i)).toBeInTheDocument();
      });
    });

    test('uses confirmed pickup slot over post pickup date', async () => {
      const claimWithSlot = createMockClaim({
        confirmedPickupSlot: {
          pickupDate: '2025-10-26',
          startTime: '10:00:00',
          endTime: '14:00:00'
        }
      });

      claimsAPI.myClaims.mockResolvedValue({ data: [claimWithSlot] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Oct 26, 2025/i)).toBeInTheDocument();
        expect(screen.getByText(/10:00 AM-2:00 PM/i)).toBeInTheDocument();
      });
    });

    test('handles alternative slot field names', async () => {
      const claimWithAltFields = createMockClaim({
        confirmedPickupSlot: {
          date: '2025-10-26',
          pickupFrom: '11:00:00',
          pickupTo: '15:00:00'
        }
      });

      claimsAPI.myClaims.mockResolvedValue({ data: [claimWithAltFields] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Oct 26, 2025/i)).toBeInTheDocument();
      });
    });

    test('displays fallback for missing pickup times', async () => {
      const claimNoTimes = createMockClaim({
        surplusPost: { ...createMockClaim().surplusPost, pickupDate: null, pickupFrom: null, pickupTo: null }
      });

      claimsAPI.myClaims.mockResolvedValue({ data: [claimNoTimes] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });
  });

  describe('Quantity Formatting', () => {
    test('formats singular unit', async () => {
      const claim = createMockClaim({ surplusPost: { ...createMockClaim().surplusPost, quantity: { value: 1, unit: 'KILOGRAM' } } });
      claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('1 Kilogram')).toBeInTheDocument();
      });
    });

    test('formats plural unit', async () => {
      const claim = createMockClaim({ surplusPost: { ...createMockClaim().surplusPost, quantity: { value: 5, unit: 'ITEM' } } });
      claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('5 Items')).toBeInTheDocument();
      });
    });

    test('handles missing quantity unit', async () => {
      const claim = createMockClaim({ surplusPost: { ...createMockClaim().surplusPost, quantity: { value: 3, unit: null } } });
      claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('3 Items')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Claim', () => {
    test('handles cancel claim button click', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });
      claimsAPI.cancel.mockResolvedValue({});
      
      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(claimsAPI.cancel).toHaveBeenCalledWith(1);
      });
    });

    test('refreshes claims list after successful cancellation', async () => {
      claimsAPI.myClaims
        .mockResolvedValueOnce({ data: [createMockClaim()] })
        .mockResolvedValueOnce({ data: [] });
      claimsAPI.cancel.mockResolvedValue({});

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      const cancelButton = await screen.findByText("Cancel");
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(claimsAPI.myClaims).toHaveBeenCalledTimes(2);
      });
    });

    test('handles cancel claim error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });
      claimsAPI.cancel.mockRejectedValue(new Error('Cancel failed'));

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      const cancelButton = await screen.findByText("Cancel");
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Modal Functionality', () => {
    test('opens modal when view details clicked', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      const viewDetailsButton = await screen.findByText('View details');
      await act(async () => {
        fireEvent.click(viewDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('claim-detail-modal')).toBeInTheDocument();
      });
    });

    test('closes modal and refreshes claims', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <NotificationProvider>
            <ReceiverMyClaims />
          </NotificationProvider>
        );
      });

      const viewDetailsButton = await screen.findByText('View details');
      await act(async () => {
        fireEvent.click(viewDetailsButton);
      });

      const closeButton = await screen.findByText('Close Modal');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('claim-detail-modal')).not.toBeInTheDocument();
      });
    });
  });
});