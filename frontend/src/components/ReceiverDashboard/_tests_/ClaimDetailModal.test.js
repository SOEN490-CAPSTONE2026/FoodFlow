import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the custom hook
jest.mock("../../../hooks/useGoogleMaps", () => ({
  __esModule: true,
  default: jest.fn(() => ({ current: null })),
}));

import ClaimDetailModal from "../ClaimDetailModal";

// Mock the child components
jest.mock("../ClaimedView", () => {
  return function MockClaimedView({ isOpen, onClose, onBack }) {
    if (!isOpen) return null;
    return (
      <div data-testid="claimed-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

jest.mock("../CompletedView", () => {
  return function MockCompletedView({ isOpen, onClose, onBack }) {
    if (!isOpen) return null;
    return (
      <div data-testid="completed-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

jest.mock("../ReadyForPickUpView", () => {
  return function MockReadyForPickUpView({ isOpen, onClose, onBack }) {
    if (!isOpen) return null;
    return (
      <div data-testid="ready-pickup-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

const mockClaim = {
  surplusPost: {
    title: "Fresh Dairy Products",
    foodType: "Dairy & Cold Items",
    quantity: { value: 15, unit: "bottles" },
    pickupDate: "2025-10-29",
    pickupFrom: "08:00",
    pickupTo: "10:00",
    donorEmail: "dairy@example.com",
    status: "CLAIMED",
    pickupLocation: {
      address: "321 Dairy Drive",
      latitude: 40.7489,
      longitude: -73.9680,
    },
  },
};

describe("ClaimDetailModal", () => {
  test("renders nothing when not open", () => {
    const { container } = render(
      <ClaimDetailModal claim={mockClaim} isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when claim is null", () => {
    const { container } = render(
      <ClaimDetailModal claim={null} isOpen={true} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders modal with donation title", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Fresh Dairy Products")).toBeInTheDocument();
  });

  test("displays Claimed status badge for CLAIMED status", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Claimed")).toBeInTheDocument();
  });

  test("displays Ready for Pickup status for READY_FOR_PICKUP status", () => {
    const readyClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: "READY_FOR_PICKUP",
      },
    };
    render(
      <ClaimDetailModal claim={readyClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument();
  });

  test("displays Completed status for COMPLETED status", () => {
    const completedClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: "COMPLETED",
      },
    };
    render(
      <ClaimDetailModal
        claim={completedClaim}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  test("displays donation details section", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Donation Details")).toBeInTheDocument();
  });

  test("displays quantity information", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("15 bottles")).toBeInTheDocument();
  });

  test("displays expiry date", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Expiry Date")).toBeInTheDocument();
    expect(screen.getByText("2025-10-29")).toBeInTheDocument();
  });

  test("displays donor email", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Donor")).toBeInTheDocument();
    expect(screen.getByText("dairy@example.com")).toBeInTheDocument();
  });

  test("displays pickup date and time", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Pickup Date & Time")).toBeInTheDocument();
    expect(screen.getByText(/2025-10-29.*08:00.*10:00/)).toBeInTheDocument();
  });

  test("displays pickup location with link", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("Pickup Location")).toBeInTheDocument();
    const link = screen.getByText("321 Dairy Drive");
    expect(link).toHaveAttribute("href");
    expect(link.getAttribute("href")).toContain("google.com/maps");
  });

  test("displays map placeholder when no coordinates", () => {
    const claimNoCoords = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        pickupLocation: {
          address: "Test Address",
        },
      },
    };
    render(
      <ClaimDetailModal
        claim={claimNoCoords}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Map view coming soon")).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={mockOnClose} />
    );
    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when overlay is clicked", () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={mockOnClose} />
    );
    const overlay = container.querySelector(".claimed-modal-overlay");
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("shows View Pickup Steps button for claimed status", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    expect(screen.getByText("View Pickup Steps")).toBeInTheDocument();
  });

  test("opens ClaimedView when View Pickup Steps is clicked for CLAIMED status", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    const viewStepsButton = screen.getByText("View Pickup Steps");
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId("claimed-view")).toBeInTheDocument();
  });

  test("opens ReadyForPickUpView when View Pickup Steps is clicked for READY_FOR_PICKUP status", () => {
    const readyClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: "READY_FOR_PICKUP",
      },
    };
    render(
      <ClaimDetailModal claim={readyClaim} isOpen={true} onClose={jest.fn()} />
    );
    const viewStepsButton = screen.getByText("View Pickup Steps");
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId("ready-pickup-view")).toBeInTheDocument();
  });

  test("opens CompletedView when View Pickup Steps is clicked for COMPLETED status", () => {
    const completedClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: "COMPLETED",
      },
    };
    render(
      <ClaimDetailModal
        claim={completedClaim}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    const viewStepsButton = screen.getByText("View Pickup Steps");
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId("completed-view")).toBeInTheDocument();
  });

  test("handles back navigation from pickup steps view", () => {
    render(
      <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
    );
    const viewStepsButton = screen.getByText("View Pickup Steps");
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId("claimed-view")).toBeInTheDocument();

    const backButton = screen.getByText("Back Mock");
    fireEvent.click(backButton);
    expect(screen.queryByTestId("claimed-view")).not.toBeInTheDocument();
  });

  test("handles missing quantity values gracefully", () => {
    const claimNoQuantity = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        quantity: {},
      },
    };
    render(
      <ClaimDetailModal
        claim={claimNoQuantity}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  test("handles missing pickup date gracefully", () => {
    const claimNoDate = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        pickupDate: null,
      },
    };
    render(
      <ClaimDetailModal
        claim={claimNoDate}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    // The component should still render even with null pickup date
    expect(screen.getByText("Expiry Date")).toBeInTheDocument();
    expect(screen.getByText("Pickup Date & Time")).toBeInTheDocument();
  });

  test("handles missing donor email gracefully", () => {
    const claimNoDonor = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        donorEmail: null,
      },
    };
    render(
      <ClaimDetailModal
        claim={claimNoDonor}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Not specified")).toBeInTheDocument();
  });

  test("uses default food type image when foodType is null", () => {
    const claimNoFoodType = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: null,
      },
    };
    const { container } = render(
      <ClaimDetailModal
        claim={claimNoFoodType}
        isOpen={true}
        onClose={jest.fn()}
      />
    );
    const img = container.querySelector(".claimed-modal-header-image");
    expect(img).toBeInTheDocument();
  });
});
