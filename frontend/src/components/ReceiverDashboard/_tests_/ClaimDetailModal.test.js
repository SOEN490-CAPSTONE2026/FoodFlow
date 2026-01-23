import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';
import { MemoryRouter } from 'react-router-dom';
import ClaimDetailModal from '../ClaimDetailModal';

import { surplusAPI } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  surplusAPI: {
    getTimeline: jest.fn(),
  },
  claimsAPI: {
    getClaimForSurplusPost: jest.fn(),
  },
  reportAPI: {
    reportUser: jest.fn(),
  },
  feedbackAPI: {
    submitFeedback: jest.fn(),
  },
}));

// Mock the custom hook
jest.mock('../../../hooks/useGoogleMaps', () => ({
  __esModule: true,
  default: jest.fn(() => ({ current: null })),
}));

// Wrapper component to provide TimezoneContext
const Wrapper = ({ children }) => (
  <MemoryRouter>
    <TimezoneProvider>{children}</TimezoneProvider>
  </MemoryRouter>
);

// Mock the child components
jest.mock('../ClaimedView', () => {
  return function MockClaimedView({ isOpen, onClose, onBack }) {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="claimed-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

jest.mock('../CompletedView', () => {
  return function MockCompletedView({ isOpen, onClose, onBack }) {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="completed-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

jest.mock('../ReadyForPickUpView', () => {
  return function MockReadyForPickUpView({ isOpen, onClose, onBack }) {
    if (!isOpen) {
      return null;
    }
    return (
      <div data-testid="ready-pickup-view">
        <button onClick={onBack}>Back Mock</button>
        <button onClick={onClose}>Close Mock</button>
      </div>
    );
  };
});

jest.mock('../../shared/DonationTimeline', () => {
  return function MockDonationTimeline() {
    return <div data-testid="donation-timeline">Timeline</div>;
  };
});

jest.mock('../../FeedbackModal/FeedbackModal', () => {
  return function MockFeedbackModal() {
    return <div data-testid="feedback-modal">Feedback Modal</div>;
  };
});

const mockClaim = {
  surplusPost: {
    title: 'Fresh Dairy Products',
    foodType: 'Dairy & Cold Items',
    quantity: { value: 15, unit: 'bottles' },
    expiryDate: '2025-10-29',
    pickupDate: '2025-10-29',
    pickupFrom: '08:00',
    pickupTo: '10:00',
    donorEmail: 'dairy@example.com',
    donorName: 'dairy@example.com',
    status: 'CLAIMED',
    pickupLocation: {
      address: '321 Dairy Drive',
      latitude: 40.7489,
      longitude: -73.968,
    },
  },
};

describe('ClaimDetailModal', () => {
  test('renders nothing when not open', () => {
    const { container } = render(
      <Wrapper>
        <ClaimDetailModal
          claim={mockClaim}
          isOpen={false}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when claim is null', () => {
    const { container } = render(
      <Wrapper>
        <ClaimDetailModal claim={null} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal with donation title', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Fresh Dairy Products')).toBeInTheDocument();
  });

  test('displays Claimed status badge for CLAIMED status', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Claimed')).toBeInTheDocument();
  });

  test('displays Ready for Pickup status for READY_FOR_PICKUP status', () => {
    const readyClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: 'READY_FOR_PICKUP',
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={readyClaim}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByText('Ready for Pickup')).toBeInTheDocument();
  });

  test('displays Completed status for COMPLETED status', () => {
    const completedClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: 'COMPLETED',
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={completedClaim}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('displays donation details section', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Donation Details')).toBeInTheDocument();
  });

  test('displays quantity information', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('15 bottles')).toBeInTheDocument();
  });

  test('displays expiry date', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Expiry Date')).toBeInTheDocument();
    expect(screen.getByText('2025-10-29')).toBeInTheDocument();
  });

  test('displays donor email', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Donor')).toBeInTheDocument();
    expect(screen.getByText('dairy@example.com')).toBeInTheDocument();
  });

  test('displays pickup date and time', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Pickup Date & Time')).toBeInTheDocument();
    // Check for the formatted date and time pattern (timezone-aware)
    expect(
      screen.getByText(/Oct 29, 2025 \d{1,2}:\d{2} [AP]M-\d{1,2}:\d{2} [AP]M/)
    ).toBeInTheDocument();
  });

  test('displays pickup location with link', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('Pickup Location')).toBeInTheDocument();
    const link = screen.getByText('321 Dairy Drive');
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toContain('google.com/maps');
  });

  test('displays map placeholder when no coordinates', () => {
    const claimNoCoords = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        pickupLocation: {
          address: 'Test Address',
        },
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={claimNoCoords}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByText('Map view coming soon')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={mockClaim}
          isOpen={true}
          onClose={mockOnClose}
        />
      </Wrapper>
    );
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when overlay is clicked', () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <Wrapper>
        <ClaimDetailModal
          claim={mockClaim}
          isOpen={true}
          onClose={mockOnClose}
        />
      </Wrapper>
    );
    const overlay = container.querySelector('.claimed-modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows View Pickup Steps button for claimed status', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('View Pickup Steps')).toBeInTheDocument();
  });

  test('opens ClaimedView when View Pickup Steps is clicked for CLAIMED status', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    const viewStepsButton = screen.getByText('View Pickup Steps');
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId('claimed-view')).toBeInTheDocument();
  });

  test('opens ReadyForPickUpView when View Pickup Steps is clicked for READY_FOR_PICKUP status', () => {
    const readyClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: 'READY_FOR_PICKUP',
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={readyClaim}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    const viewStepsButton = screen.getByText('View Pickup Steps');
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId('ready-pickup-view')).toBeInTheDocument();
  });

  test('opens CompletedView when View Pickup Steps is clicked for COMPLETED status', () => {
    const completedClaim = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        status: 'COMPLETED',
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={completedClaim}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    const viewStepsButton = screen.getByText('View Pickup Steps');
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId('completed-view')).toBeInTheDocument();
  });

  test('handles back navigation from pickup steps view', () => {
    render(
      <Wrapper>
        <ClaimDetailModal claim={mockClaim} isOpen={true} onClose={jest.fn()} />
      </Wrapper>
    );
    const viewStepsButton = screen.getByText('View Pickup Steps');
    fireEvent.click(viewStepsButton);
    expect(screen.getByTestId('claimed-view')).toBeInTheDocument();

    const backButton = screen.getByText('Back Mock');
    fireEvent.click(backButton);
    expect(screen.queryByTestId('claimed-view')).not.toBeInTheDocument();
  });

  test('handles missing quantity values gracefully', () => {
    const claimNoQuantity = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        quantity: {},
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={claimNoQuantity}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  test('handles missing pickup date gracefully', () => {
    const claimNoDate = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        pickupDate: null,
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={claimNoDate}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    // The component should still render even with null pickup date
    expect(screen.getByText('Expiry Date')).toBeInTheDocument();
    expect(screen.getByText('Pickup Date & Time')).toBeInTheDocument();
  });

  test('handles missing donor email gracefully', () => {
    const claimNoDonor = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        donorEmail: null,
        donorName: null,
      },
    };
    render(
      <Wrapper>
        <ClaimDetailModal
          claim={claimNoDonor}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  test('uses default food type image when foodType is null', () => {
    const claimNoFoodType = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        foodType: null,
      },
    };
    const { container } = render(
      <Wrapper>
        <ClaimDetailModal
          claim={claimNoFoodType}
          isOpen={true}
          onClose={jest.fn()}
        />
      </Wrapper>
    );
    const img = container.querySelector('.claimed-modal-header-image');
    expect(img).toBeInTheDocument();
  });

  describe('Timeline Feature', () => {
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
        eventType: 'READY_FOR_PICKUP',
        timestamp: '2026-01-11T12:00:00',
        actor: 'donor',
        actorUserId: 1,
        oldStatus: 'CLAIMED',
        newStatus: 'READY_FOR_PICKUP',
        details: 'Ready for pickup',
        visibleToUsers: true,
      },
    ];

    const mockClaimWithId = {
      ...mockClaim,
      surplusPost: {
        ...mockClaim.surplusPost,
        id: 456,
      },
    };

    beforeEach(() => {
      surplusAPI.getTimeline.mockReset();
      surplusAPI.getTimeline.mockResolvedValue({
        data: mockTimelineData,
      });
    });

    test('should render timeline toggle button', () => {
      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );
      const button = container.querySelector('.claimed-timeline-toggle-button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toMatch(/View.*Donation Timeline/);
    });

    test('should fetch and display timeline when toggle button is clicked', async () => {
      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      const toggleButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledWith(456);
      });
    });

    test('should toggle timeline visibility', async () => {
      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      // Click to expand
      const viewButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
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

    test('should handle timeline fetch error gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      surplusAPI.getTimeline.mockRejectedValue(
        new Error('Failed to fetch timeline')
      );

      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      const toggleButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching timeline:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('should cache timeline data and not refetch', async () => {
      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      // Click to expand
      const viewButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
      });

      // Collapse
      fireEvent.click(viewButton);

      // Expand again
      fireEvent.click(viewButton);

      // Should not fetch again (cached)
      expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
    });

    test('should not fetch timeline if post ID is missing', async () => {
      const { container } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaim}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      const toggleButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
      fireEvent.click(toggleButton);

      // Should not call API without post ID
      expect(surplusAPI.getTimeline).not.toHaveBeenCalled();
    });

    test('should reset timeline when modal reopens', async () => {
      const { container, rerender } = render(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      // Expand timeline
      const viewButton = container.querySelector(
        '.claimed-timeline-toggle-button'
      );
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(surplusAPI.getTimeline).toHaveBeenCalledTimes(1);
      });

      // Close modal
      rerender(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={false}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      // Reopen modal
      rerender(
        <Wrapper>
          <ClaimDetailModal
            claim={mockClaimWithId}
            isOpen={true}
            onClose={jest.fn()}
          />
        </Wrapper>
      );

      // Timeline should be reset and need to expand again
      const button = container.querySelector('.claimed-timeline-toggle-button');
      expect(button.textContent).toMatch(/View.*Donation Timeline/);
    });
  });
});
