import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import './DonationTimeline.css';

/**
 * DonationTimeline Component
 * Displays a chronological list of donation events (Posted → Claimed → Ready → Picked Up → Completed)
 *
 * @param {Array} timeline - Array of timeline event objects
 * @param {boolean} loading - Loading state
 * @param {boolean} showAdminBadges - Whether to show admin-only badges (default: false)
 */
export default function DonationTimeline({
  timeline = [],
  loading = false,
  showAdminBadges = false,
}) {
  const formatDate = timestamp => {
    if (!timestamp) {
      return '—';
    }
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="donation-timeline-loading">
        <Clock className="loading-spinner" size={24} />
        <span>Loading timeline...</span>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="donation-timeline-empty">
        <Clock size={32} />
        <p>No timeline events available yet.</p>
      </div>
    );
  }

  return (
    <div className="donation-timeline-container">
      {timeline.map((event, idx) => (
        <div
          key={idx}
          className={`donation-timeline-item ${event.visibleToUsers === false ? 'admin-only' : ''}`}
        >
          <div className="donation-timeline-marker" />
          <div className="donation-timeline-content">
            <div className="donation-timeline-event-type">
              {event.eventType}
            </div>
            <div className="donation-timeline-meta">
              <span>{formatDate(event.timestamp)}</span>
              <span className="donation-timeline-actor">
                Actor: {event.actor}
              </span>
              {showAdminBadges && event.visibleToUsers === false && (
                <span className="admin-only-badge">
                  <ShieldAlert size={14} />
                  ADMIN ONLY
                </span>
              )}
            </div>
            {event.oldStatus && event.newStatus && (
              <div className="donation-timeline-status-change">
                Status: <span className="old-status">{event.oldStatus}</span>
                <span className="arrow">→</span>
                <span className="new-status">{event.newStatus}</span>
              </div>
            )}
            {event.details && (
              <div className="donation-timeline-details">{event.details}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
