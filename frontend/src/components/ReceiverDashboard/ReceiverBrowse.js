import React, { useEffect, useState, useRef } from 'react';
import { Calendar, MapPin, Clock, Package2, Bookmark, ChevronDown, ChevronUp, User, Navigation } from 'lucide-react';
import { surplusAPI } from '../../services/api';
import BakeryPastryImage from '../../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../../assets/foodtypes/PreparedFood.jpg';
import "./ReceiverBrowse.css";

const mockData = [
  {
    id: 1,
    foodName: "Fresh Organic Apples",
    foodType: "Fruits & Vegetables",
    expiryDate: "2025-11-08",
    location: "Downtown Montreal",
    pickupFrom: "2025-11-06T14:00:00",
    pickupTo: "17:00:00",
    quantity: 5,
    unit: "kg",
    donorName: "Green Organic Market",
    donorNote: "Crisp and sweet! Delicious apples, perfect for snacking or baking. Freshly picked this week from local orchard.",
    createdAt: "2025-11-04T10:00:00"
  },
  {
    id: 2,
    foodName: "Artisan Bread Assortment",
    foodType: "Bakery & Pastry",
    expiryDate: "2025-11-05",
    location: "Plateau Mont-Royal",
    pickupFrom: "2025-11-05T08:00:00",
    pickupTo: "12:00:00",
    quantity: 10,
    unit: "items",
    donorName: "Le Petit Boulanger",
    donorNote: "Freshly baked this morning. Includes sourdough, baguettes, and whole wheat bread.",
    createdAt: "2025-11-04T16:30:00"
  },
  {
    id: 3,
    foodName: "Canned Goods Variety Pack",
    foodType: "Packaged / Pantry Items",
    expiryDate: "2026-03-15",
    location: "Ville-Marie",
    pickupFrom: "2025-11-07T09:00:00",
    pickupTo: "18:00:00",
    quantity: 25,
    unit: "items",
    donorName: "Metro Supermarket",
    donorNote: "Assorted canned vegetables, beans, and soups. Perfect for food drives.",
    createdAt: "2025-11-04T14:15:00"
  },
  {
    id: 4,
    foodName: "Fresh Milk & Yogurt",
    foodType: "Dairy & Cold Items",
    expiryDate: "2025-11-12",
    location: "Griffintown",
    pickupFrom: "2025-11-06T10:00:00",
    pickupTo: "16:00:00",
    quantity: 15,
    unit: "liters",
    donorName: "Dairy Delight",
    donorNote: "Fresh dairy products from local farms. Requires refrigeration.",
    createdAt: "2025-11-04T08:45:00"
  },
  {
    id: 5,
    foodName: "Frozen Vegetables Mix",
    foodType: "Frozen Food",
    expiryDate: "2026-01-20",
    location: "Hochelaga",
    pickupFrom: "2025-11-07T13:00:00",
    pickupTo: "17:00:00",
    quantity: 8,
    unit: "boxes",
    donorName: "IGA Marché",
    donorNote: "Mixed frozen vegetables - corn, peas, carrots, and green beans. Great for soups and stir-fries.",
    createdAt: "2025-11-03T20:20:00"
  },
  {
    id: 6,
    foodName: "Homemade Lasagna Trays",
    foodType: "Prepared Meals",
    expiryDate: "2025-11-09",
    location: "Little Italy",
    pickupFrom: "2025-11-06T11:00:00",
    pickupTo: "19:00:00",
    quantity: 12,
    unit: "items",
    donorName: "Mama Rosa's Kitchen",
    donorNote: "Freshly prepared lasagna with meat sauce and cheese. Just heat and serve!",
    createdAt: "2025-11-04T12:00:00"
  }
];
export default function ReceiverBrowse() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const pollingRef = useRef(null);

  const fetchDonations = async () => {
    try {
      setItems(mockData);
      // const { data } = await surplusAPI.list(); //UNCOMMENT WHEN BACKEND IS READY
      // setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError('Failed to load available donations');
      console.error('fetchDonations error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    pollingRef.current = setInterval(fetchDonations, 8000);
    return () => pollingRef.current && clearInterval(pollingRef.current);
  }, []);

  const handleMoreClick = (item) => {
    if (expandedCardId === item.id) {
      setExpandedCardId(null);
    } else {
      // Expand the card
      setExpandedCardId(item.id);
    }
  };

  const handleClaimDonation = (item) => {// Next Sprint
    console.log('Claiming donation:', item);
  };

  const handleBookmark = (item, e) => {// Next Sprint
    e.stopPropagation();
    console.log('Bookmarking:', item);
  };

  // Function to get the appropriate image based on the food type
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

  // Function to get CSS class for image container
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

  // function to format the time
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
      {loading && (
        <div className="loading-message">
          Explore Available Donations
        </div>
      )}

      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p>No donations available right now.</p>
          <p>Check back soon for new surplus food!</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="donations-list">
          {items.map((item) => (
            <div
              key={item.id || `${item.foodName}-${Math.random()}`}
              className={`donation-card ${expandedCardId === item.id ? 'expanded' : ''}`}
            >
              <div className={`donation-image ${getFoodImageClass(item.foodType)}`}>
                <img
                  src={getFoodTypeImage(item.foodType)}
                  alt={item.foodType || "Food donation"}
                  className="food-type-image"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('food-image-default');
                  }}
                />
              </div>

              {/* Content */}
              <div className="donation-content">
                {/* Title and status */}
                <div className="donation-header">
                  <h3 className="donation-title">
                    {item.foodName}
                  </h3>
                  <div className="header-actions">
                    <button
                      className="bookmark-button"
                      onClick={(e) => handleBookmark(item, e)}
                      aria-label="Bookmark"
                    >
                      <Bookmark size={16} style={{ display: 'block', margin: '0 auto', color: '#90A1B9' }} />
                    </button>
                    <span className="status-badge">
                      <span className="status-icon">✓</span>
                      Available
                    </span>
                  </div>
                </div>

                {/* Info row */}
                <div className="donation-info">
                  <div className="info-item">
                    <Calendar size={16} className="info-icon expiry-icon" />
                    <span>Expires: {formatExpiryDate(item.expiryDate)}</span>
                  </div>
                  <div className="info-item">
                    <MapPin size={16} className="info-icon location-icon" />
                    <span>{item.location}</span>
                  </div>
                  <div className="info-item">
                    <Clock size={16} className="info-icon time-icon" />
                    <span>{formatPickupTime(item.pickupFrom, item.pickupTo)}</span>
                  </div>
                </div>

                {/* Category tag and donator */}
                <div className="donation-meta">
                  <span className="category-tag">
                    {item.foodType}
                  </span>
                  <div className="donor-info">
                    <User size={16} />
                    <span>Donated by {item.donorName || 'Local Business'}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCardId === item.id && (
                  <div className="donation-details">
                    <div className="details-grid">
                      <div className="details-section">
                        <div className="detail-item">
                          <span className="detail-label">Quantity</span>
                          <div className="detail-value">
                            <Package2 size={14} className="quantity-icon-detail" style={{ display: 'inline', marginRight: '8px' }} />
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Pickup Time</span>
                          <div className="detail-value">
                            <Clock size={14} className="time-icon-detail" style={{ display: 'inline', marginRight: '8px' }}/>
                            {formatPickupTime(item.pickupFrom, item.pickupTo)}
                          </div>
                        </div>
                      </div>

                      <div className="details-section">
                        <div className="detail-item">
                          <span className="detail-label">Expires</span>
                          <div className="detail-value">
                            <Calendar size={14} className="expiry-icon-detail" style={{ display: 'inline', marginRight: '8px' }} />
                            {formatExpiryDate(item.expiryDate)}
                          </div>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location</span>
                          <div className="detail-value">
                            <MapPin size={14} className='location-icon-detail' style={{ display: 'inline', marginRight: '8px' }} />
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Donor's Note */}
                    {(item.donorNote || item.description) && (
                      <div className="donor-note">
                        <div className="note-label">Donor's Note</div>
                        <div className="note-content">
                          {item.donorNote}
                        </div>
                      </div>
                    )}

                    {/* Posted Time */}
                    {item.createdAt && (
                      <div className="posted-time">
                        Posted {formatPostedTime(item.createdAt)}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="donation-actions">
                  <button
                    onClick={() => handleClaimDonation(item)}
                    className="claim-button"
                  >
                    Claim Donation
                  </button>
                  <button
                    onClick={() => handleMoreClick(item)}
                    className={`more-button ${expandedCardId === item.id ? 'expanded' : ''}`}
                  >
                    {expandedCardId === item.id ? 'Less' : 'More'}
                    {expandedCardId === item.id
                      ? <ChevronUp size={14} className="dropdown-icon" />
                      : <ChevronDown size={14} className="dropdown-icon" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh button */}
      {!loading && (
        <div className="refresh-container">
          <button
            onClick={fetchDonations}
            className="refresh-button"
          >
            Refresh Donations
          </button>
        </div>
      )}
    </div>
  );
}