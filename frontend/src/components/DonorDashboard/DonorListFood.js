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
import { LoadScript } from "@react-google-maps/api";
// import { AuthContext } from '../../contexts/AuthContext';
import { surplusAPI } from "../../services/api";
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import ConfirmPickupModal from "../DonorDashboard/ConfirmPickupModal";
import ClaimedSuccessModal from "../DonorDashboard/ClaimedSuccessModal";
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

// Format the pickup time range
function formatPickupTime(pickupDate, pickupFrom, pickupTo) {
  if (!pickupDate) return "Flexible";

  try {
    const date = new Date(pickupDate);
    const dateStr = date.toLocaleDateString("en-US", {
      // Format the date
      month: "short",
      day: "numeric",
    });

    if (pickupFrom && pickupTo) {
      let [hours, minutes] = pickupFrom.split(":");
      date.setHours(parseInt(hours), parseInt(minutes));
      const fromTime = date.toLocaleTimeString("en-US", {
        // Format the to time
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      [hours, minutes] = pickupTo.split(":");
      date.setHours(parseInt(hours), parseInt(minutes));
      const toTime = date.toLocaleTimeString("en-US", {
        // Format the to time
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return `${dateStr}, ${fromTime} – ${toTime}`;
    }

    return `${dateStr}`;
  } catch (error) {
    console.error("Error formatting pickup time:", error);
    return "Flexible";
  }
}
// Mock data for testing different badge statuses
const MOCK_DATA = [
  {
    id: 1,
    title: "Artisan Bread Selection",
    status: "READY_FOR_PICKUP",
    foodCategories: ["BREAD", "BAKED_GOODS", "BAKERY_ITEMS"],
    quantity: { value: 8, unit: "LOAF" },
    expiryDate: "2025-10-05",
    pickupDate: "2025-10-05",
    pickupFrom: "09:00",
    pickupTo: "12:00",
    location: { address: "Westmount Village, Montreal, QC" },
    description:
      "Fresh sourdough, whole wheat, and gluten-free options. Baked this morning with organic ingredients. Great for sandwiches or toast.",
  },
  {
    id: 2,
    title: "Dairy & Protein Pack",
    status: "NOT_COMPLETED",
    foodCategories: ["DAIRY"],
    quantity: { value: 12, unit: "ITEM" },
    expiryDate: "2025-10-02",
    pickupDate: "2025-10-02",
    pickupFrom: "13:00",
    pickupTo: "15:00",
    location: { address: "Old Port, Montreal, QC" },
    description:
      "Includes organic milk, Greek yogurt, aged cheddar cheese, and free-range eggs. All from local Quebec producers.",
  },
  {
    id: 3,
    title: "Seasonal Vegetable Mix",
    status: "COMPLETED",
    foodCategories: ["FRUITS_VEGETABLES"],
    quantity: { value: 3.5, unit: "KILOGRAM" },
    expiryDate: "2025-10-10",
    pickupDate: "2025-10-10",
    pickupFrom: "16:00",
    pickupTo: "19:00",
    location: { address: "Plateau Mont-Royal, Montreal, QC" },
    description:
      "Fresh carrots, bell peppers, zucchini, and tomatoes from local farm. Perfect for stir-fry, soups, or salads. All pesticide-free.",
  },
  {
    id: 4,
    title: "International Prepared Meals",
    status: "AVAILABLE",
    foodCategories: ["PREPARED_MEALS"],
    quantity: { value: 15, unit: "PORTION" },
    expiryDate: "2025-10-12",
    pickupDate: "2025-10-12",
    pickupFrom: "17:00",
    pickupTo: "20:00",
    location: { address: "Little Italy, Montreal, QC" },
    description:
      "Homemade Italian pasta dishes, Thai curry, and Indian dal. All vegetarian, properly frozen and labeled. Ready to heat and serve.",
  },
  {
    id: 5,
    title: "Gourmet Beverages",
    status: "AVAILABLE",
    foodCategories: ["BEVERAGES"],
    quantity: { value: 24, unit: "BOTTLE" },
    expiryDate: "2025-10-15",
    pickupDate: "2025-10-15",
    pickupFrom: "10:00",
    pickupTo: "14:00",
    location: { address: "Old Montreal, Montreal, QC" },
    description:
      "Artisan sodas, fresh juices, herbal teas, and kombucha. Mix of local Quebec brands and specialty imports. All unopened and refrigerated.",
  },
  {
    id: 6,
    title: "Fresh Bakery Items",
    status: "CLAIMED",
    foodCategories: ["BAKERY_ITEMS"],
    quantity: { value: 20, unit: "ITEM" },
    expiryDate: "2025-10-08",
    pickupDate: "2025-10-08",
    pickupFrom: "08:00",
    pickupTo: "10:00",
    location: { address: "NDG, Montreal, QC" },
    description:
      "Assorted pastries, croissants, and muffins from local bakery. Freshly baked yesterday morning.",
  },
];

// Toggle between mock data and real API
const USE_MOCK_DATA = false; // Set to false to use real API

export default function DonorListFood() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Use mock data
      setTimeout(() => {
        setItems(MOCK_DATA);
        setLoading(false);
      }, 500); // Simulate loading delay
    } else {
      // Use real API
      fetchMyPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function requestDelete(id) {
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

  const handleModalClose = () => {
    setIsModalOpen(false);
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
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
        >
          <button
            className="donor-add-button"
            onClick={() => setIsModalOpen(true)}
          >
            + Donate More
          </button>
          <SurplusFormModal isOpen={isModalOpen} onClose={handleModalClose} />
        </LoadScript>
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
                  {item.foodCategories.map((category, index) => (
                    <span key={index} className="donation-tag">
                      {category.name ? category.name : category}{" "}
                      {/* Handles objects or plain strings */}
                    </span>
                  ))}
                </div>
              )}

              <div className="donation-quantity">
                {item.quantity.value} {item.quantity.unit}
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
                  <MapPin size={16} className="location-icon" />
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
