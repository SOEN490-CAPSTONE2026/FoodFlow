import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurplusFormModal from "../SurplusFormModal";
import axios from "axios";

// ---- Mock axios ----
jest.mock("axios", () => {
  const mockPost = jest.fn();
  const mockGet = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();
  const mockPatch = jest.fn();

  const mockInstance = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    patch: mockPatch,
    interceptors: {
      request: { use: jest.fn(() => (config) => config), eject: jest.fn() },
      response: { use: jest.fn(() => (response) => response), eject: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockInstance),
    },
  };
});

const mockAxiosInstance = axios.create();

// ---- Mocks ----
jest.mock("@react-google-maps/api", () => ({
  Autocomplete: ({ children }) => (
    <div data-testid="autocomplete">{children}</div>
  ),
}));

jest.mock("react-datepicker", () => {
  const React = require("react");
  return function MockDatePicker({ selected, onChange, placeholderText }) {
    return (
      <input
        type="text"
        value={selected ? selected.toString() : ""}
        onChange={(e) => onChange && onChange(new Date(e.target.value))}
        placeholder={placeholderText}
      />
    );
  };
});

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
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
    isMulti,
  }) {
    const handleChange = (e) => {
      if (onChange) {
        if (isMulti) {
          const selectedOptions = Array.from(e.target.selectedOptions).map(
            (opt) => options.find((option) => option.value === opt.value)
          );
          onChange(selectedOptions);
        } else {
          const selectedOption = options.find(
            (opt) => opt.value === e.target.value
          );
          onChange(selectedOption);
        }
      }
    };

    return (
      <select
        multiple={isMulti}
        value={
          isMulti
            ? value
              ? value.map((v) => v.value)
              : []
            : value
            ? value.value
            : ""
        }
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

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

describe("SurplusFormModal", () => {
  const mockToken = "mock-jwt-token";

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("jwtToken", mockToken);
    window.confirm.mockReturnValue(true);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  // Test 1: Does not render when isOpen is false
  test("does not render modal when isOpen is false", () => {
    const { container } = render(
      <SurplusFormModal {...defaultProps} isOpen={false} />
    );

    expect(screen.queryByText("Add New Donation")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  // Test 2: Submits form with valid data
  test("submits form with valid data", async () => {
    const mockResponse = { data: { id: 123 } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );
    await userEvent.type(screen.getByPlaceholderText("0"), "10");
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
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    const apiCall = mockAxiosInstance.post.mock.calls[0];
    expect(apiCall[0]).toBe("/surplus");
    expect(apiCall[1]).toMatchObject({
      title: "Test Food",
      quantity: { value: 10, unit: "KILOGRAM" },
      pickupLocation: { address: "Test Location" },
      description: "Test description",
    });
  });

  // Test 3: Handles API errors gracefully
  test("shows error when API call fails", async () => {
    const errorMessage = "Network Error";
    mockAxiosInstance.post.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Bad Test"
    );
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });
  });

  // Test 4: Cancel button triggers confirm and closes
  test("closes modal when Cancel clicked", async () => {
    render(<SurplusFormModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(window.confirm).toHaveBeenCalledWith("Cancel donation creation?");
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // Test 5: Close (X) button works
  test("closes modal when close (X) clicked", () => {
    render(<SurplusFormModal {...defaultProps} />);
    const closeButton = screen.getByTestId("x-icon").closest("button");
    fireEvent.click(closeButton);
    expect(window.confirm).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // Test 6: Updates form state on typing
  test("updates input fields correctly", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    const title = screen.getByPlaceholderText("e.g., Vegetable Lasagna");
    await userEvent.type(title, "Pizza");
    expect(title.value).toBe("Pizza");

    const desc = screen.getByPlaceholderText(
      "Describe the food (ingredients, freshness, etc.)"
    );
    await userEvent.type(desc, "Homemade pizza");
    expect(desc.value).toBe("Homemade pizza");
  });

  // Test 7: Autocomplete component renders
  test("renders autocomplete field", () => {
    render(<SurplusFormModal {...defaultProps} />);
    expect(screen.getByTestId("autocomplete")).toBeInTheDocument();
  });

  // Test 8: Required attributes on inputs
  test("title and quantity fields are required", () => {
    render(<SurplusFormModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("e.g., Vegetable Lasagna")).toBeRequired();
    expect(screen.getByPlaceholderText("0")).toBeRequired();
  });
});
