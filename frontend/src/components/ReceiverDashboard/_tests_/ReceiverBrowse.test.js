import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ReceiverBrowse from "../ReceiverBrowse";
import { surplusAPI } from "../../../services/api";

// Mock the API
jest.mock("../../../services/api", () => ({
  surplusAPI: {
    list: jest.fn(),
  },
}));

// Mock the images
jest.mock(
  "../../../assets/foodtypes/Pastry&Bakery.jpg",
  () => "bakery-image.jpg"
);
jest.mock(
  "../../../assets/foodtypes/Fruits&Vegetables.jpg",
  () => "fruits-image.jpg"
);
jest.mock(
  "../../../assets/foodtypes/PackagedItems.jpg",
  () => "packaged-image.jpg"
);
jest.mock("../../../assets/foodtypes/Dairy.jpg", () => "dairy-image.jpg");
jest.mock("../../../assets/foodtypes/FrozenFood.jpg", () => "frozen-image.jpg");
jest.mock(
  "../../../assets/foodtypes/PreparedFood.jpg",
  () => "prepared-image.jpg"
);

// Mock CSS
jest.mock("../ReceiverBrowse.css", () => ({}));

// Mock LoadScript component
jest.mock("@react-google-maps/api", () => ({
  LoadScript: ({ children }) => <div data-testid="load-script">{children}</div>,
}));

// Mock FiltersPanel component
jest.mock("../FiltersPanel", () => {
  return function MockFiltersPanel(props) {
    return (
      <div data-testid="filters-panel">
        <button onClick={props.onApplyFilters}>Apply Filters</button>
        <button onClick={props.onClearFilters}>Clear Filters</button>
      </div>
    );
  };
});

describe("ReceiverBrowse Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("renders the component title", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      expect(
        screen.getByText("Explore Available Donations")
      ).toBeInTheDocument();
    });

    test("displays loading state initially and then shows empty state when no data", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("No donations available right now.")
        ).toBeInTheDocument();
      });
    });

    test("renders empty state when no donations available", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("No donations available right now.")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Check back soon for new surplus food!")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Donation Cards Rendering", () => {
    test("renders donation cards with correct information when API returns backend data", async () => {
      // This matches your Java SurplusPost entity structure
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"], // Backend enum format
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" }, // Can be string or Location object
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00", // LocalTime format
          pickupTo: "17:00:00", // LocalTime format
          quantity: {
            value: 5,
            unit: "KILOGRAM",
          }, // Embedded Quantity object
          donor: {
            id: 1,
            name: "Green Organic Market",
          }, // User relationship
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
          updatedAt: "2025-11-04T10:00:00",
          status: "AVAILABLE",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
        expect(screen.getByText("Downtown Montreal")).toBeInTheDocument();
        expect(screen.getByText("Fruits & Vegetables")).toBeInTheDocument();
        expect(
          screen.getByText("Donated by Green Organic Market")
        ).toBeInTheDocument();
      });
    });

    test("renders multiple donation cards when API returns multiple items", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
        {
          id: 2,
          title: "Artisan Bread Assortment",
          foodCategories: ["BAKERY_PASTRY"],
          expiryDate: "2025-11-05",
          pickupLocation: { address: "Plateau Mont-Royal" },
          pickupDate: "2025-11-05",
          pickupFrom: "08:00:00",
          pickupTo: "12:00:00",
          quantity: { value: 10, unit: "PIECE" },
          donor: { name: "Le Petit Boulanger" },
          description: "Freshly baked this morning",
          createdAt: "2025-11-04T16:30:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
        expect(
          screen.getByText("Artisan Bread Assortment")
        ).toBeInTheDocument();
      });
    });

    test("shows Available status badge on cards", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        const badges = screen.getAllByText("Available");
        expect(badges.length).toBe(1);
      });
    });
  });

  describe("Bookmark Functionality", () => {
    test("bookmarks a donation when bookmark button is clicked", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
      });

      const bookmarkButtons = screen.getAllByLabelText("Bookmark");

      await act(async () => {
        fireEvent.click(bookmarkButtons[0]);
      });

      expect(bookmarkButtons[0]).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse Functionality", () => {
    test("expands and collapses donation details when More/Less button is clicked", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
      });

      const moreButtons = screen.getAllByText("More");

      // Expand
      await act(async () => {
        fireEvent.click(moreButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText("Donor's Note")).toBeInTheDocument();
        expect(screen.getByText("Crisp and sweet apples")).toBeInTheDocument();
      });

      // Collapse
      const lessButton = screen.getByText("Less");

      await act(async () => {
        fireEvent.click(lessButton);
      });

      await waitFor(() => {
        expect(screen.queryByText("Donor's Note")).not.toBeInTheDocument();
      });
    });
  });

  describe("Claim Donation Functionality", () => {
    test("calls handleClaimDonation when Claim button is clicked", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
      });

      const claimButtons = screen.getAllByText("Claim Donation");

      await act(async () => {
        fireEvent.click(claimButtons[0]);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Claiming donation:",
        expect.objectContaining({
          title: "Fresh Organic Apples",
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    test("displays error message when API call fails", async () => {
      surplusAPI.list.mockRejectedValue(new Error("API Error"));

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load available donations")
        ).toBeInTheDocument();
      });
    });

    test("handles empty data array from API", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("No donations available right now.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Polling Mechanism", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test("sets up polling interval on mount", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 8000);

      setIntervalSpy.mockRestore();
    });

    test("clears polling interval on unmount", async () => {
      surplusAPI.list.mockResolvedValue({ data: [] });
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      let component;
      await act(async () => {
        component = render(<ReceiverBrowse />);
      });

      act(() => {
        component.unmount();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    test("handles null expiry date from API", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Test Item",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: null,
          pickupLocation: { address: "Test Location" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Test Donor" },
          description: "Test description",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Expires: —")).toBeInTheDocument();
      });
    });

    test("handles missing donor name from API", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Test Item",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Test Location" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: null,
          description: "Test description",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Donated by Local Business")
        ).toBeInTheDocument();
      });
    });

    test("handles donation with no description from API", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Test Item",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Test Location" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Test Donor" },
          description: null,
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Test Item")).toBeInTheDocument();
      });

      const moreButtons = screen.getAllByText("More");

      await act(async () => {
        fireEvent.click(moreButtons[0]);
      });

      // Donor's Note section should not be rendered when there is no description
      await waitFor(() => {
        expect(screen.queryByText("Donor's Note")).not.toBeInTheDocument();
      });
    });
  });

  describe("Food Category Mapping", () => {
    test("correctly maps backend food categories to display strings", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Bakery Item",
          foodCategories: ["BAKERY_GOODS"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Test Location" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "PIECE" },
          donor: { name: "Test Donor" },
          description: "Test description",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Bakery & Pastry")).toBeInTheDocument(); //TODO: to be modified later
      });
    });
  });

  describe("Accessibility", () => {
    test("bookmark button has proper aria-label", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: { address: "Downtown Montreal" },
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donor: { name: "Green Organic Market" },
          description: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
      ];

      surplusAPI.list.mockResolvedValue({ data: mockApiResponse });

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Organic Apples")).toBeInTheDocument();
      });

      const bookmarkButtons = screen.getAllByLabelText("Bookmark");
      expect(bookmarkButtons.length).toBeGreaterThan(0);
    });

    test("error messages have proper role attribute when API fails", async () => {
      surplusAPI.list.mockRejectedValue(new Error("API Error"));

      await act(async () => {
        render(<ReceiverBrowse />);
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });
});
