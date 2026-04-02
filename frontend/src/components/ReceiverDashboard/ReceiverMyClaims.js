import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  User,
  ArrowRight,
  Filter,
  Clock,
  Calendar,
  MapPin,
  Heart,
  Star,
} from 'lucide-react';
import Select from 'react-select';
import { claimsAPI, feedbackAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getDietaryTagLabel,
  getPrimaryFoodCategory,
  getTemperatureCategoryLabel,
  foodTypeImages,
  getUnitLabel,
} from '../../constants/foodConstants';
import {
  formatPickupWindowFromParts,
  parseLocalDateTimeParts,
} from '../../utils/timezoneUtils';
import { normalizeStatus } from '../../utils/statusUtils';
import ClaimDetailModal from './ClaimDetailModal.js';
import './Receiver_Styles/ReceiverMyClaims.css';

const FILTER_KEYS = {
  CLAIMED: 'CLAIMED',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  NOT_COMPLETED: 'NOT_COMPLETED',
  EXPIRED: 'EXPIRED',
  ALL: 'ALL',
};

export default function ReceiverMyClaims() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const hasSetInitialFilter = useRef(false);
  const [claims, setClaims] = useState([]);
  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);
  const [sortBy, setSortBy] = useState({
    value: 'date',
    label: 'Sort by Date',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState({
    show: false,
    claimId: null,
    postTitle: '',
  });
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [focusedDonationId, setFocusedDonationId] = useState(null);

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

  const sortOptions = [
    { value: 'date', label: t('receiverMyClaims.sortByDate') },
    { value: 'status', label: t('receiverMyClaims.sortByStatus') },
  ];

  const getNormalizedStatus = claim => {
    const claimStatus = claim?.status;
    const normalizedClaimStatus = normalizeStatus(claimStatus);
    const normalizedPostStatus = normalizeStatus(claim?.surplusPost?.status);
    if (normalizedClaimStatus && normalizedClaimStatus !== 'ACTIVE') {
      return normalizedClaimStatus;
    }

    // ACTIVE claim means "ongoing"; visible lifecycle state should come from post.
    if (normalizedClaimStatus === 'ACTIVE') {
      return normalizedPostStatus || 'CLAIMED';
    }

    return normalizedPostStatus || null;
  };

  const getDisplayStatus = claim => {
    const status = getNormalizedStatus(claim);
    if (status === 'READY_FOR_PICKUP') {
      return 'Ready for Pickup';
    }
    if (status === 'COMPLETED') {
      return 'Completed';
    }
    if (status === 'EXPIRED') {
      return 'EXPIRED';
    }
    if (status === 'NOT_COMPLETED') {
      return 'Not Completed';
    }
    return 'Claimed';
  };

  const getClaimDonationId = claim =>
    Number(claim?.surplusPost?.id ?? claim?.surplusPostId ?? 0);

  // Deep-link mode: keep All filter so focused donation card is reachable immediately.
  useEffect(() => {
    if (!location.state?.focusDonationId) {
      return;
    }
    hasSetInitialFilter.current = true;
    if (activeFilter !== FILTER_KEYS.ALL) {
      setActiveFilter(FILTER_KEYS.ALL);
    }
  }, [activeFilter, location.state]);

  useEffect(() => {
    fetchMyClaims();
    fetchMyRating();

    // Poll for updates every 10 seconds to catch status changes faster
    const intervalId = setInterval(() => {
      fetchMyClaims();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Set initial filter based on priority: Ready > Claimed > Completed (only once on first load)
  useEffect(() => {
    if (location.state?.focusDonationId) {
      return;
    }

    if (claims.length === 0 || hasSetInitialFilter.current) {
      return;
    }

    // Check for Ready for Pickup claims
    const hasReady = claims.some(
      c => getNormalizedStatus(c) === 'READY_FOR_PICKUP'
    );
    if (hasReady) {
      setActiveFilter(FILTER_KEYS.READY);
      hasSetInitialFilter.current = true;
      return;
    }

    // Check for Claimed (not ready, not completed, not expired)
    const hasClaimed = claims.some(
      c =>
        getNormalizedStatus(c) !== 'READY_FOR_PICKUP' &&
        getNormalizedStatus(c) !== 'COMPLETED' &&
        getNormalizedStatus(c) !== 'NOT_COMPLETED' &&
        getNormalizedStatus(c) !== 'EXPIRED'
    );
    if (hasClaimed) {
      setActiveFilter(FILTER_KEYS.CLAIMED);
      hasSetInitialFilter.current = true;
      return;
    }

    // Check for Completed claims
    const hasCompleted = claims.some(
      c => getNormalizedStatus(c) === 'COMPLETED'
    );
    if (hasCompleted) {
      setActiveFilter(FILTER_KEYS.COMPLETED);
      hasSetInitialFilter.current = true;
      return;
    }

    // Otherwise show All
    setActiveFilter(FILTER_KEYS.ALL);
    hasSetInitialFilter.current = true;
  }, [claims, location.state]);

  const fetchMyClaims = async () => {
    setLoading(true);
    try {
      const response = await claimsAPI.myClaims();
      setClaims(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching claims:', error);
      setError(t('receiverMyClaims.failedToLoad'));
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRating = async () => {
    try {
      const response = await feedbackAPI.getMyRating();
      if (response && response.data) {
        setRating({
          averageRating:
            Math.round((response.data.averageRating || 0) * 10) / 10,
          totalReviews: response.data.totalReviews || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleCancelClick = claimId => {
    // Find the claim to get its title for the confirmation
    const claim = claims.find(c => c.id === claimId);
    const postTitle = claim?.surplusPost?.title || 'donation';

    setConfirmCancel({
      show: true,
      claimId: claimId,
      postTitle: postTitle,
    });
  };

  const handleConfirmCancel = async () => {
    try {
      const { claimId, postTitle } = confirmCancel;

      await claimsAPI.cancel(claimId);
      console.log('Claim cancelled successfully');

      // Show toast notification
      showNotification(
        t('receiverMyClaims.claimCancelled'),
        t('receiverMyClaims.claimCancelledMessage', { postTitle })
      );

      // Close confirmation dialog
      setConfirmCancel({ show: false, claimId: null, postTitle: '' });

      fetchMyClaims(); // Refresh list
    } catch (error) {
      console.error('Error cancelling claim:', error);
      showNotification(t('common.error'), t('receiverMyClaims.cancelFailed'));
      // Close confirmation dialog even on error
      setConfirmCancel({ show: false, claimId: null, postTitle: '' });
    }
  };

  const handleCancelCancel = () => {
    setConfirmCancel({ show: false, claimId: null, postTitle: '' });
  };

  const handleViewDetails = claim => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClaim(null);
    fetchMyClaims();
  };

  // Format pickup time consistently with ReceiverBrowse
  const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) {
      return '--';
    }
    try {
      return (
        formatPickupWindowFromParts(
          String(pickupDate),
          String(pickupFrom),
          String(pickupTo),
          'en-US'
        ) || '--'
      );
    } catch (error) {
      console.error('Error formatting pickup time:', error);
      return '--';
    }
  };

  const formatDisplayDate = dateValue => {
    if (!dateValue) {
      return t('receiverMyClaims.notSpecified');
    }

    try {
      const [year, month, day] = String(dateValue).split('-').map(Number);
      if (!year || !month || !day) {
        return dateValue;
      }
      const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateValue;
    }
  };

  const getShortAddress = address => {
    if (!address || typeof address !== 'string') {
      return t('receiverMyClaims.notSpecified');
    }

    const trimmed = address.trim();
    if (!trimmed) {
      return t('receiverMyClaims.notSpecified');
    }

    return trimmed.length > 64 ? `${trimmed.slice(0, 61)}...` : trimmed;
  };

  const getStatusCount = filterKey => {
    if (filterKey === FILTER_KEYS.ALL) {
      return claims.length;
    }
    if (filterKey === FILTER_KEYS.READY) {
      return claims.filter(c => getNormalizedStatus(c) === 'READY_FOR_PICKUP')
        .length;
    }
    if (filterKey === FILTER_KEYS.COMPLETED) {
      return claims.filter(c => getNormalizedStatus(c) === 'COMPLETED').length;
    }
    if (filterKey === FILTER_KEYS.NOT_COMPLETED) {
      return claims.filter(c => getNormalizedStatus(c) === 'NOT_COMPLETED')
        .length;
    }
    if (filterKey === FILTER_KEYS.EXPIRED) {
      return claims.filter(c => getNormalizedStatus(c) === 'EXPIRED').length;
    }
    if (filterKey === FILTER_KEYS.CLAIMED) {
      return claims.filter(
        c =>
          getNormalizedStatus(c) !== 'READY_FOR_PICKUP' &&
          getNormalizedStatus(c) !== 'COMPLETED' &&
          getNormalizedStatus(c) !== 'NOT_COMPLETED' &&
          getNormalizedStatus(c) !== 'EXPIRED'
      ).length;
    }
    return 0;
  };

  const filters = [
    {
      key: FILTER_KEYS.CLAIMED,
      name: t('receiverMyClaims.filters.claimed'),
      count: getStatusCount(FILTER_KEYS.CLAIMED),
    },
    {
      key: FILTER_KEYS.READY,
      name: t('receiverMyClaims.filters.ready'),
      count: getStatusCount(FILTER_KEYS.READY),
    },
    {
      key: FILTER_KEYS.COMPLETED,
      name: t('receiverMyClaims.filters.completed'),
      count: getStatusCount(FILTER_KEYS.COMPLETED),
    },
    {
      key: FILTER_KEYS.NOT_COMPLETED,
      name: t('receiverMyClaims.filters.notCompleted'),
      count: getStatusCount(FILTER_KEYS.NOT_COMPLETED),
    },
    {
      key: FILTER_KEYS.EXPIRED,
      name: 'Expired',
      count: getStatusCount(FILTER_KEYS.EXPIRED),
    },
    {
      key: FILTER_KEYS.ALL,
      name: t('receiverMyClaims.filters.all'),
      count: getStatusCount(FILTER_KEYS.ALL),
    },
  ];

  const filteredClaims = claims.filter(claim => {
    if (activeFilter === FILTER_KEYS.ALL) {
      return true;
    }
    if (activeFilter === FILTER_KEYS.READY) {
      return getNormalizedStatus(claim) === 'READY_FOR_PICKUP';
    }
    if (activeFilter === FILTER_KEYS.COMPLETED) {
      return getNormalizedStatus(claim) === 'COMPLETED';
    }
    if (activeFilter === FILTER_KEYS.NOT_COMPLETED) {
      return getNormalizedStatus(claim) === 'NOT_COMPLETED';
    }
    if (activeFilter === FILTER_KEYS.EXPIRED) {
      return getNormalizedStatus(claim) === 'EXPIRED';
    }
    if (activeFilter === FILTER_KEYS.CLAIMED) {
      return (
        getNormalizedStatus(claim) !== 'READY_FOR_PICKUP' &&
        getNormalizedStatus(claim) !== 'COMPLETED' &&
        getNormalizedStatus(claim) !== 'NOT_COMPLETED' &&
        getNormalizedStatus(claim) !== 'EXPIRED'
      );
    }
    return true;
  });

  // Sort claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy.value === 'date') {
      // Get the pickup date (prioritize confirmed slot, fallback to post pickup date)
      const getPickupDate = claim => {
        return (
          claim.confirmedPickupSlot?.pickupDate ||
          claim.confirmedPickupSlot?.date ||
          claim.surplusPost?.pickupDate
        );
      };

      const dateA = getPickupDate(a);
      const dateB = getPickupDate(b);

      // Handle missing dates
      if (!dateA && !dateB) {
        return 0;
      }
      if (!dateA) {
        return 1;
      } // Put items without dates at the end
      if (!dateB) {
        return -1;
      }

      // Sort by pickup date - most recent first (descending)
      const parsedA = parseLocalDateTimeParts(dateA, '00:00:00') || new Date(0);
      const parsedB = parseLocalDateTimeParts(dateB, '00:00:00') || new Date(0);
      return parsedB.getTime() - parsedA.getTime();
    }
    if (sortBy.value === 'status') {
      const statusPriority = {
        [t('receiverMyClaims.readyForPickup')]: 1,
        [t('receiverMyClaims.claimed')]: 2,
        [t('receiverMyClaims.completed')]: 3,
      };

      const statusA = getDisplayStatus(a);
      const statusB = getDisplayStatus(b);

      return (statusPriority[statusA] || 99) - (statusPriority[statusB] || 99);
    }
    return 0;
  });

  useEffect(() => {
    const targetId = location.state?.focusDonationId;
    if (!targetId || !claims.length) {
      return;
    }

    const normalizedTargetId = Number(targetId);
    const targetClaim = claims.find(
      claim => getClaimDonationId(claim) === normalizedTargetId
    );

    if (!targetClaim) {
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (activeFilter !== FILTER_KEYS.ALL) {
      setActiveFilter(FILTER_KEYS.ALL);
      return;
    }

    const targetCard = document.getElementById(
      `claim-card-${normalizedTargetId}`
    );
    if (!targetCard) {
      return;
    }

    setFocusedDonationId(normalizedTargetId);
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearHighlightTimer = setTimeout(() => {
      setFocusedDonationId(null);
    }, 2200);

    navigate(location.pathname, { replace: true, state: {} });

    return () => clearTimeout(clearHighlightTimer);
  }, [activeFilter, claims, location.pathname, location.state, navigate]);

  if (loading && claims.length === 0) {
    return (
      <div className="claimed-page claimed-donations-container">
        <div className="claimed-page loading">
          {t('receiverMyClaims.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="claimed-page claimed-donations-container">
      <div
        className="claimed-page claims-header"
        data-tour="receiver-my-claims"
      >
        <div className="claimed-page claims-header-text">
          <h1>{t('receiverMyClaims.title')}</h1>
          <p className="claimed-page claimed-subtitle">
            {t('receiverMyClaims.subtitle')}
          </p>
        </div>

        {/* Rating Stats Box */}
        <div className="receiver-stats-box">
          <div className="stat-item">
            <div className="stat-info">
              <div className="stat-value">
                {rating.totalReviews > 0 ? (
                  <span className="rating-vertical-wrap">
                    <span className="rating-main">
                      <Star
                        size={18}
                        className="rating-star"
                        fill="#f59e0b"
                        color="#f59e0b"
                      />{' '}
                      Your Rating :
                      <span className="rating-number">
                        {rating.averageRating.toFixed(1)}
                      </span>
                      <span className="rating-count">
                        ({rating.totalReviews})
                      </span>
                    </span>
                    <span className="rating-count-row">
                      <span className="rating-count"></span>
                    </span>
                  </span>
                ) : (
                  <span className="no-rating">--</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="claimed-page error-message">{error}</div>}

      <section
        className="claimed-page donation-support-banner"
        aria-label={t('donation.bannerAriaLabel')}
      >
        <div className="claimed-page donation-support-banner-content">
          <div
            className="claimed-page donation-support-banner-icon"
            aria-hidden="true"
          >
            <Heart strokeWidth={2} />
          </div>
          <div className="claimed-page donation-support-banner-text">
            <h3>{t('donation.title')}</h3>
            <p>{t('donation.claimsSubtitle')}</p>
          </div>
        </div>
        <button
          className="claimed-page donation-support-banner-button"
          onClick={() => navigate('/payment')}
        >
          {t('donation.modalAriaLabel')}
        </button>
      </section>

      {/* Filters and Sort */}
      <div className="claimed-page donation-filters-container">
        <div className="claimed-page donation-filter-buttons">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`claimed-page filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
            >
              <span>{filter.name}</span>
              <span className="claimed-page donation-filter-count">
                ({filter.count})
              </span>
            </button>
          ))}
        </div>

        <div className="claimed-page donation-sort-dropdown">
          <Filter size={20} className="claimed-page donation-filter-icon" />
          <Select
            value={sortBy}
            onChange={selectedOption => setSortBy(selectedOption)}
            options={sortOptions}
            classNamePrefix="react-select"
            isSearchable={false}
          />
        </div>
      </div>

      <div className="claimed-page donations-grid">
        {sortedClaims.map(claim => {
          const post = claim.surplusPost;
          const displayStatus = getDisplayStatus(claim);

          // Get the primary food category from foodCategories array
          const normalizedFoodCategories = Array.isArray(post?.foodCategories)
            ? post.foodCategories.map(category => category?.name || category)
            : [];
          const primaryFoodCategory = getPrimaryFoodCategory(
            normalizedFoodCategories
          );
          const resolvedDonationImage = getImageUrl(
            post?.resolvedDonationImageUrl ||
              post?.donationImageUrl ||
              post?.imageUrl
          );
          const fallbackDonationImage =
            foodTypeImages[primaryFoodCategory] ||
            foodTypeImages['Prepared Meals'];
          const pickupWindow = formatPickupTime(
            claim.confirmedPickupSlot?.pickupDate ||
              claim.confirmedPickupSlot?.date,
            claim.confirmedPickupSlot?.startTime ||
              claim.confirmedPickupSlot?.pickupFrom,
            claim.confirmedPickupSlot?.endTime ||
              claim.confirmedPickupSlot?.pickupTo
          );
          const categoryBadge = getPrimaryFoodCategory(
            normalizedFoodCategories
          );
          const dietaryBadges = (
            Array.isArray(post?.dietaryTags) ? post.dietaryTags : []
          )
            .slice(0, 2)
            .map(getDietaryTagLabel)
            .filter(Boolean);
          const temperatureBadge = post?.temperatureCategory
            ? getTemperatureCategoryLabel(post.temperatureCategory)
            : '';
          const quantityValue = `${post?.quantity?.value || 0} ${
            getUnitLabel(post?.quantity?.unit) || 'items'
          }`;
          const expiryValue = formatDisplayDate(post?.expiryDate);
          const pickupValue = pickupWindow;
          const donorValue =
            post?.donorName || t('receiverMyClaims.notSpecified');
          const locationValue = getShortAddress(post?.pickupLocation?.address);

          const infoRows = [
            {
              key: 'quantity-expiry',
              icon: <Package size={16} className="claimed-page detail-icon" />,
              value: `${quantityValue} ? Expires ${expiryValue}`,
              tone: 'quantity',
            },
            {
              key: 'pickup',
              icon: <Clock size={16} className="claimed-page detail-icon" />,
              prefix: 'Pickup',
              value: pickupValue,
              emphasizeValue: true,
              tone: 'pickup',
            },
            {
              key: 'donor',
              icon: <User size={16} className="claimed-page detail-icon" />,
              value: donorValue,
              tone: 'donor',
            },
            {
              key: 'location',
              icon: <MapPin size={16} className="claimed-page detail-icon" />,
              value: locationValue,
              title:
                post?.pickupLocation?.address ||
                t('receiverMyClaims.notSpecified'),
              isLocation: true,
              tone: 'location',
            },
          ];

          return (
            <div
              key={claim.id}
              id={`claim-card-${getClaimDonationId(claim) || claim.id}`}
              className={`claimed-page donation-card ${
                focusedDonationId === getClaimDonationId(claim)
                  ? 'donation-card--focused'
                  : ''
              }`}
              onClick={() => handleViewDetails(claim)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleViewDetails(claim);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {/* Image */}
              <div className="claimed-page card-image">
                <img
                  src={resolvedDonationImage || fallbackDonationImage}
                  alt={post?.title || 'Donation'}
                  onError={event => {
                    event.currentTarget.src = fallbackDonationImage;
                  }}
                />
                <span
                  className={`claimed-page status-badge status-${displayStatus.toLowerCase().replace(' ', '-')}`}
                >
                  {displayStatus}
                </span>
              </div>

              {/* Content */}
              <div className="claimed-page card-content">
                <h3 className="claimed-page card-title">
                  {post?.title || t('receiverMyClaims.untitledDonation')}
                </h3>

                {(categoryBadge ||
                  dietaryBadges.length > 0 ||
                  temperatureBadge) && (
                  <div className="claimed-page card-tags">
                    {categoryBadge && (
                      <span className="claimed-page card-tag card-tag-category">
                        {categoryBadge}
                      </span>
                    )}
                    {dietaryBadges.map(tag => (
                      <span
                        key={`${claim.id}-${tag}`}
                        className="claimed-page card-tag"
                      >
                        {tag}
                      </span>
                    ))}
                    {temperatureBadge && (
                      <span className="claimed-page card-tag card-tag-temp">
                        {temperatureBadge}
                      </span>
                    )}
                  </div>
                )}

                <div className="claimed-page card-details">
                  {infoRows.map(item => (
                    <div
                      className={`claimed-page detail-item detail-item-${item.tone || 'default'}`}
                      key={item.key}
                    >
                      {item.icon}
                      <span
                        className={`claimed-page detail-value ${item.isLocation ? 'detail-value-location' : ''}`}
                        title={item.title || undefined}
                      >
                        {item.prefix ? (
                          <>
                            <span>{item.prefix} </span>
                            <span
                              className={
                                item.emphasizeValue
                                  ? 'claimed-page detail-value-emphasis'
                                  : ''
                              }
                            >
                              {item.value}
                            </span>
                          </>
                        ) : (
                          item.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Action Buttons */}
                <div className="claimed-page card-actions">
                  {/* Only show Cancel button when status is CLAIMED */}
                  {getNormalizedStatus(claim) === 'CLAIMED' && (
                    <button
                      onClick={event => {
                        event.stopPropagation();
                        handleCancelClick(claim.id);
                      }}
                      className="claimed-page cancel-claim-btn"
                      type="button"
                    >
                      {t('receiverMyClaims.cancel')}
                    </button>
                  )}

                  <button
                    className="claimed-page view-details-container"
                    onClick={event => {
                      event.stopPropagation();
                      handleViewDetails(claim);
                    }}
                    type="button"
                  >
                    <span>{t('receiverMyClaims.viewDetails')}</span>
                    <ArrowRight size={16} className="claimed-page arrow-icon" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedClaims.length === 0 && !loading && (
        <div className="claimed-page empty-state">
          <Package size={48} className="claimed-page empty-icon" />
          <p>
            {activeFilter === FILTER_KEYS.ALL
              ? t('receiverMyClaims.noClaimsYet')
              : t('receiverMyClaims.noDonationsForFilter', {
                  filter:
                    filters.find(filter => filter.key === activeFilter)?.name ||
                    activeFilter,
                })}
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmCancel.show && (
        <div className="claimed-page confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>{t('receiverMyClaims.cancelClaim')}</h3>
            <p>
              {t('receiverMyClaims.confirmCancelMessage', {
                postTitle: confirmCancel.postTitle,
              })}
            </p>
            <div className="confirmation-buttons">
              <button onClick={handleCancelCancel} className="btn btn-cancel">
                {t('receiverMyClaims.keepClaim')}
              </button>
              <button onClick={handleConfirmCancel} className="btn btn-create">
                {t('receiverMyClaims.yesCancelClaim')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <ClaimDetailModal
        claim={selectedClaim}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
