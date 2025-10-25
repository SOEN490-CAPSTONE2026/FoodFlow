import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { LoadScript } from "@react-google-maps/api";
import { surplusAPI } from "../../services/api";
import FiltersPanel from "./FiltersPanel";
import BakeryPastryImage from "../../assets/foodtypes/Pastry&Bakery.jpg";
import FruitsVeggiesImage from "../../assets/foodtypes/Fruits&Vegetables.jpg";
import PackagedPantryImage from "../../assets/foodtypes/PackagedItems.jpg";
import DairyColdImage from "../../assets/foodtypes/Dairy.jpg";
import FrozenFoodImage from "../../assets/foodtypes/FrozenFood.jpg";
import PreparedMealsImage from "../../assets/foodtypes/PreparedFood.jpg";
import "./ReceiverBrowse.css";

// Google Maps libraries needed for Places API
const libraries = ["places"];

export default function ReceiverBrowse() {
  // Filter state (not applied, just stored)
  const [filters, setFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    foodType: [],
    expiryBefore: null,
    distance: 10,
    location: "",
  });

  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());

  // Filter handlers (just update state, no filtering logic)
  const handleFiltersChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      foodType: [],
      expiryBefore: null,
      distance: 10,
      location: "",
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const handleToggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  const handleCloseFilters = () => {
    setIsFiltersVisible(false);
  };

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await surplusAPI.list();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError("Failed to load available donations");
      console.error("fetchDonations error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Removed the polling - only fetch once on mount
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleMoreClick = useCallback((item) => {
    setExpandedCardId((prev) => (prev === item.id ? null : item.id));
  }, []);

  // const handleClaimDonation = useCallback((item) => {
  //   console.log("Claiming donation:", item);
  // }, []);

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
    console.log("Bookmarking:", item);
  }, []);

  const handleClaimDonation = async (item) => {
      if (!window.confirm('Are you sure you want to claim this donation?')) {
          return;
      }
      
      try {
          await surplusAPI.claim(item.id);  // Use surplusAPI
          alert('Successfully claimed! Check "My Claims" tab.');
          
          // Remove from available list
          setItems(items.filter(post => post.id !== item.id));  // Use setItems/items
      } catch (error) {
          console.error('Error claiming post:', error);
          alert(error.response?.data?.message || 'Failed to claim. It may have already been claimed.');
      }
  };

  // Convert each category to display string (for separate tags)
  const getFoodCategoryDisplays = (foodCategories) => {
    if (
      !foodCategories ||
      !Array.isArray(foodCategories) ||
      foodCategories.length === 0
    ) {
      return ["Other"];
    }

    // Convert all categories to display strings
    return foodCategories.map((category) => {
      switch (category) {
        case "FRUITS_VEGETABLES":
          return "Fruits & Vegetables";
        case "BAKERY_PASTRY":
          return "Bakery & Pastry";
        case "PACKAGED_PANTRY":
          return "Packaged / Pantry Items";
        case "DAIRY_COLD":
          return "Dairy & Cold Items";
        case "FROZEN_FOOD":
          return "Frozen Food";
        case "PREPARED_MEALS":
          return "Prepared Meals";
        default:
          return category;
      }
    });
  };

  // Get primary food category for image (first one)
  const getPrimaryFoodCategory = (foodCategories) => {
    if (
      !foodCategories ||
      !Array.isArray(foodCategories) ||
      foodCategories.length === 0
    ) {
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
      case "DAIRY_COLD":
        return "Dairy & Cold Items";
      case "FROZEN_FOOD":
        return "Frozen Food";
      case "PREPARED_MEALS":
        return "Prepared Meals";
      default:
        return "Other";
    }
  };

  const getFoodTypeImage = (foodType) => {
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
  };

  const getFoodImageClass = (foodType) => {
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
  };

  const formatExpiryDate = (dateString) => {
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
  };

  // Updated to handle new format: pickupDate + pickupFrom + pickupTo
  const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
    if (!pickupDate || !pickupFrom || !pickupTo) return "—";
    try {
      // Combine pickupDate (LocalDate) and pickupFrom (LocalTime)
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

      // Parse pickupTo (LocalTime format "17:00:00")
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

  const formatPostedTime = (dateString) => {
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
  };

  const formatStatus = (status) => {
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
  };

  const getStatusClass = (status) => {
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
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
      onError={(error) =>
        console.error("Google Maps API failed to load:", error)
      }
    >
      <div className="receiver-browse">
        {/* Mobile Filter Toggle Button */}
        {!isFiltersVisible && (
          <button
            className="mobile-filter-toggle"
            onClick={handleToggleFilters}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
            </svg>
            <span>Filters</span>
          </button>
        )}

        <FiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          appliedFilters={appliedFilters}
          onClearFilters={handleClearFilters}
          isVisible={isFiltersVisible}
          onClose={handleCloseFilters}
        />

        <div className="receiver-browse-container">
          <h1 className="receiver-section-title">
            Explore Available Donations
          </h1>
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
              {items.map((item) => {
                const categoryDisplays = getFoodCategoryDisplays(
                  item.foodCategories
                );
                const primaryFoodCategory = getPrimaryFoodCategory(
                  item.foodCategories
                );

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
                          e.target.parentElement.classList.add(
                            "food-image-default"
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
                            onClick={(e) => handleBookmark(item, e)}
                            aria-label="Bookmark"
                          >
                            <Bookmark
                              size={16}
                              style={{
                                display: "block",
                                margin: "0 auto",
                                color: bookmarkedItems.has(item.id)
                                  ? "#1B4965"
                                  : "#90A1B9",
                                fill: bookmarkedItems.has(item.id)
                                  ? "#1B4965"
                                  : "transparent",
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
                          <Calendar
                            size={16}
                            className="receiver-info-icon-expiry-icon"
                          />
                          <span>
                            Expires: {formatExpiryDate(item.expiryDate)}
                          </span>
                        </div>
                        <div className="receiver-info-item">
                          <MapPin
                            size={16}
                            className="receiver-info-icon-location-icon"
                          />
                          <span>
                            {item.pickupLocation?.address ||
                              "Location not specified"}
                          </span>
                        </div>
                        <div className="receiver-info-item">
                          <Clock
                            size={16}
                            className="receiver-info-icon-time-icon"
                          />
                          <span>
                            {formatPickupTime(
                              item.pickupDate,
                              item.pickupFrom,
                              item.pickupTo
                            )}
                          </span>
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
                          <span>
                            Donated by {item.donor?.name || "Local Business"}
                          </span>
                        </div>
                      </div>

                      {expandedCardId === item.id && (
                        <div className="receiver-donation-details">
                          <div className="receiver-details-grid">
                            <div className="receiver-details-section">
                              <div className="receiver-detail-item">
                                <span className="receiver-detail-label">
                                  Quantity
                                </span>
                                <div className="receiver-detail-value">
                                  <Package2
                                    size={14}
                                    className="receiver-quantity-icon-detail"
                                    style={{
                                      display: "inline",
                                      marginRight: "8px",
                                    }}
                                  />
                                  {item.quantity?.value || 0}{" "}
                                  {item.quantity?.unit || "items"}
                                </div>
                              </div>
                              <div className="receiver-detail-item">
                                <span className="receiver-detail-label">
                                  Pickup Time
                                </span>
                                <div className="receiver-detail-value">
                                  <Clock
                                    size={14}
                                    className="receiver-time-icon-detail"
                                    style={{
                                      display: "inline",
                                      marginRight: "8px",
                                    }}
                                  />
                                  {formatPickupTime(
                                    item.pickupDate,
                                    item.pickupFrom,
                                    item.pickupTo
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="receiver-details-section">
                              <div className="receiver-detail-item">
                                <span className="receiver-detail-label">
                                  Expires
                                </span>
                                <div className="receiver-detail-value">
                                  <Calendar
                                    size={14}
                                    className="receiver-expiry-icon-detail"
                                    style={{
                                      display: "inline",
                                      marginRight: "8px",
                                    }}
                                  />
                                  {formatExpiryDate(item.expiryDate)}
                                </div>
                              </div>
                              <div className="receiver-detail-item">
                                <span className="receiver-detail-label">
                                  Location
                                </span>
                                <div className="receiver-detail-value">
                                  <MapPin
                                    size={14}
                                    className="receiver-location-icon-detail"
                                    style={{
                                      display: "inline",
                                      marginRight: "8px",
                                    }}
                                  />
                                  {item.pickupLocation?.address ||
                                    "Location not specified"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {item.description && (
                            <div className="receiver-donor-note">
                              <div className="receiver-note-label">
                                Donor's Note
                              </div>
                              <div className="receiver-note-content">
                                {item.description}
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
                          className={`receiver-more-button ${
                            expandedCardId === item.id ? "expanded" : ""
                          }`}
                        >
                          {expandedCardId === item.id ? "Less" : "More"}
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
          )}
        </div>
      </div>
    </LoadScript>
  );
}
