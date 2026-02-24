import React from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Package2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Package,
  User,
  Star,
} from 'lucide-react';
import {
  getDietaryTagLabel,
  getPrimaryFoodCategory,
  getFoodImageClass,
  getFoodTypeLabel,
  foodTypeImages,
  getUnitLabel,
  getTemperatureCategoryLabel,
  getTemperatureCategoryIcon,
  getPackagingTypeLabel,
  mapLegacyCategoryToFoodType,
} from '../../constants/foodConstants';

export default function ReceiverDonationCard({
  item,
  t,
  expanded,
  onToggleMore,
  onClaim,
  onBookmark,
  isBookmarked,
  isBookmarking,
  claiming,
  isClaimTarget,
  formatBestBeforeDate,
  formatPickupTime,
  formatPostedTime,
  formatStatus,
  getStatusClass,
  getRecommendationData,
  hoveredRecommended,
  setHoveredRecommended,
}) {
  const rawCategories =
    Array.isArray(item.foodCategories) && item.foodCategories.length > 0
      ? item.foodCategories
      : item.foodType
        ? [item.foodType]
        : [];
  const categoryDisplays =
    rawCategories.length > 0
      ? rawCategories.map(category => {
          const normalizedCategory = mapLegacyCategoryToFoodType(category);
          return t(
            `surplusForm.foodTypeValues.${normalizedCategory}`,
            getFoodTypeLabel(category)
          );
        })
      : ['Other'];
  const primaryFoodCategory = getPrimaryFoodCategory(item.foodCategories);
  const dietaryTags = Array.isArray(item.dietaryTags) ? item.dietaryTags : [];
  const visibleDietaryTags = dietaryTags.slice(0, 4);
  const hiddenDietaryCount = Math.max(dietaryTags.length - 4, 0);
  const recommendation = getRecommendationData
    ? getRecommendationData(item)
    : null;

  return (
    <div className={`receiver-donation-card ${expanded ? 'expanded' : ''}`}>
      {recommendation && (
        <div
          className="recommended-badge"
          onMouseEnter={() => setHoveredRecommended(item.id)}
          onMouseLeave={() => setHoveredRecommended(null)}
        >
          <Star size={14} fill="#ffffff" color="#ffffff" />

          {hoveredRecommended === item.id && (
            <div className="recommendation-tooltip">
              <div className="tooltip-header">
                <span className="match-label">Match Score</span>
                <span className="match-score">{recommendation.score}%</span>
              </div>
              <div className="tooltip-reasons">
                {recommendation.reasons.map((reason, index) => (
                  <div key={index} className="reason-item">
                    <span className="reason-check">✓</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`receiver-donation-image ${getFoodImageClass(primaryFoodCategory)}`}
      >
        <img
          src={
            foodTypeImages[primaryFoodCategory] ||
            foodTypeImages['Prepared Meals']
          }
          alt={primaryFoodCategory || 'Food donation'}
          className="receiver-food-type-image"
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.classList.add('food-image-default');
          }}
        />
      </div>

      <div className="receiver-donation-content">
        <div className="receiver-donation-header">
          <h3 className="receiver-donation-title">{item.title}</h3>
          <div className="receiver-header-actions">
            <button
              className="receiver-bookmark-button"
              onClick={e => onBookmark(item, e)}
              aria-label="Bookmark"
              disabled={isBookmarking}
            >
              <Bookmark
                size={16}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  color: isBookmarked ? '#1B4965' : '#90A1B9',
                  fill: isBookmarked ? '#1B4965' : 'transparent',
                }}
              />
            </button>
            <span
              className={`receiver-status-badge ${getStatusClass(item.status)}`}
            >
              <span className="receiver-status-icon">✓</span>
              {formatStatus(item.status)}
            </span>
            {item.expiringSoon && (
              <span className="receiver-expiring-soon-badge">
                {t('receiverBrowse.expiringSoon', 'Expiring soon')}
              </span>
            )}
            {!item.expiryDateActual &&
              item.expiryDatePredicted &&
              !item.expiryOverridden && (
                <span className="receiver-predicted-badge">
                  {t('receiverBrowse.predicted', 'predicted')}
                </span>
              )}
          </div>
        </div>

        <div className="receiver-donation-info">
          <div className="receiver-info-item">
            <Calendar size={16} className="receiver-info-icon-expiry-icon" />
            <span>
              {t('receiverBrowse.expires')}:{' '}
              {formatBestBeforeDate(
                item.expiryDateEffective || item.expiryDate
              )}
            </span>
          </div>
          <div className="receiver-info-item">
            <MapPin size={16} className="receiver-info-icon-location-icon" />
            <span>
              {item.pickupLocation?.address ||
                t('receiverBrowse.locationNotSpecified')}
            </span>
          </div>
          <div className="receiver-info-item">
            <Clock size={16} className="receiver-info-icon-time-icon" />
            {item.pickupSlots && item.pickupSlots.length > 0 ? (
              <div className="pickup-slots-list">
                {item.pickupSlots.map((slot, idx) => (
                  <div key={idx} className="pickup-slot-time">
                    {formatPickupTime(
                      slot.pickupDate || slot.date,
                      slot.startTime || slot.pickupFrom,
                      slot.endTime || slot.pickupTo
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span>
                {formatPickupTime(
                  item.pickupDate,
                  item.pickupFrom,
                  item.pickupTo
                )}
              </span>
            )}
          </div>
        </div>

        <div className="receiver-donation-meta">
          {dietaryTags.length > 0 && (
            <div className="receiver-dietary-tags">
              {visibleDietaryTags.map(tag => (
                <span
                  key={`${item.id}-${tag}`}
                  className="receiver-dietary-tag"
                >
                  {t(
                    `surplusForm.dietaryTagValues.${tag}`,
                    getDietaryTagLabel(tag)
                  )}
                </span>
              ))}
              {hiddenDietaryCount > 0 && (
                <span className="receiver-dietary-tag overflow">
                  +{hiddenDietaryCount}
                </span>
              )}
            </div>
          )}
          <div className="receiver-category-tags">
            {categoryDisplays.map((category, index) => (
              <span key={index} className="receiver-category-tag">
                {category}
              </span>
            ))}
          </div>
          <div className="receiver-donor-info">
            <User size={16} />
            <span>
              {t('receiverBrowse.donatedBy', {
                donorName: item.donorName || t('receiverBrowse.localBusiness'),
              })}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="receiver-donation-details">
            <div className="receiver-details-grid">
              <div className="receiver-details-section">
                <div className="receiver-detail-item">
                  <span className="receiver-detail-label">
                    {t('receiverBrowse.quantity')}
                  </span>
                  <div className="receiver-detail-value">
                    <span className="receiver-quantity-icon-detail">
                      <Package2 size={14} />
                    </span>
                    {item.quantity?.value || 0}{' '}
                    {getUnitLabel(item.quantity?.unit) ||
                      t('receiverBrowse.items')}
                  </div>
                </div>
                <div className="receiver-detail-item">
                  <span className="receiver-detail-label">
                    {t('receiverBrowse.pickupTime')}
                    {item.pickupSlots && item.pickupSlots.length > 1 ? 's' : ''}
                  </span>
                  <div className="receiver-detail-value">
                    <span className="receiver-time-icon-detail">
                      <Clock size={14} />
                    </span>
                    {item.pickupSlots && item.pickupSlots.length > 0 ? (
                      <div className="pickup-slots-list">
                        {item.pickupSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="pickup-slot-time"
                            style={{ color: '#314158' }}
                          >
                            {formatPickupTime(
                              slot.pickupDate || slot.date,
                              slot.startTime || slot.pickupFrom,
                              slot.endTime || slot.pickupTo
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#314158' }}>
                        {formatPickupTime(
                          item.pickupDate,
                          item.pickupFrom,
                          item.pickupTo
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="receiver-details-section">
                <div className="receiver-detail-item">
                  <span className="receiver-detail-label">
                    {t('receiverBrowse.expires')}
                  </span>
                  <div className="receiver-detail-value">
                    <span className="receiver-expiry-icon-detail">
                      <Calendar size={14} />
                    </span>
                    {formatBestBeforeDate(
                      item.expiryDateEffective || item.expiryDate
                    )}
                  </div>
                </div>
                <div className="receiver-detail-item">
                  <span className="receiver-detail-label">
                    {t('common.location', 'Location')}
                  </span>
                  <div className="receiver-detail-value">
                    <span className="receiver-location-icon-detail">
                      <MapPin size={14} />
                    </span>
                    {item.pickupLocation?.address ||
                      t('receiverBrowse.locationNotSpecified')}
                  </div>
                </div>
              </div>
            </div>

            {(item.temperatureCategory || item.packagingType) && (
              <div className="receiver-details-grid">
                <div className="receiver-details-section">
                  {item.temperatureCategory && (
                    <div className="receiver-detail-item">
                      <span className="receiver-detail-label">
                        {t('surplusForm.temperatureCategoryLabel')}
                      </span>
                      <div className="receiver-detail-value">
                        <span className="receiver-compliance-icon-bg">
                          {getTemperatureCategoryIcon(item.temperatureCategory)}
                        </span>
                        {t(
                          `surplusForm.temperatureCategoryValues.${item.temperatureCategory}`,
                          getTemperatureCategoryLabel(item.temperatureCategory)
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="receiver-details-section">
                  {item.packagingType && (
                    <div className="receiver-detail-item">
                      <span className="receiver-detail-label">
                        {t('surplusForm.packagingTypeLabel')}
                      </span>
                      <div className="receiver-detail-value">
                        <span className="receiver-compliance-icon-bg">
                          <Package size={14} />
                        </span>
                        {t(
                          `surplusForm.packagingTypeValues.${item.packagingType}`,
                          getPackagingTypeLabel(item.packagingType)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {item.description && (
              <div className="receiver-donor-note">
                <div className="receiver-note-label">
                  {t('receiverBrowse.donorsNote')}
                </div>
                <div className="receiver-note-content">{item.description}</div>
              </div>
            )}

            {item.createdAt && (
              <div className="receiver-posted-time">
                {t('receiverBrowse.posted')} {formatPostedTime(item.createdAt)}
              </div>
            )}
          </div>
        )}

        <div className="receiver-donation-actions">
          <button
            onClick={() => onClaim(item)}
            className="receiver-claim-button"
            disabled={claiming}
          >
            {claiming && isClaimTarget
              ? t('receiverBrowse.claiming')
              : t('receiverBrowse.claimDonation')}
          </button>
          <button
            onClick={() => onToggleMore(item)}
            className={`receiver-more-button ${expanded ? 'expanded' : ''}`}
          >
            {expanded ? t('receiverBrowse.less') : t('receiverBrowse.more')}
            {expanded ? (
              <ChevronUp size={14} className="receiver-dropdown-icon" />
            ) : (
              <ChevronDown size={14} className="receiver-dropdown-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
