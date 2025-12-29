import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock axios
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

import SurplusFormModal from "../SurplusFormModal";
import axios from "axios";

// Get reference to the mocked instance for use in tests
const mockAxiosInstance = axios.create();

// Mock @react-google-maps/api with autocomplete simulation
jest.mock("@react-google-maps/api", () => {
  const mockReact = require("react");
  return {
    Autocomplete: ({ children, onLoad, onPlaceChanged }) => {
      mockReact.useEffect(() => {
        if (onLoad) {
          const mockAutocomplete = {
            getPlace: jest.fn(() => ({
              geometry: {
                location: {
                  lat: () => 45.4215,
                  lng: () => -75.6972,
                },
              },
              formatted_address: "123 Test Street, Ottawa, ON",
              name: "Test Location",
            })),
          };
          onLoad(mockAutocomplete);
        }
      }, []);

      return mockReact.cloneElement(children, {
        onBlur: onPlaceChanged,
      });
    },
  };
});

// Mock react-datepicker
jest.mock("react-datepicker", () => {
  const mockReact = require("react");
  return function MockDatePicker({
    selected,
    onChange,
    customInput,
    placeholderText,
    minDate,
    showTimeSelect,
  }) {
    const handleClick = () => {
      if (onChange) {
        onChange(new Date("2024-01-01T10:00:00"));
      }
    };

    if (customInput) {
      return mockReact.cloneElement(customInput, {
        value: selected ? selected.toString() : "",
        onClick: handleClick,
        placeholder: placeholderText,
      });
    }

    return mockReact.createElement("input", {
      type: "text",
      value: selected ? selected.toString() : "",
      onChange: (e) => onChange && onChange(new Date(e.target.value)),
      onClick: handleClick,
      placeholder: placeholderText,
      "data-testid": showTimeSelect ? "time-picker" : "date-picker",
    });
  };
});

