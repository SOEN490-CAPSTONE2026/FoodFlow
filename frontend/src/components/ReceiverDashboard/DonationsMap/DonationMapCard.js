import React from 'react';
import { MapPin, Package, Calendar } from 'lucide-react';
import {
  getPrimaryFoodCategory,
  getFoodImageClass,
} from '../../../constants/foodConstants';
import './DonationMapCard.css';

/**
 * Compact donation card displayed in map info windows.
 *
 * @param {Object} props
 * @param {Object} props.donation - Donation object
 * @param {Object} props.userLocation - User's location for distance calculation
 * @param {Function} props.onClaimClick - Callback when claim button clicked
 */
const DonationMapCard = ({ donation, userLocation, onClaimClick }) => {
  // Calculate distance
  const calculateDistance = () => {
    if (!userLocation || !donation.pickupLocation) {
      return null;
    }

    const R = 6371; // Earth's radius in km
    const dLat = toRad(
      donation.pickupLocation.latitude - userLocation.latitude
    );
    const dLon = toRad(
      donation.pickupLocation.longitude - userLocation.longitude
    );

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.latitude)) *
        Math.cos(toRad(donation.pickupLocation.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  };

  const toRad = value => {
    return (value * Math.PI) / 180;
  };

  const distance = calculateDistance();

  const formatDate = dateString => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="donation-map-card">
      {/* Content - NO IMAGE */}
      <div className="map-card-content">
        <div className="map-card-header">
          <h4 className="map-card-title">{donation.title}</h4>
          {distance && (
            <span className="distance-badge-inline">
              <MapPin size={12} />
              {distance}
            </span>
          )}
        </div>

        <div className="map-card-details">
          <div className="map-card-detail">
            <Package size={14} />
            <span>
              {donation.quantity?.value} {donation.quantity?.unit}
            </span>
          </div>

          {donation.expiryDate && (
            <div className="map-card-detail">
              <Calendar size={14} />
              <span>Exp: {formatDate(donation.expiryDate)}</span>
            </div>
          )}
        </div>

        {donation.pickupLocation?.address && (
          <div className="map-card-location">
            <MapPin size={14} />
            <span>{donation.pickupLocation.address}</span>
          </div>
        )}

        <button
          className="map-card-claim-btn"
          onClick={() => onClaimClick && onClaimClick(donation)}
        >
          Claim Donation
        </button>
      </div>
    </div>
  );
};

export default DonationMapCard;
