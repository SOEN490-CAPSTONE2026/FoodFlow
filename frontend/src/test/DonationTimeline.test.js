import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DonationTimeline from '../components/shared/DonationTimeline';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Clock: ({ size, className }) => (
    <div
      data-testid="clock-icon"
      className={className}
      style={{ width: size, height: size }}
    />
  ),
  ShieldAlert: ({ size }) => (
    <div
      data-testid="shield-alert-icon"
      style={{ width: size, height: size }}
    />
  ),
  Camera: ({ size }) => (
    <div data-testid="camera-icon" style={{ width: size, height: size }} />
  ),
  X: ({ size }) => (
    <div data-testid="x-icon" style={{ width: size, height: size }} />
  ),
}));

describe('DonationTimeline Component', () => {
  const mockTimeline = [
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
      details: 'Claimed by Food Bank Central',
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
      details: 'Food is ready for pickup',
      visibleToUsers: true,
    },
    {
      id: 4,
      eventType: 'PICKUP_CONFIRMED',
      timestamp: '2026-01-11T13:00:00',
      actor: 'receiver',
      actorUserId: 2,
      oldStatus: 'READY_FOR_PICKUP',
      newStatus: 'COMPLETED',
      details: 'Pickup confirmed successfully',
      visibleToUsers: true,
    },
  ];

  const adminOnlyEvent = {
    id: 5,
    eventType: 'ADMIN_AUDIT',
    timestamp: '2026-01-11T14:00:00',
    actor: 'system',
    actorUserId: null,
    details: 'Admin audit log entry',
    visibleToUsers: false,
  };

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      render(<DonationTimeline timeline={[]} loading={true} />);

      expect(screen.getByText('Loading timeline...')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should apply loading-spinner class to icon', () => {
      render(<DonationTimeline timeline={[]} loading={true} />);

      const icon = screen.getByTestId('clock-icon');
      expect(icon).toHaveClass('loading-spinner');
    });
  });

  describe('Empty State', () => {
    it('should display empty message when timeline is empty', () => {
      render(<DonationTimeline timeline={[]} loading={false} />);

      expect(
        screen.getByText('No timeline events available yet.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should display empty message when timeline is null', () => {
      render(<DonationTimeline timeline={null} loading={false} />);

      expect(
        screen.getByText('No timeline events available yet.')
      ).toBeInTheDocument();
    });

    it('should display empty message when timeline is undefined', () => {
      render(<DonationTimeline loading={false} />);

      expect(
        screen.getByText('No timeline events available yet.')
      ).toBeInTheDocument();
    });
  });

  describe('Timeline Rendering', () => {
    it('should render all timeline events', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      expect(screen.getByText('DONATION_POSTED')).toBeInTheDocument();
      expect(screen.getByText('DONATION_CLAIMED')).toBeInTheDocument();
      expect(screen.getAllByText('READY_FOR_PICKUP').length).toBeGreaterThan(0);
      expect(screen.getByText('PICKUP_CONFIRMED')).toBeInTheDocument();
    });

    it('should display timestamps for all events', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      // Should display formatted dates (exact format may vary by locale)
      const metaElements = screen.getAllByText(/1\/11\/2026/);
      expect(metaElements.length).toBeGreaterThan(0);
    });

    it('should display actor information for all events', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      expect(screen.getAllByText(/Actor: donor/).length).toBe(2);
      expect(screen.getAllByText(/Actor: receiver/).length).toBe(2);
    });

    it('should display event details when present', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      expect(screen.getByText('Donation created')).toBeInTheDocument();
      expect(
        screen.getByText('Claimed by Food Bank Central')
      ).toBeInTheDocument();
      expect(screen.getByText('Food is ready for pickup')).toBeInTheDocument();
      expect(
        screen.getByText('Pickup confirmed successfully')
      ).toBeInTheDocument();
    });

    it('should not display details section if details are missing', () => {
      const eventWithoutDetails = [
        {
          ...mockTimeline[0],
          details: null,
        },
      ];

      render(
        <DonationTimeline timeline={eventWithoutDetails} loading={false} />
      );

      const container = screen
        .getByText('DONATION_POSTED')
        .closest('.donation-timeline-content');
      expect(
        container.querySelector('.donation-timeline-details')
      ).not.toBeInTheDocument();
    });
  });

  describe('Status Change Display', () => {
    it('should display status changes with arrow', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      // Check for status change elements
      const statusChanges = screen.getAllByText(/Status:/);
      expect(statusChanges.length).toBe(3); // Only events 2, 3, 4 have oldStatus
    });

    it('should show old and new status correctly', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
      expect(screen.getAllByText('CLAIMED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('READY_FOR_PICKUP').length).toBeGreaterThan(0);
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    it('should not display status change if oldStatus is missing', () => {
      const eventWithoutOldStatus = [
        {
          ...mockTimeline[0],
          newStatus: 'AVAILABLE',
          oldStatus: null,
        },
      ];

      render(
        <DonationTimeline timeline={eventWithoutOldStatus} loading={false} />
      );

      const container = screen
        .getByText('DONATION_POSTED')
        .closest('.donation-timeline-content');
      expect(
        container.querySelector('.donation-timeline-status-change')
      ).not.toBeInTheDocument();
    });

    it('should not display status change if newStatus is missing', () => {
      const eventWithoutNewStatus = [
        {
          ...mockTimeline[1],
          oldStatus: 'AVAILABLE',
          newStatus: null,
        },
      ];

      render(
        <DonationTimeline timeline={eventWithoutNewStatus} loading={false} />
      );

      const container = screen
        .getByText('DONATION_CLAIMED')
        .closest('.donation-timeline-content');
      expect(
        container.querySelector('.donation-timeline-status-change')
      ).not.toBeInTheDocument();
    });
  });

  describe('Admin-Only Events', () => {
    it('should apply admin-only class to non-user-visible events', () => {
      const timelineWithAdmin = [...mockTimeline, adminOnlyEvent];
      render(
        <DonationTimeline
          timeline={timelineWithAdmin}
          loading={false}
          showAdminBadges={false}
        />
      );

      const adminEventElement = screen
        .getByText('ADMIN_AUDIT')
        .closest('.donation-timeline-item');
      expect(adminEventElement).toHaveClass('admin-only');
    });

    it('should display admin badge when showAdminBadges is true', () => {
      const timelineWithAdmin = [...mockTimeline, adminOnlyEvent];
      render(
        <DonationTimeline
          timeline={timelineWithAdmin}
          loading={false}
          showAdminBadges={true}
        />
      );

      expect(screen.getByText('ADMIN ONLY')).toBeInTheDocument();
      expect(screen.getByTestId('shield-alert-icon')).toBeInTheDocument();
    });

    it('should not display admin badge when showAdminBadges is false', () => {
      const timelineWithAdmin = [...mockTimeline, adminOnlyEvent];
      render(
        <DonationTimeline
          timeline={timelineWithAdmin}
          loading={false}
          showAdminBadges={false}
        />
      );

      expect(screen.queryByText('ADMIN ONLY')).not.toBeInTheDocument();
    });

    it('should not display admin badge for user-visible events', () => {
      render(
        <DonationTimeline
          timeline={mockTimeline}
          loading={false}
          showAdminBadges={true}
        />
      );

      expect(screen.queryByText('ADMIN ONLY')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid timestamps correctly', () => {
      const timeline = [
        {
          eventType: 'TEST_EVENT',
          timestamp: '2026-01-11T10:30:00',
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={timeline} loading={false} />);

      // Should contain date components (format may vary)
      expect(screen.getByText(/1\/11\/2026/)).toBeInTheDocument();
    });

    it('should handle null timestamp gracefully', () => {
      const timeline = [
        {
          eventType: 'TEST_EVENT',
          timestamp: null,
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={timeline} loading={false} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should handle undefined timestamp gracefully', () => {
      const timeline = [
        {
          eventType: 'TEST_EVENT',
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={timeline} loading={false} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should handle invalid timestamp gracefully', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const timeline = [
        {
          eventType: 'TEST_EVENT',
          timestamp: 'invalid-date',
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={timeline} loading={false} />);

      // Should render something (either "—" or the invalid string formatted)
      expect(screen.getByText('TEST_EVENT')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should fallback to dash when date formatting throws', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const toLocaleSpy = jest
        .spyOn(Date.prototype, 'toLocaleString')
        .mockImplementation(() => {
          throw new Error('format failed');
        });

      const timeline = [
        {
          eventType: 'TEST_EVENT',
          timestamp: '2026-01-11T10:30:00',
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={timeline} loading={false} />);

      expect(screen.getByText('—')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalled();

      toLocaleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Structure', () => {
    it('should render with correct container class', () => {
      const { container } = render(
        <DonationTimeline timeline={mockTimeline} loading={false} />
      );

      expect(
        container.querySelector('.donation-timeline-container')
      ).toBeInTheDocument();
    });

    it('should render timeline markers for each event', () => {
      const { container } = render(
        <DonationTimeline timeline={mockTimeline} loading={false} />
      );

      const markers = container.querySelectorAll('.donation-timeline-marker');
      expect(markers.length).toBe(mockTimeline.length);
    });

    it('should render timeline items in order', () => {
      const { container } = render(
        <DonationTimeline timeline={mockTimeline} loading={false} />
      );

      const items = container.querySelectorAll('.donation-timeline-item');
      expect(items.length).toBe(mockTimeline.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single event timeline', () => {
      const singleEvent = [mockTimeline[0]];
      render(<DonationTimeline timeline={singleEvent} loading={false} />);

      expect(screen.getByText('DONATION_POSTED')).toBeInTheDocument();
      expect(screen.getByText('Donation created')).toBeInTheDocument();
    });

    it('should handle very long timeline', () => {
      const longTimeline = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        eventType: `EVENT_${i}`,
        timestamp: `2026-01-11T10:${i.toString().padStart(2, '0')}:00`,
        actor: 'test',
        details: `Event ${i}`,
        visibleToUsers: true,
      }));

      render(<DonationTimeline timeline={longTimeline} loading={false} />);

      expect(screen.getByText('EVENT_0')).toBeInTheDocument();
      expect(screen.getByText('EVENT_49')).toBeInTheDocument();
    });

    it('should handle mixed visibility events', () => {
      const mixedTimeline = [
        { ...mockTimeline[0], visibleToUsers: true },
        { ...mockTimeline[1], visibleToUsers: false },
        { ...mockTimeline[2], visibleToUsers: true },
        { ...mockTimeline[3], visibleToUsers: false },
      ];

      const { container } = render(
        <DonationTimeline timeline={mixedTimeline} loading={false} />
      );

      const adminOnlyItems = container.querySelectorAll(
        '.donation-timeline-item.admin-only'
      );
      expect(adminOnlyItems.length).toBe(2);
    });

    it('should handle events with missing optional fields', () => {
      const minimalEvent = [
        {
          eventType: 'MINIMAL_EVENT',
          actor: 'test',
          visibleToUsers: true,
        },
      ];

      render(<DonationTimeline timeline={minimalEvent} loading={false} />);

      expect(screen.getByText('MINIMAL_EVENT')).toBeInTheDocument();
      expect(screen.getByText('Actor: test')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should use default props when not provided', () => {
      render(<DonationTimeline />);

      expect(
        screen.getByText('No timeline events available yet.')
      ).toBeInTheDocument();
    });

    it('should accept showAdminBadges prop', () => {
      const timelineWithAdmin = [...mockTimeline, adminOnlyEvent];
      const { rerender } = render(
        <DonationTimeline
          timeline={timelineWithAdmin}
          loading={false}
          showAdminBadges={false}
        />
      );

      expect(screen.queryByText('ADMIN ONLY')).not.toBeInTheDocument();

      rerender(
        <DonationTimeline
          timeline={timelineWithAdmin}
          loading={false}
          showAdminBadges={true}
        />
      );

      expect(screen.getByText('ADMIN ONLY')).toBeInTheDocument();
    });

    it('should accept loading prop', () => {
      const { rerender } = render(
        <DonationTimeline timeline={mockTimeline} loading={true} />
      );

      expect(screen.getByText('Loading timeline...')).toBeInTheDocument();

      rerender(<DonationTimeline timeline={mockTimeline} loading={false} />);

      expect(screen.queryByText('Loading timeline...')).not.toBeInTheDocument();
      expect(screen.getByText('DONATION_POSTED')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(
        <DonationTimeline timeline={mockTimeline} loading={false} />
      );

      const timelineContainer = container.querySelector(
        '.donation-timeline-container'
      );
      expect(timelineContainer).toBeInTheDocument();

      const items = timelineContainer.querySelectorAll(
        '.donation-timeline-item'
      );
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have readable text content', () => {
      render(<DonationTimeline timeline={mockTimeline} loading={false} />);

      // All text should be readable - check unique event types
      expect(screen.getByText('DONATION_POSTED')).toBeVisible();
      expect(screen.getByText('DONATION_CLAIMED')).toBeVisible();
      expect(screen.getByText('PICKUP_CONFIRMED')).toBeVisible();

      // Check details
      mockTimeline.forEach(event => {
        if (event.details) {
          expect(screen.getByText(event.details)).toBeVisible();
        }
      });
    });
  });

  describe('DonationTimeline - Evidence Display', () => {
    const mockTimelineWithEvidence = [
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
        eventType: 'PICKUP_EVIDENCE_UPLOADED',
        timestamp: '2026-01-11T14:00:00',
        actor: 'donor',
        actorUserId: 1,
        details: 'Pickup evidence photo uploaded',
        visibleToUsers: true,
        pickupEvidenceUrl: '/api/files/evidence/donation-1/test-uuid.jpg',
      },
    ];

    it('should display evidence image when pickupEvidenceUrl exists', () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      const evidenceImage = screen.getByAltText('Pickup evidence');
      expect(evidenceImage).toBeInTheDocument();
    });

    it('should display PICKUP_EVIDENCE_UPLOADED event type', () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      expect(screen.getByText('PICKUP_EVIDENCE_UPLOADED')).toBeInTheDocument();
    });

    it('should display evidence label', () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      expect(screen.getByText('Pickup Evidence')).toBeInTheDocument();
    });

    it('should not display evidence section when pickupEvidenceUrl is null', () => {
      const timelineWithoutEvidence = [
        {
          id: 1,
          eventType: 'DONATION_POSTED',
          timestamp: '2026-01-11T10:00:00',
          actor: 'donor',
          actorUserId: 1,
          visibleToUsers: true,
          pickupEvidenceUrl: null,
        },
      ];

      render(
        <DonationTimeline timeline={timelineWithoutEvidence} loading={false} />
      );

      expect(screen.queryByAltText('Pickup evidence')).not.toBeInTheDocument();
      expect(screen.queryByText('Pickup Evidence')).not.toBeInTheDocument();
    });

    it('should have clickable evidence thumbnail', () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      const evidenceImage = screen.getByAltText('Pickup evidence');
      expect(evidenceImage).toHaveClass('evidence-thumbnail');
    });

    it('should render camera icon for pickup evidence upload event', () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('should normalize /uploads evidence URL', () => {
      const timelineWithLegacyUpload = [
        {
          id: 9,
          eventType: 'PICKUP_EVIDENCE_UPLOADED',
          timestamp: '2026-01-11T14:00:00',
          actor: 'donor',
          visibleToUsers: true,
          pickupEvidenceUrl: '/uploads/evidence-legacy.jpg',
        },
      ];

      render(
        <DonationTimeline timeline={timelineWithLegacyUpload} loading={false} />
      );

      const evidenceImage = screen.getByAltText('Pickup evidence');
      expect(evidenceImage).toHaveAttribute(
        'src',
        expect.stringContaining('/api/files/uploads/evidence-legacy.jpg')
      );
    });

    it('should keep full evidence URL unchanged', () => {
      const timelineWithAbsoluteEvidence = [
        {
          id: 10,
          eventType: 'PICKUP_EVIDENCE_UPLOADED',
          timestamp: '2026-01-11T14:00:00',
          actor: 'donor',
          visibleToUsers: true,
          pickupEvidenceUrl: 'https://cdn.example.com/evidence/photo.jpg',
        },
      ];

      render(
        <DonationTimeline
          timeline={timelineWithAbsoluteEvidence}
          loading={false}
        />
      );

      const evidenceImage = screen.getByAltText('Pickup evidence');
      expect(evidenceImage).toHaveAttribute(
        'src',
        'https://cdn.example.com/evidence/photo.jpg'
      );
    });

    it('should map fallback relative evidence URL to /api/files', () => {
      const timelineWithFallbackPath = [
        {
          id: 11,
          eventType: 'PICKUP_EVIDENCE_UPLOADED',
          timestamp: '2026-01-11T14:00:00',
          actor: 'donor',
          visibleToUsers: true,
          pickupEvidenceUrl: 'evidence/fallback-photo.jpg',
        },
      ];

      render(
        <DonationTimeline timeline={timelineWithFallbackPath} loading={false} />
      );

      const evidenceImage = screen.getByAltText('Pickup evidence');
      expect(evidenceImage).toHaveAttribute(
        'src',
        expect.stringContaining('/api/files/evidence/fallback-photo.jpg')
      );
    });

    it('should open and close enlarged evidence modal', async () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      fireEvent.click(screen.getByAltText('Pickup evidence'));
      expect(
        screen.getByAltText('Pickup evidence enlarged')
      ).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();

      fireEvent.click(document.querySelector('.evidence-modal-content'));
      expect(
        screen.getByAltText('Pickup evidence enlarged')
      ).toBeInTheDocument();

      fireEvent.click(document.querySelector('.evidence-modal-overlay'));
      await waitFor(() => {
        expect(
          screen.queryByAltText('Pickup evidence enlarged')
        ).not.toBeInTheDocument();
      });
    });

    it('should close enlarged evidence modal with close button', async () => {
      render(
        <DonationTimeline timeline={mockTimelineWithEvidence} loading={false} />
      );

      fireEvent.click(screen.getByAltText('Pickup evidence'));
      expect(
        screen.getByAltText('Pickup evidence enlarged')
      ).toBeInTheDocument();

      fireEvent.click(document.querySelector('.evidence-modal-close'));

      await waitFor(() => {
        expect(
          screen.queryByAltText('Pickup evidence enlarged')
        ).not.toBeInTheDocument();
      });
    });
  });
});
