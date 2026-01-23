import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, ShieldAlert, Camera, X } from 'lucide-react';
import './DonationTimeline.css';

// Get the backend base URL (without /api suffix)
const BACKEND_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'
).replace(/\/api$/, '');

/**
 * Constructs the full URL for an evidence image
 * Handles both new format (/api/files/...) and legacy format (/uploads/...)
 */
const getEvidenceImageUrl = url => {
  if (!url) return null;

  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle legacy URLs that start with /uploads/ (convert to /api/files/uploads/)
  if (url.startsWith('/uploads/')) {
    const filename = url.substring('/uploads/'.length);
    return `${BACKEND_BASE_URL}/api/files/uploads/${filename}`;
  }

  // Handle proper /api/files/ URLs
  if (url.startsWith('/api/files/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Fallback: prepend backend base + /api/files
  return `${BACKEND_BASE_URL}/api/files${url.startsWith('/') ? '' : '/'}${url}`;
};

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
  const [enlargedImage, setEnlargedImage] = useState(null);

  const formatDate = timestamp => {
    if (!timestamp) return '—';
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
      // eslint-disable-next-line no-console
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
              {event.eventType === 'PICKUP_EVIDENCE_UPLOADED' && (
                <Camera size={14} />
              )}
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
            {/* Display pickup evidence image */}
            {event.pickupEvidenceUrl && (
              <div className="donation-timeline-evidence">
                <img
                  src={getEvidenceImageUrl(event.pickupEvidenceUrl)}
                  alt="Pickup evidence"
                  className="evidence-thumbnail"
                  onClick={() =>
                    setEnlargedImage(
                      getEvidenceImageUrl(event.pickupEvidenceUrl)
                    )
                  }
                />
                <span className="evidence-label">Pickup Evidence</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Enlarged image modal */}
      {enlargedImage && (
        <div
          className="evidence-modal-overlay"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="evidence-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="evidence-modal-close"
              onClick={() => setEnlargedImage(null)}
            >
              <X size={24} />
            </button>
            <img src={enlargedImage} alt="Pickup evidence enlarged" />
          </div>
        </div>
      )}
    </div>
  );
}

DonationTimeline.propTypes = {
  timeline: PropTypes.array,
  loading: PropTypes.bool,
  showAdminBadges: PropTypes.bool,
};
