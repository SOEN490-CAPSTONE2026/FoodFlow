import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Package2,
  User,
  Thermometer,
} from 'lucide-react';
import {
  getDietaryTagLabel,
  getPrimaryFoodCategory,
  getFoodTypeLabel,
  getTemperatureCategoryLabel,
  mapLegacyCategoryToFoodType,
  getUnitLabel,
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
const DonationMapCard = ({
  donation,
  userLocation,
  onClaimClick,
  onViewDetailsClick,
  formatBestBeforeDate,
  formatPickupTime,
  formatStatus,
  getStatusClass,
  t,
}) => {
  const translate = t || ((_, fallback) => fallback || '');

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

  const getShortAddress = address => {
    if (!address) {
      return translate(
        'receiverBrowse.locationNotSpecified',
        'Location not specified'
      );
    }

    const trimmed = address.trim();
    if (!trimmed) {
      return translate(
        'receiverBrowse.locationNotSpecified',
        'Location not specified'
      );
    }

    const segments = trimmed
      .split(',')
      .map(segment => segment.trim())
      .filter(Boolean);

    const compact =
      segments.length >= 2 ? segments.slice(0, 2).join(', ') : trimmed;
    return compact.length > 54 ? `${compact.slice(0, 51)}...` : compact;
  };

  const normalizedStatus = (donation?.status || 'AVAILABLE').toUpperCase();
  const isAvailable = normalizedStatus === 'AVAILABLE';

  const quantityValue = donation?.quantity?.value ?? 0;
  const quantityUnit =
    (typeof getUnitLabel === 'function'
      ? getUnitLabel(donation?.quantity?.unit)
      : '') ||
    donation?.quantity?.unit ||
    translate('receiverBrowse.items', 'items');

  const rawCategories =
    Array.isArray(donation?.foodCategories) &&
    donation.foodCategories.length > 0
      ? donation.foodCategories
      : donation?.foodType
        ? [donation.foodType]
        : [];

  const categoryBadges = rawCategories
    .slice(0, 2)
    .map(category => {
      const normalized = mapLegacyCategoryToFoodType(category);
      return translate(
        `surplusForm.foodTypeValues.${normalized}`,
        getFoodTypeLabel(category)
      );
    })
    .filter(Boolean);

  const dietaryBadges = (
    Array.isArray(donation?.dietaryTags) ? donation.dietaryTags : []
  )
    .slice(0, 2)
    .map(tag =>
      translate(`surplusForm.dietaryTagValues.${tag}`, getDietaryTagLabel(tag))
    )
    .filter(Boolean);

  const temperatureBadge = donation?.temperatureCategory
    ? translate(
        `surplusForm.temperatureCategoryValues.${donation.temperatureCategory}`,
        getTemperatureCategoryLabel(donation.temperatureCategory)
      )
    : '';

  const pickupRows =
    Array.isArray(donation?.pickupSlots) && donation.pickupSlots.length > 0
      ? donation.pickupSlots
          .slice(0, 2)
          .map(slot =>
            formatPickupTime
              ? formatPickupTime(
                  slot.pickupDate || slot.date,
                  slot.startTime || slot.pickupFrom,
                  slot.endTime || slot.pickupTo
                )
              : ''
          )
          .filter(Boolean)
      : [
          formatPickupTime
            ? formatPickupTime(
                donation?.pickupDate,
                donation?.pickupFrom,
                donation?.pickupTo
              )
            : '',
        ].filter(Boolean);

  const pickupLabel =
    pickupRows.length > 0
      ? pickupRows.join(' | ')
      : translate('receiverBrowse.pickupNotSpecified', 'Pickup not specified');

  const expiryLabel = formatBestBeforeDate
    ? formatBestBeforeDate(
        donation?.expiryDateEffective || donation?.expiryDate
      )
    : donation?.expiryDate || '—';

  const primaryStatus = formatStatus
    ? formatStatus(donation?.status)
    : donation?.status || 'Available';

  const statusClass = getStatusClass ? getStatusClass(donation?.status) : '';

  const donorName =
    donation?.donorName ||
    translate('receiverBrowse.localBusiness', 'Local donor');
  const shortAddress = getShortAddress(donation?.pickupLocation?.address);

  const fallbackCategory = getPrimaryFoodCategory(donation?.foodCategories);
  if (!categoryBadges.length && fallbackCategory) {
    categoryBadges.push(fallbackCategory);
  }

  const infoItems = [
    {
      key: 'quantity',
      icon: <Package2 size={14} aria-hidden="true" />,
      label: translate('receiverBrowse.quantity', 'Quantity'),
      value: `${quantityValue} ${quantityUnit}`,
    },
    {
      key: 'expiry',
      icon: <Calendar size={14} aria-hidden="true" />,
      label: translate('receiverBrowse.expires', 'Expiry'),
      value: expiryLabel,
      highlight: true,
    },
    {
      key: 'pickup',
      icon: <Clock size={14} aria-hidden="true" />,
      label: translate('receiverBrowse.pickupTime', 'Pickup'),
      value: pickupLabel,
      highlight: true,
    },
    {
      key: 'donor',
      icon: <User size={14} aria-hidden="true" />,
      label: translate('receiverBrowse.donor', 'Donor'),
      value: donorName,
    },
  ];

  return (
    <article className="donation-map-card" aria-label="Donation details">
      <div className="map-card-content">
        <div className="map-card-header">
          <div className="map-card-title-group">
            <h4 className="map-card-title">{donation.title}</h4>
            {distance && (
              <span
                className="distance-badge-inline"
                aria-label={`Distance ${distance}`}
              >
                <MapPin size={12} aria-hidden="true" />
                {distance}
              </span>
            )}
          </div>
        </div>

        <div className="map-card-details-grid">
          {infoItems.map(item => (
            <div
              key={item.key}
              className={`map-card-detail ${item.highlight ? 'is-highlight' : ''}`}
            >
              {item.icon}
              <div className="map-card-detail-copy">
                <span className="map-card-detail-label">{item.label}</span>
                <span className="map-card-detail-value">{item.value}</span>
              </div>
            </div>
          ))}
          <div className="map-card-detail map-card-detail-address">
            <MapPin size={14} aria-hidden="true" />
            <div className="map-card-detail-copy">
              <span className="map-card-detail-label">
                {translate('common.location', 'Address')}
              </span>
              <span
                className="map-card-detail-value"
                title={donation?.pickupLocation?.address || shortAddress}
              >
                {shortAddress}
              </span>
            </div>
          </div>
        </div>

        {(categoryBadges.length > 0 ||
          dietaryBadges.length > 0 ||
          temperatureBadge) && (
          <div className="map-card-tags">
            {categoryBadges.map(badge => (
              <span key={`cat-${badge}`} className="map-card-tag">
                {badge}
              </span>
            ))}
            {dietaryBadges.map(badge => (
              <span
                key={`diet-${badge}`}
                className="map-card-tag map-card-tag-soft"
              >
                {badge}
              </span>
            ))}
            {temperatureBadge && (
              <span className="map-card-tag map-card-tag-temp">
                <Thermometer size={12} />
                {temperatureBadge}
              </span>
            )}
          </div>
        )}

        <div className="map-card-footer">
          <span
            className={`map-card-status ${statusClass || ''}`}
            aria-label={primaryStatus}
          >
            {primaryStatus}
          </span>
          <div className="map-card-actions">
            {onViewDetailsClick && (
              <button
                type="button"
                className="map-card-secondary-btn"
                onClick={() => onViewDetailsClick(donation)}
                aria-label="View full donation details"
              >
                View details
              </button>
            )}
            <button
              type="button"
              className="map-card-claim-btn"
              onClick={() => onClaimClick && onClaimClick(donation)}
              disabled={!isAvailable}
              aria-label={
                isAvailable ? 'Claim donation' : 'Donation unavailable'
              }
            >
              {isAvailable ? 'Claim Donation' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DonationMapCard;
