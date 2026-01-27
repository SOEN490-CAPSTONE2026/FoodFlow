import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, User, ArrowRight, Filter, Clock, Star } from 'lucide-react';
import Select from 'react-select';
import { claimsAPI, feedbackAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useTimezone } from '../../contexts/TimezoneContext';
import { getPrimaryFoodCategory, foodTypeImages, getUnitLabel } from '../../constants/foodConstants';
import ClaimDetailModal from './ClaimDetailModal.js';
import "./Receiver_Styles/ReceiverMyClaims.css";

export default function ReceiverMyClaims() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { userTimezone } = useTimezone();
  const [claims, setClaims] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ value: 'date', label: 'Sort by Date' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState({ show: false, claimId: null, postTitle: '' });
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });

  const sortOptions = [
    { value: 'date', label: t('receiverMyClaims.sortByDate') },
    { value: 'status', label: t('receiverMyClaims.sortByStatus') }
  ];

  const getNormalizedStatus = claim => {
    const postStatus = claim.surplusPost?.status;
    if (postStatus) {
      return postStatus;
    }
    const claimStatus = claim?.status;
    if (!claimStatus || typeof claimStatus !== 'string') {
      return null;
    }
    return claimStatus.toUpperCase().replace(/\s+/g, '_');
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
    if (claims.length === 0 || hasSetInitialFilter.current) {
      return;
    }

    // Check for Ready for Pickup claims
    const hasReady = claims.some(
      c => getNormalizedStatus(c) === 'READY_FOR_PICKUP'
    );
    if (hasReady) {
      setActiveFilter('Ready');
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
      setActiveFilter('Claimed');
      hasSetInitialFilter.current = true;
      return;
    }

    // Check for Completed claims
    const hasCompleted = claims.some(
      c => getNormalizedStatus(c) === 'COMPLETED'
    );
    if (hasCompleted) {
      setActiveFilter('Completed');
      hasSetInitialFilter.current = true;
      return;
    }

    // Otherwise show All
    setActiveFilter('All');
    hasSetInitialFilter.current = true;
  }, [claims]);

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
          averageRating: Math.round((response.data.averageRating || 0) * 10) / 10,
          totalReviews: response.data.totalReviews || 0
        });
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleCancelClick = (claimId) => {
    // Find the claim to get its title for the confirmation
    const claim = claims.find(c => c.id === claimId);
    const postTitle = claim?.surplusPost?.title || 'donation';
    
    setConfirmCancel({ 
      show: true, 
      claimId: claimId, 
      postTitle: postTitle 
    });
  };

  const handleConfirmCancel = async () => {
    try {
      const { claimId, postTitle } = confirmCancel;
      
      await claimsAPI.cancel(claimId);
      console.log('Claim cancelled successfully');
      
      // Show toast notification
      showNotification(t('receiverMyClaims.claimCancelled'), t('receiverMyClaims.claimCancelledMessage', { postTitle }));
      
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

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClaim(null);
    fetchMyClaims();
  };

  // Format pickup time consistently with ReceiverBrowse
  const formatPickupTime = (pickupDate, pickupFrom, pickupTo, userTimezone = 'UTC') => {
    if (!pickupDate || !pickupFrom || !pickupTo) return "—";
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
      
      const dateStr = fromDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: userTimezone
      });
      const fromTime = fromDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: userTimezone
      });
      const toTime = toDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: userTimezone
      });
      return `${dateStr} ${fromTime}-${toTime}`;
    } catch (error) {
      console.error('Error formatting pickup time:', error);
      return "—";
    }
  };

  const getStatusCount = status => {
    if (status === 'All') {
      return claims.length;
    }
    if (status === 'Ready') {
      return claims.filter(c => getNormalizedStatus(c) === 'READY_FOR_PICKUP')
        .length;
    }
    if (status === 'Completed') {
      return claims.filter(c => getNormalizedStatus(c) === 'COMPLETED').length;
    }
    if (status === 'Not Completed') {
      return claims.filter(c => getNormalizedStatus(c) === 'NOT_COMPLETED')
        .length;
    }
    if (status === 'Expired') {
      return claims.filter(c => getNormalizedStatus(c) === 'EXPIRED').length;
    }
    if (status === 'Claimed') {
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
    { name: t('receiverMyClaims.filters.claimed'), count: getStatusCount(t('receiverMyClaims.filters.claimed')) },
    { name: t('receiverMyClaims.filters.ready'), count: getStatusCount(t('receiverMyClaims.filters.ready')) },
    { name: t('receiverMyClaims.filters.completed'), count: getStatusCount(t('receiverMyClaims.filters.completed')) },
    { name: t('receiverMyClaims.filters.notCompleted'), count: getStatusCount(t('receiverMyClaims.filters.notCompleted')) },
    { name: 'Expired', count: getStatusCount('Expired') },
    { name: t('receiverMyClaims.filters.all'), count: getStatusCount(t('receiverMyClaims.filters.all')) }
  ];

  const filteredClaims = claims.filter(claim => {
    if (activeFilter === 'All') {
      return true;
    }
    if (activeFilter === 'Ready') {
      return getNormalizedStatus(claim) === 'READY_FOR_PICKUP';
    }
    if (activeFilter === 'Completed') {
      return getNormalizedStatus(claim) === 'COMPLETED';
    }
    if (activeFilter === 'Not Completed') {
      return getNormalizedStatus(claim) === 'NOT_COMPLETED';
    }
    if (activeFilter === 'Expired') {
      return getNormalizedStatus(claim) === 'EXPIRED';
    }
    if (activeFilter === 'Claimed') {
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
      const getPickupDate = (claim) => {
        return claim.confirmedPickupSlot?.pickupDate || 
               claim.confirmedPickupSlot?.date || 
               claim.surplusPost?.pickupDate;
      };
      
      const dateA = getPickupDate(a);
      const dateB = getPickupDate(b);
      
      // Handle missing dates
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put items without dates at the end
      if (!dateB) return -1;
      
      // Sort by pickup date - earliest pickup first (ascending)
      return new Date(dateA).getTime() - new Date(dateB).getTime();
      
    }
    if (sortBy.value === 'status') {
      const statusPriority = {
        [t('receiverMyClaims.readyForPickup')]: 1,
        [t('receiverMyClaims.claimed')]: 2,
        [t('receiverMyClaims.completed')]: 3
      };
      
      const statusA = getDisplayStatus(a);
      const statusB = getDisplayStatus(b);
      
      return (statusPriority[statusA] || 99) - (statusPriority[statusB] || 99);
    }
    return 0;
  });

  if (loading && claims.length === 0) {
    return (
      <div className="claimed-page claimed-donations-container">
        <div className="claimed-page loading">{t('receiverMyClaims.loading')}</div>
      </div>
    );
  }

  return (
    <div className="claimed-page claimed-donations-container">
      {/* Rating Stats Box */}
      <div className="receiver-stats-box">
        <div className="stat-item">
          <div className="stat-info">
            <div className="stat-value">
              {rating.totalReviews > 0 ? (
                <span className="rating-vertical-wrap">
                  <span className="rating-main">
                    <span className="rating-star">★</span> Your Rating :
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
                <span className="no-rating">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h1>{t('receiverMyClaims.title')}</h1>
      <p className="claimed-page claimed-subtitle">{t('receiverMyClaims.subtitle')}</p>

      {error && (
        <div className="claimed-page error-message">
          {error}
        </div>
      )}

      {/* Filters and Sort */}
      <div className="claimed-page donation-filters-container">
        <div className="claimed-page donation-filter-buttons">
          {filters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`claimed-page filter-btn ${activeFilter === filter.name ? 'active' : ''}`}
            >
              <span>{filter.name}</span> 
              <span className="claimed-page donation-filter-count">({filter.count})</span>
            </button>
          ))}
        </div>

        <div className="claimed-page donation-sort-dropdown">
          <Filter
            size={20}
            className="claimed-page donation-filter-icon"
          />
          <Select
            value={sortBy}
            onChange={(selectedOption) => setSortBy(selectedOption)}
            options={sortOptions}
            classNamePrefix="react-select"
            isSearchable={false}
          />
        </div>
      </div>

      <div className="claimed-page donations-grid">
        {sortedClaims.map((claim) => {
          const post = claim.surplusPost;
          const displayStatus = getDisplayStatus(claim);
          
          // Get the primary food category from foodCategories array
          const primaryFoodCategory = getPrimaryFoodCategory(post?.foodCategories);
          
          return (
            <div key={claim.id} className="claimed-page donation-card">
              {/* Image */}
              <div className="claimed-page card-image">
                <img
                  src={foodTypeImages[primaryFoodCategory] || foodTypeImages['Prepared Meals']}
                  alt={post?.title || 'Donation'}
                />
                <span className={`claimed-page status-badge status-${displayStatus.toLowerCase().replace(' ', '-')}`}>
                  {displayStatus}
                </span>
              </div>

              {/* Content */}
              <div className="claimed-page card-content">
                <h3 className="claimed-page card-title">{post?.title || t('receiverMyClaims.untitledDonation')}</h3>

                 <div className="claimed-page card-details">
                  <div className="claimed-page detail-item">
                    <Package size={16} className="claimed-page quantity-detail-icon" />
                    <span>
                      {post?.quantity?.value || 0} {getUnitLabel(post?.quantity?.unit) || 'items'}
                    </span>
                  </div>
                  <div className="claimed-page detail-item">
                    <User size={16} className="claimed-page donor-detail-icon" />
                    <span>{post?.donorName || t('receiverMyClaims.notSpecified')}</span>
                  </div>
                  <div className="claimed-page detail-item">
                    <Clock size={16} className="claimed-page date-detail-icon" />
                    <span>
                      {formatPickupTime(
                        claim.confirmedPickupSlot?.pickupDate || claim.confirmedPickupSlot?.date,
                        claim.confirmedPickupSlot?.startTime || claim.confirmedPickupSlot?.pickupFrom,
                        claim.confirmedPickupSlot?.endTime || claim.confirmedPickupSlot?.pickupTo,
                        userTimezone
                      )}
                    </span>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="claimed-page card-actions">
                  {/* Only show Cancel button when status is CLAIMED */}
                  {getNormalizedStatus(claim) === 'CLAIMED' && (
                    <button
                      onClick={() => handleCancelClick(claim.id)}
                      className="claimed-page cancel-claim-btn"
                    >
                      {t('receiverMyClaims.cancel')}
                    </button>
                  )}
                  
                  <div className="claimed-page view-details-container" onClick={() => handleViewDetails(claim)}>
                    <span>{t('receiverMyClaims.viewDetails')}</span>
                    <button className="claimed-page view-details-btn">
                      <ArrowRight size={16} className="claimed-page arrow-icon" />
                    </button>
                  </div>
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
            {activeFilter === t('receiverMyClaims.filters.all')
              ? t('receiverMyClaims.noClaimsYet')
              : t('receiverMyClaims.noDonationsForFilter', { filter: activeFilter })}
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmCancel.show && (
        <div className="claimed-page confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>{t('receiverMyClaims.cancelClaim')}</h3>
            <p>
              {t('receiverMyClaims.confirmCancelMessage', { postTitle: confirmCancel.postTitle })}
            </p>
            <div className="confirmation-buttons">
              <button 
                onClick={handleCancelCancel}
                className="btn btn-cancel"
              >
                {t('receiverMyClaims.keepClaim')}
              </button>
              <button 
                onClick={handleConfirmCancel}
                className="btn btn-create"
              >
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
