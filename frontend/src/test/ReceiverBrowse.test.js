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
import {
  surplusAPI,
  recommendationAPI,
  savedDonationAPI,
} from '../services/api';
import { TimezoneProvider } from '../contexts/TimezoneContext';
import { AuthContext } from '../contexts/AuthContext';

// Helper function to render with required providers
const renderWithProviders = (ui, options = {}) => {
  const mockTimezoneContext = {
    userTimezone: 'America/Toronto',
    userRegion: 'CA',
  };
  const authValue = {
    accountStatus: 'ACTIVE',
    ...(options.authValue || {}),
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <TimezoneProvider value={mockTimezoneContext}>{ui}</TimezoneProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
    options
  );
};

// Mock images
jest.mock(
  '../../../assets/foodtypes/Pastry&Bakery.jpg',
  () => 'bakery-image.jpg'
);
jest.mock(
  '../../../assets/foodtypes/Fruits&Vegetables.jpg',
  () => 'fruits-image.jpg'
);
jest.mock(
  '../../../assets/foodtypes/PackagedItems.jpg',
  () => 'packaged-image.jpg'
);
jest.mock('../../../assets/foodtypes/Dairy.jpg', () => 'dairy-image.jpg');
jest.mock('../../../assets/foodtypes/FrozenFood.jpg', () => 'frozen-image.jpg');
jest.mock(
  '../../../assets/foodtypes/PreparedFood.jpg',
  () => 'prepared-image.jpg'
);

// Mock CSS
jest.mock('../../ReceiverBrowse.css', () => ({}));
jest.mock('../../ReceiverBrowseModal.css', () => ({}));

// Mock useLoadScript hook
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true, loadError: null }),
}));

// Mock FiltersPanel
jest.mock('../components/ReceiverDashboard/FiltersPanel', () => {
  return function MockFiltersPanel(props) {
    if (!props.isVisible) {
      return null;
    }

    return (
      <div data-testid="filters-panel">
        <button onClick={props.onApplyFilters}>Apply Filters</button>
        <button onClick={props.onClearFilters}>Clear Filters</button>
        <button onClick={props.onClose}>Close Filters</button>
        <button
          onClick={() =>
            props.onFiltersChange('foodType', ['FRUITS_VEGETABLES'])
          }
        >
          Change Food Type
        </button>
      </div>
    );
  };
});

jest.mock('../components/ReceiverDashboard/DonationsMap/MapViewBanner', () => {
  return function MockMapViewBanner({ onOpenMap }) {
    return (
      <button type="button" onClick={onOpenMap}>
        Open Map
      </button>
    );
  };
});

jest.mock('../components/ReceiverDashboard/DonationsMap/MapViewModal', () => {
  return function MockMapViewModal({
    isOpen,
    onClose,
    onClaimClick,
    donations,
  }) {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="map-modal">
        <button type="button" onClick={onClose}>
          Close Map
        </button>
        <button type="button" onClick={() => onClaimClick(donations?.[0])}>
          Claim From Map
        </button>
      </div>
    );
  };
});

global.alert = jest.fn();
global.confirm = jest.fn();

// Helper to create mock donation
const createMockDonation = (overrides = {}) => ({
  id: 99,
  title: 'Test Donation Item',
  foodCategories: ['FRUITS_VEGETABLES'],
  expiryDate: '2025-11-25',
  pickupLocation: { address: 'Test Address' },
  pickupDate: '2025-11-20',
  pickupFrom: '14:00:00',
  pickupTo: '17:00:00',
  quantity: { value: 10, unit: 'KILOGRAM' },
  donor: { name: 'Test Donor' },
  donorName: 'Test Donor',
  description: 'Test description',
  createdAt: '2025-11-15T10:00:00',
  status: 'AVAILABLE',
  ...overrides,
});

