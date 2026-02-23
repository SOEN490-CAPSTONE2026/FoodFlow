import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ReceiverMyClaims from '../ReceiverMyClaims';
import { surplusAPI, claimsAPI } from '../../../services/api';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';

// Mock images
jest.mock('../../../assets/foodtypes/Pastry&Bakery.jpg', () => 'bakery.jpg');
jest.mock(
  '../../../assets/foodtypes/Fruits&Vegetables.jpg',
  () => 'fruits.jpg'
);
jest.mock('../../../assets/foodtypes/PackagedItems.jpg', () => 'packaged.jpg');
jest.mock('../../../assets/foodtypes/Dairy.jpg', () => 'dairy.jpg');
jest.mock('../../../assets/foodtypes/FrozenFood.jpg', () => 'frozen.jpg');
jest.mock('../../../assets/foodtypes/PreparedFood.jpg', () => 'prepared.jpg');

// Mock ClaimDetailModal
jest.mock('../ClaimDetailModal.js', () => {
  return function MockClaimDetailModal({ isOpen, onClose, claim }) {
    if (!isOpen) {
      return null;
    }
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

// Wrapper component to provide both contexts
const Wrapper = ({ children }) => (
  <MemoryRouter>
    <TimezoneProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </TimezoneProvider>
  </MemoryRouter>
);

const createMockClaim = (overrides = {}) => ({
  id: 1,
  surplusPostTitle: 'Fresh Vegetables',
  claimedAt: '2025-10-24T10:00:00',
  status: 'Active',
  surplusPost: {
    id: 10,
    title: 'Fresh Vegetables',
    donorName: 'Green Grocer',
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
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Initial Rendering & Loading', () => {
    test('renders loading state initially', () => {
      claimsAPI.myClaims.mockImplementation(() => new Promise(() => {}));

      render(
        <Wrapper>
          <ReceiverMyClaims />
        </Wrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('renders "no claims" message when claims list is empty', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/you haven't claimed any donations yet/i)
        ).toBeInTheDocument();
      });
    });

    test('handles API fetch error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      claimsAPI.myClaims.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load your claimed donations/i)
        ).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test('polls for updates every 10 seconds', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
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
        createMockClaim({
          id: 1,
          surplusPost: {
            ...createMockClaim().surplusPost,
            title: 'Fresh Vegetables',
          },
        }),
        createMockClaim({
          id: 2,
          surplusPost: {
            ...createMockClaim().surplusPost,
            title: 'Baked Goods',
            donorName: 'Local Bakery',
          },
        }),
      ];

      claimsAPI.myClaims.mockResolvedValue({ data: mockClaims });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
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
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Green Grocer')).toBeInTheDocument();
        // getUnitLabel() converts KILOGRAM to "kg"
        expect(screen.getByText(/10 kg/i)).toBeInTheDocument();
      });
    });

    test('handles null/missing surplusPost fields', async () => {
      const claimWithNulls = createMockClaim({
        surplusPost: {
          title: null,
          donorName: null,
          quantity: null,
          pickupDate: null,
          pickupFrom: null,
          pickupTo: null,
          foodCategories: null,
        },
      });

      claimsAPI.myClaims.mockResolvedValue({ data: [claimWithNulls] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Untitled Donation')).toBeInTheDocument();
        expect(screen.getByText('Not specified')).toBeInTheDocument();
        // When quantity is null, it defaults to "0 items"
        expect(screen.getByText(/0 items/i)).toBeInTheDocument();
      });
    });
  });

  describe('Food Categories & Images', () => {
    const categories = [
      { enum: 'FRUITS_VEGETABLES', image: 'fruits.jpg' },
      { enum: 'BAKERY_PASTRY', image: 'bakery.jpg' },
      { enum: 'PACKAGED_PANTRY', image: 'packaged.jpg' },
      { enum: 'DAIRY', image: 'dairy.jpg' },
      { enum: 'FROZEN', image: 'frozen.jpg' },
      { enum: 'PREPARED_MEALS', image: 'prepared.jpg' },
    ];

    categories.forEach(({ enum: cat, image }) => {
      test(`displays correct image for ${cat}`, async () => {
        const claim = createMockClaim({
          surplusPost: {
            ...createMockClaim().surplusPost,
            foodCategories: [cat],
          },
        });
        claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

        await act(async () => {
          render(
            <Wrapper>
              <ReceiverMyClaims />
            </Wrapper>
          );
        });

        await waitFor(() => {
          const img = screen.getByAltText(/Fresh Vegetables|Donation/);
          expect(img).toHaveAttribute('src', image);
        });
      });
    });

    test('displays default image for unknown category', async () => {
      const claim = createMockClaim({
        surplusPost: {
          ...createMockClaim().surplusPost,
          foodCategories: ['UNKNOWN'],
        },
      });
      claimsAPI.myClaims.mockResolvedValue({ data: [claim] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        const img = screen.getByAltText('Fresh Vegetables');
        expect(img).toHaveAttribute('src', 'prepared.jpg');
      });
    });
  });

  describe('Cancel Claim', () => {
    test('handles cancel claim button click', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });
      claimsAPI.cancel.mockResolvedValue({});

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      });

      // Click the Cancel button to open the confirmation dialog
      const cancelButton = screen.getByText('Cancel');
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Wait for confirmation dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Cancel Claim')).toBeInTheDocument();
      });

      // Click the "Yes, Cancel Claim" button to confirm
      const confirmButton = screen.getByText('Yes, Cancel Claim');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(claimsAPI.cancel).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Modal Functionality', () => {
    test('opens modal when view details clicked', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      const viewDetailsButton = await screen.findByText('View Details');
      await act(async () => {
        fireEvent.click(viewDetailsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('claim-detail-modal')).toBeInTheDocument();
      });
    });

    test('closes modal when close clicked', async () => {
      claimsAPI.myClaims.mockResolvedValue({ data: [createMockClaim()] });

      await act(async () => {
        render(
          <Wrapper>
            <ReceiverMyClaims />
          </Wrapper>
        );
      });

      const viewDetailsButton = await screen.findByText('View Details');
      await act(async () => {
        fireEvent.click(viewDetailsButton);
      });

      const closeButton = await screen.findByText('Close Modal');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('claim-detail-modal')
        ).not.toBeInTheDocument();
      });
    });
  });
});
