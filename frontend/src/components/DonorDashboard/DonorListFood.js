import React, { useState, useEffect, useContext } from "react";
import { Calendar, Clock, MapPin, Edit, Trash2, AlertTriangle, X, Package } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";
import { AuthContext } from '../../contexts/AuthContext';
import { surplusAPI } from '../../services/api';
import SurplusFormModal from "../DonorDashboard/SurplusFormModal";
import "../DonorDashboard/Donor_Styles/DonorListFood.css";

// Define libraries for Google Maps
const libraries = ['places'];

function statusClass(status) {
  switch (status) {
    case "available":
      return "badge badge--ok";
    case "expiring-soon":
      return "badge badge--warn";
    case "claimed":
      return "badge badge--muted";
    case "expired":
      return "badge badge--danger";
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
export default function DonorListFood() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

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
                <span
                  className={statusClass(item.status)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor:
                      item.status === "available" ? '#dcfce7' :
                        item.status === "expiring-soon" ? '#e98e64ff' :
                          item.status === "claimed" ? '#dbeafe' :
                            item.status === "expired" ? '#fee2e2' : '#f3f4f6',
                    color:
                      item.status === "available" ? '#166534' :
                        item.status === "expiring-soon" ? '#9a3412' :
                          item.status === "claimed" ? '#1e40af' :
                            item.status === "expired" ? '#991b1b' : '#374151',
                  }}
                >
                  {item.status === "expiring-soon" && <AlertTriangle size={16} />}
                  {item.status === "available"
                    ? "Available"
                    : item.status === "expiring-soon"
                      ? "Expiring Soon"
                      : item.status === "claimed"
                        ? "Claimed"
                        : "Expired"}
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

              <div className="donation-actions">
                <button className="donation-link" onClick={() => openEdit(item)}>
                  <Edit className="icon" /> Edit
                </button>
                <button className="donation-link danger" onClick={() => requestDelete(item.id)}>
                  <Trash2 className="icon" /> Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
