import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Package,
  ChevronDown,
  Filter,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import { surplusAPI } from "../../services/api";
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import ConfirmPickupModal from "../DonorDashboard/ConfirmPickupModal";
import ClaimedSuccessModal from "../DonorDashboard/ClaimedSuccessModal";
import { getFoodTypeLabel, getUnitLabel, getTemperatureCategoryLabel, getTemperatureCategoryIcon, getPackagingTypeLabel } from "../../constants/foodConstants";
import "../DonorDashboard/Donor_Styles/DonorListFood.css";

// Define libraries for Google Maps
const libraries = ["places"];

function statusClass(status) {
  switch (status) {
    case "AVAILABLE":
      return "badge badge--available";
    case "READY_FOR_PICKUP":
      return "badge badge--ready";
    case "CLAIMED":
      return "badge badge--claimed";
    case "NOT_COMPLETED":
      return "badge badge--not-completed";
    case "COMPLETED":
      return "badge badge--completed";
    case "EXPIRED":
      return "badge badge--expired";
    default:
      return "badge";
  }
}

function addressLabel(full) {
  if (!full) return "";
  const parts = String(full)
    .split(",")
    .map((s) => s.trim());
  if (parts.length <= 2) return full;
  return `${parts[0]}, ${parts[1]}…`;
}

function formatExpiryDate(dateString) {
  if (!dateString) return "Not specified";
  try {
    // Parse as local date to avoid timezone conversion issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Not specified";
  }
}

// Format the pickup time range
function formatPickupTime(pickupDate, pickupFrom, pickupTo) {
  if (!pickupDate) return "Flexible";

  try {
    // Parse the date string as local date
    const [year, month, day] = pickupDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (pickupFrom && pickupTo) {
      // Create a proper local time for 'from'
      const [fromHours, fromMinutes] = pickupFrom.split(":").map(Number);
      const fromDate = new Date(year, month - 1, day, fromHours, fromMinutes);
      const fromTime = fromDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Create a proper local time for 'to'
      const [toHours, toMinutes] = pickupTo.split(":").map(Number);
      const toDate = new Date(year, month - 1, day, toHours, toMinutes);
      const toTime = toDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return `${dateStr}, ${fromTime} — ${toTime}`;
    }

    return `${dateStr}`;
  } catch (error) {
    console.error("Error formatting pickup time:", error);
    return "Flexible";
  }
}