// Mock lucide-react icons
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
    classNamePrefix,
    isMulti,
    name,
  }) {
    const handleChange = (e) => {
      if (onChange) {
        if (isMulti) {
          const selectedOptions = Array.from(e.target.selectedOptions)
            .map((opt) => options.find((option) => option.value === opt.value))
            .filter(Boolean);
          onChange(selectedOptions);
        } else {
          const selectedOption = options.find(
            (opt) => opt.value === e.target.value
          );
          // Only call onChange if we found an option (not empty value)
          if (selectedOption) {
            onChange(selectedOption);
          }
        }
      }
    };

    return (
      <select
        multiple={isMulti}
        name={name}
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
        data-testid={`mock-select-${name || "default"}`}
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
  jest.setTimeout(15000);

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

  // Helper function to fill Step 1 (Food Details)
  const fillStep1 = async () => {
    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );
    
    const categoriesSelect = screen.getByTestId("mock-select-default");
    await userEvent.selectOptions(categoriesSelect, ["PREPARED_MEALS"]);
    
    const tempSelect = screen.getByTestId("mock-select-temperatureCategory");
    fireEvent.change(tempSelect, { target: { value: "REFRIGERATED" } });
    
    const packagingSelect = screen.getByTestId("mock-select-packagingType");
    fireEvent.change(packagingSelect, { target: { value: "SEALED" } });
  };

  // Helper function to fill Step 2 (Quantity & Dates)
  const fillStep2 = async () => {
    await userEvent.type(screen.getByPlaceholderText("0"), "10");
    
    const datePickers = screen.getAllByTestId("date-picker");
    fireEvent.click(datePickers[0]); // Fabrication date
    fireEvent.click(datePickers[1]); // Expiry date
  };

  // Helper function to fill Step 3 (Pickup Info)
  const fillStep3 = async () => {
    const datePickers = screen.getAllByTestId("date-picker");
    const timePickers = screen.getAllByTestId("time-picker");
    
    fireEvent.click(datePickers[0]); // Pickup date
    fireEvent.click(timePickers[0]); // Start time
    fireEvent.click(timePickers[1]); // End time
    
    const addressInput = screen.getByPlaceholderText("Start typing address...");
    await userEvent.type(addressInput, "Test Location");
    fireEvent.blur(addressInput);
  };

  // Helper function to fill Step 4 (Description)
  const fillStep4 = async () => {
    await userEvent.type(
      screen.getByPlaceholderText("Describe the food (ingredients, freshness, etc.)"),
      "Test description"
    );
  };

  // Component renders when isOpen is true
  test("renders modal when isOpen is true", () => {
    render(<SurplusFormModal {...defaultProps} />);

    expect(screen.getByText("Add New Donation")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., Vegetable Lasagna")).toBeInTheDocument();
    expect(screen.getByText("Food Details")).toBeInTheDocument();
  });

  // Component doesn't render when isOpen is false
  test("does not render modal when isOpen is false", () => {
    const { container } = render(
      <SurplusFormModal {...defaultProps} isOpen={false} />
    );

    expect(screen.queryByText("Add New Donation")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  // Multi-step navigation
  test("navigates through all steps correctly", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    // Step 1
    expect(screen.getByText("Food Details")).toBeInTheDocument();
    await fillStep1();
    fireEvent.click(screen.getByText("Next"));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText("Quantity & Dates")).toBeInTheDocument();
    });
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));

    // Step 3
    await waitFor(() => {
      expect(screen.getByText("Pickup Info")).toBeInTheDocument();
    });
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));

    // Step 4
    await waitFor(() => {
      expect(screen.getByText("Description")).toBeInTheDocument();
    });
    await fillStep4();
    
    expect(screen.getByText("Create Donation")).toBeInTheDocument();
  });

  // Step validation prevents moving forward
  test("prevents moving to next step without completing required fields", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    // Try to go to next step without filling anything
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/Please complete all required fields/)).toBeInTheDocument();
    });
    
    // Should still be on step 1
    expect(screen.getByText("Food Details")).toBeInTheDocument();
  });

  // Previous button navigation
  test("navigates back to previous step", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("Quantity & Dates")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Previous"));

    await waitFor(() => {
      expect(screen.getByText("Food Details")).toBeInTheDocument();
    });
  });

  // Form submission with valid data through all steps
  test("submits form with valid data through all steps", async () => {
    const mockResponse = { data: { id: 123 } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    // Complete all steps
    await fillStep1();
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    await fillStep4();

    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    const apiCall = mockAxiosInstance.post.mock.calls[0];
    expect(apiCall[0]).toBe("/surplus");
    expect(apiCall[1]).toMatchObject({
      title: "Test Food",
      quantity: { value: 10, unit: "KILOGRAM" },
      temperatureCategory: "REFRIGERATED",
      packagingType: "SEALED",
      description: "Test description",
    });
  });

  // Temperature category is required
  test("requires temperature category in step 1", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );
    
    const categoriesSelect = screen.getByTestId("mock-select-default");
    await userEvent.selectOptions(categoriesSelect, ["PREPARED_MEALS"]);
    
    const packagingSelect = screen.getByTestId("mock-select-packagingType");
    fireEvent.change(packagingSelect, { target: { value: "SEALED" } });
    
    // Don't fill temperature category
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/Please complete all required fields/)).toBeInTheDocument();
    });
  });

  // Packaging type is required
  test("requires packaging type in step 1", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );
    
    const categoriesSelect = screen.getByTestId("mock-select-default");
    await userEvent.selectOptions(categoriesSelect, ["PREPARED_MEALS"]);
    
    const tempSelect = screen.getByTestId("mock-select-temperatureCategory");
    fireEvent.change(tempSelect, { target: { value: "REFRIGERATED" } });
    
    // Don't fill packaging type
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText(/Please complete all required fields/)).toBeInTheDocument();
    });
  });

  // API error handling
  test("handles API errors correctly", async () => {
    const errorMessage = "Network Error";
    mockAxiosInstance.post.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());
    
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    
    await fillStep4();
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // Cancel button functionality
  test("cancels form and resets data when cancel button is clicked", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g., Vegetable Lasagna"),
      "Test Food"
    );

    const closeButton = screen.getByTestId("x-icon").closest("button");
    fireEvent.click(closeButton);

    expect(window.confirm).toHaveBeenCalledWith("Cancel donation creation?");
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Success message after successful submission
  test("shows success message after successful submission", async () => {
    const mockResponse = { data: { id: 123 } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());
    
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    
    await fillStep4();
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(screen.getByText(/Success! Post created with ID: 123/)).toBeInTheDocument();
    });
  });

  // Progress steps display correctly
  test("displays progress steps correctly", () => {
    render(<SurplusFormModal {...defaultProps} />);

    expect(screen.getByText("Food Details")).toBeInTheDocument();
    expect(screen.getByText("Quantity & Dates")).toBeInTheDocument();
    expect(screen.getByText("Pickup Info")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  // Add multiple pickup slots
  test("adds multiple pickup slots", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());

    const addButton = screen.getByText("Add Another Slot");
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByText("Slot 1")).toBeInTheDocument();
    expect(screen.getByText("Slot 2")).toBeInTheDocument();
    expect(screen.getByText("Slot 3")).toBeInTheDocument();
  });

  // Remove pickup slot
  test("removes a pickup slot", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());

    const addButton = screen.getByText("Add Another Slot");
    fireEvent.click(addButton);

    expect(screen.getByText("Slot 2")).toBeInTheDocument();

    const trashIcons = screen.getAllByTestId("trash-icon");
    fireEvent.click(trashIcons[0].closest("button"));

    await waitFor(() => {
      expect(screen.queryByText("Slot 2")).not.toBeInTheDocument();
    });
  });

  // Cannot remove last pickup slot
  test("does not remove the last remaining pickup slot", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());

    const trashIcons = screen.queryAllByTestId("trash-icon");
    expect(trashIcons.length).toBe(0);
  });

  // Update pickup slot notes
  test("updates pickup slot notes", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());

    const notesInput = screen.getByPlaceholderText(
      "e.g., Use back entrance, Ask for manager"
    );
    
    await userEvent.type(notesInput, "Ring the doorbell");

    expect(notesInput.value).toBe("Ring the doorbell");
  });

  // Modal closes after successful submission
  test("closes modal after successful submission", async () => {
    const mockResponse = { data: { id: 123 } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());
    
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    
    await fillStep4();
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(screen.getByText(/Success! Post created with ID: 123/)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  // Quantity with decimal values
  test("handles decimal quantity values", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());

    const quantityInput = screen.getByPlaceholderText("0");
    await userEvent.type(quantityInput, "5.5");

    expect(quantityInput.value).toBe("5.5");
  });

  // Submit with multiple slots
  test("submits form with multiple pickup slots", async () => {
    const mockResponse = { data: { id: 456 } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());

    // Fill first slot (from fillStep3)
    let datePickers = screen.getAllByTestId("date-picker");
    let timePickers = screen.getAllByTestId("time-picker");
    
    fireEvent.click(datePickers[0]); // Pickup date
    fireEvent.click(timePickers[0]); // Start time
    fireEvent.click(timePickers[1]); // End time
    
    const addressInput = screen.getByPlaceholderText("Start typing address...");
    await userEvent.type(addressInput, "Test Location");
    fireEvent.blur(addressInput);

    // Add a second slot
    fireEvent.click(screen.getByText("Add Another Slot"));
    
    // Wait for second slot to appear and get updated pickers
    await waitFor(() => {
      expect(screen.getByText("Slot 2")).toBeInTheDocument();
    });
    
    // Get all pickers again after second slot is added
    datePickers = screen.getAllByTestId("date-picker");
    timePickers = screen.getAllByTestId("time-picker");
    
    // Fill second slot
    fireEvent.click(datePickers[1]);
    fireEvent.click(timePickers[2]);
    fireEvent.click(timePickers[3]);
    
    // Fill slot notes
    const notesInputs = screen.getAllByPlaceholderText(
      "e.g., Use back entrance, Ask for manager"
    );
    await userEvent.type(notesInputs[0], "First slot notes");
    await userEvent.type(notesInputs[1], "Second slot notes");

    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    
    await fillStep4();
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      const apiCall = mockAxiosInstance.post.mock.calls[0];
      expect(apiCall[1].pickupSlots).toHaveLength(2);
    });
  });

  // Unit selection change
  test("changes quantity unit selection", async () => {
    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());

    const unitSelect = screen.getByTestId("mock-select-quantityUnit");
    
    fireEvent.change(unitSelect, {
      target: { value: "ITEM" },
    });

    expect(unitSelect.value).toBe("ITEM");
  });

  // API error without response data
  test("handles API error without response message", async () => {
    mockAxiosInstance.post.mockRejectedValue({});

    render(<SurplusFormModal {...defaultProps} />);

    await fillStep1();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Quantity & Dates")).toBeInTheDocument());
    
    await fillStep2();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Pickup Info")).toBeInTheDocument());
    
    await fillStep3();
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Description")).toBeInTheDocument());
    
    await fillStep4();
    fireEvent.click(screen.getByText("Create Donation"));

    await waitFor(() => {
      expect(screen.getByText("Failed to create surplus post")).toBeInTheDocument();
    });
  });

  // Cancel confirmation when user declines
  test("does not close modal when cancel is declined", () => {
    mockConfirm.mockReturnValue(false);

    render(<SurplusFormModal {...defaultProps} />);

    const closeButton = screen.getByTestId("x-icon").closest("button");
    fireEvent.click(closeButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});