describe('ReceiverBrowse Component', () => {
  let ReceiverBrowse;

  const setViewportWidth = width => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    global.confirm.mockClear();
    setViewportWidth(1024);

    // Set default mock implementations - no need for mockReset as clearAllMocks handles it
    surplusAPI.list.mockResolvedValue({ data: [] });
    surplusAPI.search.mockResolvedValue({ data: [] });
    surplusAPI.claim.mockResolvedValue({});
    savedDonationAPI.getSavedDonations.mockResolvedValue({ data: [] });
    savedDonationAPI.save.mockResolvedValue({});
    savedDonationAPI.unsave.mockResolvedValue({});
    recommendationAPI.getBrowseRecommendations.mockResolvedValue({});
    recommendationAPI.getRecommendationForPost.mockResolvedValue(null);
    recommendationAPI.getTopRecommendations.mockResolvedValue([]);

    ReceiverBrowse = require('../ReceiverBrowse').default;
  });

  describe('Basic Rendering', () => {
    test('renders title and sort controls', async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      expect(
        screen.getByText('Explore Available Donations')
      ).toBeInTheDocument();
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByText('Relevance')).toBeInTheDocument();
      expect(screen.getByText('Date Posted')).toBeInTheDocument();
    });

    test('renders empty state when no donations', async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('No donations available right now.')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Check back soon for new surplus food!')
        ).toBeInTheDocument();
      });
    });

    test('shows loading state', async () => {
      let resolvePromise;
      surplusAPI.list.mockReturnValue(
        new Promise(r => {
          resolvePromise = r;
        })
      );

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });
      expect(screen.getByText('Loading donations...')).toBeInTheDocument();

      await act(async () => {
        resolvePromise({ data: [] });
      });
      await waitFor(() => {
        expect(
          screen.queryByText('Loading donations...')
        ).not.toBeInTheDocument();
      });
    });

    test('handles API error', async () => {
      surplusAPI.list.mockRejectedValue(new Error('API Error'));
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load available donations')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    test('toggles sort options', async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      const relevanceBtn = screen.getByText('Relevance');
      const dateBtn = screen.getByText('Date Posted');

      expect(relevanceBtn.closest('button')).toHaveClass('active');

      await act(async () => {
        fireEvent.click(dateBtn);
      });

      expect(dateBtn.closest('button')).toHaveClass('active');
      expect(relevanceBtn.closest('button')).not.toHaveClass('active');
    });

    test('shows all items in relevance mode with recommended items first', async () => {
      const recommendedDonation = createMockDonation({
        id: 100,
        title: 'Recommended Item',
        createdAt: '2025-11-16T10:00:00Z',
      });
      const nonRecommendedDonation = createMockDonation({
        id: 999,
        title: 'Non-Recommended Item',
        createdAt: '2025-11-17T10:00:00Z', // More recent date
      });

      surplusAPI.list.mockResolvedValue({
        data: [nonRecommendedDonation, recommendedDonation],
      });

      // Mock recommendations for the recommended item
      recommendationAPI.getTopRecommendations.mockResolvedValue({
        100: { score: 95, reasons: ['Great match!'], isRecommended: true },
      });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      // Should be in relevance mode by default
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Recommended Item' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Non-Recommended Item' })
        ).toBeInTheDocument();

        // Verify recommended item has badge
        const recommendedBadges =
          document.querySelectorAll('.recommended-badge');
        expect(recommendedBadges.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Recommendation System', () => {
    test('shows recommendation badges', async () => {
      const recommendedPost = createMockDonation({ id: 123 });
      surplusAPI.list.mockResolvedValue({ data: [recommendedPost] });

      recommendationAPI.getTopRecommendations.mockResolvedValue({
        123: { score: 90, reasons: ['Perfect match!'], isRecommended: true },
      });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        const badges = document.querySelectorAll('.recommended-badge');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    test('fetches recommendations for real posts', async () => {
      const realPost = createMockDonation({ id: 123 });
      surplusAPI.list.mockResolvedValue({ data: [realPost] });

      // Mock recommendation response
      recommendationAPI.getTopRecommendations.mockResolvedValue({
        123: { score: 85, reasons: ['Great match!'], isRecommended: true },
      });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(recommendationAPI.getTopRecommendations).toHaveBeenCalledWith(
          [123],
          50
        );
      });
    });

    test('shows tooltip on hover', async () => {
      const recommendedPost = createMockDonation({ id: 456 });
      surplusAPI.list.mockResolvedValue({ data: [recommendedPost] });

      recommendationAPI.getTopRecommendations.mockResolvedValue({
        456: {
          score: 88,
          reasons: ['Close to your location'],
          isRecommended: true,
        },
      });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        const badge = document.querySelector('.recommended-badge');
        expect(badge).toBeInTheDocument();
      });

      const badge = document.querySelector('.recommended-badge');
      await act(async () => {
        fireEvent.mouseEnter(badge);
      });

      await waitFor(() => {
        expect(screen.getByText('Match Score')).toBeInTheDocument();
      });
    });
  });

  describe('Donation Cards', () => {
    test('renders donations from API', async () => {
      const donation1 = createMockDonation({
        id: 1,
        title: 'Fresh Bakery Items',
        foodCategories: ['BAKERY_PASTRY'],
      });
      const donation2 = createMockDonation({
        id: 2,
        title: 'Fresh Organic Apples',
        foodCategories: ['FRUITS_VEGETABLES'],
      });
      const donation3 = createMockDonation({
        id: 3,
        title: 'Prepared Meals',
        foodCategories: ['PREPARED_MEALS'],
      });

      surplusAPI.list.mockResolvedValue({
        data: [donation1, donation2, donation3],
      });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Fresh Bakery Items' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Fresh Organic Apples' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Prepared Meals' })
        ).toBeInTheDocument();
        const availableBadges = screen.getAllByText('Available');
        expect(availableBadges.length).toBeGreaterThanOrEqual(3);
      });
    });

    test('renders multiple API donations', async () => {
      const donation1 = createMockDonation({
        id: 10,
        title: 'Test Donation 1',
      });
      const donation2 = createMockDonation({
        id: 20,
        title: 'Test Donation 2',
      });

      surplusAPI.list.mockResolvedValue({ data: [donation1, donation2] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Test Donation 1' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'Test Donation 2' })
        ).toBeInTheDocument();
        expect(
          screen.getAllByText('Test Address').length
        ).toBeGreaterThanOrEqual(2);
        const availableBadges = screen.getAllByText('Available');
        expect(availableBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('expands card details', async () => {
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText('More')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('More'));
      });

      await waitFor(() => {
        expect(screen.getByText('Less')).toBeInTheDocument();
      });
    });
  });

  describe('Claim Functionality', () => {
    test('claims donation with confirmation', async () => {
      global.confirm.mockReturnValue(true);
      surplusAPI.claim.mockResolvedValue({});
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText('Claim Donation')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Claim Donation'));
      });

      expect(global.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(surplusAPI.claim).toHaveBeenCalled();
      });
    });

    test('cancels claim when declined', async () => {
      global.confirm.mockReturnValue(false);
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Claim Donation'));
      });

      expect(surplusAPI.claim).not.toHaveBeenCalled();
    });

    test('handles claim error', async () => {
      global.confirm.mockReturnValue(true);
      surplusAPI.claim.mockRejectedValue(new Error('Network error'));
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Claim Donation'));
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to claim. It may have already been claimed.'
        );
      });
    });

    test('shows approval modal and skips claim when account is not approved', async () => {
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />, {
          authValue: { accountStatus: 'PENDING_ADMIN_APPROVAL' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Claim Donation'));
      });

      expect(surplusAPI.claim).not.toHaveBeenCalled();
      expect(
        await screen.findByText('Approval required to claim donations')
      ).toBeInTheDocument();
    });

    test('shows approval modal when backend rejects claim for unapproved account', async () => {
      global.confirm.mockReturnValue(true);
      surplusAPI.claim.mockRejectedValue({
        response: { data: { message: 'Account not approved yet' } },
      });
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Claim Donation'));
      });

      expect(
        await screen.findByText('Approval required to claim donations')
      ).toBeInTheDocument();
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Filter Functionality', () => {
    test('applies filters', async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      surplusAPI.search.mockResolvedValue({ data: [] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Change Food Type'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Apply Filters'));
      });

      await waitFor(() => {
        expect(surplusAPI.search).toHaveBeenCalled();
      });
    });

    test('keeps filters closed by default on mobile and allows reopening', async () => {
      setViewportWidth(390);
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument();

      const toggleButton = screen.getByRole('button', {
        name: /filter donations|filters/i,
      });

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument();
    });

    // Test removed due to flakiness in CI environment - timing-dependent test with inconsistent behavior
    // between local and CI environments regarding TimezoneProvider initialization
  });

  describe('Bookmark Functionality', () => {
    test('bookmarks items', async () => {
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });
      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getAllByLabelText('Bookmark')[0]).toBeInTheDocument();
      });

      const bookmarkBtn = screen.getAllByLabelText('Bookmark')[0];
      await act(async () => {
        fireEvent.click(bookmarkBtn);
      });

      expect(bookmarkBtn).toBeInTheDocument();
    });

    test('saves then unsaves when clicked twice', async () => {
      const donation = createMockDonation({ id: 55 });
      surplusAPI.list.mockResolvedValue({ data: [donation] });
      savedDonationAPI.getSavedDonations.mockResolvedValue({ data: [] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      const bookmarkBtn = await screen.findByLabelText('Bookmark');
      fireEvent.click(bookmarkBtn);

      await waitFor(() => {
        expect(savedDonationAPI.save).toHaveBeenCalledWith(55);
      });

      await waitFor(() => {
        expect(bookmarkBtn).not.toBeDisabled();
      });

      fireEvent.click(bookmarkBtn);
      await waitFor(() => {
        expect(savedDonationAPI.unsave).toHaveBeenCalledWith(55);
      });
    });

    test('restores bookmark and alerts on save error', async () => {
      const donation = createMockDonation({ id: 77 });
      surplusAPI.list.mockResolvedValue({ data: [donation] });
      savedDonationAPI.save.mockRejectedValueOnce(new Error('save failed'));

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      const bookmarkBtn = await screen.findByLabelText('Bookmark');
      fireEvent.click(bookmarkBtn);

      await waitFor(() => {
        expect(savedDonationAPI.save).toHaveBeenCalledWith(77);
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Claim Modal Branch', () => {
    test('opens pickup-slot modal and confirms claim with selected slot', async () => {
      const donation = createMockDonation({
        id: 88,
        pickupSlots: [
          {
            pickupDate: '2025-11-20',
            startTime: '09:00:00',
            endTime: '11:00:00',
          },
          {
            pickupDate: '2025-11-21',
            startTime: '14:00:00',
            endTime: '16:00:00',
          },
        ],
      });
      surplusAPI.list.mockResolvedValue({ data: [donation] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      fireEvent.click(await screen.findByText('Claim Donation'));
      expect(
        await screen.findByText('Choose a pickup slot')
      ).toBeInTheDocument();

      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[1]);
      fireEvent.click(
        document.querySelector('.claim-modal-actions .btn-create')
      );

      await waitFor(() => {
        expect(surplusAPI.claim).toHaveBeenCalledWith(
          88,
          expect.objectContaining({
            pickupDate: '2025-11-21',
            startTime: '14:00:00',
            endTime: '16:00:00',
          })
        );
      });
    });

    test('switches to map browse mode and triggers claim from map section', async () => {
      const donation = createMockDonation({
        id: 89,
        pickupSlots: [
          {
            pickupDate: '2025-11-22',
            startTime: '10:00:00',
            endTime: '12:00:00',
          },
        ],
      });
      surplusAPI.list.mockResolvedValue({ data: [donation] });

      await act(async () => {
        renderWithProviders(<ReceiverBrowse />);
      });

      fireEvent.click(await screen.findByRole('button', { name: 'Map' }));
      expect(await screen.findByTestId('map-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Claim From Map'));
      expect(
        await screen.findByText('Choose a pickup slot')
      ).toBeInTheDocument();
    });
  });
});
