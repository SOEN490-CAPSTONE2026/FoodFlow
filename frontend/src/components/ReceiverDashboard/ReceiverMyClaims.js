import React, { useState, useEffect, useRef } from 'react';
import { Package, User, ArrowRight, Filter, Clock, Star } from 'lucide-react';
import Select from 'react-select';
import { claimsAPI, feedbackAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useTimezone } from '../../contexts/TimezoneContext';
import {
  getPrimaryFoodCategory,
  foodTypeImages,
  getUnitLabel,
} from '../../constants/foodConstants';
import ClaimDetailModal from './ClaimDetailModal.js';
import './Receiver_Styles/ReceiverMyClaims.css';

export default function ReceiverMyClaims() {
  const { showNotification } = useNotification();
  const { userTimezone } = useTimezone();
  const [claims, setClaims] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
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
  const hasSetInitialFilter = useRef(false);

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'status', label: 'Sort by Status' },
  ];

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
      c => c.surplusPost?.status === 'READY_FOR_PICKUP'
    );
    if (hasReady) {
      setActiveFilter('Ready');
      hasSetInitialFilter.current = true;
      return;
    }

    // Check for Claimed (not ready, not completed, not expired)
    const hasClaimed = claims.some(
      c =>
        c.surplusPost?.status !== 'READY_FOR_PICKUP' &&
        c.surplusPost?.status !== 'COMPLETED' &&
        c.surplusPost?.status !== 'NOT_COMPLETED' &&
        c.surplusPost?.status !== 'EXPIRED'
    );
    if (hasClaimed) {
      setActiveFilter('Claimed');
      hasSetInitialFilter.current = true;
      return;
    }

    // Check for Completed claims
    const hasCompleted = claims.some(
      c => c.surplusPost?.status === 'COMPLETED'
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
      setError('Failed to load your claimed donations');
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
        'Claim Cancelled',
        `Your claim on "${postTitle}" has been cancelled`
      );

      // Close confirmation dialog
      setConfirmCancel({ show: false, claimId: null, postTitle: '' });

      fetchMyClaims(); // Refresh list
    } catch (error) {
      console.error('Error cancelling claim:', error);
      showNotification('Error', 'Failed to cancel claim. Please try again.');
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
  const formatPickupTime = (
    pickupDate,
    pickupFrom,
    pickupTo,
    userTimezone = 'UTC'
  ) => {
    if (!pickupDate || !pickupFrom || !pickupTo) {
      return '—';
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
      return '—';
    }
  };

  // Map claim status to display status
  const getDisplayStatus = claim => {
    const postStatus = claim.surplusPost?.status;
    if (postStatus === 'READY_FOR_PICKUP') {
      return 'Ready for Pickup';
    }
    if (postStatus === 'COMPLETED') {
      return 'Completed';
    }
    if (postStatus === 'EXPIRED') {
      return 'EXPIRED';
    }
    if (postStatus === 'NOT_COMPLETED') {
      return 'Not Completed';
    }
    return 'Claimed';
  };

  const getStatusCount = status => {
    if (status === 'All') {
      return claims.length;
    }
    if (status === 'Ready') {
      return claims.filter(c => c.surplusPost?.status === 'READY_FOR_PICKUP')
        .length;
    }
    if (status === 'Completed') {
      return claims.filter(c => c.surplusPost?.status === 'COMPLETED').length;
    }
    if (status === 'Not Completed') {
      return claims.filter(c => c.surplusPost?.status === 'NOT_COMPLETED')
        .length;
    }
    if (status === 'Expired') {
      return claims.filter(c => c.surplusPost?.status === 'EXPIRED').length;
    }
    if (status === 'Claimed') {
      return claims.filter(
        c =>
          c.surplusPost?.status !== 'READY_FOR_PICKUP' &&
          c.surplusPost?.status !== 'COMPLETED' &&
          c.surplusPost?.status !== 'NOT_COMPLETED'
      ).length;
    }
    return 0;
  };

  const filters = [
    { name: 'Claimed', count: getStatusCount('Claimed') },
    { name: 'Ready', count: getStatusCount('Ready') },
    { name: 'Completed', count: getStatusCount('Completed') },
    { name: 'Not Completed', count: getStatusCount('Not Completed') },
    { name: 'Expired', count: getStatusCount('Expired') },
    { name: 'All', count: getStatusCount('All') },
  ];

  const filteredClaims = claims.filter(claim => {
    if (activeFilter === 'All') {
      return true;
    }
    if (activeFilter === 'Ready') {
      return claim.surplusPost?.status === 'READY_FOR_PICKUP';
    }
    if (activeFilter === 'Completed') {
      return claim.surplusPost?.status === 'COMPLETED';
    }
    if (activeFilter === 'Not Completed') {
      return claim.surplusPost?.status === 'NOT_COMPLETED';
    }
    if (activeFilter === 'Expired') {
      return claim.surplusPost?.status === 'EXPIRED';
    }
    if (activeFilter === 'Claimed') {
      return (
        claim.surplusPost?.status !== 'READY_FOR_PICKUP' &&
        claim.surplusPost?.status !== 'COMPLETED' &&
        claim.surplusPost?.status !== 'NOT_COMPLETED'
      );
    }
    return true;
  });

  // Sort claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy.value === 'date') {
      // For completed claims, use completedAt date; otherwise use pickup date
      const getRelevantDate = claim => {
        if (claim.surplusPost?.status === 'COMPLETED' && claim.completedAt) {
          return claim.completedAt;
        }
        return (
          claim.confirmedPickupSlot?.pickupDate ||
          claim.confirmedPickupSlot?.date ||
          claim.surplusPost?.pickupDate
        );
      };

      const dateA = getRelevantDate(a);
      const dateB = getRelevantDate(b);

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

      // For completed claims, sort by most recent first (descending)
      // For other claims, sort by earliest pickup first (ascending)
      const isCompletedFilter = activeFilter === 'Completed';
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();

      return isCompletedFilter ? timeB - timeA : timeA - timeB;
    }
    if (sortBy.value === 'status') {
      const statusPriority = {
        'Ready for Pickup': 1,
        Claimed: 2,
        Completed: 3,
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
        <div className="claimed-page loading">Loading your claims...</div>
      </div>
    );
  }

  return (
    <div className="claimed-page claimed-donations-container">
      {/* Rating Stats Box */}
      <div className="receiver-stats-box">
        <div className="stat-item">
          <Star size={16} fill="#F59E0B" color="#F59E0B" />
          <div className="stat-info">
            <div className="stat-label">Rating:</div>
            <div className="stat-value">
              {rating.totalReviews > 0 ? (
                <>
                  {rating.averageRating.toFixed(1)}
                  <span className="rating-count">
                    ★ ({rating.totalReviews})
                  </span>
                </>
              ) : (
                <span className="no-rating">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h1>My Claimed Donations</h1>
      <p className="claimed-page claimed-subtitle">
        Track your donations and get ready for pickup — every claim helps reduce
        waste and feed our community.
      </p>

      {error && <div className="claimed-page error-message">{error}</div>}

      {/* Filters and Sort */}
      <div className="claimed-page donation-filters-container">
        <div className="claimed-page donation-filter-buttons">
          {filters.map(filter => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`claimed-page filter-btn ${activeFilter === filter.name ? 'active' : ''}`}
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
          const primaryFoodCategory = getPrimaryFoodCategory(
            post?.foodCategories
          );

          return (
            <div key={claim.id} className="claimed-page donation-card">
              {/* Image */}
              <div className="claimed-page card-image">
                <img
                  src={
                    foodTypeImages[primaryFoodCategory] ||
                    foodTypeImages['Prepared Meals']
                  }
                  alt={post?.title || 'Donation'}
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
                  {post?.title || 'Untitled Donation'}
                </h3>

                <div className="claimed-page card-details">
                  <div className="claimed-page detail-item">
                    <Package
                      size={16}
                      className="claimed-page quantity-detail-icon"
                    />
                    <span>
                      {post?.quantity?.value || 0}{' '}
                      {getUnitLabel(post?.quantity?.unit) || 'items'}
                    </span>
                  </div>
                  <div className="claimed-page detail-item">
                    <User
                      size={16}
                      className="claimed-page donor-detail-icon"
                    />
                    <span>{post?.donorName || 'Not specified'}</span>
                  </div>
                  <div className="claimed-page detail-item">
                    <Clock
                      size={16}
                      className="claimed-page date-detail-icon"
                    />
                    <span>
                      {formatPickupTime(
                        claim.confirmedPickupSlot?.pickupDate ||
                          claim.confirmedPickupSlot?.date,
                        claim.confirmedPickupSlot?.startTime ||
                          claim.confirmedPickupSlot?.pickupFrom,
                        claim.confirmedPickupSlot?.endTime ||
                          claim.confirmedPickupSlot?.pickupTo,
                        userTimezone
                      )}
                    </span>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="claimed-page card-actions">
                  {/* Only show Cancel button when status is CLAIMED */}
                  {claim.surplusPost?.status === 'CLAIMED' && (
                    <button
                      onClick={() => handleCancelClick(claim.id)}
                      className="claimed-page cancel-claim-btn"
                    >
                      Cancel
                    </button>
                  )}

                  <div
                    className="claimed-page view-details-container"
                    onClick={() => handleViewDetails(claim)}
                  >
                    <span>View details</span>
                    <button className="claimed-page view-details-btn">
                      <ArrowRight
                        size={16}
                        className="claimed-page arrow-icon"
                      />
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
            {activeFilter === 'All'
              ? "You haven't claimed any donations yet. Browse available donations to make your first claim!"
              : `No donations found for the "${activeFilter}" filter.`}
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmCancel.show && (
        <div className="claimed-page confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Cancel Claim</h3>
            <p>
              Are you sure you want to cancel your claim on{' '}
              <strong>"{confirmCancel.postTitle}"</strong>? This action cannot
              be undone.
            </p>
            <div className="confirmation-buttons">
              <button onClick={handleCancelCancel} className="btn btn-cancel">
                Keep Claim
              </button>
              <button onClick={handleConfirmCancel} className="btn btn-create">
                Yes, Cancel Claim
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
