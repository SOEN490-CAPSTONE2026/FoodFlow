import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
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
  Star,
} from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
import { surplusAPI, claimsAPI, reportAPI } from "../../services/api";
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import ConfirmPickupModal from "../DonorDashboard/ConfirmPickupModal";
import ClaimedSuccessModal from "../DonorDashboard/ClaimedSuccessModal";
import ReportUserModal from "../ReportUserModal";
import FeedbackModal from "../FeedbackModal/FeedbackModal";
import DonationTimeline from "../shared/DonationTimeline";
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
  const { t } = useTranslation();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editPostId, setEditPostId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // "date" or "status"
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  // Report and Feedback modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportTargetUser, setReportTargetUser] = useState(null);
  const [feedbackTargetUser, setFeedbackTargetUser] = useState(null);
  const [feedbackClaimId, setFeedbackClaimId] = useState(null);
  const [completedDonationId, setCompletedDonationId] = useState(null);
  const navigate = useNavigate();
  
  // Photo upload states
  const [donationPhotos, setDonationPhotos] = useState({}); // { donationId: [photo urls] }
  const [viewingPhotos, setViewingPhotos] = useState({}); // { donationId: true/false }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({}); // { donationId: index }

  // Timeline states
  const [expandedTimeline, setExpandedTimeline] = useState({}); // { donationId: true/false }
  const [timelines, setTimelines] = useState({}); // { donationId: [timeline events] }
  const [loadingTimelines, setLoadingTimelines] = useState({}); // { donationId: true/false }

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
        err.response?.data?.message || err.message || t('donorListFood.failedToFetch');
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getRecipientEmailForClaimedPost = async (item) => {
    try {
      setError(null);
      const { data: claims } = await claimsAPI.getClaimForSurplusPost(item.id);

      if (!claims || claims.length === 0) {
        setError(`Failed to fetch the recipient email for post "${item.title}"`);
        return null; 
      }

      return claims[0].receiverEmail;

    } catch (err) {
      console.error('Error fetching recipient email:', err);

      if (err.response?.status === 400) {
        setError('Receiver not found or invalid email');
      } else {
        setError('Failed to fetch recipient email. Please try again.');
      }

      return null;
    }
  };

  const contactReceiver = async (item) => {
    const recipientEmail = await getRecipientEmailForClaimedPost(item);

    if (!recipientEmail) return;
    navigate(`/donor/messages?recipientEmail=${encodeURIComponent(recipientEmail)}`);
  };

  const handleOpenFeedback = async (item) => {
    try {
      console.log("Opening feedback modal for item:", item);
      
      // Get claim details to find the receiver - returns an array
      const { data: claims } = await claimsAPI.getClaimForSurplusPost(item.id);
      console.log("Claims data:", claims);
      
      if (claims && claims.length > 0) {
        const claim = claims[0];
        if (claim.receiverId) {
          const targetUser = {
            id: claim.receiverId,
            email: claim.receiverEmail,
          };
          console.log("Setting feedback target user:", targetUser);
          setFeedbackTargetUser(targetUser);
          setFeedbackClaimId(claim.id);
          setShowFeedbackModal(true);
          console.log("Feedback modal state set to true");
        } else {
          console.log("No receiver ID found in claim");
          alert("Unable to load receiver information. Please try again.");
        }
      } else {
        console.log("No claims found for this post");
        alert("No claims found for this donation. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching claim details for feedback:", error);
      alert("Failed to open feedback modal. Please try again.");
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
    t('donorListFood.confirmDelete')
  );
  if (!confirmDelete) return;

  try {
    await surplusAPI.deletePost(id);
    setItems(prev => prev.filter(item => item.id !== id));

    alert(t('donorListFood.postDeletedSuccess'));
  } catch (err) {
    alert(err.response?.data?.message || t('donorListFood.postDeleteFailed'));
  }
}


  function openEdit(item) {
    alert(
      t('donorListFood.editFunctionality', { title: item.title })
    );
    setEditPostId(item.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  }

  const handleModalClose = async () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditPostId(null);
    // Small delay to ensure backend has processed the changes
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

  const handleOpenReport = (item) => {
    setReportTargetUser({
      id: item.receiverId,
      name: item.receiverName || item.receiverEmail,
    });
    setCompletedDonationId(item.id);
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      await reportAPI.submitReport(reportData);
      alert('Report submitted successfully');
      setShowReportModal(false);
      setReportTargetUser(null);
      setCompletedDonationId(null);
    } catch (err) {
      console.error('Failed to submit report', err);
      alert('Failed to submit report. Please try again.');
    }
  };

  // Photo upload handlers
  const handlePhotoUpload = (donationId, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create preview URLs for uploaded files
    const newPhotoUrls = files.map(file => URL.createObjectURL(file));
    
    setDonationPhotos(prev => {
      const existingPhotos = prev[donationId] || [];
      // Initialize photo index if first upload
      if (existingPhotos.length === 0) {
        setCurrentPhotoIndex(prevIndex => ({ ...prevIndex, [donationId]: 0 }));
      }
      return {
        ...prev,
        [donationId]: [...existingPhotos, ...newPhotoUrls]
      };
    });
  };

  const toggleViewPhotos = (donationId) => {
    // Initialize photo index when first viewing
    setCurrentPhotoIndex(prev => {
      if (prev[donationId] === undefined) {
        return { ...prev, [donationId]: 0 };
      }
      return prev;
    });
    
    setViewingPhotos(prev => ({
      ...prev,
      [donationId]: !prev[donationId]
    }));
  };

  const navigatePhoto = (donationId, direction) => {
    const photos = donationPhotos[donationId] || [];
    if (photos.length === 0) return;
    
    setCurrentPhotoIndex(prev => {
      const currentIndex = prev[donationId] ?? 0;
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % photos.length;
      } else {
        newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
      }
      
      return { ...prev, [donationId]: newIndex };
    });
  };

  // Timeline handlers
  const toggleTimeline = async (donationId) => {
    const isExpanding = !expandedTimeline[donationId];

    setExpandedTimeline(prev => ({
      ...prev,
      [donationId]: isExpanding
    }));

    // Fetch timeline data if expanding and not already loaded
    if (isExpanding && !timelines[donationId]) {
      await fetchTimeline(donationId);
    }
  };

  const fetchTimeline = async (donationId) => {
    setLoadingTimelines(prev => ({ ...prev, [donationId]: true }));

    try {
      const response = await surplusAPI.getTimeline(donationId);
      setTimelines(prev => ({
        ...prev,
        [donationId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching timeline for donation', donationId, ':', error);
      setTimelines(prev => ({
        ...prev,
        [donationId]: []
      }));
    } finally {
      setLoadingTimelines(prev => ({ ...prev, [donationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="donor-list-wrapper">
        <div className="loading-state">
          <Package className="loading-icon" size={48} />
          <h3>{t('donorListFood.loading')}</h3>
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
                {sortBy === "date" ? t('donorListFood.sortByDate') : t('donorListFood.sortByStatus')}
              </span>
              <ChevronDown size={18} className={`chevron ${isSortDropdownOpen ? "open" : ""}`} />
            </button>
            
            {isSortDropdownOpen && (
              <div className="sort-dropdown-menu">
                <button
                  className={`sort-option ${sortBy === "date" ? "active" : ""}`}
                  onClick={() => handleSortChange("date")}
                >
                  {t('donorListFood.sortByDate')}
                </button>
                <button
                  className={`sort-option ${sortBy === "status" ? "active" : ""}`}
                  onClick={() => handleSortChange("status")}
                >
                  {t('donorListFood.sortByStatus')}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <button
          className="donor-add-button"
          onClick={() => {
            setIsEditMode(false);
            setEditPostId(null);
            setIsModalOpen(true);
          }}
        >
          + {t('donorListFood.donateMore')}
        </button>
        {isLoaded && (
          <SurplusFormModal 
            isOpen={isModalOpen} 
            onClose={handleModalClose} 
            editMode={isEditMode}
            postId={editPostId}
          />
        )}
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" size={64} />
          <h3 className="empty-state-title">{t('donorListFood.emptyStateTitle')}</h3>
          <p className="empty-state-description">
            {t('donorListFood.emptyStateDescription')}
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
                    ? t('donorListFood.status.available')
                    : item.status === "READY_FOR_PICKUP"
                      ? t('donorListFood.status.readyForPickup')
                      : item.status === "CLAIMED"
                        ? t('donorListFood.status.claimed')
                        : item.status === "NOT_COMPLETED"
                          ? t('donorListFood.status.notCompleted')
                          : item.status === "COMPLETED"
                            ? t('donorListFood.status.completed')
                            : item.status === "EXPIRED"
                              ? t('donorListFood.status.expired')
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
                  <span>{t('donorListFood.expires')}: {formatExpiryDate(item.expiryDate)}</span>
                </li>
                <li>
                  <Clock size={16} className="time-icon" />
                  <div className="pickup-times-container">
                    <span className="pickup-label">{t('donorListFood.pickup')}:</span>
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
                        {t('donorListFood.addressNotSpecified')}
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
                  <button
                    className="view-photos-button"
                    onClick={() => toggleViewPhotos(item.id)}
                  >
                    <ImageIcon size={14} />
                    View {donationPhotos[item.id].length} photo{donationPhotos[item.id].length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              )}

              {/* Timeline Section - Show for CLAIMED, READY_FOR_PICKUP, COMPLETED, NOT_COMPLETED */}
              {(item.status === "CLAIMED" ||
                item.status === "READY_FOR_PICKUP" ||
                item.status === "COMPLETED" ||
                item.status === "NOT_COMPLETED") && (
                <div className="donation-timeline-section">
                  <button
                    className="timeline-toggle-button"
                    onClick={() => toggleTimeline(item.id)}
                  >
                    <Clock size={16} />
                    <span>
                      {expandedTimeline[item.id] ? 'Hide' : 'View'} Donation Timeline
                    </span>
                    <ChevronDown
                      size={16}
                      className={`chevron ${expandedTimeline[item.id] ? 'open' : ''}`}
                    />
                  </button>

                  {expandedTimeline[item.id] && (
                    <div className="timeline-content-wrapper">
                      <DonationTimeline
                        timeline={timelines[item.id] || []}
                        loading={loadingTimelines[item.id]}
                      />
                    </div>
                  )}
                </div>
              )}

              {item.status === "AVAILABLE" ? (
                <div className="donation-actions">
                  <button
                    className="donation-link"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="icon" /> {t('donorListFood.edit')}
                  </button>
                  <button
                    className="donation-link danger"
                    onClick={() => requestDelete(item.id)}
                  >
                    <Trash2 className="icon" /> {t('donorListFood.delete')}
                  </button>
                </div>
              ) : item.status === "NOT_COMPLETED" ? (
                <div className="donation-actions">
                  <button
                    className="donation-action-button primary"
                    onClick={() => alert(t('donorListFood.rescheduleComingSoon'))}
                  >
                    {t('donorListFood.reschedule')}
                  </button>
                  <button
                    className="donation-action-button secondary"
                    onClick={() => handleOpenFeedback(item)}
                  >
                    <Star className="icon" /> LEAVE FEEDBACK
                  </button>
                </div>
              ) : (
                <div className="donation-actions">
                  {item.status === "READY_FOR_PICKUP" && (
                    <button
                      className="donation-action-button primary"
                      onClick={() => handleOpenPickupModal(item)}
                    >
                      {t('donorListFood.enterPickupCode')}
                    </button>
                  )}
                  {item.status === "COMPLETED" && (
                    <>
                    <button
                      className="donation-action-button secondary"
                      disabled
                    >
                      {t('donorListFood.thankYou')}
                    </button>
                    <button
                        className="donation-action-button secondary"
                        onClick={() => handleOpenFeedback(item)}
                      >
                        <Star className="icon" /> LEAVE FEEDBACK
                      </button>
                    </>
                  )}
                  {item.status === "CLAIMED" && (
                    <button className="donation-action-button primary" onClick={() => contactReceiver(item)}>
                      {t('donorListFood.openChat')}
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

      {/* Photo Viewer Modal - Outside of cards */}
      {Object.keys(viewingPhotos).map(donationId => 
        viewingPhotos[donationId] && donationPhotos[donationId]?.length > 0 && (
          <div 
            key={donationId} 
            className="photo-modal-overlay"
            onClick={() => toggleViewPhotos(donationId)}
          >
            <div className="photo-modal-container" onClick={e => e.stopPropagation()}>
              <button
                className="photo-modal-close"
                onClick={() => toggleViewPhotos(donationId)}
              >
                <X size={20} />
              </button>

              <div className="photo-modal-main">
                <button
                  className="photo-nav-btn photo-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto(donationId, 'prev');
                  }}
                  disabled={donationPhotos[donationId].length <= 1}
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="photo-display-wrapper">
                  <img
                    src={donationPhotos[donationId][currentPhotoIndex[donationId] ?? 0]}
                    alt={`Photo ${(currentPhotoIndex[donationId] ?? 0) + 1}`}
                    className="photo-display-image"
                    draggable={false}
                  />
                </div>

                <button
                  className="photo-nav-btn photo-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto(donationId, 'next');
                  }}
                  disabled={donationPhotos[donationId].length <= 1}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="photo-modal-footer">
                <div className="photo-count">
                  {(currentPhotoIndex[donationId] ?? 0) + 1} / {donationPhotos[donationId].length}
                </div>
                <label className="photo-add-btn">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(donationId, e)}
                    style={{ display: 'none' }}
                  />
                  <Upload size={16} />
                  Add More
                </label>
              </div>
            </div>
          </div>
        )
      )}

      <FeedbackModal
        claimId={feedbackClaimId}
        targetUser={feedbackTargetUser}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}
