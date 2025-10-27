import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CompletedView from "../CompletedView";

jest.mock("react-confetti");

const mockClaim = {
  surplusPost: {
    title: "Fresh Vegetables",
    foodType: "Fruits & Vegetables",
    quantity: { value: 5, unit: "kg" },
    pickupDate: "2025-10-27",
    pickupFrom: "14:00",
    pickupTo: "16:00",
    donorEmail: "veggie@example.com",
    pickupLocation: {
      address: "456 Garden Ave",
      latitude: 40.7589,
      longitude: -73.9851,
    },
  },
};

describe("CompletedView", () => {
  test("renders nothing when not open", () => {
    const { container } = render(
      <CompletedView
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
      <CompletedView
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
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Fresh Vegetables")).toBeInTheDocument();
  });

  test("displays Claimed status badge", () => {
    render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Claimed")).toBeInTheDocument();
  });

  test("renders modal when open", () => {
    const { container } = render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(container.querySelector(".claimed-modal-container")).toBeInTheDocument();
  });

  test("displays confirmation message", () => {
    render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Donation Claimed!")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your claim is confirmed. Wait for the pickup window to start/i
      )
    ).toBeInTheDocument();
  });

  test("displays pickup steps section", () => {
    render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Pickup Steps")).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <CompletedView
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
      <CompletedView
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
      <CompletedView
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
      <CompletedView
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

  test("renders View Pickup Steps button", () => {
    render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("View Pickup Steps")).toBeInTheDocument();
  });

  test("handles different food types correctly", () => {
    const dairyClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Dairy & Cold Items",
      },
    };
    const { container } = render(
      <CompletedView
        claim={dairyClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toBeInTheDocument();
  });

  test("uses default image for unknown food type", () => {
    const unknownClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Something Else",
      },
    };
    const { container } = render(
      <CompletedView
        claim={unknownClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toBeInTheDocument();
  });

  test("handles missing title gracefully", () => {
    const claimWithoutTitle = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        title: null,
      },
    };
    render(
      <CompletedView
        claim={claimWithoutTitle}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Untitled Donation")).toBeInTheDocument();
  });

  test("updates dimensions on mount", () => {
    const { container } = render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const modalContainer = container.querySelector(".claimed-modal-container");
    expect(modalContainer).toBeInTheDocument();
  });
});
