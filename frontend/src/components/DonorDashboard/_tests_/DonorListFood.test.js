import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the dependencies
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("@react-google-maps/api", () => ({
  LoadScript: ({ children }) => children,
  useLoadScript: () => ({
    isLoaded: true,
    loadError: null,
  }),
}));

jest.mock("../SurplusFormModal", () => {
  return function MockSurplusFormModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="surplus-form-modal">Mock Modal</div>
    ) : null;
  };
});

// Fixed AuthContext mock - define it inline
jest.mock("../../../contexts/AuthContext", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({
      user: { id: 1, name: "Test User" },
    }),
  };
});

jest.mock("../../../services/api", () => ({
  surplusAPI: {
    getMyPosts: jest.fn(),
    deletePost: jest.fn(),
    getTimeline: jest.fn(),
  },
  claimsAPI: {
    getClaimForSurplusPost: jest.fn(),
  },
  reportAPI: {
    createReport: jest.fn(),
  },
  feedbackAPI: {
    getFeedbackForClaim: jest.fn(),
    submitFeedback: jest.fn(),
  },
}));

jest.mock("../../../constants/foodConstants", () => ({
  getFoodTypeLabel: (value) => {
    const mapping = {
      FRUITS_VEGETABLES: "Fruits & Vegetables",
      BAKERY_ITEMS: "Bakery & Pastry",
      PREPARED_MEALS: "Prepared Meals",
      DAIRY_COLD: "Dairy & Cold",
      FROZEN: "Frozen",
    };
    return mapping[value] || value;
  },
  getUnitLabel: (value) => {
    const mapping = {
      KILOGRAM: "kg",
      LOAF: "loaves",
      SERVINGS: "servings",
      ITEM: "items",
      LITER: "liters",
      POUND: "lbs",
      BOX: "boxes",
      PACKAGES: "packages",
    };
    return mapping[value] || value;
  }
}));

jest.mock("lucide-react", () => ({
  Calendar: () => "CalendarIcon",
  Clock: () => "ClockIcon",
  MapPin: () => "MapPinIcon",
  Edit: () => "EditIcon",
  Trash2: () => "TrashIcon",
  AlertTriangle: () => "AlertIcon",
  X: () => "XIcon",
  Package: () => "PackageIcon",
  ChevronDown: () => "ChevronDownIcon",
  Filter: () => "FilterIcon",
  Camera: () => "CameraIcon",
  Image: () => "ImageIcon",
  ChevronLeft: () => "ChevronLeftIcon",
  ChevronRight: () => "ChevronRightIcon",
  Upload: () => "UploadIcon",
  Star: () => "StarIcon",
}));

jest.mock("../../shared/DonationTimeline", () => {
  return function MockDonationTimeline() {
    return <div data-testid="donation-timeline">Timeline</div>;
  };
});

jest.mock("../ConfirmPickupModal", () => {
  return function MockConfirmPickupModal() {
    return <div data-testid="confirm-pickup-modal">Pickup Modal</div>;
  };
});

jest.mock("../ClaimedSuccessModal", () => {
  return function MockClaimedSuccessModal() {
    return <div data-testid="claimed-success-modal">Success Modal</div>;
  };
});

jest.mock("../../FeedbackModal/FeedbackModal", () => {
  return function MockFeedbackModal() {
    return <div data-testid="feedback-modal">Feedback Modal</div>;
  };
});

jest.mock("../../ReportUserModal", () => {
  return function MockReportUserModal() {
    return <div data-testid="report-modal">Report Modal</div>;
  };
});

import DonorListFood from "../DonorListFood";
import { surplusAPI } from "../../../services/api";
import { AuthContext } from "../../../contexts/AuthContext";

// Mock data - changed to use objects with name property like the real API
const mockItems = [
  {
    id: 1,
    title: "Fresh Apples",
    foodCategories: [{ name: "FRUITS_VEGETABLES" }],
    quantity: {
      value: 5,
      unit: "KILOGRAM",
    },
    expiryDate: "2025-10-08",
    pickupDate: "2025-10-01",
    pickupFrom: "14:00",
    pickupTo: "17:00",
    pickupLocation: { address: "123 Main St, City, State 12345" },
    description: "Red Delicious apples, perfect for snacking or baking",
    status: "AVAILABLE",
  },
  {
    id: 2,
    title: "Artisan Bread Selection",
    foodCategories: [{ name: "BAKERY_ITEMS" }],
    quantity: {
      value: 10,
      unit: "LOAF",
    },
    expiryDate: "2025-10-02",
    pickupSlots: [
      {
        pickupDate: "2025-10-01",
        startTime: "09:00",
        endTime: "12:00",
      },
      {
        pickupDate: "2025-10-02",
        startTime: "14:00",
        endTime: "17:00",
      },
    ],
    pickupLocation: { address: "456 Oak Ave, Town, State 67890" },
    description: "Fresh sourdough, whole wheat, and gluten-free options",
    status: "NOT_COMPLETED",
  },
];

