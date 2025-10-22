import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Edit, Trash2, AlertTriangle, X, Package } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";
// import { AuthContext } from '../../contexts/AuthContext';
import { surplusAPI } from '../../services/api';
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import ConfirmPickupModal from "../DonorDashboard/ConfirmPickupModal";
import ClaimedSuccessModal from "../DonorDashboard/ClaimedSuccessModal";
import "../DonorDashboard/Donor_Styles/DonorListFood.css";

// Define libraries for Google Maps
const libraries = ['places'];

function statusClass(status) {
  switch (status) {
    case "available":
      return "badge badge--available";
    case "ready-for-pickup":
      return "badge badge--ready";
    case "claimed":
      return "badge badge--claimed";
    case "not-completed":
      return "badge badge--not-completed";
    case "completed":
      return "badge badge--completed";
    default:
      return "badge";
  }
}

function addressLabel(full) {
  if (!full) return "";
  const parts = String(full).split(",").map((s) => s.trim());
  if (parts.length <= 2) return full;
  return `${parts[0]}, ${parts[1]}…`;
}

// Format the pickup time range
function formatPickupTime(from, to) {
  if (!from && !to) return 'Flexible';

  try {
    if (from && to) {
      const fromDate = new Date(from);
      const dateStr = fromDate.toLocaleDateString('en-US', { // Format the date
        month: 'short',
        day: 'numeric'
      });
      const fromTime = fromDate.toLocaleTimeString('en-US', { // Format the from time
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const [hours, minutes] = to.split(':');
      const toDate = new Date(fromDate);
      toDate.setHours(parseInt(hours), parseInt(minutes));
      const toTime = toDate.toLocaleTimeString('en-US', { // Format the to time
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `${dateStr}, ${fromTime} – ${toTime}`;
    }

    // Fallback if only one time is available
    if (from) {
      const fromDate = new Date(from);
      const dateStr = fromDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const timeStr = fromDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${dateStr}, ${timeStr}`;
    }

    return to || 'Flexible';
  } catch (error) {
    console.error('Error formatting pickup time:', error);
    return 'Flexible';
  }
}
// Mock data for testing different badge statuses
const MOCK_DATA = [
  {
    id: 1,
    foodName: "Artisan Bread Selection",
    status: "ready-for-pickup",
    foodType: "Bakery",
    quantity: "8",
    unit: "loaves",
    expiryDate: "Oct 5, 2025",
    pickupFrom: "2025-10-05T09:00:00",
    pickupTo: "12:00",
    location: "Westmount Village, Montreal, QC",
    notes: "Fresh sourdough, whole wheat, and gluten-free options. Baked this morning with organic ingredients. Great for sandwiches or toast."
  },
  {
    id: 2,
    foodName: "Dairy & Protein Pack",
    status: "not-completed",
    foodType: "Dairy",
    quantity: "12",
    unit: "items",
    expiryDate: "Oct 2, 2025",
    pickupFrom: "2025-10-02T13:00:00",
    pickupTo: "15:00",
    location: "Old Port, Montreal, QC",
    notes: "Includes organic milk, Greek yogurt, aged cheddar cheese, and free-range eggs. All from local Quebec producers."
  },
  {
    id: 3,
    foodName: "Seasonal Vegetable Mix",
    status: "completed",
    foodType: "Vegetables",
    quantity: "3.5",
    unit: "kg",
    expiryDate: "Oct 10, 2025",
    pickupFrom: "2025-10-10T16:00:00",
    pickupTo: "19:00",
    location: "Plateau Mont-Royal, Montreal, QC",
    notes: "Fresh carrots, bell peppers, zucchini, and tomatoes from local farm. Perfect for stir-fry, soups, or salads. All pesticide-free."
  },
  {
    id: 4,
    foodName: "International Prepared Meals",
    status: "available",
    foodType: "Prepared Meals",
    quantity: "15",
    unit: "portions",
    expiryDate: "Oct 12, 2025",
    pickupFrom: "2025-10-12T17:00:00",
    pickupTo: "20:00",
    location: "Little Italy, Montreal, QC",
    notes: "Homemade Italian pasta dishes, Thai curry, and Indian dal. All vegetarian, properly frozen and labeled. Ready to heat and serve."
  },
  {
    id: 5,
    foodName: "Gourmet Beverages",
    status: "available",
    foodType: "Beverages",
    quantity: "24",
    unit: "bottles",
    expiryDate: "Oct 15, 2025",
    pickupFrom: "2025-10-15T10:00:00",
    pickupTo: "14:00",
    location: "Old Montreal, Montreal, QC",
    notes: "Artisan sodas, fresh juices, herbal teas, and kombucha. Mix of local Quebec brands and specialty imports. All unopened and refrigerated."
  },
  {
    id: 6,
    foodName: "Fresh Bakery Items",
    status: "claimed",
    foodType: "Bakery",
    quantity: "20",
    unit: "items",
    expiryDate: "Oct 8, 2025",
    pickupFrom: "2025-10-08T08:00:00",
    pickupTo: "10:00",
    location: "NDG, Montreal, QC",
    notes: "Assorted pastries, croissants, and muffins from local bakery. Freshly baked yesterday morning."
  }
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
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch posts';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  function requestDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      alert("Post deleted successfully.");
    }
  }

  function openEdit(item) {
    alert(`Opening edit form for: ${item.foodName}\n(Edit functionality to be implemented)`);
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
          <SurplusFormModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
          />
        </LoadScript>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" size={64} />
          <h3 className="empty-state-title">You haven't posted anything yet</h3>
          <p className="empty-state-description">
            Create your first donation post to start helping your community reduce food waste.
          </p>
        </div>
      ) : (
        <section className="donor-list-grid" aria-label="Donations list">
          {items.map((item) => (
            <article key={item.id} className="donation-card" aria-label={item.foodName}>
              <div className="donation-header">
                <h3 className="donation-title">{item.foodName}</h3>
                <span className={statusClass(item.status)}>
                  {item.status === "available"
                    ? "Available"
                    : item.status === "ready-for-pickup"
                      ? "Ready for Pickup"
                      : item.status === "claimed"
                        ? "Claimed"
                        : item.status === "not-completed"
                          ? "Not Completed"
                          : item.status === "completed"
                            ? "Completed"
                            : item.status}
                </span>
              </div>

              {item.foodType && (
                <div className="donation-tags">
                  <span className="donation-tag">{item.foodType}</span>
                </div>
              )}

              <div className="donation-quantity">{item.quantity} {item.unit}</div>

              <ul className="donation-meta" aria-label="details">
                <li>
                  <Calendar size={16} className="calendar-icon" />
                  <span>Expires: {item.expiryDate || 'Not specified'}</span>
                </li>
                <li>
                  <Clock size={16} className="time-icon" />
                  <span>Pickup: {formatPickupTime(item.pickupFrom, item.pickupTo)}</span>
                </li>
                <li>
                  <MapPin size={16} className="location-icon" />
                  {item.location ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="donation-address"
                      title={item.location}
                    >
                      {addressLabel(item.location)}
                    </a>
                  ) : (
                    <span className="donation-address">Address not specified</span>
                  )}
                </li>
              </ul>

              {item.notes && <p className="donation-notes">{item.notes}</p>}

              {(item.status === "available" || item.status === "not-completed") ? (
                <div className="donation-actions">
                  <button className="donation-link" onClick={() => openEdit(item)}>
                    <Edit className="icon" /> Edit
                  </button>
                  <button className="donation-link danger" onClick={() => requestDelete(item.id)}>
                    <Trash2 className="icon" /> Delete
                  </button>
                </div>
              ) : (
                <div className="donation-actions">
                  {item.status === "ready-for-pickup" && (
                    <button 
                      className="donation-action-button primary"
                      onClick={() => handleOpenPickupModal(item)}
                    >
                      ENTER PICKUP CODE
                    </button>
                  )}
                  {item.status === "completed" && (
                    <button className="donation-action-button secondary" disabled>
                      THANK YOU
                    </button>
                  )}
                  {item.status === "claimed" && (
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
