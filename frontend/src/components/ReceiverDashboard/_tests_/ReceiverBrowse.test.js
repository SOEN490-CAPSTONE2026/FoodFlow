import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { surplusAPI } from "../../../services/api";

// Mock the API
jest.mock("../../../services/api", () => ({
  surplusAPI: {
    list: jest.fn(),
    search: jest.fn(),
    claim: jest.fn(),
  },
}));

// Mock images
jest.mock("../../../assets/foodtypes/Pastry&Bakery.jpg", () => "bakery-image.jpg");
jest.mock("../../../assets/foodtypes/Fruits&Vegetables.jpg", () => "fruits-image.jpg");
jest.mock("../../../assets/foodtypes/PackagedItems.jpg", () => "packaged-image.jpg");
jest.mock("../../../assets/foodtypes/Dairy.jpg", () => "dairy-image.jpg");
jest.mock("../../../assets/foodtypes/FrozenFood.jpg", () => "frozen-image.jpg");
jest.mock("../../../assets/foodtypes/PreparedFood.jpg", () => "prepared-image.jpg");

// Mock CSS
jest.mock("../ReceiverBrowse.css", () => ({}));
jest.mock("../ReceiverBrowseModal.css", () => ({}));

// Mock useLoadScript hook
jest.mock("@react-google-maps/api", () => ({
  useLoadScript: () => ({ isLoaded: true, loadError: null }),
}));

