import React from "react";
import "./Dashboards.css";
import "./DonorListFood.css";
const H = () => ({ 
  "Content-Type": "application/json", 
  ...(localStorage.token ? {Authorization:`Bearer ${localStorage.token}`} : {}) 
});

// Mock data for demonstration
const mockListings = [
  {
    id: 1,
    title: "Fresh Bread and Pastries",
    category: "Bakery",
    qty: 5,
    unit: "boxes",
    expiresAt: "2024-02-15T18:00",
    pickupWindow: "3-6 PM",
    location: "123 Main St, Kitchen",
    status: "Active",
    createdAt: "2024-02-10T10:00"
  },
  {
    id: 2,
    title: "Assorted Vegetables",
    category: "Produce",
    qty: 10,
    unit: "kg",
    expiresAt: "2024-02-12T12:00",
    pickupWindow: "9 AM-12 PM",
    location: "456 Oak Ave, Storage",
    status: "Pending",
    createdAt: "2024-02-11T14:30"
  }
];

async function fetchListings(){ 
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ 
        items: mockListings, 
        total: mockListings.length 
      });
    }, 500);
  });
}

async function createListing(payload){ 
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      const newListing = {
        id: Date.now(),
        ...payload,
        status: "Active",
        createdAt: new Date().toISOString()
      };
      mockListings.unshift(newListing);
      resolve({ ok: true, data: newListing });
    }, 500);
  });
}

async function deleteListing(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = mockListings.findIndex(item => item.id === id);
      if (index > -1) {
        mockListings.splice(index, 1);
      }
      resolve({ ok: true });
    }, 300);
  });
}

export default function DonorListFood(){
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ 
    title: "", 
    category: "Prepared Meals", 
    qty: 1, 
    unit: "kg", 
    pickupWindow: "", 
    location: "", 
    expiresAt: "" 
  });

  React.useEffect(() => { 
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);
    try {
      const r = await fetchListings();
      setItems(r.items || []);
      setTotal(r.total || 0);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  }

  function onChange(k, v) { 
    setForm(f => ({ ...f, [k]: v })); 
  }

  function clearForm() {
    setForm({
      title: "", 
      category: "Prepared Meals", 
      qty: 1, 
      unit: "kg", 
      pickupWindow: "", 
      location: "", 
      expiresAt: ""
    });
  }

  async function save() {
    if (!form.title.trim() || !form.location.trim()) {
      alert("Please fill in required fields: Title and Location");
      return;
    }

    setSaving(true);
    try {
      await createListing({
        title: form.title, 
        category: form.category, 
        quantity: Number(form.qty), 
        unit: form.unit,
        pickupWindow: form.pickupWindow, 
        location: form.location, 
        expiresAt: form.expiresAt
      });
      await loadListings(); // Reload listings
      clearForm();
      alert("Listing created successfully!");
    } catch (error) {
      console.error("Failed to create listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteListing(id);
        await loadListings(); // Reload listings
        alert("Listing deleted successfully!");
      } catch (error) {
        console.error("Failed to delete listing:", error);
        alert("Failed to delete listing. Please try again.");
      }
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'st-active';
      case 'Pending': return 'st-pending';
      case 'Completed': return 'st-claimed';
      case 'Expired': return 'st-closed';
      default: return 'st-closed';
    }
  };

  return (
    <div className="donor-list-food">
      {/* Create New Listing Card */}
      <div className="ff-card listing-form-card">
        <h3 className="section-title">Create New Food Listing</h3>
        <div className="ff-form">
          <div className="form-row">
            <div className="form-group">
              <label>Food Title *</label>
              <input 
                className="ff-input" 
                placeholder="e.g., Fresh Bread, Assorted Vegetables..." 
                value={form.title} 
                onChange={e => onChange("title", e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="ff-input" value={form.category} onChange={e => onChange("category", e.target.value)}>
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
                className="ff-input" 
                value={form.qty} 
                onChange={e => onChange("qty", e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Unit *</label>
              <select className="ff-input" value={form.unit} onChange={e => onChange("unit", e.target.value)}>
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
                className="ff-input" 
                value={form.expiresAt} 
                onChange={e => onChange("expiresAt", e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Pickup Window</label>
              <input 
                className="ff-input" 
                placeholder="e.g., 3-6 PM, 9 AM-12 PM" 
                value={form.pickupWindow} 
                onChange={e => onChange("pickupWindow", e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Pickup Location *</label>
            <input 
              className="ff-input" 
              placeholder="Full address or specific location details" 
              value={form.location} 
              onChange={e => onChange("location", e.target.value)} 
            />
          </div>

          <div className="form-actions">
            <button 
              className="ff-btn ghost" 
              onClick={clearForm}
              disabled={saving}
            >
              Clear Form
            </button>
            <button 
              className="ff-btn secondary" 
              onClick={save}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </div>
      </div>

      {/* My Listings Card */}
      <div className="ff-card listings-card">
        <div className="listings-header">
          <h3 className="section-title">My Listings</h3>
          <span className="listings-count">{items.length} listing(s)</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading listings...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
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
                    <span className="detail-value">{item.qty} {item.unit}</span>
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
                  <span className="created-date">
                    Created: {formatDate(item.createdAt)}
                  </span>
                  <button 
                    className="ff-btn ghost small danger"
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