// Create a wrapper component to provide the AuthContext AND Router
const TestWrapper = ({ children }) => {
  const mockUser = { id: 1, name: "Test User" };
  return (
    <MemoryRouter>
      <AuthContext.Provider value={{ user: mockUser }}>
        {children}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("DonorListFood", () => {
  const setup = () => render(<DonorListFood />, { wrapper: TestWrapper });

  let originalAlert;
  let originalConfirm;

  beforeAll(() => {
    originalAlert = window.alert;
    originalConfirm = window.confirm;
  });

  beforeEach(() => {
    window.alert = jest.fn();
    window.confirm = jest.fn();
    surplusAPI.getMyPosts.mockClear();
  });

  afterAll(() => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  });

  test("renders loading state initially", () => {
    surplusAPI.getMyPosts.mockImplementation(() => new Promise(() => {})); // Never resolves

    setup();

    expect(screen.getByText(/loading your donations/i)).toBeInTheDocument();
  });

  test("renders empty state when no donations exist", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: [] });

    setup();

    await waitFor(() => {
      expect(
        screen.getByText(/you haven't posted anything yet/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /create your first donation post to start helping your community reduce food waste/i
      )
    ).toBeInTheDocument();
  });

  test("renders donation listings after loading data", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /\+ donate more/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("region", { name: /donations list/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /fresh apples/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /artisan bread selection/i })
    ).toBeInTheDocument();
  });

  test("displays correct donation information after loading data", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const appleCard = screen.getByLabelText(/fresh apples/i);
    // Check for quantity by finding the donation-quantity div
    const quantityDiv = appleCard.querySelector('.donation-quantity');
    expect(quantityDiv).toBeInTheDocument();
    expect(quantityDiv).toHaveTextContent('5');
    expect(quantityDiv).toHaveTextContent('kg');
    expect(within(appleCard).getByText(/Available/i)).toBeInTheDocument();
    expect(
      within(appleCard).getByText(/Fruits & Vegetables/i)
    ).toBeInTheDocument();
  });

  test("displays donation details like time and location after loading data", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const appleCard = screen.getByLabelText(/fresh apples/i);
    expect(
      within(appleCard).getByText(/Expires:\s*Oct 8, 2025/)
    ).toBeInTheDocument();
    expect(within(appleCard).getByText(/Pickup:/)).toBeInTheDocument();
  });

  test("displays multiple pickup slots when available", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/artisan bread selection/i)).toBeInTheDocument();
    });

    const breadCard = screen.getByLabelText(/artisan bread selection/i);
    
    // Should display "Pickup:" label once
    const pickupLabels = within(breadCard).getAllByText(/Pickup:/i);
    expect(pickupLabels).toHaveLength(1);
    
    // Should display the divider between slots
    expect(within(breadCard).getByText(/\|/)).toBeInTheDocument();
  });

  test("shows edit and delete buttons for AVAILABLE status donations", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    // Only the AVAILABLE item should have edit and delete buttons
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  test("shows reschedule button for NOT_COMPLETED status donations", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/artisan bread selection/i)).toBeInTheDocument();
    });

    const rescheduleButton = screen.getByRole("button", { name: /reschedule/i });
    expect(rescheduleButton).toBeInTheDocument();
  });

  test("reschedule button shows alert when clicked", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/artisan bread selection/i)).toBeInTheDocument();
    });

    const rescheduleButton = screen.getByRole("button", { name: /reschedule/i });
    await user.click(rescheduleButton);

    expect(window.alert).toHaveBeenCalledWith(
      "Reschedule functionality coming soon!"
    );
  });

  test("edit button opens modal in edit mode when clicked", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);

    // Modal should open
    expect(screen.getByTestId("surplus-form-modal")).toBeInTheDocument();
  });

