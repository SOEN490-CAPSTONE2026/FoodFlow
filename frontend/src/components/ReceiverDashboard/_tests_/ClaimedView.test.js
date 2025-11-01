import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ClaimedView from "../ClaimedView";

const mockClaim = {
  surplusPost: {
    title: "Frozen Pizza",
    foodType: "Frozen Food",
    quantity: { value: 20, unit: "pieces" },
    pickupDate: "2025-10-28",
    pickupFrom: "09:00",
    pickupTo: "11:00",
    donorEmail: "pizza@example.com",
    pickupLocation: {
      address: "789 Pizza Lane",
      latitude: 40.7306,
      longitude: -73.9352,
    },
  },
};

describe("ClaimedView", () => {
  test("renders nothing when not open", () => {
    const { container } = render(
      <ClaimedView
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
      <ClaimedView
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
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Frozen Pizza")).toBeInTheDocument();
  });

  test("displays Claimed status badge", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Claimed")).toBeInTheDocument();
  });

  test("displays all three pickup steps", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Pickup Steps")).toBeInTheDocument();
    expect(
      screen.getByText("Review pickup time and location")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Wait for the pickup window to start")
    ).toBeInTheDocument();
    expect(screen.getByText("Arrival Confirmation")).toBeInTheDocument();
  });

  test("displays step 1 content", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Be on time to ensure your organization receives/i)
    ).toBeInTheDocument();
  });

  test("displays step 2 with placeholder dots", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Once it starts, your pickup code will appear here/i)
    ).toBeInTheDocument();
  });

  test("displays step 3 content", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Make sure to arrive on time and send a quick text/i)
    ).toBeInTheDocument();
  });

  test("displays info box message", () => {
    render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(
      screen.getByText("Pickup code will unlock when it's time")
    ).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <ClaimedView
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
      <ClaimedView
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
      <ClaimedView
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
      <ClaimedView
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
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("View Pickup Steps")).toBeInTheDocument();
  });

  test("handles Bakery & Pastry food type", () => {
    const bakeryClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Bakery & Pastry",
      },
    };
    const { container } = render(
      <ClaimedView
        claim={bakeryClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toBeInTheDocument();
  });

  test("handles Packaged / Pantry Items food type", () => {
    const pantryClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: "Packaged / Pantry Items",
      },
    };
    const { container } = render(
      <ClaimedView
        claim={pantryClaim}
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
        foodType: "Unknown Food",
      },
    };
    const { container } = render(
      <ClaimedView
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
      <ClaimedView
        claim={claimWithoutTitle}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Untitled Donation")).toBeInTheDocument();
  });

  test("renders placeholder elements for locked steps", () => {
    const { container } = render(
      <ClaimedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const placeholders = container.querySelectorAll(".pickup-step-placeholder");
    expect(placeholders.length).toBe(2);
  });
});
