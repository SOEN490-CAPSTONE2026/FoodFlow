import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReadyForPickUpView from "../ReadyForPickUpView";

jest.mock("react-confetti");

const mockClaim = {
  surplusPost: {
    title: "Fresh Bread",
    foodType: "Bakery & Pastry",
    quantity: { value: 10, unit: "loaves" },
    pickupDate: "2025-10-27",
    pickupFrom: "10:00",
    pickupTo: "12:00",
    donorEmail: "donor@example.com",
    pickupLocation: {
      address: "123 Main St",
      latitude: 40.7128,
      longitude: -74.0060,
    },
  },
  pickupCode: "123456",
};

describe("ReadyForPickUpView", () => {
  test("renders nothing when not open", () => {
    const { container } = render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={false}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when claim is null", () => {
    const { container } = render(
      <ReadyForPickUpView
        claim={null}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders modal with donation title", () => {
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Fresh Bread")).toBeInTheDocument();
  });

  test("displays Ready for Pickup status badge", () => {
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument();
  });

  test("displays pickup code digits correctly", () => {
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("PICKUP CODE")).toBeInTheDocument();
    const codeDigits = screen.getAllByText("1").filter(el => el.className === "pickup-code-digit");
    expect(codeDigits.length).toBeGreaterThan(0);
  });

  test("uses default pickup code when not provided", () => {
    const claimWithoutCode = {
      ...mockClaim,
      pickupCode: null,
    };
    const { container } = render(
      <ReadyForPickUpView
        claim={claimWithoutCode}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const codeDigits = container.querySelectorAll(".pickup-code-digit");
    expect(codeDigits.length).toBe(6);
  });

  test("displays pickup steps", () => {
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Pickup Steps")).toBeInTheDocument();
    expect(screen.getByText("Your Pickup Code")).toBeInTheDocument();
    expect(screen.getByText("Confirm Pickup")).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={mockOnClose}
        onBack={jest.fn()}
      />
    );
    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when overlay is clicked", () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={mockOnClose}
        onBack={jest.fn()}
      />
    );
    const overlay = container.querySelector(".claimed-modal-overlay");
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("does not call onClose when modal container is clicked", () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={mockOnClose}
        onBack={jest.fn()}
      />
    );
    const modalContainer = container.querySelector(".claimed-modal-container");
    fireEvent.click(modalContainer);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test("calls onBack when Back to Details button is clicked", () => {
    const mockOnBack = jest.fn();
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={mockOnBack}
      />
    );
    const backButton = screen.getByText("Back to Details");
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test("logs to console when Mark as Collected is clicked", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(
      <ReadyForPickUpView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const markCollectedButton = screen.getByText("Mark as Collected");
    fireEvent.click(markCollectedButton);
    expect(consoleSpy).toHaveBeenCalledWith("Marking as collected...");
    consoleSpy.mockRestore();
  });

  test("renders correct food type image for Fruits & Vegetables", () => {
    const fruitsClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Fruits & Vegetables",
      },
    };
    const { container } = render(
      <ReadyForPickUpView
        claim={fruitsClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toHaveAttribute("alt", "Fresh Bread");
  });

  test("uses default food type image for unknown food type", () => {
    const unknownClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Unknown Type",
      },
    };
    const { container } = render(
      <ReadyForPickUpView
        claim={unknownClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toBeInTheDocument();
  });

  test("handles missing post title gracefully", () => {
    const claimWithoutTitle = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        title: null,
      },
    };
    render(
      <ReadyForPickUpView
        claim={claimWithoutTitle}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Untitled Donation")).toBeInTheDocument();
  });
});
