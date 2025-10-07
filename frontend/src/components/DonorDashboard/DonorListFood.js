// DonorListFood.jsx
import React from "react";
import "./Dashboards.css";
import "./DonorListFood.css";

export default function DonorListFood({
  items = [],
  loading = false,
  saving = false,
  onCreate = async () => {},
  onDelete = async () => {},
}) {
  const [form, setForm] = React.useState({
    title: "",
    category: "Prepared Meals",
    qty: 1,
    unit: "kg",
    pickupWindow: "",
    location: "",
    expiresAt: "",
  });

  function onChange(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function clearForm() {
    setForm({
      title: "",
      category: "Prepared Meals",
      qty: 1,
      unit: "kg",
      pickupWindow: "",
      location: "",
      expiresAt: "",
    });
  }

  async function save() {
    if (!form.title.trim() || !form.location.trim()) {
      alert("Please fill in required fields: Title and Location");
      return;
    }
    
    await onCreate({
      title: form.title,
      category: form.category,
      quantity: Number(form.qty),
      unit: form.unit,
      pickupWindow: form.pickupWindow,
      location: form.location,
      expiresAt: form.expiresAt || null,
    });
    clearForm();
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      await onDelete(id);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateTime(dateString) {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "st-active";
      case "Pending":
        return "st-pending";
      case "Completed":
        return "st-claimed";
      case "Expired":
        return "st-closed";
      default:
        return "st-closed";
    }
  };

  return (
    <div className="donor-list-food">
      {/* Create New Listing Card */}
      <div className="card listing-form-card">
        <h3 className="section-title">Create New Food Listing</h3>
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Food Title *</label>
              <input
                className="input"
                placeholder="e.g., Fresh Bread, Assorted Vegetables..."
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => onChange("category", e.target.value)}
              >
                <option value="Prepared Meals">Prepared Meals</option>
                <option value="Produce">Produce</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
                <option value="Packaged Goods">Packaged Goods</option>
                <option value="Beverages">Beverages</option>
                <option value="Meat">Meat</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                className="input"
                value={form.qty}
                onChange={(e) => onChange("qty", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Unit *</label>
              <select
                className="input"
                value={form.unit}
                onChange={(e) => onChange("unit", e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="boxes">boxes</option>
                <option value="units">units</option>
                <option value="liters">liters</option>
                <option value="packages">packages</option>
                <option value="other">other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiration Date/Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.expiresAt}
                onChange={(e) => onChange("expiresAt", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Pickup Window</label>
              <input
                className="input"
                placeholder="e.g., 3-6 PM, 9 AM-12 PM"
                value={form.pickupWindow}
                onChange={(e) => onChange("pickupWindow", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Pickup Location *</label>
            <input
              className="input"
              placeholder="Full address or specific location details"
              value={form.location}
              onChange={(e) => onChange("location", e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn ghost" onClick={clearForm} disabled={saving}>
              Clear Form
            </button>
            <button className="btn secondary" onClick={save} disabled={saving}>
              {saving ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </div>
      </div>

      {/* My Listings Card */}
      <div className="card listings-card">
        <div className="listings-header">
          <h3 className="section-title">My Listings</h3>
          <span className="listings-count">{items.length} listing(s)</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading listings...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            
            <h4>No listings yet</h4>
            <p>Create your first food listing to get started!</p>
          </div>
        ) : (
          <div className="listings-grid">
            {items.map((item) => (
              <div key={item.id} className="listing-item">
                <div className="listing-header">
                  <h4 className="listing-title">{item.title}</h4>
                  <span className={`status-badge ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="listing-details">
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{item.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">
                      {item.qty} {item.unit}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">
                      {item.expiresAt ? formatDateTime(item.expiresAt) : "Not specified"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Pickup:</span>
                    <span className="detail-value">{item.pickupWindow || "Flexible"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{item.location}</span>
                  </div>
                </div>

                <div className="listing-actions">
                  <span className="created-date">Created: {formatDate(item.createdAt)}</span>
                  <button
                    className="btn ghost small danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- helpers (module-local) ----
function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status) {
  switch (status) {
    case "Active":
      return "st-active";
    case "Pending":
      return "st-pending";
    case "Completed":
      return "st-claimed";
    case "Expired":
      return "st-closed";
    default:
      return "st-closed";
  }
}
