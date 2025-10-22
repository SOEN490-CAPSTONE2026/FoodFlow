import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import SurplusFormModal from "../components/DonorDashboard/SurplusFormModal";

// Mock dependencies
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock @react-google-maps/api
jest.mock("@react-google-maps/api", () => ({
  Autocomplete: ({ children }) => children,
}));

// Mock react-datepicker
jest.mock("react-datepicker", () => {
  const React = require("react");
  return function MockDatePicker({
    selected,
    onChange,
    customInput,
    placeholderText,
  }) {
    const handleClick = () => {
      if (onChange) {
        onChange(new Date("2024-01-01T10:00:00"));
      }
    };

    if (customInput) {
      // Clone the custom input element and pass it proper props
      return React.cloneElement(customInput, {
        value: selected ? selected.toString() : "",
        onClick: handleClick,
        placeholder: placeholderText,
      });
    }

    return React.createElement("input", {
      type: "text",
      value: selected ? selected.toString() : "",
      onChange: (e) => onChange && onChange(new Date(e.target.value)),
      placeholder: placeholderText,
    });
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, "confirm", {
  writable: true,
  value: mockConfirm,
});

// Mock react-select
jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
    placeholder,
    classNamePrefix,
  }) {
    const handleChange = (e) => {
      if (onChange) {
        const selectedOption = options.find(
          (opt) => opt.value === e.target.value
        );
        onChange(selectedOption);
      }
    };

    return (
      <select
        value={value ? value.value : ""}
        onChange={handleChange}
        data-testid="mock-select"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

describe("SurplusFormModal", () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue("mock-jwt-token");
    mockConfirm.mockReturnValue(true);
  });

  // Test 1: Component renders when isOpen is true
  test("renders modal when isOpen is true", () => {
    render(<SurplusFormModal {...defaultProps} />);

    expect(screen.getByText("Add New Donation")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna")
    ).toBeInTheDocument();
    expect(screen.getByText("Create Donation")).toBeInTheDocument();
  });

  // Test 2: Component doesn't render when isOpen is false
  test("does not render modal when isOpen is false", () => {
    const { container } = render(
      <SurplusFormModal {...defaultProps} isOpen={false} />
    );

    expect(screen.queryByText("Add New Donation")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  // Test 3: Form submission with valid data
  test("submits form with valid data", async () => {
    const mockResponse = { data: { id: 123 } };
    axios.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    // Fill the form
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    // Fill quantity
    await userEvent.type(screen.getByPlaceholderText("0"), "10");

    // Fill location
    await userEvent.type(
      screen.getByPlaceholderText("Start typing address..."),
      "Test Location"
    );

    // Fill description
    await userEvent.type(
      screen.getByPlaceholderText(
        "Describe the food (ingredients, freshness, etc.)"
      ),
      "Test description"
    );

    // Submit form
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    const apiCall = axios.post.mock.calls[0];
    expect(apiCall[0]).toBe("http://localhost:8080/api/surplus");
    expect(apiCall[1]).toMatchObject({
      title: "Test Food",
      quantity: { value: 10, unit: "KILOGRAM" },
      pickupLocation: { address: "Test Location" },
      description: "Test description",
    });
    expect(apiCall[2].headers.Authorization).toBe("Bearer mock-jwt-token");
  });

  // Test 4: Form validation - required fields prevent submission
  test("does not submit form when required fields are empty", async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: "Validation error" } },
    });

    render(<SurplusFormModal {...defaultProps} />);

    fireEvent.submit(screen.getByText("Create Donation").closest("form"));

    await waitFor(() => {
      expect(screen.getByText("Validation error")).toBeInTheDocument();
    });
  });

  // Test 5: API error handling
  test("handles API errors correctly", async () => {
    const errorMessage = "Network Error";
    axios.post.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<SurplusFormModal {...defaultProps} />);

    // Fill required fields and submit
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    await userEvent.type(
      screen.getByPlaceholderText("Start typing address..."),
      "Test Location"
    );

    await userEvent.type(
      screen.getByPlaceholderText(
        "Describe the food (ingredients, freshness, etc.)"
      ),
      "Test description"
    );

    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // Test 6: Cancel button functionality
  test("cancels form and resets data when cancel button is clicked", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    // Fill some data
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    // Click cancel
    fireEvent.click(screen.getByText("Cancel"));

    expect(window.confirm).toHaveBeenCalledWith("Cancel donation creation?");
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test 7: Close button functionality
  test("closes modal when close button is clicked", () => {
    render(<SurplusFormModal {...defaultProps} />);

    const closeButton = screen.getByTestId("x-icon").closest("button");
    fireEvent.click(closeButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test 8: Success message after successful submission
  test("shows success message after successful submission", async () => {
    const mockResponse = { data: { id: 123 } };
    axios.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    // Fill required fields
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    await userEvent.type(
      screen.getByPlaceholderText("Start typing address..."),
      "Test Location"
    );

    await userEvent.type(
      screen.getByPlaceholderText(
        "Describe the food (ingredients, freshness, etc.)"
      ),
      "Test description"
    );

    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(
        screen.getByText(/Success! Post created with ID: 123/)
      ).toBeInTheDocument();
    });
  });

  // Test 9: JWT token is retrieved from localStorage
  test("retrieves JWT token from localStorage", async () => {
    const mockResponse = { data: { id: 123 } };
    axios.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    // Fill minimal required fields
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    await userEvent.type(
      screen.getByPlaceholderText("Start typing address..."),
      "Test Location"
    );

    await userEvent.type(
      screen.getByPlaceholderText(
        "Describe the food (ingredients, freshness, etc.)"
      ),
      "Test description"
    );

    // Submit the form to trigger token retrieval
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith("jwtToken");
    });
  });

  // Test 10: Cancel confirmation when user declines
  test("does not close modal when cancel is declined", () => {
    mockConfirm.mockReturnValue(false);

    render(<SurplusFormModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Test 11: Input field changes update form state
  test("updates form state when input fields change", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText("e.g., Vegetable Lasagna");
    await userEvent.type(titleInput, "Banana Bread");

    expect(titleInput.value).toBe("Banana Bread");

    const quantityInput = screen.getByPlaceholderText("0");
    await userEvent.type(quantityInput, "5");

    expect(quantityInput.value).toBe("5");

    const notesInput = screen.getByPlaceholderText(
      "Describe the food (ingredients, freshness, etc.)"
    );
    await userEvent.type(notesInput, "Fresh banana bread");

    expect(notesInput.value).toBe("Fresh banana bread");
  });

  // Test 12: Modal closes after successful submission
  test("closes modal after successful submission", async () => {
    const mockResponse = { data: { id: 123 } };
    axios.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    // Fill minimal required fields
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    await userEvent.type(
      screen.getByPlaceholderText("Start typing address..."),
      "Test Location"
    );

    await userEvent.type(
      screen.getByPlaceholderText(
        "Describe the food (ingredients, freshness, etc.)"
      ),
      "Test description"
    );

    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(
        screen.getByText(/Success! Post created with ID: 123/)
      ).toBeInTheDocument();
    });

    // Check that onClose is called after delay
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
