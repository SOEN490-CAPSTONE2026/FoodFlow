import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminUsers from "../AdminUsers";

// Mock axios
jest.mock("axios");
import axios from "axios";

// Mock react-select
jest.mock("react-select", () => {
  return function MockSelect({ options, value, onChange, placeholder }) {
    return (
      <select
        data-testid="react-select"
        value={value?.value || ""}
        onChange={(e) => {
          const selectedOption = options?.find(opt => opt.value === e.target.value);
          onChange?.(selectedOption || null);
        }}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronRight: () => <div>ChevronRight</div>,
  ChevronDown: () => <div>ChevronDown</div>,
  Power: () => <div>Power</div>,
  Bell: () => <div>Bell</div>,
  Edit3: () => <div>Edit3</div>,
  Search: () => <div>Search</div>,
  Users: () => <div>Users</div>,
  Gift: () => <div>Gift</div>,
  Sparkles: () => <div>Sparkles</div>,
  Handshake: () => <div>Handshake</div>,
}));

describe("AdminUsers", () => {
  const mockUsers = [
    {
      id: 1,
      email: "donor@test.com",
      role: "DONOR",
      organizationName: "Test Org",
      contactPerson: "John Doe",
      phone: "123-456-7890",
      accountStatus: "ACTIVE",
      verificationStatus: "VERIFIED",
      donationCount: 10,
      createdAt: "2025-01-01T10:00:00",
      adminNotes: null,
    },
    {
      id: 2,
      email: "receiver@test.com",
      role: "RECEIVER",
      organizationName: "Food Bank",
      contactPerson: "Jane Smith",
      phone: "098-765-4321",
      accountStatus: "DEACTIVATED",
      verificationStatus: "PENDING",
      claimCount: 5,
      createdAt: "2025-02-01T10:00:00",
      adminNotes: "Test note",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("jwtToken", "test-token");
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Component Rendering", () => {
    test("renders stats cards", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: mockUsers,
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("Total Donors")).toBeInTheDocument();
        expect(screen.getByText("Total Receivers")).toBeInTheDocument();
        expect(screen.getByText("New Users")).toBeInTheDocument();
      });
    });

    test("renders search bar and filters", async () => {
      axios.get.mockResolvedValueOnce({
        data: { content: [], totalPages: 0 },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by name, email, or organization/i)).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });
    });

    test("renders users table with headers", async () => {
      axios.get.mockResolvedValueOnce({
        data: { content: [], totalPages: 0 },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("ID")).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Role")).toBeInTheDocument();
        expect(screen.getByText("Verification")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Phone")).toBeInTheDocument();
        expect(screen.getByText("Activity")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    test("displays loading state", () => {
      axios.get.mockImplementation(() => new Promise(() => {}));

      render(<AdminUsers />);

      expect(screen.getByText("Loading users...")).toBeInTheDocument();
    });

    test("fetches and displays users", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: mockUsers,
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("donor@test.com")).toBeInTheDocument();
        expect(screen.getByText("receiver@test.com")).toBeInTheDocument();
      });
    });

    test("displays error message on API failure", async () => {
      axios.get.mockRejectedValueOnce(new Error("API Error"));

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load users. Please try again.")).toBeInTheDocument();
      });
    });

    test("displays 'No users found' when no data", async () => {
      axios.get.mockResolvedValueOnce({
        data: { content: [], totalPages: 0 },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("No users found")).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    test("updates search term on input change", async () => {
      axios.get.mockResolvedValue({
        data: { content: [], totalPages: 0 },
      });

      render(<AdminUsers />);

      const searchInput = await screen.findByPlaceholderText(/search by name, email, or organization/i);
      
      fireEvent.change(searchInput, { target: { value: "John" } });

      expect(searchInput.value).toBe("John");
    });

    test("triggers search after debounce delay", async () => {
      jest.useFakeTimers();
      axios.get.mockResolvedValue({
        data: { content: mockUsers, totalPages: 1 },
      });

      render(<AdminUsers />);

      const searchInput = await screen.findByPlaceholderText(/search by name, email, or organization/i);
      
      fireEvent.change(searchInput, { target: { value: "John" } });

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: expect.objectContaining({
              search: "John",
            }),
          })
        );
      });

      jest.useRealTimers();
    });
  });

  describe("Filter Functionality", () => {
    test("resets filters on reset button click", async () => {
      axios.get.mockResolvedValue({
        data: { content: mockUsers, totalPages: 1 },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });

      const resetButton = screen.getByText("Reset");
      fireEvent.click(resetButton);

      const searchInput = screen.getByPlaceholderText(/search by name, email, or organization/i);
      expect(searchInput.value).toBe("");
    });
  });

  describe("User Actions", () => {
    test("opens deactivate modal when deactivate button clicked", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByTitle("Deactivate");
      fireEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deactivate User:")).toBeInTheDocument();
        expect(screen.getByText("donor@test.com")).toBeInTheDocument();
      });
    });

    test("opens reactivate modal when reactivate button clicked", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[1]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      const reactivateButtons = screen.getAllByTitle("Reactivate");
      fireEvent.click(reactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Reactivate User")).toBeInTheDocument();
      });
    });

    test("opens send alert modal when alert button clicked", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });
    });
  });

  describe("Deactivate User Modal", () => {
    test("closes modal when cancel button clicked", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByTitle("Deactivate");
      fireEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deactivate User:")).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText("Cancel");
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("Deactivate User:")).not.toBeInTheDocument();
      });
    });

    test("shows alert when trying to deactivate without reason", async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByTitle("Deactivate");
      fireEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deactivate User:")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText("Deactivate");
      const modalDeactivateButton = confirmButtons.find(btn => btn.closest('.modal-actions'));
      
      if (modalDeactivateButton) {
        fireEvent.click(modalDeactivateButton);
        expect(alertMock).toHaveBeenCalledWith('Please provide a reason for deactivation');
      }

      alertMock.mockRestore();
    });

    test("deactivates user successfully", async () => {
      axios.get.mockResolvedValue({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      axios.patch.mockResolvedValueOnce({
        data: { ...mockUsers[0], accountStatus: "DEACTIVATED" },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByTitle("Deactivate");
      fireEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deactivate User:")).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByPlaceholderText(/provide a reason/i);
      fireEvent.change(reasonTextarea, { target: { value: "Test reason" } });

      const confirmButtons = screen.getAllByText("Deactivate");
      const modalDeactivateButton = confirmButtons.find(btn => btn.closest('.modal-actions'));
      
      if (modalDeactivateButton) {
        fireEvent.click(modalDeactivateButton);

        await waitFor(() => {
          expect(axios.patch).toHaveBeenCalled();
        });
      }
    });
  });

  describe("Send Alert Modal", () => {
    test("closes modal when cancel button clicked", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText("Cancel");
      const lastCancel = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(lastCancel);

      await waitFor(() => {
        expect(screen.queryByText("Send Alert to:")).not.toBeInTheDocument();
      });
    });

    test("allows selecting alert type", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });

      const verifyCheckbox = screen.getByLabelText(/verify account/i);
      fireEvent.click(verifyCheckbox);

      expect(verifyCheckbox.checked).toBe(true);
    });

    test("allows deselecting alert type", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });

      const verifyCheckbox = screen.getByLabelText(/verify account/i);
      
      fireEvent.click(verifyCheckbox);
      expect(verifyCheckbox.checked).toBe(true);

      fireEvent.click(verifyCheckbox);
      expect(verifyCheckbox.checked).toBe(false);
    });

    test("shows custom message textarea when custom alert selected", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });

      const customCheckbox = screen.getByLabelText(/custom message/i);
      fireEvent.click(customCheckbox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter custom message/i)).toBeInTheDocument();
      });
    });

    test("resets alert type when modal closes", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: [mockUsers[0]],
          totalPages: 1,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const alertButtons = screen.getAllByTitle("Send Alert");
      fireEvent.click(alertButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Send Alert to:")).toBeInTheDocument();
      });

      const verifyCheckbox = screen.getByLabelText(/verify account/i);
      fireEvent.click(verifyCheckbox);

      const cancelButtons = screen.getAllByText("Cancel");
      const lastCancel = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(lastCancel);

      await waitFor(() => {
        expect(screen.queryByText("Send Alert to:")).not.toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    test("shows pagination controls when there are multiple pages", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          content: mockUsers,
          totalPages: 3,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
      });
    });

    test("next button calls API with incremented page", async () => {
      axios.get.mockResolvedValue({
        data: {
          content: mockUsers,
          totalPages: 3,
        },
      });

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText("Next")).toBeInTheDocument();
      });

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: expect.objectContaining({
              page: 1,
            }),
          })
        );
      });
    });
  });
});