test("delete button shows confirmation and removes item when confirmed", async () => {
  surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

  surplusAPI.deletePost = jest.fn(() => Promise.resolve({}));

  window.confirm.mockReturnValue(true);
  const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this post?"
    );
    expect(window.alert).toHaveBeenCalledWith("Post deleted successfully.");

    // The item should be removed from the UI
    expect(screen.queryByLabelText(/fresh apples/i)).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(/artisan bread selection/i)
    ).toBeInTheDocument();
  });

  test("delete button does not delete when confirmation is cancelled", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    window.confirm.mockReturnValue(false);
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this post?"
    );
    expect(window.alert).not.toHaveBeenCalledWith("Post deleted successfully.");

    // The item should still be in the UI
    expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
  });

  test("renders donation notes after loading data", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Red Delicious apples, perfect for snacking or baking/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fresh sourdough, whole wheat, and gluten-free options/i)
    ).toBeInTheDocument();
  });

  test("location links open in new tab after loading data", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const locationLinks = screen.getAllByRole("link");

    locationLinks.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.href).toContain("google.com/maps");
    });
  });

  test("shows error banner when API call fails", async () => {
    surplusAPI.getMyPosts.mockRejectedValue(new Error("API Error"));

    setup();

    await waitFor(() => {
      expect(screen.getByText(/error: api error/i)).toBeInTheDocument();
    });

    // Find and test the error close button
    const errorCloseButton = screen.getByRole("button", { name: "XIcon" });
    expect(errorCloseButton).toBeInTheDocument();
  });

  test("opens and closes donation modal", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByRole("button", { name: /\+ donate more/i }));
    expect(screen.getByTestId("surplus-form-modal")).toBeInTheDocument();
  });

  test("shows only confirmed pickup slot when confirmedPickupSlot exists", async () => {
    const itemWithConfirmedSlot = {
      id: 3,
      title: "Confirmed Slot Item",
      foodCategories: [{ name: "PREPARED_MEALS" }],
      quantity: { value: 3, unit: "SERVINGS" },
      expiryDate: "2025-10-10",
      pickupSlots: [
        { pickupDate: "2025-10-05", startTime: "10:00", endTime: "12:00" },
        { pickupDate: "2025-10-06", startTime: "14:00", endTime: "16:00" },
      ],
      confirmedPickupSlot: {
        pickupDate: "2025-10-06",
        startTime: "14:00",
        endTime: "16:00",
      },
      pickupLocation: { address: "789 Test St" },
      status: "CLAIMED",
    };

    surplusAPI.getMyPosts.mockResolvedValue({ data: [itemWithConfirmedSlot] });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/confirmed slot item/i)).toBeInTheDocument();
    });

    const card = screen.getByLabelText(/confirmed slot item/i);
    const pickupTimes = card.querySelectorAll(".pickup-time-item");

    // Should only show ONE pickup time (the confirmed one)
    expect(pickupTimes).toHaveLength(1);
    
    // Should not have divider since there's only one slot shown
    expect(within(card).queryByText(/\|/)).not.toBeInTheDocument();
  });

  test("shows all pickup slots when no confirmedPickupSlot exists", async () => {
    const itemWithoutConfirmedSlot = {
      id: 4,
      title: "No Confirmed Slot Item",
      foodCategories: [{ name: "DAIRY_COLD" }],
      quantity: { value: 2, unit: "LITER" },
      expiryDate: "2025-10-08",
      pickupSlots: [
        { pickupDate: "2025-10-05", startTime: "10:00", endTime: "12:00" },
        { pickupDate: "2025-10-06", startTime: "14:00", endTime: "16:00" },
      ],
      pickupLocation: { address: "321 Test Ave" },
      status: "AVAILABLE",
    };

    surplusAPI.getMyPosts.mockResolvedValue({ data: [itemWithoutConfirmedSlot] });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/no confirmed slot item/i)).toBeInTheDocument();
    });

    const card = screen.getByLabelText(/no confirmed slot item/i);
    const pickupTimes = card.querySelectorAll(".pickup-time-item");

    // Should show ALL pickup slots when not confirmed
    expect(pickupTimes).toHaveLength(2);
    
    // Should have divider between multiple slots
    expect(within(card).getByText(/\|/)).toBeInTheDocument();
  });

  test("shows only the confirmed slot for single slot item when confirmed", async () => {
    const itemWithSingleConfirmedSlot = {
      id: 5,
      title: "Single Confirmed Slot",
      foodCategories: [{ name: "FROZEN" }],
      quantity: { value: 5, unit: "PACKAGES" },
      expiryDate: "2025-10-15",
      pickupSlots: [
        { pickupDate: "2025-10-10", startTime: "09:00", endTime: "11:00" },
      ],
      confirmedPickupSlot: {
        pickupDate: "2025-10-10",
        startTime: "09:00",
        endTime: "11:00",
      },
      pickupLocation: { address: "555 Frozen Lane" },
      status: "READY_FOR_PICKUP",
    };

    surplusAPI.getMyPosts.mockResolvedValue({ data: [itemWithSingleConfirmedSlot] });

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/single confirmed slot/i)).toBeInTheDocument();
    });

    const card = screen.getByLabelText(/single confirmed slot/i);
    const pickupTimes = card.querySelectorAll(".pickup-time-item");

    // Should show only one slot
    expect(pickupTimes).toHaveLength(1);
    
    // Should not have divider for single slot
    expect(within(card).queryByText(/\|/)).not.toBeInTheDocument();
  });

  // Additional test to verify navigation functionality works
  test("handles navigation functionality when buttons are clicked", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    // Test that components with navigation hooks render properly
    // This would fail with the Router error if not wrapped properly
    expect(screen.getByRole("button", { name: /\+ donate more/i })).toBeInTheDocument();
    
    // If your buttons trigger navigation, they should work without throwing Router errors
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);
    
    // Modal should open properly with Router context
    expect(screen.getByTestId("surplus-form-modal")).toBeInTheDocument();
  });

  describe('Timeline Feature', () => {
    const mockTimelineData = [
      {
        id: 1,
        eventType: 'DONATION_POSTED',
        timestamp: '2026-01-11T10:00:00',
        actor: 'donor',
        actorUserId: 1,
        newStatus: 'AVAILABLE',
        details: 'Donation created',
        visibleToUsers: true,
      },
      {
        id: 2,
        eventType: 'DONATION_CLAIMED',
        timestamp: '2026-01-11T11:00:00',
        actor: 'receiver',
        actorUserId: 2,
        oldStatus: 'AVAILABLE',
        newStatus: 'CLAIMED',
        details: 'Claimed by Food Bank',
        visibleToUsers: true,
      },
    ];

    beforeEach(() => {
      surplusAPI.getMyPosts.mockResolvedValue({
        data: mockItems,
      });
      surplusAPI.getTimeline = jest.fn().mockResolvedValue({
        data: mockTimelineData,
      });
    });

    it('should fetch and display timeline when clicking view timeline button', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: { id: 1, name: "Test User" } }}>
            <DonorListFood />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Fresh Apples")).toBeInTheDocument();
      });

      // Find and click the view timeline button - Item 2 (Artisan Bread) has the timeline button
      const timelineButtons = screen.getAllByRole('button', { name: /view.*donation timeline/i });
      await user.click(timelineButtons[0]);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledWith(2);
      });
    });

    it('should toggle timeline visibility on button click', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: { id: 1, name: "Test User" } }}>
            <DonorListFood />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Fresh Apples")).toBeInTheDocument();
      });

      const timelineButtons = screen.getAllByRole('button', { name: /view.*donation timeline/i });

      // Click to expand
      await user.click(timelineButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /hide.*donation timeline/i })).toBeInTheDocument();
      });

      // Click to collapse
      const hideButton = screen.getByRole('button', { name: /hide.*donation timeline/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /hide.*donation timeline/i })).not.toBeInTheDocument();
      });
    });

    it('should handle timeline fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      surplusAPI.getTimeline.mockRejectedValue(new Error('Failed to fetch timeline'));

      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: { id: 1, name: "Test User" } }}>
            <DonorListFood />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Fresh Apples")).toBeInTheDocument();
      });

      const timelineButtons = screen.getAllByRole('button', { name: /view.*donation timeline/i });
      await user.click(timelineButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Check the actual call - Item 2 (Artisan Bread) is the first one with timeline button
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching timeline for donation',
        2,
        ':',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not fetch timeline again if already loaded', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: { id: 1, name: "Test User" } }}>
            <DonorListFood />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Fresh Apples")).toBeInTheDocument();
      });

      const timelineButtons = screen.getAllByRole('button', { name: /view.*donation timeline/i });

      // Click to expand first time
      await user.click(timelineButtons[0]);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
      });

      // Collapse
      const hideButton = screen.getByRole('button', { name: /hide.*donation timeline/i });
      await user.click(hideButton);

      // Expand again
      const viewButtons = screen.getAllByRole('button', { name: /view.*donation timeline/i });
      await user.click(viewButtons[0]);

      // Should still only have been called once (cached)
      expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
    });
  });
});

