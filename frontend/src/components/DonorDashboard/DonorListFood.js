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
} from "lucide-react";
import { useLoadScript } from "@react-google-maps/api";
// import { AuthContext } from '../../contexts/AuthContext';
import { surplusAPI } from "../../services/api";
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import ConfirmPickupModal from "../DonorDashboard/ConfirmPickupModal";
import ClaimedSuccessModal from "../DonorDashboard/ClaimedSuccessModal";
import "../DonorDashboard/Donor_Styles/DonorListFood.css";

// Define libraries for Google Maps
const libraries = ["places"];

// Food category mapping from enum values to display labels
const foodCategoryLabels = {
  PREPARED_MEALS: "Prepared Meals",
  BAKERY_PASTRY: "Bakery & Pastry",
  FRUITS_VEGETABLES: "Fruits & Vegetables",
  PACKAGED_PANTRY: "Packaged / Pantry Items",
  DAIRY_COLD: "Dairy & Cold Items",
  FROZEN: "Frozen Food",
};

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

// Helper function to format quantity text (singular/plural)
function formatQuantityText(value, unit) {
  const numValue = parseFloat(value);
  const unitLower = unit.toLowerCase();
  
  // If value is 1, make unit singular
  if (numValue === 1) {
    // For units ending in 's', remove the 's' for singular
    if (unitLower.endsWith('s')) {
      return `${value} ${unitLower.slice(0, -1)}`;
    }
    return `${value} ${unitLower}`;
  }
  
  // For values other than 1, ensure plural form
  // If unit doesn't end in 's', add 's' for plural
  if (!unitLower.endsWith('s')) {
    return `${value} ${unitLower}s`;
  }
  
  return `${value} ${unitLower}`;
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

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await surplusAPI.getMyPosts();
      setItems(response.data);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch posts";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  function requestDelete(id) { //Needs to be connected to backend(code to come)
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (confirmDelete) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      alert("Post deleted successfully.");
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
                    // Map to display label, fallback to formatted version if not in mapping
                    const displayLabel = foodCategoryLabels[categoryValue] || 
                      categoryValue.replace(/_/g, ' ').toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    
                    return (
                      <span key={index} className="donation-tag">
                        {displayLabel}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="donation-quantity">
                {formatQuantityText(item.quantity.value, item.quantity.unit)}
              </div>

              <ul className="donation-meta" aria-label="details">
                <li>
                  <Calendar size={16} className="calendar-icon" />
                  <span>Expires: {item.expiryDate || "Not specified"}</span>
                </li>
                <li>
                  <Clock size={16} className="time-icon" />
                  <span>
                    Pickup:{" "}
                    {formatPickupTime(
                      item.pickupDate,
                      item.pickupFrom,
                      item.pickupTo
                    )}
                  </span>
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

              {item.status === "AVAILABLE" ||
                item.status === "NOT_COMPLETED" ? (
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