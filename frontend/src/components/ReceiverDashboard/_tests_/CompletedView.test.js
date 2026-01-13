import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CompletedView from "../CompletedView";

jest.mock("react-confetti");

jest.mock("../../../services/api", () => ({
  surplusAPI: {
    getTimeline: jest.fn(),
  },
}));

import { surplusAPI } from "../../../services/api";

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
    // The actual text in the component
    expect(
      screen.getByText(
        /Your donation has been successfully claimed! Thank you for making a difference in your community./i
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

  test("renders Back to Details button", () => {
    render(
      <CompletedView
        claim={mockClaim}
        isOpen={true}
        onClose={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(screen.getByText("Back to Details")).toBeInTheDocument();
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

  describe("Timeline Feature", () => {
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
      {
        id: 3,
        eventType: 'PICKUP_CONFIRMED',
        timestamp: '2026-01-11T13:00:00',
        actor: 'receiver',
        actorUserId: 2,
        oldStatus: 'READY_FOR_PICKUP',
        newStatus: 'COMPLETED',
        details: 'Pickup confirmed',
        visibleToUsers: true,
      },
    ];

    const mockClaimWithId = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        id: 123,
      },
    };

    beforeEach(() => {
      surplusAPI.getTimeline.mockReset();
      surplusAPI.getTimeline.mockResolvedValue({
        data: mockTimelineData,
      });
    });

    test("should render timeline toggle button", () => {
      const { container } = render(
        <CompletedView
          claim={mockClaimWithId}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );
      const button = container.querySelector('.completed-timeline-toggle-button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toMatch(/View.*Donation Timeline/);
    });

    test("should fetch and display timeline when toggle button is clicked", async () => {
      const { container } = render(
        <CompletedView
          claim={mockClaimWithId}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );

      const toggleButton = container.querySelector('.completed-timeline-toggle-button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledWith(123);
      });
    });

    test("should toggle timeline visibility", async () => {
      const { container } = render(
        <CompletedView
          claim={mockClaimWithId}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );

      // Click to expand
      const viewButton = container.querySelector('.completed-timeline-toggle-button');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(viewButton.textContent).toMatch(/Hide.*Donation Timeline/);
      });

      // Click to collapse
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(viewButton.textContent).toMatch(/View.*Donation Timeline/);
      });
    });

    test("should handle timeline fetch error gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      surplusAPI.getTimeline.mockRejectedValue(new Error('Failed to fetch timeline'));

      const { container } = render(
        <CompletedView
          claim={mockClaimWithId}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );

      const toggleButton = container.querySelector('.completed-timeline-toggle-button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching timeline:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test("should only fetch timeline once when expanded", async () => {
      const { container } = render(
        <CompletedView
          claim={mockClaimWithId}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );

      // Click to expand
      const viewButton = container.querySelector('.completed-timeline-toggle-button');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
      });

      // Collapse
      fireEvent.click(viewButton);

      // Expand again
      fireEvent.click(viewButton);

      // Should not fetch again
      expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
    });

    test("should not fetch timeline if post ID is missing", async () => {
      const { container } = render(
        <CompletedView
          claim={mockClaim}
          isOpen={true}
          onClose={jest.fn()}
          onBack={jest.fn()}
        />
      );

      const toggleButton = container.querySelector('.completed-timeline-toggle-button');
      fireEvent.click(toggleButton);

      // Should not call API without post ID
      expect(surplusAPI.getTimeline).not.toHaveBeenCalled();
    });
  });
});