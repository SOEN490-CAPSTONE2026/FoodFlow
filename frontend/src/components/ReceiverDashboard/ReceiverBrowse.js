import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Target,
  ArrowUpDown,
  Star,
} from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  surplusAPI,
  recommendationAPI,
  conversationAPI,
  savedDonationAPI,
} from '../../services/api';
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
import { useTimezone } from '../../contexts/TimezoneContext';
import FiltersPanel from './FiltersPanel';
import MapViewBanner from './DonationsMap/MapViewBanner';
import MapViewModal from './DonationsMap/MapViewModal';
import './ReceiverBrowseModal.css';
import './ReceiverBrowse.css';

const libraries = ['places'];

export default function ReceiverBrowse() {
  const { t } = useTranslation();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const { userTimezone } = useTimezone();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: '',
    locationCoords: null,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: '',
    locationCoords: null,
  });

  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [bookmarkingItemIds, setBookmarkingItemIds] = useState(new Set());
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [hoveredRecommended, setHoveredRecommended] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [mapViewOpen, setMapViewOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [expressingInterest, setExpressingInterest] = useState(null);
  const [focusedDonationId, setFocusedDonationId] = useState(null);
  const [savedNotification, setSavedNotification] = useState('');

  const getRecommendationData = item => {
    // Mock logic to determine if item is recommended
    return recommendations[item.id.toString()] || null;
  };

  const fetchRecommendations = useCallback(async items => {
    const postIds = items.map(item => item.id).filter(id => id > 0);
    const recommendationData = await recommendationAPI.getTopRecommendations(
      postIds,
      80
    );
    setRecommendations(recommendationData);
  }, []);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await surplusAPI.list();
      const availableItems = Array.isArray(data) ? data : [];

      // Add mock data for testing recommended tags

      // Combine mock data with real data
      setItems([...availableItems]);
      setError(null);
    } catch (e) {
      console.error('Error fetching donations:', e);
      setError(t('receiverBrowse.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchSavedDonations = useCallback(async () => {
    try {
      const response = await savedDonationAPI.getSavedDonations();
      const savedDonations = Array.isArray(response.data) ? response.data : [];
      const availableSavedDonations = savedDonations.filter(
        donation => donation?.status === 'AVAILABLE'
      );
      setBookmarkedItems(
        new Set(availableSavedDonations.map(donation => donation.id))
      );
    } catch (e) {
      console.error('Error fetching saved donations:', e);
    }
  }, []);

  const fetchFilteredDonations = useCallback(
    async filterCriteria => {
      setLoading(true);
      try {
        const hasActiveFilters =
          (filterCriteria.foodType && filterCriteria.foodType.length > 0) ||
          filterCriteria.expiryBefore ||
          (filterCriteria.locationCoords && filterCriteria.distance);

        let data;
        if (hasActiveFilters) {
          const response = await surplusAPI.search(filterCriteria);
          data = response.data;
        } else {
          const response = await surplusAPI.list();
          data = response.data;
        }

        setItems(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        setError(t('receiverBrowse.failedToLoadFiltered'));
        console.error('Error fetching filtered donations:', e);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchDonations();
    fetchSavedDonations();
  }, [fetchDonations, fetchSavedDonations, userTimezone]);

  useEffect(() => {
    if (items.length > 0) {
      fetchRecommendations(items);
    }
  }, [items, fetchRecommendations]);

  useEffect(() => {
    if (!savedNotification) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSavedNotification('');
    }, 2200);

    return () => clearTimeout(timer);
  }, [savedNotification]);

  useEffect(() => {
    const targetId = location.state?.focusDonationId;
    if (!targetId || !items.length) {
      return;
    }

    const normalizedTargetId = Number(targetId);
    const targetItem = items.find(
      item => Number(item.id) === normalizedTargetId
    );

    if (!targetItem) {
      if (location.state?.fallbackToClaims) {
        navigate('/receiver/my-claims', {
          state: {
            focusDonationId: normalizedTargetId,
            fromBrowseFallback: true,
          },
        });
        return;
      }
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    setExpandedCardId(normalizedTargetId);
    setFocusedDonationId(normalizedTargetId);

    const targetCard = document.getElementById(
      `receiver-browse-card-${normalizedTargetId}`
    );
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const clearHighlightTimer = setTimeout(() => {
      setFocusedDonationId(null);
    }, 2200);

    navigate(location.pathname, { replace: true, state: {} });

    return () => clearTimeout(clearHighlightTimer);
  }, [items, location.pathname, location.state, navigate]);

  const handleFiltersChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  }, []);

  const handleApplyFilters = useCallback(async () => {
    setAppliedFilters({ ...filters });
    await fetchFilteredDonations(filters);
  }, [filters, fetchFilteredDonations]);

  const handleClearFilters = useCallback(async () => {
    const clearedFilters = {
      foodType: [],
      expiryBefore: null,
      distance: 10,
      location: '',
      locationCoords: null,
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    await fetchDonations();
  }, [fetchDonations]);

  const handleCloseFilters = useCallback(() => {
    setIsFiltersVisible(false);
  }, []);

  const handleMoreClick = useCallback(item => {
    setExpandedCardId(prev => (prev === item.id ? null : item.id));
  }, []);

  const handleBookmark = useCallback(
    async (item, e) => {
      e.stopPropagation();
      const isSaved = bookmarkedItems.has(item.id);

      setBookmarkedItems(prev => {
        const next = new Set(prev);
        if (isSaved) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });

      setBookmarkingItemIds(prev => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });

      try {
        if (isSaved) {
          await savedDonationAPI.unsave(item.id);
          window.dispatchEvent(new Event('saved-donations-updated'));
        } else {
          await savedDonationAPI.save(item.id);
          window.dispatchEvent(new Event('saved-donations-updated'));
          setSavedNotification(
            t('receiverBrowse.addedToSaved', 'Added to saved donations')
          );
        }
      } catch (error) {
        setBookmarkedItems(prev => {
          const next = new Set(prev);
          if (isSaved) {
            next.add(item.id);
          } else {
            next.delete(item.id);
          }
          return next;
        });
        console.error('Error updating saved donation:', error);
        alert(
          error.response?.data?.message ||
            t(
              'receiverBrowse.failedToUpdateSaved',
              'Failed to update saved donation'
            )
        );
      } finally {
        setBookmarkingItemIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [bookmarkedItems, t]
  );

  const confirmClaim = useCallback(
    async (item, slot) => {
      setClaiming(true);
      try {
        await surplusAPI.claim(item.id, slot);
        setItems(prev => prev.filter(post => post.id !== item.id));
        setClaimModalOpen(false);
        setClaimTargetItem(null);
      } catch (error) {
        console.error('Error claiming post:', error);
        alert(
          error.response?.data?.message || t('receiverBrowse.failedToClaim')
        );
      } finally {
        setClaiming(false);
      }
    },
    [t]
  );

  //======================================
  // Donations Map Helpers
  //======================================
  const getNearbyCount = useCallback(() => {
    if (!filters.locationCoords) {
      return items.length;
    }

    return items.filter(item => {
      if (!item.pickupLocation) {
        return false;
      }

      const distance = calculateDistance(
        filters.locationCoords.lat,
        filters.locationCoords.lng,
        item.pickupLocation.latitude,
        item.pickupLocation.longitude
      );

      return distance <= (filters.distance || 10);
    }).length;
  }, [items, filters]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  //=================================================
  //=================================================

  const handleClaimDonation = useCallback(
    item => {
      if (
        item.pickupSlots &&
        Array.isArray(item.pickupSlots) &&
        item.pickupSlots.length > 0
      ) {
        setClaimTargetItem(item);
        setSelectedSlotIndex(0);
        setClaimModalOpen(true);
        return;
      }

      if (!window.confirm(t('receiverBrowse.confirmClaim'))) {
        return;
      }

      const legacySlot =
        item.pickupDate && item.pickupFrom && item.pickupTo
          ? {
              pickupDate: item.pickupDate,
              startTime: item.pickupFrom,
              endTime: item.pickupTo,
            }
          : null;

      confirmClaim(item, legacySlot);
    },
    [confirmClaim, t]
  );

  const handleExpressInterest = useCallback(
    async item => {
      try {
        setExpressingInterest(item.id);
        const response = await conversationAPI.expressInterest(item.id);
        const conversation = response.data;
        navigate(`/receiver/messages?conversationId=${conversation.id}`);
      } catch (err) {
        console.error('Error expressing interest:', err);
        alert(
          t(
            'receiverBrowse.failedToExpressInterest',
            "Couldn't start conversation. Please try again."
          )
        );
      } finally {
        setExpressingInterest(null);
      }
    },
    [navigate, t]
  );

  const formatExpiryDate = useCallback(dateString => {
    if (!dateString) {
      return '—';
    }
    try {
      // Parse as local date to avoid timezone conversion issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }, []);

  const formatBestBeforeDate = useCallback(dateValue => {
    if (!dateValue) {
      return '—';
    }
    try {
      const date = new Date(dateValue);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }, []);

  const formatPickupTime = useCallback((pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) {
      return '—';
    }
    try {
      const fromDate = new Date(`${pickupDate}T${pickupFrom}`);
      const dateStr = fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const fromTime = fromDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const [hours, minutes] = pickupTo.split(':');
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const toTime = `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
      return `${dateStr} ${fromTime}-${toTime}`;
    } catch {
      return '—';
    }
  }, []);

  const formatPostedTime = useCallback(
    dateString => {
      if (!dateString) {
        return '';
      }
      try {
        const now = new Date();
        const posted = new Date(dateString);
        const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
        if (diffInHours < 1) {
          return t('receiverBrowse.justNow');
        }
        if (diffInHours === 1) {
          return t('receiverBrowse.hourAgo');
        }
        if (diffInHours < 24) {
          return t('receiverBrowse.hoursAgo', { hours: diffInHours });
        }
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
          return t('receiverBrowse.dayAgo');
        }
        return t('receiverBrowse.daysAgo', { days: diffInDays });
      } catch {
        return '';
      }
    },
    [t]
  );

  const formatStatus = useCallback(
    status => {
      switch (status) {
        case 'AVAILABLE':
          return t('receiverBrowse.status.available');
        case 'READY_FOR_PICKUP':
          return t('receiverBrowse.status.readyForPickup');
        case 'CLAIMED':
          return t('receiverBrowse.status.claimed');
        case 'COMPLETED':
          return t('receiverBrowse.status.completed');
        case 'NOT_COMPLETED':
          return t('receiverBrowse.status.notCompleted');
        case 'EXPIRED':
          return t('receiverBrowse.status.expired');
        default:
          return status || t('receiverBrowse.status.available');
      }
    },
    [t]
  );

  const getStatusClass = useCallback(status => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'READY_FOR_PICKUP':
        return 'status-ready';
      case 'CLAIMED':
        return 'status-claimed';
      case 'COMPLETED':
        return 'status-completed';
      case 'NOT_COMPLETED':
        return 'status-not-completed';
      case 'EXPIRED':
        return 'status-expired';
      default:
        return 'status-available';
    }
  }, []);

  return (
    <div className="receiver-browse-container">
      {savedNotification && (
        <div role="alert" className="receiver-saved-notification">
          {savedNotification}
        </div>
      )}

      <div className="receiver-browse-header">
        <h1 className="receiver-section-title-browse">
          {t('receiverBrowse.title')}
        </h1>

        <div className="sort-controls">
          <span className="sort-label">
            <ArrowUpDown size={16} />
            {t('receiverBrowse.sortBy')}
          </span>
          <div className="sort-buttons">
            <button
              className={`sort-button ${sortBy === 'relevance' ? 'active' : ''}`}
              onClick={() => setSortBy('relevance')}
            >
              <Target size={16} />
              {t('receiverBrowse.relevance')}
            </button>
            <button
              className={`sort-button ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => setSortBy('date')}
            >
              <Calendar size={16} />
              {t('receiverBrowse.datePosted')}
            </button>
          </div>
        </div>
      </div>

      {/* Only render FiltersPanel when Google Maps is loaded */}
      {isLoaded && (
        <FiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          appliedFilters={appliedFilters}
          onClearFilters={handleClearFilters}
          isVisible={isFiltersVisible}
          onClose={handleCloseFilters}
        />
      )}

      {isLoaded && (
        <MapViewBanner
          onOpenMap={() => setMapViewOpen(true)}
          nearbyCount={getNearbyCount()}
          distanceRadius={filters.distance || 10}
          hasLocation={!!filters.locationCoords}
        />
      )}

      {error && (
        <div role="alert" className="receiver-error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="receiver-loading-state">
          <p>{t('receiverBrowse.loading')}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="receiver-empty-state">
          <Package className="receiver-empty-state-icon" size={64} />
          <p>{t('receiverBrowse.noDonations')}</p>
          <p>{t('receiverBrowse.checkBackSoon')}</p>
        </div>
      )}

      {!loading &&
        !error &&
        items.length > 0 &&
        (() => {
          // Filter and sort items based on selected sort option
          const filteredItems = [...items];

          if (sortBy === 'relevance') {
            // Sort by recommendation score (recommended items first, then non-recommended)
            filteredItems.sort((a, b) => {
              const scoreA = getRecommendationData(a)?.score || 0;
              const scoreB = getRecommendationData(b)?.score || 0;

              // If both have recommendations, sort by score (highest first)
              if (scoreA > 0 && scoreB > 0) {
                return scoreB - scoreA;
              }
              // If only one has recommendations, prioritize it
              if (scoreA > 0 && scoreB === 0) {
                return -1;
              }
              if (scoreA === 0 && scoreB > 0) {
                return 1;
              }

              // If neither has recommendations, sort by date (newest first)
              const dateA = new Date(a.createdAt || a.pickupDate);
              const dateB = new Date(b.createdAt || b.pickupDate);
              return dateB.getTime() - dateA.getTime();
            });
          } else {
            // Sort by creation date (newest first) for date filter
            filteredItems.sort((a, b) => {
              const dateA = new Date(a.createdAt || a.pickupDate);
              const dateB = new Date(b.createdAt || b.pickupDate);
              return dateB.getTime() - dateA.getTime();
            });
          }

          return (
            <div className="receiver-donations-list">
              {filteredItems.map(item => {
                const rawCategories =
                  Array.isArray(item.foodCategories) &&
                  item.foodCategories.length > 0
                    ? item.foodCategories
                    : item.foodType
                      ? [item.foodType]
                      : [];
                const categoryDisplays =
                  rawCategories.length > 0
                    ? rawCategories.map(category => {
                        const normalizedCategory =
                          mapLegacyCategoryToFoodType(category);
                        return t(
                          `surplusForm.foodTypeValues.${normalizedCategory}`,
                          getFoodTypeLabel(category)
                        );
                      })
                    : ['Other'];
                const primaryFoodCategory = getPrimaryFoodCategory(
                  item.foodCategories
                );
                const dietaryTags = Array.isArray(item.dietaryTags)
                  ? item.dietaryTags
                  : [];
                const visibleDietaryTags = dietaryTags.slice(0, 4);
                const hiddenDietaryCount = Math.max(dietaryTags.length - 4, 0);

                return (
                  <div
                    key={item.id}
                    id={`receiver-browse-card-${item.id}`}
                    className={`receiver-donation-card ${
                      expandedCardId === item.id ? 'expanded' : ''
                    } ${
                      focusedDonationId === Number(item.id)
                        ? 'receiver-donation-card--focused'
                        : ''
                    }`}
                  >
                    {/* Corner Recommended Badge */}
                    {getRecommendationData(item) && (
                      <div
                        className="recommended-badge"
                        onMouseEnter={() => setHoveredRecommended(item.id)}
                        onMouseLeave={() => setHoveredRecommended(null)}
                      >
                        <Star size={14} fill="#ffffff" color="#ffffff" />

                        {/* Tooltip */}
                        {hoveredRecommended === item.id && (
                          <div className="recommendation-tooltip">
                            <div className="tooltip-header">
                              <span className="match-label">Match Score</span>
                              <span className="match-score">
                                {getRecommendationData(item).score}%
                              </span>
                            </div>
                            <div className="tooltip-reasons">
                              {getRecommendationData(item).reasons.map(
                                (reason, index) => (
                                  <div key={index} className="reason-item">
                                    <span className="reason-check">✓</span>
                                    <span>{reason}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`receiver-donation-image ${getFoodImageClass(
                        primaryFoodCategory
                      )}`}
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
                          e.target.parentElement.classList.add(
                            'food-image-default'
                          );
                        }}
                      />
                    </div>

                    <div className="receiver-donation-content">
                      <div className="receiver-donation-header">
                        <h3 className="receiver-donation-title">
                          {item.title}
                        </h3>
                        <div className="receiver-header-actions">
                          <button
                            className="receiver-bookmark-button"
                            onClick={e => handleBookmark(item, e)}
                            aria-label="Bookmark"
                            disabled={bookmarkingItemIds.has(item.id)}
                          >
                            <Bookmark
                              size={16}
                              style={{
                                display: 'block',
                                margin: '0 auto',
                                color: bookmarkedItems.has(item.id)
                                  ? '#1B4965'
                                  : '#90A1B9',
                                fill: bookmarkedItems.has(item.id)
                                  ? '#1B4965'
                                  : 'transparent',
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
                              {t(
                                'receiverBrowse.expiringSoon',
                                'Expiring soon'
                              )}
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
                          <Calendar
                            size={16}
                            className="receiver-info-icon-expiry-icon"
                          />
                          <span>
                            {t('receiverBrowse.expires')}:{' '}
                            {formatBestBeforeDate(
                              item.expiryDateEffective || item.expiryDate
                            )}
                          </span>
                        </div>
                        <div className="receiver-info-item">
                          <MapPin
                            size={16}
                            className="receiver-info-icon-location-icon"
                          />
                          <span>
                            {item.pickupLocation?.address ||
                              t('receiverBrowse.locationNotSpecified')}
                          </span>
                        </div>
                        <div className="receiver-info-item">
                          <Clock
                            size={16}
                            className="receiver-info-icon-time-icon"
                          />
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
                              donorName:
                                item.donorName ||
                                t('receiverBrowse.localBusiness'),
                            })}
                          </span>
                        </div>
                      </div>

                      {expandedCardId === item.id && (
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
                                  {item.pickupSlots &&
                                  item.pickupSlots.length > 1
                                    ? 's'
                                    : ''}
                                </span>
                                <div className="receiver-detail-value">
                                  <span className="receiver-time-icon-detail">
                                    <Clock size={14} />
                                  </span>
                                  {item.pickupSlots &&
                                  item.pickupSlots.length > 0 ? (
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

                          {/* Food Compliance Section */}
                          {(item.temperatureCategory || item.packagingType) && (
                            <>
                              <div className="receiver-details-grid">
                                <div className="receiver-details-section">
                                  {item.temperatureCategory && (
                                    <div className="receiver-detail-item">
                                      <span className="receiver-detail-label">
                                        {t(
                                          'surplusForm.temperatureCategoryLabel'
                                        )}
                                      </span>
                                      <div className="receiver-detail-value">
                                        <span className="receiver-compliance-icon-bg">
                                          {getTemperatureCategoryIcon(
                                            item.temperatureCategory
                                          )}
                                        </span>
                                        {t(
                                          `surplusForm.temperatureCategoryValues.${item.temperatureCategory}`,
                                          getTemperatureCategoryLabel(
                                            item.temperatureCategory
                                          )
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
                                          getPackagingTypeLabel(
                                            item.packagingType
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {item.description && (
                            <div className="receiver-donor-note">
                              <div className="receiver-note-label">
                                {t('receiverBrowse.donorsNote')}
                              </div>
                              <div className="receiver-note-content">
                                {item.description}
                              </div>
                            </div>
                          )}

                          {item.createdAt && (
                            <div className="receiver-posted-time">
                              {t('receiverBrowse.posted')}{' '}
                              {formatPostedTime(item.createdAt)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="receiver-donation-actions">
                        <button
                          onClick={() => handleClaimDonation(item)}
                          className="receiver-claim-button"
                          disabled={claiming}
                        >
                          {claiming && claimTargetItem?.id === item.id
                            ? t('receiverBrowse.claiming')
                            : t('receiverBrowse.claimDonation')}
                        </button>
                        <button
                          onClick={() => handleMoreClick(item)}
                          className={`receiver-more-button ${
                            expandedCardId === item.id ? 'expanded' : ''
                          }`}
                        >
                          {expandedCardId === item.id
                            ? t('receiverBrowse.less')
                            : t('receiverBrowse.more')}
                          {expandedCardId === item.id ? (
                            <ChevronUp
                              size={14}
                              className="receiver-dropdown-icon"
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="receiver-dropdown-icon"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      <ClaimModal
        open={claimModalOpen}
        item={claimTargetItem}
        selectedIndex={selectedSlotIndex}
        onSelectIndex={idx => setSelectedSlotIndex(idx)}
        onConfirm={slot => confirmClaim(claimTargetItem, slot)}
        onClose={() => {
          setClaimModalOpen(false);
          setClaimTargetItem(null);
        }}
        loading={claiming}
        formatFn={formatPickupTime}
      />

      <MapViewModal
        isOpen={mapViewOpen}
        onClose={() => setMapViewOpen(false)}
        donations={items}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClaimClick={donation => {
          setClaimTargetItem(donation);
          setClaimModalOpen(true);
        }}
        isLoaded={isLoaded}
        savedLocation={userLocation}
      />
    </div>
  );
}

function ClaimModal({
  open,
  item,
  selectedIndex,
  onSelectIndex,
  onConfirm,
  onClose,
  loading,
  formatFn,
}) {
  const { t } = useTranslation();
  if (!open || !item) {
    return null;
  }

  const slots = Array.isArray(item.pickupSlots) ? item.pickupSlots : [];

  return (
    <div className="claim-modal-overlay" role="dialog" aria-modal="true">
      <div className="claim-modal-card">
        <h3>Choose a pickup slot</h3>
        {slots.length === 0 && (
          <div className="claim-modal-empty">No proposed slots available.</div>
        )}
        <div className="claim-slots-list">
          {slots.map((slot, idx) => {
            const date = slot.pickupDate || slot.date || '';
            const from = slot.startTime || slot.pickupFrom || slot.from || '';
            const to = slot.endTime || slot.pickupTo || slot.to || '';
            const display = formatFn ? formatFn(date, from, to) : '';
            return (
              <label
                key={idx}
                className={`claim-slot-item ${selectedIndex === idx ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="pickupSlot"
                  checked={selectedIndex === idx}
                  onChange={() => onSelectIndex(idx)}
                />
                <div className="claim-slot-content">
                  <div className="claim-slot-time">{display}</div>
                  {slot.notes && (
                    <div className="claim-slot-notes">{slot.notes}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="claim-modal-actions">
          <button
            className="btn btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-create"
            onClick={() => {
              const selectedSlot = slots[selectedIndex];
              const normalized = selectedSlot
                ? {
                    pickupDate: selectedSlot.pickupDate || selectedSlot.date,
                    startTime:
                      selectedSlot.startTime || selectedSlot.pickupFrom,
                    endTime: selectedSlot.endTime || selectedSlot.pickupTo,
                    notes: selectedSlot.notes || null,
                    id: selectedSlot.id || undefined,
                  }
                : null;
              onConfirm(normalized);
            }}
            disabled={loading || slots.length === 0}
          >
            {loading
              ? t('receiverBrowse.confirming')
              : t('receiverBrowse.confirmAndClaim')}
          </button>
        </div>
      </div>
    </div>
  );
}
