import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Clock, ShieldAlert, Camera, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  parseBackendUtcTimestamp,
  parseExplicitUtcTimestamp,
} from '../../utils/timezoneUtils';
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
  if (!url) {
    return null;
  }

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
  userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
}) {
  const { t } = useTranslation();
  const [enlargedImage, setEnlargedImage] = useState(null);

  const humanizeToken = value => {
    if (!value || typeof value !== 'string') {
      return '—';
    }
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatEventType = eventType => {
    if (!eventType) {
      return '—';
    }
    return t(`donationTimeline.events.${eventType}`, humanizeToken(eventType));
  };

  const formatActor = actor => {
    if (!actor) {
      return t('donationTimeline.actor.unknown', 'Unknown');
    }
    const normalized = String(actor).toLowerCase();
    const known = {
      donor: t('donationTimeline.actor.donor', 'Donor'),
      receiver: t('donationTimeline.actor.receiver', 'Receiver'),
      system: t('donationTimeline.actor.system', 'System'),
      admin: t('donationTimeline.actor.admin', 'Admin'),
    };
    return known[normalized] || actor;
  };

  const formatStatus = status => {
    if (!status) {
      return '—';
    }

    const normalized = String(status).toUpperCase();
    const map = {
      AVAILABLE: t('receiverBrowse.status.available', 'Available'),
      CLAIMED: t('claimDetail.status.claimed', 'Claimed'),
      READY_FOR_PICKUP: t(
        'claimDetail.status.readyForPickup',
        'Ready for Pickup'
      ),
      COMPLETED: t('claimDetail.status.completed', 'Completed'),
      NOT_COMPLETED: t('claimDetail.status.notCompleted', 'Not Completed'),
      EXPIRED: t('claimDetail.status.expired', 'Expired'),
    };

    return map[normalized] || humanizeToken(normalized);
  };

  const formatDetails = event => {
    if (!event?.details) {
      return '';
    }

    const details = String(event.details);

    if (/^Claimed by\s+/i.test(details)) {
      const name = details.replace(/^Claimed by\s+/i, '').trim();
      return t('donationTimeline.details.claimedBy', 'Claimed by {{name}}', {
        name,
      });
    }

    if (/^Donation posted by\s+/i.test(details)) {
      const name = details.replace(/^Donation posted by\s+/i, '').trim();
      return t(
        'donationTimeline.details.postedBy',
        'Donation posted by {{name}}',
        { name }
      );
    }

    if (event.eventType === 'READY_FOR_PICKUP') {
      return t(
        'donationTimeline.details.readyForPickup',
        'Pickup time arrived. OTP generated automatically.'
      );
    }

    if (event.eventType === 'PICKUP_MISSED') {
      return t(
        'donationTimeline.details.pickupMissed',
        'Pickup window expired. Marked as not completed automatically.'
      );
    }

    if (event.eventType === 'DONATION_EXPIRED') {
      return t(
        'donationTimeline.details.expired',
        'Donation expired automatically.'
      );
    }

    return details;
  };

  const formatDate = timestamp => {
    if (!timestamp) {
      return '—';
    }
    try {
      const date =
        parseExplicitUtcTimestamp(timestamp) ||
        parseBackendUtcTimestamp(timestamp);
      if (!date) {
        return '—';
      }
      return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone || 'UTC',
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
        <span>{t('donationTimeline.loading', 'Loading timeline...')}</span>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="donation-timeline-empty">
        <Clock size={32} />
        <p>
          {t(
            'donationTimeline.empty',
            'No donation timeline events available yet.'
          )}
        </p>
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
              {formatEventType(event.eventType)}
            </div>
            <div className="donation-timeline-meta">
              <span>{formatDate(event.timestamp)}</span>
              <span className="donation-timeline-actor">
                {t('donationTimeline.actorLabel', 'Actor')}:{' '}
                {formatActor(event.actor)}
              </span>
              {showAdminBadges && event.visibleToUsers === false && (
                <span className="admin-only-badge">
                  <ShieldAlert size={14} />
                  {t('donationTimeline.adminOnly', 'Admin only')}
                </span>
              )}
            </div>
            {event.oldStatus && event.newStatus && (
              <div className="donation-timeline-status-change">
                {t('donationTimeline.statusLabel', 'Status')}:{' '}
                <span className="old-status">
                  {formatStatus(event.oldStatus)}
                </span>
                <span className="arrow">→</span>
                <span className="new-status">
                  {formatStatus(event.newStatus)}
                </span>
              </div>
            )}
            {formatDetails(event) && (
              <div className="donation-timeline-details">
                {formatDetails(event)}
              </div>
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
                <span className="evidence-label">
                  {t('donationTimeline.pickupEvidence', 'Pickup Evidence')}
                </span>
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
  userTimezone: PropTypes.string,
};
