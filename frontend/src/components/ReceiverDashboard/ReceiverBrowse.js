import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import { surplusAPI } from "../../services/api";
import FiltersPanel from "./FiltersPanel";
import BakeryPastryImage from "../../assets/foodtypes/Pastry&Bakery.jpg";
import FruitsVeggiesImage from "../../assets/foodtypes/Fruits&Vegetables.jpg";
import PackagedPantryImage from "../../assets/foodtypes/PackagedItems.jpg";
import DairyColdImage from "../../assets/foodtypes/Dairy.jpg";
import FrozenFoodImage from "../../assets/foodtypes/FrozenFood.jpg";
import PreparedMealsImage from "../../assets/foodtypes/PreparedFood.jpg";
import "./ReceiverBrowseModal.css";
import "./ReceiverBrowse.css";

const libraries = ["places"];

export default function ReceiverBrowse() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const [filters, setFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: "",
    locationCoords: null,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: "",
    locationCoords: null,
  });

  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await surplusAPI.list();
      const availableItems = Array.isArray(data) ? data : [];
      setItems(availableItems);
      setError(null);
    } catch (e) {
      console.error("Error fetching donations:", e);
      setError("Failed to load available donations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilteredDonations = useCallback(async (filterCriteria) => {
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
      setError("Failed to load donations with applied filters");
      console.error("Error fetching filtered donations:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleFiltersChange = useCallback((filterType, value) => {
    setFilters((prev) => ({
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
      location: "",
      locationCoords: null,
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    await fetchDonations();
  }, [fetchDonations]);

  const handleCloseFilters = useCallback(() => {
    setIsFiltersVisible(false);
  }, []);

  const handleMoreClick = useCallback((item) => {
    setExpandedCardId((prev) => (prev === item.id ? null : item.id));
  }, []);

  const handleBookmark = useCallback((item, e) => {
    e.stopPropagation();
    setBookmarkedItems((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(item.id)) {
        newBookmarks.delete(item.id);
      } else {
        newBookmarks.add(item.id);
      }
      return newBookmarks;
    });
  }, []);

  const confirmClaim = useCallback(async (item, slot) => {
    setClaiming(true);
    try {
      await surplusAPI.claim(item.id, slot);
      setItems((prev) => prev.filter((post) => post.id !== item.id));
      setClaimModalOpen(false);
      setClaimTargetItem(null);
    } catch (error) {
      console.error("Error claiming post:", error);
      alert(
        error.response?.data?.message ||
        "Failed to claim. It may have already been claimed."
      );
    } finally {
      setClaiming(false);
    }
  }, []);

  const handleClaimDonation = useCallback((item) => {
    if (item.pickupSlots && Array.isArray(item.pickupSlots) && item.pickupSlots.length > 0) {
      setClaimTargetItem(item);
      setSelectedSlotIndex(0);
      setClaimModalOpen(true);
      return;
    }

    if (!window.confirm("Are you sure you want to claim this donation?")) {
      return;
    }

    const legacySlot = (item.pickupDate && item.pickupFrom && item.pickupTo) ? {
      pickupDate: item.pickupDate,
      startTime: item.pickupFrom,
      endTime: item.pickupTo
    } : null;

    confirmClaim(item, legacySlot);
  }, [confirmClaim]);

  const getFoodCategoryDisplays = useCallback((foodCategories) => {
    if (!foodCategories || !Array.isArray(foodCategories) || foodCategories.length === 0) {
      return ["Other"];
    }

    return foodCategories.map((category) => {
      switch (category) {
        case "FRUITS_VEGETABLES":
          return "Fruits & Vegetables";
        case "BAKERY_PASTRY":
          return "Bakery & Pastry";
        case "PACKAGED_PANTRY":
          return "Packaged / Pantry Items";
        case "DAIRY":
          return "Dairy & Cold Items";
        case "FROZEN":
          return "Frozen Food";
        case "PREPARED_MEALS":
          return "Prepared Meals";
        default:
          return category;
      }
    });
  }, []);

  const getPrimaryFoodCategory = useCallback((foodCategories) => {
    if (!foodCategories || !Array.isArray(foodCategories) || foodCategories.length === 0) {
      return "Other";
    }

    const category = foodCategories[0];
    switch (category) {
      case "FRUITS_VEGETABLES":
        return "Fruits & Vegetables";
      case "BAKERY_PASTRY":
        return "Bakery & Pastry";
      case "PACKAGED_PANTRY":
        return "Packaged / Pantry Items";
      case "DAIRY":
        return "Dairy & Cold Items";
      case "FROZEN":
        return "Frozen Food";
      case "PREPARED_MEALS":
        return "Prepared Meals";
      default:
        return "Other";
    }
  }, []);

  const getFoodTypeImage = useCallback((foodType) => {
    switch (foodType) {
      case "Bakery & Pastry":
        return BakeryPastryImage;
      case "Fruits & Vegetables":
        return FruitsVeggiesImage;
      case "Packaged / Pantry Items":
        return PackagedPantryImage;
      case "Dairy & Cold Items":
        return DairyColdImage;
      case "Frozen Food":
        return FrozenFoodImage;
      case "Prepared Meals":
        return PreparedMealsImage;
      default:
        return PreparedMealsImage;
    }
  }, []);

  const getFoodImageClass = useCallback((foodType) => {
    switch (foodType) {
      case "Bakery & Pastry":
        return "food-image-bakery";
      case "Fruits & Vegetables":
        return "food-image-fruits-veg";
      case "Packaged / Pantry Items":
        return "food-image-packaged";
      case "Dairy & Cold Items":
        return "food-image-dairy";
      case "Frozen Food":
        return "food-image-frozen";
      case "Prepared Meals":
        return "food-image-prepared";
      default:
        return "food-image-packaged";
    }
  }, []);

  const formatExpiryDate = useCallback((dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }, []);

  const formatPickupTime = useCallback((pickupDate, pickupFrom, pickupTo) => {
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
  }, []);

  const formatPostedTime = useCallback((dateString) => {
    if (!dateString) return "";
    try {
      const now = new Date();
      const posted = new Date(dateString);
      const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
      if (diffInHours < 1) return "Just now";
      if (diffInHours === 1) return "1 hour ago";
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return "1 day ago";
      return `${diffInDays} days ago`;
    } catch {
      return "";
    }
  }, []);

  const formatStatus = useCallback((status) => {
    switch (status) {
      case "AVAILABLE":
        return "Available";
      case "READY_FOR_PICKUP":
        return "Ready for Pickup";
      case "CLAIMED":
        return "Claimed";
      case "COMPLETED":
        return "Completed";
      case "NOT_COMPLETED":
        return "Not Completed";
      case "EXPIRED":
        return "Expired";
      default:
        return status || "Available";
    }
  }, []);

  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "AVAILABLE":
        return "status-available";
      case "READY_FOR_PICKUP":
        return "status-ready";
      case "CLAIMED":
        return "status-claimed";
      case "COMPLETED":
        return "status-completed";
      case "NOT_COMPLETED":
        return "status-not-completed";
      case "EXPIRED":
        return "status-expired";
      default:
        return "status-available";
    }
  }, []);

  return (
    <div className="receiver-browse-container">
      <h1 className="receiver-section-title">Explore Available Donations</h1>
      
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
      
      {error && (
        <div role="alert" className="receiver-error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="receiver-loading-state">
          <p>Loading donations...</p>
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
          {items.map((item) => {
            const categoryDisplays = getFoodCategoryDisplays(item.foodCategories);
            const primaryFoodCategory = getPrimaryFoodCategory(item.foodCategories);

            return (
              <div
                key={item.id}
                className={`receiver-donation-card ${
                  expandedCardId === item.id ? "expanded" : ""
                }`}
              >
                <div
                  className={`receiver-donation-image ${getFoodImageClass(
                    primaryFoodCategory
                  )}`}
                >
                  <img
                    src={getFoodTypeImage(primaryFoodCategory)}
                    alt={primaryFoodCategory || "Food donation"}
                    className="receiver-food-type-image"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.classList.add("food-image-default");
                    }}
                  />
                </div>

                <div className="receiver-donation-content">
                  <div className="receiver-donation-header">
                    <h3 className="receiver-donation-title">{item.title}</h3>
                    <div className="receiver-header-actions">
                      <button
                        className="receiver-bookmark-button"
                        onClick={(e) => handleBookmark(item, e)}
                        aria-label="Bookmark"
                      >
                        <Bookmark
                          size={16}
                          style={{
                            display: "block",
                            margin: "0 auto",
                            color: bookmarkedItems.has(item.id) ? "#1B4965" : "#90A1B9",
                            fill: bookmarkedItems.has(item.id) ? "#1B4965" : "transparent",
                          }}
                        />
                      </button>
                      <span className={`receiver-status-badge ${getStatusClass(item.status)}`}>
                        <span className="receiver-status-icon">✓</span>
                        {formatStatus(item.status)}
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
                      <span>
                        {item.pickupLocation?.address || "Location not specified"}
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
                    <div className="receiver-category-tags">
                      {categoryDisplays.map((category, index) => (
                        <span key={index} className="receiver-category-tag">
                          {category}
                        </span>
                      ))}
                    </div>
                    <div className="receiver-donor-info">
                      <User size={16} />
                      <span>Donated by {item.donor?.name || "Local Business"}</span>
                    </div>
                  </div>

                  {expandedCardId === item.id && (
                    <div className="receiver-donation-details">
                      <div className="receiver-details-grid">
                        <div className="receiver-details-section">
                          <div className="receiver-detail-item">
                            <span className="receiver-detail-label">Quantity</span>
                            <div className="receiver-detail-value">
                              <Package2
                                size={14}
                                className="receiver-quantity-icon-detail"
                                style={{ display: "inline", marginRight: "8px" }}
                              />
                              {item.quantity?.value || 0} {item.quantity?.unit || "items"}
                            </div>
                          </div>
                          <div className="receiver-detail-item">
                            <span className="receiver-detail-label">
                              Pickup Time{item.pickupSlots && item.pickupSlots.length > 1 ? 's' : ''}
                            </span>
                            <div className="receiver-detail-value">
                              <Clock
                                size={14}
                                className="receiver-time-icon-detail"
                                style={{ display: "inline", marginRight: "8px" }}
                              />
                              {item.pickupSlots && item.pickupSlots.length > 0 ? (
                                <div className="pickup-slots-list">
                                  {item.pickupSlots.map((slot, idx) => (
                                    <div key={idx} className="pickup-slot-time" style={{ color: '#314158' }}>
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
                            <span className="receiver-detail-label">Expires</span>
                            <div className="receiver-detail-value">
                              <Calendar
                                size={14}
                                className="receiver-expiry-icon-detail"
                                style={{ display: "inline", marginRight: "8px" }}
                              />
                              {formatExpiryDate(item.expiryDate)}
                            </div>
                          </div>
                          <div className="receiver-detail-item">
                            <span className="receiver-detail-label">Location</span>
                            <div className="receiver-detail-value">
                              <MapPin
                                size={14}
                                className="receiver-location-icon-detail"
                                style={{ display: "inline", marginRight: "8px" }}
                              />
                              {item.pickupLocation?.address || "Location not specified"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.description && (
                        <div className="receiver-donor-note">
                          <div className="receiver-note-label">Donor's Note</div>
                          <div className="receiver-note-content">{item.description}</div>
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
                      disabled={claiming}
                    >
                      {claiming && claimTargetItem?.id === item.id ? 'Claiming...' : 'Claim Donation'}
                    </button>
                    <button
                      onClick={() => handleMoreClick(item)}
                      className={`receiver-more-button ${
                        expandedCardId === item.id ? "expanded" : ""
                      }`}
                    >
                      {expandedCardId === item.id ? "Less" : "More"}
                      {expandedCardId === item.id ? (
                        <ChevronUp size={14} className="receiver-dropdown-icon" />
                      ) : (
                        <ChevronDown size={14} className="receiver-dropdown-icon" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClaimModal
        open={claimModalOpen}
        item={claimTargetItem}
        selectedIndex={selectedSlotIndex}
        onSelectIndex={(idx) => setSelectedSlotIndex(idx)}
        onConfirm={(slot) => confirmClaim(claimTargetItem, slot)}
        onClose={() => { 
          setClaimModalOpen(false); 
          setClaimTargetItem(null); 
        }}
        loading={claiming}
        formatFn={formatPickupTime}
      />
    </div>
  );
}

function ClaimModal({ open, item, selectedIndex, onSelectIndex, onConfirm, onClose, loading, formatFn }) {
  if (!open || !item) return null;

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
              <label key={idx} className={`claim-slot-item ${selectedIndex === idx ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="pickupSlot"
                  checked={selectedIndex === idx}
                  onChange={() => onSelectIndex(idx)}
                />
                <div className="claim-slot-content">
                  <div className="claim-slot-time">{display}</div>
                  {slot.notes && <div className="claim-slot-notes">{slot.notes}</div>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="claim-modal-actions">
          <button className="btn btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-create"
            onClick={() => {
              const selectedSlot = slots[selectedIndex];
              const normalized = selectedSlot ? {
                pickupDate: selectedSlot.pickupDate || selectedSlot.date,
                startTime: selectedSlot.startTime || selectedSlot.pickupFrom,
                endTime: selectedSlot.endTime || selectedSlot.pickupTo,
                notes: selectedSlot.notes || null,
                id: selectedSlot.id || undefined,
              } : null;
              onConfirm(normalized);
            }}
            disabled={loading || slots.length === 0}
          >
            {loading ? 'Confirming...' : 'Confirm & Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}