// Mock FiltersPanel
jest.mock("../FiltersPanel", () => {
  return function MockFiltersPanel(props) {
    return (
      <div data-testid="filters-panel">
        <button onClick={props.onApplyFilters}>Apply Filters</button>
        <button onClick={props.onClearFilters}>Clear Filters</button>
        <button onClick={props.onClose}>Close Filters</button>
        <button onClick={() => props.onFiltersChange('foodType', ['FRUITS_VEGETABLES'])}>
          Change Food Type
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
  title: "Test Donation Item",
  foodCategories: ["FRUITS_VEGETABLES"],
  expiryDate: "2025-11-25",
  pickupLocation: { address: "Test Address" },
  pickupDate: "2025-11-20",
  pickupFrom: "14:00:00",
  pickupTo: "17:00:00",
  quantity: { value: 10, unit: "KILOGRAM" },
  donor: { name: "Test Donor" },
  donorName: "Test Donor",
  description: "Test description",
  createdAt: "2025-11-15T10:00:00",
  status: "AVAILABLE",
  ...overrides,
});

describe("ReceiverBrowse Component", () => {
  let ReceiverBrowse;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    global.confirm.mockClear();
    surplusAPI.list.mockReset();
    surplusAPI.search.mockReset();
    surplusAPI.claim.mockReset();
    ReceiverBrowse = require("../ReceiverBrowse").default;
  });

  describe("Basic Rendering", () => {
    test("renders title and sort controls", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      expect(screen.getByText("Explore Available Donations")).toBeInTheDocument();
      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      expect(screen.getByText("Relevance")).toBeInTheDocument();
      expect(screen.getByText("Date Posted")).toBeInTheDocument();
    });

    test("shows mock data", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => {
        expect(screen.getByText("Fresh Bakery Items")).toBeInTheDocument();
        expect(screen.getByText("Fresh Organic Apples & Vegetables")).toBeInTheDocument();
      });
    });

    test("shows loading state", async () => {
      let resolvePromise;
      surplusAPI.list.mockReturnValue(new Promise(r => { resolvePromise = r; }));

      await act(async () => { render(<ReceiverBrowse />); });
      expect(screen.getByText("Loading donations...")).toBeInTheDocument();

      await act(async () => { resolvePromise({ data: [] }); });
      await waitFor(() => {
        expect(screen.queryByText("Loading donations...")).not.toBeInTheDocument();
      });
    });

    test("handles API error", async () => {
      surplusAPI.list.mockRejectedValue(new Error("API Error"));
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => {
        expect(screen.getByText("Failed to load available donations")).toBeInTheDocument();
      });
    });
  });

  describe("Sort Functionality", () => {
    test("toggles sort options", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      const relevanceBtn = screen.getByText("Relevance");
      const dateBtn = screen.getByText("Date Posted");

      expect(relevanceBtn.closest('button')).toHaveClass('active');

      await act(async () => {
        fireEvent.click(dateBtn);
      });

      expect(dateBtn.closest('button')).toHaveClass('active');
      expect(relevanceBtn.closest('button')).not.toHaveClass('active');
    });
  });

  describe("Recommendation System", () => {
    test("shows recommendation badges", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => {
        const badges = document.querySelectorAll('.recommended-badge');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    test("shows tooltip on hover", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => {
        const badge = document.querySelector('.recommended-badge');
        expect(badge).toBeInTheDocument();
      });

      const badge = document.querySelector('.recommended-badge');
      await act(async () => {
        fireEvent.mouseEnter(badge);
      });

      await waitFor(() => {
        expect(screen.getByText("Match Score")).toBeInTheDocument();
      });
    });
  });

  describe("Donation Cards", () => {
    test("renders mock donations", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => {
        // Look for specific titles using more specific selectors
        expect(screen.getByRole('heading', { name: 'Fresh Bakery Items' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Fresh Organic Apples & Vegetables' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Prepared Meals' })).toBeInTheDocument();
        // Use getAllByText since there are multiple "Available" badges
        const availableBadges = screen.getAllByText("Available");
        expect(availableBadges.length).toBeGreaterThanOrEqual(3);
      });
    });

    test("renders API donations", async () => {
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });
      await act(async () => { render(<ReceiverBrowse />); });

      // Switch to date sort to show all items (not just recommended)
      await waitFor(() => {
        expect(screen.getByText("Date Posted")).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText("Date Posted"));
      
      await waitFor(() => {
        // Should show both mock data and API data when sorted by date
        expect(screen.getByRole('heading', { name: 'Fresh Bakery Items' })).toBeInTheDocument(); // Mock data
        expect(screen.getByRole('heading', { name: 'Test Donation Item' })).toBeInTheDocument(); // API data
        expect(screen.getByText("Test Address")).toBeInTheDocument();
        // Multiple Available badges from both sources
        const availableBadges = screen.getAllByText("Available");
        expect(availableBadges.length).toBeGreaterThanOrEqual(4); // 3 mock + 1 API
      });
    });

    test("expands card details", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => { 
        expect(screen.getAllByText("More")[0]).toBeInTheDocument(); 
      });

      await act(async () => { 
        fireEvent.click(screen.getAllByText("More")[0]); 
      });

      await waitFor(() => {
        expect(screen.getByText("Less")).toBeInTheDocument();
      });
    });
  });

  describe("Claim Functionality", () => {
    test("claims donation with confirmation", async () => {
      global.confirm.mockReturnValue(true);
      surplusAPI.claim.mockResolvedValue({});
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => { render(<ReceiverBrowse />); });
      
      await waitFor(() => { 
        expect(screen.getAllByText("Claim Donation")[0]).toBeInTheDocument(); 
      });

      await act(async () => { 
        fireEvent.click(screen.getAllByText("Claim Donation")[0]); 
      });

      expect(global.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(surplusAPI.claim).toHaveBeenCalled();
      });
    });

    test("cancels claim when declined", async () => {
      global.confirm.mockReturnValue(false);
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => { render(<ReceiverBrowse />); });
      
      await act(async () => { 
        fireEvent.click(screen.getAllByText("Claim Donation")[0]); 
      });

      expect(surplusAPI.claim).not.toHaveBeenCalled();
    });

    test("handles claim error", async () => {
      global.confirm.mockReturnValue(true);
      surplusAPI.claim.mockRejectedValue(new Error("Network error"));
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => { render(<ReceiverBrowse />); });
      
      await act(async () => { 
        fireEvent.click(screen.getAllByText("Claim Donation")[0]); 
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          "Failed to claim. It may have already been claimed."
        );
      });
    });
  });

  describe("Filter Functionality", () => {
    test("applies filters", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      surplusAPI.search.mockResolvedValue({ data: [] });

      await act(async () => { render(<ReceiverBrowse />); });

      await act(async () => { 
        fireEvent.click(screen.getByText("Change Food Type")); 
      });
      await act(async () => { 
        fireEvent.click(screen.getByText("Apply Filters")); 
      });

      await waitFor(() => { 
        expect(surplusAPI.search).toHaveBeenCalled(); 
      });
    });

    test("clears filters", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => { render(<ReceiverBrowse />); });

      await act(async () => {
        fireEvent.click(screen.getByText("Change Food Type"));
        fireEvent.click(screen.getByText("Clear Filters"));
      });

      await waitFor(() => { 
        expect(surplusAPI.list).toHaveBeenCalledTimes(2); 
      });
    });
  });

  describe("Bookmark Functionality", () => {
    test("bookmarks items", async () => {
      surplusAPI.list.mockResolvedValue({ data: [createMockDonation()] });
      await act(async () => { render(<ReceiverBrowse />); });

      await waitFor(() => { 
        expect(screen.getAllByLabelText("Bookmark")[0]).toBeInTheDocument(); 
      });

      const bookmarkBtn = screen.getAllByLabelText("Bookmark")[0];
      await act(async () => { 
        fireEvent.click(bookmarkBtn); 
      });

      expect(bookmarkBtn).toBeInTheDocument();
    });
  });
});
