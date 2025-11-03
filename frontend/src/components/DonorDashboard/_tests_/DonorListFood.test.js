import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
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
  },
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
}));

import DonorListFood from "../DonorListFood";
import { surplusAPI } from "../../../services/api";
import { AuthContext } from "../../../contexts/AuthContext";

// Mock data
const mockItems = [
  {
    id: 1,
    title: "Fresh Apples",
    foodCategories: ["FRUITS_VEGETABLES"],
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
    foodCategories: ["BAKERY_ITEMS"],
    quantity: {
      value: 10,
      unit: "LOAF",
    },
    expiryDate: "2025-10-02",
    pickupDate: "2025-10-01",
    pickupFrom: "09:00",
    pickupTo: "12:00",
    pickupLocation: { address: "456 Oak Ave, Town, State 67890" },
    description: "Fresh sourdough, whole wheat, and gluten-free options",
    status: "NOT_COMPLETED",
  },
];

// Create a wrapper component to provide the AuthContext
const TestWrapper = ({ children }) => {
  const mockUser = { id: 1, name: "Test User" };
  return (
    <AuthContext.Provider value={{ user: mockUser }}>
      {children}
    </AuthContext.Provider>
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
    expect(within(appleCard).getByText(/5 KILOGRAM/i)).toBeInTheDocument(); //TODO: to be modified later
    expect(within(appleCard).getByText(/Available/i)).toBeInTheDocument();
    expect(
      within(appleCard).getByText(/FRUITS_VEGETABLES/i) //TODO: to be modified later
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
      within(appleCard).getByText(/Expires: 2025-10-08/)
    ).toBeInTheDocument();
    expect(within(appleCard).getByText(/Pickup:/)).toBeInTheDocument();
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

  test("edit button shows alert when clicked", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
    const user = userEvent.setup();

    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/fresh apples/i)).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Opening edit form for: Fresh Apples")
    );
  });

  test("delete button shows confirmation and removes item when confirmed", async () => {
    surplusAPI.getMyPosts.mockResolvedValue({ data: mockItems });
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
});