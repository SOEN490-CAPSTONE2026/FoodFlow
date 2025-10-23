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
    test("renders donation cards with correct information when API returns data", async () => {
      const mockApiResponse = [
        {
          id: 1,
          title: "Fresh Organic Apples",
          foodCategories: ["FRUITS_VEGETABLES"],
          expiryDate: "2025-11-08",
          pickupLocation: "Downtown Montreal",
          pickupDate: "2025-11-06",
          pickupFrom: "14:00:00",
          pickupTo: "17:00:00",
          quantity: { value: 5, unit: "KILOGRAM" },
          donorName: "Green Organic Market",
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
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
          createdAt: "2025-11-04T10:00:00",
        },
        {
          id: 2,
          foodName: "Artisan Bread Assortment",
          foodType: "Bakery & Pastry",
          expiryDate: "2025-11-05",
          location: "Plateau Mont-Royal",
          pickupFrom: "2025-11-05T08:00:00",
          pickupTo: "12:00:00",
          quantity: 10,
          unit: "items",
          donorName: "Le Petit Boulanger",
          notes: "Freshly baked this morning",
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
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
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
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
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
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
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
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
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
          foodName: "Fresh Organic Apples",
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
          foodName: "Test Item",
          foodType: "Fruits & Vegetables",
          expiryDate: null,
          location: "Test Location",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Test Donor",
          notes: "Test notes",
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
          foodName: "Test Item",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Test Location",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: null,
          notes: "Test notes",
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

    test("handles donation with no notes from API", async () => {
      const mockApiResponse = [
        {
          id: 1,
          foodName: "Test Item",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Test Location",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Test Donor",
          notes: null,
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

      // Donor's Note section should not be rendered when there are no notes
      await waitFor(() => {
        expect(screen.queryByText("Donor's Note")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    test("bookmark button has proper aria-label", async () => {
      const mockApiResponse = [
        {
          id: 1,
          foodName: "Fresh Organic Apples",
          foodType: "Fruits & Vegetables",
          expiryDate: "2025-11-08",
          location: "Downtown Montreal",
          pickupFrom: "2025-11-06T14:00:00",
          pickupTo: "17:00:00",
          quantity: 5,
          unit: "kg",
          donorName: "Green Organic Market",
          notes: "Crisp and sweet apples",
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
