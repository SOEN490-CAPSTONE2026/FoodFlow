import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Edit, Trash2, AlertTriangle, X } from "lucide-react";
import SurplusFormModal from "./SurplusFormModal";
import "../style/DonorListFood.css";

const initialDonations = [
  {
    id: 1,
    title: "Fresh Apples",
    tags: ["Fruits", "Organic"],
    quantity: "5 kg",
    status: "available",
    expiry: "Expires Oct 8, 2025",
    time: "2:00–5:00 PM",
    location: "1380 Sherbrooke St W, Montreal, QC H3G 1J5, Canada",
    notes:
      "Crisp and sweet Red Delicious apples, perfect for snacking or baking. Freshly picked this week from local orchard.",
  },
  {
    id: 2,
    title: "Artisan Bread Selection",
    tags: ["Bakery", "Gluten-Free", "Whole Grain"],
    quantity: "8 loaves",
    status: "expiring-soon",
    expiry: "Expires Oct 5, 2025",
    time: "9:00 AM–12:00 PM",
    location: "5035 Rue Saint-Denis, Montréal, QC H2J 2L8, Canada",
    notes:
      "Fresh sourdough, whole wheat, and gluten-free options. Baked this morning with organic ingredients. Great for sandwiches or toast.",
  },
  {
    id: 3,
    title: "Seasonal Vegetable Mix",
    tags: ["Vegetables", "Organic", "Local"],
    quantity: "3.5 kg",
    status: "claimed",
    expiry: "Expires Oct 10, 2025",
    time: "4:00–7:00 PM",
    location: "400 Boulevard de Maisonneuve O, Montréal, QC H3A 1L4, Canada",
    notes:
      "Fresh carrots, bell peppers, zucchini, and tomatoes from local farm. Perfect for stir fry, soups, or salads. All pesticide-free.",
  },
  {
    id: 4,
    title: "Dairy & Protein Pack",
    tags: ["Dairy", "Protein", "Refrigerated"],
    quantity: "12 items",
    status: "expired",
    expiry: "Expires Oct 2, 2025",
    time: "1:00–3:00 PM",
    location: "2000 Notre-Dame St W, Montréal, QC H3J 1N4, Canada",
    notes:
      "Includes organic milk, Greek yogurt, aged cheddar cheese, and free-range eggs. All from local Quebec producers.",
  },
];

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
  if (!full) return '';
  const parts = String(full).split(',').map((s) => s.trim());
  if (parts.length <= 2) return full; 
  return `${parts[0]}, ${parts[1]}…`;
}

export default function DonorListFood() {
  const [items, setItems] = useState(initialDonations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const titleRef = useRef(null);

  function requestDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      alert("Post deleted successfully.");
    }
  }

  function openEdit(item) {
    alert(`Opening edit form for: ${item.title}\n(You will add the actual form here later.)`);
  }

  return (
    <div className="dlf-wrap">
   
      <header className="dlf-header">
        <button 
          className="dlf-cta"
          onClick={() => setIsModalOpen(true)}
        >
          + Donate More
        </button>
      </header>

      <SurplusFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />


      <section className="dlf-grid" aria-label="Donations list">
        {items.map((d) => (
          <article key={d.id} className="dc-card" aria-label={d.title}>
  
            <div className="dc-head">
              <h3 className="dc-title">{d.title}</h3>
              <span className={statusClass(d.status)}>
                {d.status === "expiring-soon" && <AlertTriangle className="dc-icon" />}
                {d.status === "available"
                  ? "Available"
                  : d.status === "expiring-soon"
                  ? "Expiring Soon"
                  : d.status === "claimed"
                  ? "Claimed"
                  : "Expired"}
              </span>
            </div>


            {d.tags?.length > 0 && (
              <div className="dc-tags">
                {d.tags.map((t) => (
                  <span key={t} className="dc-chip">{t}</span>
                ))}
              </div>
            )}


            <div className="dc-qty">{d.quantity}</div>


            <ul className="dc-meta" aria-label="details">
              <li>
                <Calendar className="dc-icon" />
                <span>{d.expiry}</span>
              </li>
              <li>
                <Clock className="dc-icon" />
                <span>{d.time}</span>
              </li>
              <li>
                <MapPin className="dc-icon" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dc-link--address"
                  title={d.location}
                >
                  {addressLabel(d.location)}
                </a>
              </li>
            </ul>


            {d.notes && <p className="dc-desc">{d.notes}</p>}


            <div className="dc-actions">
              <button className="dc-link" onClick={() => openEdit(d)}>
                <Edit className="dc-icon" /> Edit
              </button>
              <button className="dc-link dc-link--danger" onClick={() => requestDelete(d.id)}>
                <Trash2 className="dc-icon" /> Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
