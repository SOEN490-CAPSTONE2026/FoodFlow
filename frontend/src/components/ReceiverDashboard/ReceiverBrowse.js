import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Calendar, MapPin, Clock, Package2, Bookmark, ChevronDown, ChevronUp, Package, User } from 'lucide-react';
import { surplusAPI } from '../../services/api';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import "./ReceiverBrowse.css";


export default function ReceiverBrowse() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const pollingRef = useRef(null);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await surplusAPI.list();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError('Failed to load available donations');
      console.error('fetchDonations error:', e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDonations();
    pollingRef.current = setInterval(fetchDonations, 8000);
    return () => pollingRef.current && clearInterval(pollingRef.current);
  }, [fetchDonations]);

  const handleMoreClick = useCallback((item) => {
    setExpandedCardId(prev => prev === item.id ? null : item.id);
  }, []);

  const handleClaimDonation = useCallback((item) => {
    console.log('Claiming donation:', item);
  }, []);

  const handleBookmark = useCallback((item, e) => {
    e.stopPropagation();
    setBookmarkedItems(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(item.id)) {
        newBookmarks.delete(item.id);
      } else {
        newBookmarks.add(item.id);
      }
      return newBookmarks;
    });
    console.log('Bookmarking:', item);
  }, []);

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

  const getFoodImageClass = (foodType) => {
    switch (foodType) {
      case 'Bakery & Pastry':
        return 'food-image-bakery';
      case 'Fruits & Vegetables':
        return 'food-image-fruits-veg';
      case 'Packaged / Pantry Items':
        return 'food-image-packaged';
      case 'Dairy & Cold Items':
        return 'food-image-dairy';
      case 'Frozen Food':
        return 'food-image-frozen';
      case 'Prepared Meals':
        return 'food-image-prepared';
      default:
        return 'food-image-packaged';
    }
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formatPickupTime = (pickupFrom, pickupTo) => {
    if (!pickupFrom || !pickupTo) return '—';
    try {
      const fromDate = new Date(pickupFrom);
      const dateStr = fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const fromTime = fromDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const [hours, minutes] = pickupTo.split(':');
      const hour = parseInt(hours);
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const toTime = `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;

      return `${dateStr} ${fromTime}-${toTime}`;
    } catch {
      return '—';
    }
  };

  const formatPostedTime = (dateString) => {
    if (!dateString) return '';

    try {
      const now = new Date();
      const posted = new Date(dateString);
      const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours === 1) return '1 hour ago';
      if (diffInHours < 24) return `${diffInHours} hours ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return '1 day ago';
      return `${diffInDays} days ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="receiver-browse-container">
      <h2 className="receiver-section-title">Explore Available Donations</h2>
      {error && (
        <div role="alert" className="receiver-error-message">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="receiver-empty-state">
          <Package className="receiver-empty-state-icon" size={64} />
          <p>No donations available right now.</p>
          <p>Check back soon for new surplus food!</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="receiver-donations-list">
          {items.map((item) => (
            <div
              key={item.id}
              className={`receiver-donation-card ${expandedCardId === item.id ? 'expanded' : ''}`}
            >
              <div className={`receiver-donation-image ${getFoodImageClass(item.foodType)}`}>
                <img
                  src={getFoodTypeImage(item.foodType)}
                  alt={item.foodType || "Food donation"}
                  className="receiver-food-type-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('food-image-default');
                  }}
                />
              </div>

              <div className="receiver-donation-content">
                <div className="receiver-donation-header">
                  <h3 className="receiver-donation-title">
                    {item.foodName}
                  </h3>
                  <div className="receiver-header-actions">
                    <button
                      className="receiver-bookmark-button"
                      onClick={(e) => handleBookmark(item, e)}
                      aria-label="Bookmark"
                    >
                      <Bookmark
                        size={16}
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          color: bookmarkedItems.has(item.id) ? '#1B4965' : '#90A1B9',
                          fill: bookmarkedItems.has(item.id) ? '#1B4965' : 'transparent'
                        }}
                      />
                    </button>
                    <span className="receiver-status-badge">
                      <span className="receiver-status-icon">✓</span>
                      Available
                    </span>
                  </div>
                </div>

                <div className="receiver-donation-info">
                  <div className="receiver-info-item">
                    <Calendar size={16} className="receiver-info-icon-expiry-icon" />
                    <span>Expires: {formatExpiryDate(item.expiryDate)}</span>
                  </div>
                  <div className="receiver-info-item">
                    <MapPin size={16} className="receiver-info-icon-location-icon" />
                    <span>{item.location}</span>
                  </div>
                  <div className="receiver-info-item">
                    <Clock size={16} className="receiver-info-icon-time-icon" />
                    <span>{formatPickupTime(item.pickupFrom, item.pickupTo)}</span>
                  </div>
                </div>

                <div className="receiver-donation-meta">
                  <span className="receiver-category-tag">
                    {item.foodType}
                  </span>
                  <div className="receiver-donor-info">
                    <User size={16} />
                    <span>Donated by {item.donorName || 'Local Business'}</span>
                  </div>
                </div>

                {expandedCardId === item.id && (
                  <div className="receiver-donation-details">
                    <div className="receiver-details-grid">
                      <div className="receiver-details-section">
                        <div className="receiver-detail-item">
                          <span className="receiver-detail-label">Quantity</span>
                          <div className="receiver-detail-value">
                            <Package2 size={14} className="receiver-quantity-icon-detail" style={{ display: 'inline', marginRight: '8px' }} />
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                        <div className="receiver-detail-item">
                          <span className="receiver-detail-label">Pickup Time</span>
                          <div className="receiver-detail-value">
                            <Clock size={14} className="receiver-time-icon-detail" style={{ display: 'inline', marginRight: '8px' }} />
                            {formatPickupTime(item.pickupFrom, item.pickupTo)}
                          </div>
                        </div>
                      </div>

                      <div className="receiver-details-section">
                        <div className="receiver-detail-item">
                          <span className="receiver-detail-label">Expires</span>
                          <div className="receiver-detail-value">
                            <Calendar size={14} className="receiver-expiry-icon-detail" style={{ display: 'inline', marginRight: '8px' }} />
                            {formatExpiryDate(item.expiryDate)}
                          </div>
                        </div>
                        <div className="receiver-detail-item">
                          <span className="receiver-detail-label">Location</span>
                          <div className="receiver-detail-value">
                            <MapPin size={14} className='receiver-location-icon-detail' style={{ display: 'inline', marginRight: '8px' }} />
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(item.notes || item.description) && (
                      <div className="receiver-donor-note">
                        <div className="receiver-note-label">Donor's Note</div>
                        <div className="receiver-note-content">
                          {item.notes}
                        </div>
                      </div>
                    )}

                    {item.createdAt && (
                      <div className="receiver-posted-time">
                        Posted {formatPostedTime(item.createdAt)}
                      </div>
                    )}
                  </div>
                )}

                <div className="receiver-donation-actions">
                  <button
                    onClick={() => handleClaimDonation(item)}
                    className="receiver-claim-button"
                  >
                    Claim Donation
                  </button>
                  <button
                    onClick={() => handleMoreClick(item)}
                    className={`receiver-more-button ${expandedCardId === item.id ? 'expanded' : ''}`}
                  >
                    {expandedCardId === item.id ? 'Less' : 'More'}
                    {expandedCardId === item.id
                      ? <ChevronUp size={14} className="receiver-dropdown-icon" />
                      : <ChevronDown size={14} className="receiver-dropdown-icon" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}