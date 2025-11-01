import React, { useState, useEffect } from 'react';
import { Package, MapPin, User, ArrowRight, Filter, Clock } from 'lucide-react';
import Select from 'react-select';
import { claimsAPI } from '../../services/api';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';

import ClaimDetailModal from './ClaimDetailModal.js';
import "./Receiver_Styles/ReceiverMyClaims.css";

export default function ReceiverMyClaims() {
  const [claims, setClaims] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ value: 'date', label: 'Sort by Date' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'status', label: 'Sort by Status' }
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
      setError('Failed to load your claimed donations');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this claim?')) {
      return;
    }

    try {
      await claimsAPI.cancel(claimId);
      alert('Claim cancelled successfully');
      fetchMyClaims(); // Refresh list
    } catch (error) {
      console.error('Error cancelling claim:', error);
      alert('Failed to cancel claim');
    }
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

  const getFoodTypeImage = (foodType) => {
    switch (foodType) {
      case 'Bakery & Pastry':
        return BakeryPastryImage;
      case 'Fruits & Vegetables':
        return FruitsVeggiesImage;
      case 'Packaged / Pantry Items':
        return PackagedPantryImage;
      case 'Dairy & Cold Items':
        return DairyColdImage;
      case 'Frozen Food':
        return FrozenFoodImage;
      case 'Prepared Meals':
        return PreparedMealsImage;
      default:
        return PreparedMealsImage;
    }
  };

  // Map claim status to display status
  const getDisplayStatus = (claim) => {
    const postStatus = claim.surplusPost?.status;
    if (postStatus === 'READY_FOR_PICKUP') return 'Ready for Pickup';
    if (postStatus === 'COMPLETED') return 'Completed';
    return 'Claimed';
  };

  const getStatusCount = (status) => {
    if (status === 'All') return claims.length;
    if (status === 'Ready') {
      return claims.filter(c => c.surplusPost?.status === 'READY_FOR_PICKUP').length;
    }
    if (status === 'Completed') {
      return claims.filter(c => c.surplusPost?.status === 'COMPLETED').length;
    }
    if (status === 'Claimed') {
      return claims.filter(c => c.surplusPost?.status !== 'READY_FOR_PICKUP' && c.surplusPost?.status !== 'COMPLETED').length;
    }
    return 0;
  };

  const filters = [
    { name: 'All', count: getStatusCount('All') },
    { name: 'Claimed', count: getStatusCount('Claimed') },
    { name: 'Ready', count: getStatusCount('Ready') },
    { name: 'Completed', count: getStatusCount('Completed') }
  ];

  const filteredClaims = claims.filter(claim => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Ready') return claim.surplusPost?.status === 'READY_FOR_PICKUP';
    if (activeFilter === 'Completed') return claim.surplusPost?.status === 'COMPLETED';
    if (activeFilter === 'Claimed') {
      return claim.surplusPost?.status !== 'READY_FOR_PICKUP' && claim.surplusPost?.status !== 'COMPLETED';
    }
    return true;
  });

  // Sort claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy.value === 'date') {
      return new Date(b.claimedAt) - new Date(a.claimedAt);
    }
    if (sortBy.value === 'status') {
      return getDisplayStatus(a).localeCompare(getDisplayStatus(b));
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
      <h1>My Claimed Donations</h1>
      <p className="claimed-page claimed-subtitle">Track your donations and get ready for pickup — every claim helps reduce waste and feed our community.</p>

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
          
          return (
            <div key={claim.id} className="claimed-page donation-card">
              {/* Image */}
              <div className="claimed-page card-image">
                <img
                  src={getFoodTypeImage(post?.foodType || 'Prepared Meals')}
                  alt={post?.title || 'Donation'}
                />
                <span className={`claimed-page status-badge status-${displayStatus.toLowerCase().replace(' ', '-')}`}>
                  {displayStatus}
                </span>
              </div>

              {/* Content */}
              <div className="claimed-page card-content">
                <h3 className="claimed-page card-title">{post?.title || 'Untitled Donation'}</h3>

                <div className="claimed-page card-details">
                  <div className="claimed-page detail-item">
                    <Package size={16} className="claimed-page quantity-detail-icon" />
                    <span>{post?.quantity?.value || 0} {post?.quantity?.unit || 'items'}</span>
                  </div>
                  <div className="claimed-page detail-item">
                    <User size={16} className="claimed-page donor-detail-icon" />
                    <span>{post?.donorEmail || 'Not specified'}</span>
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
                  <button 
                    onClick={() => handleCancelClaim(claim.id)}
                    className="claimed-page cancel-claim-btn"
                  >
                    Cancel Claim
                  </button>
                  
                  <div className="claimed-page view-details-container" onClick={() => handleViewDetails(claim)}>
                    <span>View details</span>
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
            {activeFilter === 'All' 
              ? "You haven't claimed any donations yet. Browse available donations to make your first claim!"
              : `No donations found for the "${activeFilter}" filter.`}
          </p>
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