export default function DonorListFood() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // "date" or "status"
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  // Photo upload states
  const [donationPhotos, setDonationPhotos] = useState({}); // { donationId: [photo urls] }
  const [viewingPhotos, setViewingPhotos] = useState({}); // { donationId: true/false }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({}); // { donationId: index }

  useEffect(() => {
    fetchMyPosts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSortDropdownOpen && !event.target.closest('.sort-dropdown-container')) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await surplusAPI.getMyPosts();
      // Sort by newest first (default)
      const sortedData = sortPosts(response.data, sortBy);
      setItems(sortedData);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch posts";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Sort posts based on creation date or status
  const sortPosts = (posts, sortOrder) => {
    if (!Array.isArray(posts)) return [];
    
    return [...posts].sort((a, b) => {
      if (sortOrder === "date") {
        // Sort by date - newest first
        const dateA = new Date(a.createdAt || a.pickupDate || 0);
        const dateB = new Date(b.createdAt || b.pickupDate || 0);
        return dateB - dateA;
      } else if (sortOrder === "status") {
        // Sort by status priority
        const statusOrder = {
          'AVAILABLE': 1,
          'CLAIMED': 2,
          'READY_FOR_PICKUP': 3,
          'COMPLETED': 4,
          'NOT_COMPLETED': 5,
          'EXPIRED': 6
        };
        const statusA = statusOrder[a.status] || 999;
        const statusB = statusOrder[b.status] || 999;
        return statusA - statusB;
      }
      return 0;
    });
  };

  // Update sort order and re-sort items
  const handleSortChange = (newSortOrder) => {
    setSortBy(newSortOrder);
    setItems(prevItems => sortPosts(prevItems, newSortOrder));
    setIsSortDropdownOpen(false);
  };

 async function requestDelete(id) {
  console.log("DELETE CLICKED for ID =", id); 
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this post?"
  );
  if (!confirmDelete) return;

  try {
    await surplusAPI.deletePost(id);
    setItems(prev => prev.filter(item => item.id !== id));

    alert("Post deleted successfully.");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete post.");
  }
}


  function openEdit(item) {
    alert(
      `Opening edit form for: ${item.title}\n(Edit functionality to be implemented)`
    );
  }

  const handleModalClose = async () => {
    setIsModalOpen(false);
    // Small delay to ensure backend has processed the new post
    await new Promise(resolve => setTimeout(resolve, 300));
    fetchMyPosts();
  };

  const handleOpenPickupModal = (item) => {
    setSelectedItem(item);
    setIsPickupModalOpen(true);
  };

  const handleClosePickupModal = () => {
    setIsPickupModalOpen(false);
    setSelectedItem(null);
  };

  const handlePickupSuccess = () => {
    setIsSuccessModalOpen(true);
    // Refresh the posts list to show updated status
    fetchMyPosts();
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  // Photo upload handlers
  const handlePhotoUpload = (donationId, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create preview URLs for uploaded files
    const newPhotoUrls = files.map(file => URL.createObjectURL(file));
    
    setDonationPhotos(prev => ({
      ...prev,
      [donationId]: [...(prev[donationId] || []), ...newPhotoUrls]
    }));

    // Initialize photo index if first upload
    if (!donationPhotos[donationId] || donationPhotos[donationId].length === 0) {
      setCurrentPhotoIndex(prev => ({ ...prev, [donationId]: 0 }));
    }
  };

  const toggleViewPhotos = (donationId) => {
    setViewingPhotos(prev => ({
      ...prev,
      [donationId]: !prev[donationId]
    }));
    
    // Initialize photo index when first viewing
    if (!currentPhotoIndex[donationId]) {
      setCurrentPhotoIndex(prev => ({ ...prev, [donationId]: 0 }));
    }
  };

  const navigatePhoto = (donationId, direction) => {
    const photos = donationPhotos[donationId] || [];
    const currentIndex = currentPhotoIndex[donationId] || 0;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % photos.length;
    } else {
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    }
    
    setCurrentPhotoIndex(prev => ({ ...prev, [donationId]: newIndex }));
  };

  if (loading) {
    return (
      <div className="donor-list-wrapper">
        <div className="loading-state">
          <Package className="loading-icon" size={48} />
          <h3>Loading your donations...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-list-wrapper">
      {error && (
        <div className="error-banner">
          <AlertTriangle className="error-icon" />
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <header className="donor-list-header">
        <div className="header-left">
          <Filter size={20} className="filter-icon" />
          <div className="sort-dropdown-container">
            <button
              className="sort-dropdown-button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <span className="sort-label">
                {sortBy === "date" ? "Sort by Date" : "Sort by Status"}
              </span>
              <ChevronDown size={18} className={`chevron ${isSortDropdownOpen ? "open" : ""}`} />
            </button>
            
            {isSortDropdownOpen && (
              <div className="sort-dropdown-menu">
                <button
                  className={`sort-option ${sortBy === "date" ? "active" : ""}`}
                  onClick={() => handleSortChange("date")}
                >
                  Sort by Date
                </button>
                <button
                  className={`sort-option ${sortBy === "status" ? "active" : ""}`}
                  onClick={() => handleSortChange("status")}
                >
                  Sort by Status
                </button>
              </div>
            )}
          </div>
        </div>
        
        <button
          className="donor-add-button"
          onClick={() => setIsModalOpen(true)}
        >
          + Donate More
        </button>
        {isLoaded && (
          <SurplusFormModal isOpen={isModalOpen} onClose={handleModalClose} />
        )}
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" size={64} />
          <h3 className="empty-state-title">You haven't posted anything yet</h3>
          <p className="empty-state-description">
            Create your first donation post to start helping your community
            reduce food waste.
          </p>
        </div>
      ) : (
        <section className="donor-list-grid" aria-label="Donations list">
          {items.map((item) => (
            <article
              key={item.id}
              className="donation-card"
              aria-label={item.title}
            >
              <div className="donation-header">
                <h3 className="donation-title">{item.title}</h3>
                <span className={statusClass(item.status)}>
                  {item.status === "AVAILABLE"
                    ? "Available"
                    : item.status === "READY_FOR_PICKUP"
                      ? "Ready for Pickup"
                      : item.status === "CLAIMED"
                        ? "Claimed"
                        : item.status === "NOT_COMPLETED"
                          ? "Not Completed"
                          : item.status === "COMPLETED"
                            ? "Completed"
                            : item.status === "EXPIRED"
                              ? "Expired"
                              : item.status}
                </span>
              </div>

              {item.foodCategories && item.foodCategories.length > 0 && (
                <div className="donation-tags">
                  {item.foodCategories.map((category, index) => {
                    // Get the category value (handle both object and string formats)
                    const categoryValue = category.name || category;
                    // Map to display label using centralized helper function
                    const displayLabel = getFoodTypeLabel(categoryValue);
                    
                    return (
                      <span key={index} className="donation-tag">
                        {displayLabel}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Food Safety Compliance Info */}
              {(item.temperatureCategory || item.packagingType) && (
                <div className="compliance-badges">
                  {item.temperatureCategory && (
                    <span className="compliance-badge temperature">
                      <span className="badge-icon">{getTemperatureCategoryIcon(item.temperatureCategory)}</span>
                      <span className="badge-label">{getTemperatureCategoryLabel(item.temperatureCategory)}</span>
                    </span>
                  )}
                  {item.packagingType && (
                    <span className="compliance-badge packaging">
                      <Package size={14} />
                      <span className="badge-label">{getPackagingTypeLabel(item.packagingType)}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="donation-quantity">
                {item.quantity.value} {getUnitLabel(item.quantity.unit)}
              </div>

              <ul className="donation-meta" aria-label="details">
                <li>
                  <Calendar size={16} className="calendar-icon" />
                  <span>Expires: {formatExpiryDate(item.expiryDate)}</span>
                </li>
                <li>
                  <Clock size={16} className="time-icon" />
                  <div className="pickup-times-container">
                    <span className="pickup-label">Pickup:</span>
                    {/* Show only confirmed pickup slot if it exists, otherwise show all slots */}
                    {item.confirmedPickupSlot ? (
                      <span className="pickup-time-item">
                        {formatPickupTime(
                          item.confirmedPickupSlot.pickupDate,
                          item.confirmedPickupSlot.startTime,
                          item.confirmedPickupSlot.endTime
                        )}
                      </span>
                    ) : item.pickupSlots && item.pickupSlots.length > 0 ? (
                      <>
                        {item.pickupSlots.map((slot, idx) => (
                          <React.Fragment key={idx}>
                            <span className="pickup-time-item">
                              {formatPickupTime(
                                slot.pickupDate || slot.date,
                                slot.startTime || slot.pickupFrom,
                                slot.endTime || slot.pickupTo
                              )}
                            </span>
                            {idx < item.pickupSlots.length - 1 && (
                              <span className="pickup-time-divider">|</span>
                            )}
                          </React.Fragment>
                        ))}
                      </>
                    ) : (
                      <span className="pickup-time-item">
                        {formatPickupTime(
                          item.pickupDate,
                          item.pickupFrom,
                          item.pickupTo
                        )}
                      </span>
                    )}
                  </div>
                </li>
                <li>
                  <MapPin size={16} className="locationMap-icon" />
                  {item.pickupLocation.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        item.pickupLocation.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="donation-address"
                      title={item.pickupLocation.address}
                    >
                      {addressLabel(item.pickupLocation.address)}
                    </a>
                  ) : (
                    <span className="donation-address">
                      Address not specified
                    </span>
                  )}
                </li>
              </ul>

              {item.description && (
                <p className="donation-notes">{item.description}</p>
              )}

              {/* Photo Upload/View Section - Only visible for CLAIMED or READY_FOR_PICKUP */}
              {(item.status === "CLAIMED" || item.status === "READY_FOR_PICKUP") && (
              <div className="donation-photos-section">
                {!viewingPhotos[item.id] ? (
                  // Upload mode
                  <label className="photo-upload-button">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(item.id, e)}
                      style={{ display: 'none' }}
                    />
                    <Camera size={14} />
                    <span>
                      {donationPhotos[item.id]?.length > 0
                        ? `${donationPhotos[item.id].length} photo${donationPhotos[item.id].length > 1 ? 's' : ''} uploaded`
                        : 'Upload photo of donation'}
                    </span>
                  </label>
                ) : null}

                {donationPhotos[item.id]?.length > 0 && (
                  <>
                    {!viewingPhotos[item.id] ? (
                      <button
                        className="view-photos-button"
                        onClick={() => toggleViewPhotos(item.id)}
                      >
                        <ImageIcon size={14} />
                        View photos
                      </button>
                    ) : (
                      <div className="photo-slideshow">
                        <button
                          className="slideshow-close"
                          onClick={() => toggleViewPhotos(item.id)}
                        >
                          <X size={16} />
                        </button>
                        
                        <div className="slideshow-content">
                          <button
                            className="slideshow-nav prev"
                            onClick={() => navigatePhoto(item.id, 'prev')}
                            disabled={donationPhotos[item.id].length <= 1}
                          >
                            <ChevronLeft size={20} />
                          </button>

                          <img
                            src={donationPhotos[item.id][currentPhotoIndex[item.id] || 0]}
                            alt={`Donation ${(currentPhotoIndex[item.id] || 0) + 1}`}
                            className="slideshow-image"
                          />

                          <button
                            className="slideshow-nav next"
                            onClick={() => navigatePhoto(item.id, 'next')}
                            disabled={donationPhotos[item.id].length <= 1}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>

                        <div className="slideshow-counter">
                          {(currentPhotoIndex[item.id] || 0) + 1} / {donationPhotos[item.id].length}
                        </div>

                        <label className="slideshow-add-more">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(item.id, e)}
                            style={{ display: 'none' }}
                          />
                          <Upload size={14} />
                          Add more photos
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}

              {item.status === "AVAILABLE" ? (
                <div className="donation-actions">
                  <button
                    className="donation-link"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="icon" /> Edit
                  </button>
                  <button
                    className="donation-link danger"
                    onClick={() => requestDelete(item.id)}
                  >
                    <Trash2 className="icon" /> Delete
                  </button>
                </div>
              ) : item.status === "NOT_COMPLETED" ? (
                <div className="donation-actions">
                  <button
                    className="donation-action-button primary"
                    onClick={() => alert('Reschedule functionality coming soon!')}
                  >
                    RESCHEDULE
                  </button>
                </div>
              ) : (
                <div className="donation-actions">
                  {item.status === "READY_FOR_PICKUP" && (
                    <button
                      className="donation-action-button primary"
                      onClick={() => handleOpenPickupModal(item)}
                    >
                      ENTER PICKUP CODE
                    </button>
                  )}
                  {item.status === "COMPLETED" && (
                    <button
                      className="donation-action-button secondary"
                      disabled
                    >
                      THANK YOU
                    </button>
                  )}
                  {item.status === "CLAIMED" && (
                    <button className="donation-action-button primary">
                      OPEN CHAT
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <ConfirmPickupModal
        isOpen={isPickupModalOpen}
        onClose={handleClosePickupModal}
        donationItem={selectedItem}
        onSuccess={handlePickupSuccess}
      />

      <ClaimedSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
}