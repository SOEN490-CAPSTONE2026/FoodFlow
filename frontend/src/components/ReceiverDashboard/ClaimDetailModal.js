import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Package,
  Calendar,
  MapPin,
  User,
  Clock,
  MessageCircle,
  ChevronDown,
  Star,
} from 'lucide-react';
import useGoogleMap from '../../hooks/useGoogleMaps';
import ClaimedView from './ClaimedView';
import CompletedView from './CompletedView';
import ReadyForPickUpView from './ReadyForPickUpView';
import DonationTimeline from '../shared/DonationTimeline';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import {
  surplusAPI,
  claimsAPI,
  reportAPI,
  conversationAPI,
} from '../../services/api';
import {
  getPrimaryFoodCategory,
  foodTypeImages,
  getUnitLabel,
  getTemperatureCategoryLabel,
  getTemperatureCategoryIcon,
  getPackagingTypeLabel,
} from '../../constants/foodConstants';
import { useTimezone } from '../../contexts/TimezoneContext';
import './Receiver_Styles/ClaimDetailModal.css';

const ClaimDetailModal = ({ claim, isOpen, onClose }) => {
  const { t } = useTranslation();
  const post = claim?.surplusPost;
  const normalizedStatus = (post?.status || claim?.status || '')
    .toString()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const [showPickupSteps, setShowPickupSteps] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  const [, setExpressingInterest] = useState(false);
  const navigate = useNavigate();
  const { userTimezone } = useTimezone();
  const getImageUrl = imageUrl => {
    if (!imageUrl) {
      return null;
    }
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:')
    ) {
      return imageUrl;
    }
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const backendBaseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');
    if (imageUrl.startsWith('/api/files/')) {
      return `${backendBaseUrl}${imageUrl}`;
    }
    return `${backendBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  // Reset timeline state when modal closes or claim changes
  useEffect(() => {
    if (!isOpen) {
      setExpandedTimeline(false);
      setTimeline([]);
      setLoadingTimeline(false);
    }
  }, [isOpen, claim?.surplusPost?.id]);

  // Fetch timeline when modal opens and post ID is available
  useEffect(() => {
    if (isOpen && post?.id && expandedTimeline && timeline.length === 0) {
      fetchTimeline();
    }
  }, [isOpen, post?.id, expandedTimeline]);

  const fetchTimeline = async () => {
    if (!post?.id) {
      return;
    }

    setLoadingTimeline(true);
    try {
      const response = await surplusAPI.getTimeline(post.id);
      setTimeline(response.data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const toggleTimeline = () => {
    setExpandedTimeline(!expandedTimeline);
  };

  const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) {
      return t('claimDetail.notSpecified');
    }
    try {
      // Backend sends LocalDateTime, treat as UTC by adding 'Z'
      let fromDateStr = `${pickupDate}T${pickupFrom}`;
      if (!fromDateStr.endsWith('Z') && !fromDateStr.includes('+')) {
        fromDateStr = fromDateStr + 'Z';
      }
      let toDateStr = `${pickupDate}T${pickupTo}`;
      if (!toDateStr.endsWith('Z') && !toDateStr.includes('+')) {
        toDateStr = toDateStr + 'Z';
      }

      const fromDate = new Date(fromDateStr);
      const toDate = new Date(toDateStr);

      const dateStr = fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: userTimezone,
      });
      const fromTime = fromDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });
      const toTime = toDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });
      return `${dateStr} ${fromTime}-${toTime}`;
    } catch (error) {
      console.error('Error formatting pickup time:', error);
      return t('claimDetail.notSpecified');
    }
  };

  const mapRef = useGoogleMap(post?.pickupLocation, {
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  const getDisplayStatus = () => {
    if (normalizedStatus === 'READY_FOR_PICKUP') {
      return t('claimDetail.status.readyForPickup');
    }
    if (normalizedStatus === 'COMPLETED') {
      return t('claimDetail.status.completed');
    }
    if (normalizedStatus === 'NOT_COMPLETED') {
      return t('claimDetail.status.notCompleted');
    }
    if (normalizedStatus === 'EXPIRED') {
      return t('claimDetail.status.expired', 'Expired');
    }
    return t('claimDetail.status.claimed');
  };

  const statusClassName = normalizedStatus
    ? `claimed-status-${normalizedStatus.toLowerCase().replace(/_/g, '-')}`
    : 'claimed-status-claimed';

  const handleViewPickupSteps = () => {
    if (normalizedStatus === 'EXPIRED') {
      return;
    }
    setShowPickupSteps(true);
  };

  const handleBackToDetails = () => {
    setShowPickupSteps(false);
  };

  const handleExpressInterest = useCallback(async () => {
    if (!post?.id) {
      return;
    }

    try {
      setExpressingInterest(true);
      const response = await conversationAPI.expressInterest(post.id);
      const conversation = response.data;
      navigate(`/receiver/messages?conversationId=${conversation.id}`);
    } catch (err) {
      console.error('Error expressing interest:', err);
      alert(
        t(
          'claimDetail.failedToExpressInterest',
          "Couldn't start conversation. Please try again."
        )
      );
    } finally {
      setExpressingInterest(false);
    }
  }, [post?.id, navigate, t]);

  if (!isOpen || !claim) {
    return null;
  }

  return (
    <>
      <div className="claimed-modal-overlay" onClick={onClose}>
        <div
          className="claimed-modal-container"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button className="claimed-modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>

          {/* Modal Header with Image */}
          <div className="claimed-modal-header">
            <img
              src={
                getImageUrl(post?.resolvedDonationImageUrl) ||
                foodTypeImages[getPrimaryFoodCategory(post?.foodCategories)] ||
                foodTypeImages['Prepared Meals']
              }
              alt={post?.title || t('claimDetail.defaultTitle')}
              className="claimed-modal-header-image"
            />
            <span className={`claimed-modal-status-badge ${statusClassName}`}>
              {getDisplayStatus()}
            </span>
            <div className="claimed-modal-header-overlay">
              <h2 className="claimed-modal-title">
                {post?.title || t('claimDetail.defaultTitle')}
              </h2>
            </div>
          </div>

          {/* Modal Body */}
          <div className="claimed-modal-body">
            <div className="claimed-modal-section-header">
              <h3 className="claimed-modal-section-title">
                {t('claimDetail.donationDetails')}
              </h3>
              <a
                href="#"
                className="claimed-modal-chat-link"
                onClick={e => {
                  e.preventDefault();
                  handleExpressInterest();
                }}
                title={t('claimDetail.chatWithDonor', {
                  name: post?.donorName || t('claimDetail.donor'),
                })}
              >
                <MessageCircle size={16} />
                <span>{t('claimDetail.chatWithDonorLabel')}</span>
              </a>
            </div>

            <div className="claimed-modal-details-grid">
              {/* Quantity */}
              <div className="claimed-modal-detail-item">
                <div className="claimed-modal-detail-icon package">
                  <Package size={20} />
                </div>
                <div className="claimed-modal-detail-content">
                  <span className="claimed-modal-detail-label">
                    {t('claimDetail.quantity')}
                  </span>
                  <span className="claimed-modal-detail-value">
                    {post?.quantity?.value || 0}{' '}
                    {getUnitLabel(post?.quantity?.unit) ||
                      t('claimDetail.items')}
                  </span>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="claimed-modal-detail-item">
                <div className="claimed-modal-detail-icon calendar">
                  <Calendar size={20} />
                </div>
                <div className="claimed-modal-detail-content">
                  <span className="claimed-modal-detail-label">
                    {t('claimDetail.expiryDate')}
                  </span>
                  <span className="claimed-modal-detail-value">
                    {post?.expiryDate || t('claimDetail.notSpecified')}
                  </span>
                </div>
              </div>

              {/* Donor */}
              <div className="claimed-modal-detail-item">
                <div className="claimed-modal-detail-icon user">
                  <User size={20} />
                </div>
                <div className="claimed-modal-detail-content">
                  <span className="claimed-modal-detail-label">
                    {t('claimDetail.donor')}
                  </span>
                  <span className="claimed-modal-detail-value">
                    {post?.donorName || t('claimDetail.notSpecified')}
                  </span>
                </div>
              </div>

              {/* Temperature Category */}
              {post?.temperatureCategory && (
                <div className="claimed-modal-detail-item">
                  <div className="claimed-modal-detail-icon temperature">
                    <span style={{ fontSize: '20px' }}>
                      {getTemperatureCategoryIcon(post.temperatureCategory)}
                    </span>
                  </div>
                  <div className="claimed-modal-detail-content">
                    <span className="claimed-modal-detail-label">
                      {t('claimDetail.temperature')}
                    </span>
                    <span className="claimed-modal-detail-value temperature-badge">
                      {getTemperatureCategoryLabel(post.temperatureCategory)}
                    </span>
                  </div>
                </div>
              )}

              {/* Packaging Type */}
              {post?.packagingType && (
                <div className="claimed-modal-detail-item">
                  <div className="claimed-modal-detail-icon package">
                    <Package size={20} />
                  </div>
                  <div className="claimed-modal-detail-content">
                    <span className="claimed-modal-detail-label">
                      {t('claimDetail.packaging')}
                    </span>
                    <span className="claimed-modal-detail-value">
                      {getPackagingTypeLabel(post.packagingType)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Pickup Date & Time */}
            <div className="claimed-modal-section">
              <div className="claimed-modal-detail-item-full">
                <div className="claimed-modal-detail-icon clock">
                  <Clock size={20} />
                </div>
                <div className="claimed-modal-detail-content">
                  <span className="claimed-modal-detail-label">
                    {t('claimDetail.pickupDateTime')}
                  </span>
                  <span
                    className={`claimed-modal-detail-value ${claim?.confirmedPickupSlot ? 'confirmed-pickup-time' : ''}`}
                  >
                    {claim?.confirmedPickupSlot
                      ? formatPickupTime(
                          claim.confirmedPickupSlot.pickupDate ||
                            claim.confirmedPickupSlot.date,
                          claim.confirmedPickupSlot.startTime ||
                            claim.confirmedPickupSlot.pickupFrom,
                          claim.confirmedPickupSlot.endTime ||
                            claim.confirmedPickupSlot.pickupTo
                        )
                      : formatPickupTime(
                          post?.pickupDate,
                          post?.pickupFrom,
                          post?.pickupTo
                        )}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="claimed-modal-section">
              <div className="claimed-modal-detail-item-full">
                <div className="claimed-modal-detail-icon map-pin">
                  <MapPin size={20} />
                </div>
                <div className="claimed-modal-detail-content">
                  <span className="claimed-modal-detail-label">
                    {t('claimDetail.pickupLocation')}
                  </span>
                  {post?.pickupLocation?.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.pickupLocation.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="claimed-modal-detail-value link"
                    >
                      {post.pickupLocation.address}
                    </a>
                  ) : (
                    <span className="claimed-modal-detail-value">
                      {t('claimDetail.notSpecified')}
                    </span>
                  )}
                </div>
              </div>

              {/* Map using the hook */}
              <div className="claimed-modal-map-container">
                {post?.pickupLocation?.latitude &&
                post?.pickupLocation?.longitude ? (
                  <div ref={mapRef} className="claimed-modal-map-view" />
                ) : (
                  <div className="claimed-modal-map-placeholder">
                    <MapPin size={48} />
                    <p>{t('claimDetail.mapComingSoon')}</p>
                    <p className="claimed-modal-map-address">
                      {post?.pickupLocation?.address ||
                        t('claimDetail.addressNotSpecified')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <div className="claimed-modal-timeline-section">
              <button
                className="claimed-timeline-toggle-button"
                onClick={toggleTimeline}
              >
                <Clock size={16} />
                <span>
                  {expandedTimeline
                    ? t('claimDetail.hideTimeline')
                    : t('claimDetail.viewTimeline')}
                </span>
                <ChevronDown
                  size={16}
                  className={`chevron ${expandedTimeline ? 'open' : ''}`}
                />
              </button>

              {expandedTimeline && (
                <div className="claimed-timeline-content-wrapper">
                  <DonationTimeline
                    timeline={timeline}
                    loading={loadingTimeline}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="claimed-modal-actions">
              {[
                'CLAIMED',
                'READY_FOR_PICKUP',
                'COMPLETED',
                'NOT_COMPLETED',
              ].includes(normalizedStatus) && (
                <button
                  className="claimed-modal-btn-primary"
                  onClick={handleViewPickupSteps}
                >
                  {t('claimDetail.viewPickupSteps')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Steps Modal */}
      {showPickupSteps && normalizedStatus === 'CLAIMED' && (
        <ClaimedView
          claim={claim}
          isOpen={showPickupSteps}
          onClose={() => {
            setShowPickupSteps(false);
            onClose();
          }}
          onBack={handleBackToDetails}
        />
      )}

      {showPickupSteps && normalizedStatus === 'READY_FOR_PICKUP' && (
        <ReadyForPickUpView
          claim={claim}
          isOpen={showPickupSteps}
          onClose={() => {
            setShowPickupSteps(false);
            onClose();
          }}
          onBack={handleBackToDetails}
        />
      )}

      {showPickupSteps &&
        ['COMPLETED', 'NOT_COMPLETED'].includes(normalizedStatus) && (
          <CompletedView
            claim={claim}
            isOpen={showPickupSteps}
            onClose={() => {
              setShowPickupSteps(false);
              onClose();
            }}
            onBack={handleBackToDetails}
            showFeedbackModal={showFeedbackModal}
            setShowFeedbackModal={setShowFeedbackModal}
          />
        )}

      <FeedbackModal
        claimId={claim?.id}
        targetUser={post?.donor}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
};

export default ClaimDetailModal;
