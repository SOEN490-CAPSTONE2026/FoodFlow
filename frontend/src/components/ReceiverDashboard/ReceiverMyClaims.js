import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, User, ArrowRight, Filter, Clock } from 'lucide-react';
import Select from 'react-select';
import { claimsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { getPrimaryFoodCategory, foodTypeImages, getUnitLabel } from '../../constants/foodConstants';
import ClaimDetailModal from './ClaimDetailModal.js';
import "./Receiver_Styles/ReceiverMyClaims.css";

export default function ReceiverMyClaims() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [claims, setClaims] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ value: 'date', label: 'Sort by Date' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState({ show: false, claimId: null, postTitle: '' });

  const sortOptions = [
    { value: 'date', label: t('receiverMyClaims.sortByDate') },
    { value: 'status', label: t('receiverMyClaims.sortByStatus') }
  ];

  useEffect(() => {
    fetchMyClaims();

    // Poll for updates every 10 seconds to catch status changes faster
    const intervalId = setInterval(() => {
      fetchMyClaims();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

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
  const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) return "—";
    try {
      const fromDate = new Date(`${pickupDate}T${pickupFrom}`);
      const dateStr = fromDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const fromTime = fromDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const [hours, minutes] = pickupTo.split(":");
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const toTime = `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
      return `${dateStr} ${fromTime}-${toTime}`;
    } catch {
      return "—";
    }
  };

  // Map claim status to display status
  const getDisplayStatus = (claim) => {
    const postStatus = claim.surplusPost?.status;
    if (postStatus === 'READY_FOR_PICKUP') return t('receiverMyClaims.readyForPickup');
    if (postStatus === 'COMPLETED') return t('receiverMyClaims.completed');
    if (postStatus === 'NOT_COMPLETED') return t('receiverMyClaims.notCompleted');
    return t('receiverMyClaims.claimed');
  };

  const getStatusCount = (status) => {
    if (status === t('receiverMyClaims.filters.all')) return claims.length;
    if (status === t('receiverMyClaims.filters.ready')) {
      return claims.filter(c => c.surplusPost?.status === 'READY_FOR_PICKUP').length;
    }
    if (status === t('receiverMyClaims.filters.completed')) {
      return claims.filter(c => c.surplusPost?.status === 'COMPLETED').length;
    }
    if (status === t('receiverMyClaims.filters.notCompleted')) {
      return claims.filter(c => c.surplusPost?.status === 'NOT_COMPLETED').length;
    }
    if (status === t('receiverMyClaims.filters.claimed')) {
      return claims.filter(c => c.surplusPost?.status !== 'READY_FOR_PICKUP' && 
                                c.surplusPost?.status !== 'COMPLETED' && 
                                c.surplusPost?.status !== 'NOT_COMPLETED').length;
    }
    return 0;
  };

  const filters = [
    { name: t('receiverMyClaims.filters.claimed'), count: getStatusCount(t('receiverMyClaims.filters.claimed')) },
    { name: t('receiverMyClaims.filters.ready'), count: getStatusCount(t('receiverMyClaims.filters.ready')) },
    { name: t('receiverMyClaims.filters.completed'), count: getStatusCount(t('receiverMyClaims.filters.completed')) },
    { name: t('receiverMyClaims.filters.notCompleted'), count: getStatusCount(t('receiverMyClaims.filters.notCompleted')) },
    { name: t('receiverMyClaims.filters.all'), count: getStatusCount(t('receiverMyClaims.filters.all')) }
  ];

  const filteredClaims = claims.filter(claim => {
    if (activeFilter === t('receiverMyClaims.filters.all')) return true;
    if (activeFilter === t('receiverMyClaims.filters.ready')) return claim.surplusPost?.status === 'READY_FOR_PICKUP';
    if (activeFilter === t('receiverMyClaims.filters.completed')) return claim.surplusPost?.status === 'COMPLETED';
    if (activeFilter === t('receiverMyClaims.filters.notCompleted')) return claim.surplusPost?.status === 'NOT_COMPLETED';
    if (activeFilter === t('receiverMyClaims.filters.claimed')) {
      return claim.surplusPost?.status !== 'READY_FOR_PICKUP' && 
             claim.surplusPost?.status !== 'COMPLETED' && 
             claim.surplusPost?.status !== 'NOT_COMPLETED';
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
                      {claim?.confirmedPickupSlot ? (
                        formatPickupTime(
                          claim.confirmedPickupSlot.pickupDate || claim.confirmedPickupSlot.date,
                          claim.confirmedPickupSlot.startTime || claim.confirmedPickupSlot.pickupFrom,
                          claim.confirmedPickupSlot.endTime || claim.confirmedPickupSlot.pickupTo
                        )
                      ) : (
                        formatPickupTime(post?.pickupDate, post?.pickupFrom, post?.pickupTo)
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