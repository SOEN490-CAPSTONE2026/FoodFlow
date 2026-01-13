import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Package2, UtensilsCrossed, Sprout, ArrowRight, BarChart3, PlusCircle, Sparkles, Star } from "lucide-react";
import { surplusAPI, feedbackAPI } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";
import "./Donor_Styles/DonorWelcome.css";

export default function DonorWelcome() {
  const navigate = useNavigate();
  const { organizationName } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalDonations: 0,
    mealsServed: 0,
    co2Saved: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    // Fetch donor information and statistics
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {

      // Fetch all donations from the backend
      const response = await surplusAPI.getMyPosts();
      
      if (response && response.data) {
        const donations = response.data;
        console.log('📦 Donor donations response:', donations);
        console.log('📦 First donation detailed:', donations[0]);
        
        // Calculate statistics
        const totalDonations = donations.length;
        
        // Calculate meals served (estimate: each donation serves ~5 meals on average)
        const mealsServed = donations.reduce((total, donation) => {
          // Try to parse quantity, default to 1 if not available
          const quantity = parseFloat(donation.quantity) || 1;
          return total + (quantity * 5); // Rough estimate
        }, 0);
        
        // Calculate CO2 saved (estimate: ~0.5kg CO2 per meal)
        const co2Saved = Math.round((mealsServed * 0.5) * 10) / 10;
        
        // Fetch rating data
        let averageRating = 0;
        let totalReviews = 0;
        try {
          const ratingResponse = await feedbackAPI.getMyRating();
          if (ratingResponse && ratingResponse.data) {
            averageRating = ratingResponse.data.averageRating || 0;
            totalReviews = ratingResponse.data.totalReviews || 0;
          }
        } catch (err) {
          console.error('Failed to fetch rating:', err);
        }

        setStats({
          totalDonations,
          mealsServed: Math.round(mealsServed),
          co2Saved,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews
        });

        // Format recent donations (last 4)
        const recentDonations = donations
          .sort((a, b) => new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
          .slice(0, 4)
          .map(donation => {
            // Format date
            const date = new Date(donation.createdAt || donation.pickupDate);
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            // Get recipient or show status
            console.log('🔍 Donation receiver info:', {
              receiverOrganization: donation.receiverOrganization,
              receiverName: donation.receiverName,
              receiverEmail: donation.receiverEmail,
              status: donation.status,
              id: donation.id
            });
            
            const recipient = donation.receiverOrganization || 
                            donation.receiverName || 
                            "Not claimed yet";

            // Items is just the title
            const items = donation.title || "Food donation";

            // Map status to display text
            let status = "Available";
            if (donation.status === "COMPLETED") status = "Completed";
            else if (donation.status === "CLAIMED") status = "Claimed";
            else if (donation.status === "READY_FOR_PICKUP") status = "Ready for Pickup";
            else if (donation.status === "NOT_COMPLETED") status = "Not Completed";
            else if (donation.status === "EXPIRED") status = "Expired";
            else if (donation.status === "AVAILABLE") status = "Available";

            return {
              date: dateStr,
              recipient,
              items,
              status
            };
          });

        setRecentDonations(recentDonations);
      }
    } catch (error) {
      console.error("Error fetching donor data:", error);
      // Set default mock data for development if API fails
      setStats({
        totalDonations: 0,
        mealsServed: 0,
        co2Saved: 0,
        averageRating: 0,
        totalReviews: 0
      });
      setRecentDonations([]);
    }
  };

  const handleCreateDonation = () => {
    navigate("/donor/list");
  };

  const handleViewReports = () => {
    navigate("/donor/dashboard");
  };

  const handleViewAll = () => {
    navigate("/donor/list");
  };

  return (
    <div className="donor-welcome-page">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>
          Welcome back, {organizationName || 'Donor'}
          <Sparkles className="wave-icon" size={28} strokeWidth={2} />
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package2 size={24} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Donations</div>
            <div className="stat-value">{stats.totalDonations}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <UtensilsCrossed size={24} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Meals Served</div>
            <div className="stat-value">{stats.mealsServed}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Sprout size={24} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <div className="stat-label">CO₂ Saved</div>
            <div className="stat-value">{stats.co2Saved} kg</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Star size={24} strokeWidth={2} fill="currentColor" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Your Rating</div>
            <div className="stat-value">
              {stats.totalReviews > 0 ? (
                <>
                  {stats.averageRating.toFixed(1)}
                  <span className="rating-count">★ ({stats.totalReviews})</span>
                </>
              ) : (
                <span className="no-rating">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="action-cards-grid">
        <div className="action-card">
          <div className="action-icon-wrapper">
            <div className="action-icon teal">
              <PlusCircle size={24} strokeWidth={2} />
            </div>
            <div className="action-text">
              <h3>Donate Food</h3>
              <p>Submit a new donation to share with community organizations</p>
            </div>
          </div>
          <button className="action-btn primary" onClick={handleCreateDonation}>
            Create Donation
          </button>
        </div>

        <div className="action-card">
          <div className="action-icon-wrapper">
            <div className="action-icon green">
              <BarChart3 size={24} strokeWidth={2} />
            </div>
            <div className="action-text">
              <h3>Impact Reports</h3>
              <p>View detailed statistics about your donation impact</p>
            </div>
          </div>
          <button className="action-btn secondary" onClick={handleViewReports}>
            View Reports
          </button>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="recent-donations-section">
        <div className="section-header">
          <h2>Recent Donations</h2>
          {recentDonations.length > 0 && (
            <button className="view-all-btn" onClick={handleViewAll}>
              View All <ArrowRight size={16} />
            </button>
          )}
        </div>

        {recentDonations.length === 0 ? (
          <div className="empty-state">
            <Package2 size={48} strokeWidth={1.5} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
            <p style={{ color: '#6B7280', margin: 0 }}>No donations yet. Create your first donation to get started!</p>
          </div>
        ) : (
          <div className="donations-table">
            {recentDonations.map((donation, index) => (
              <div key={index} className="donation-row">
                <div className="donation-date">{donation.date}</div>
                <div className="donation-recipient">{donation.recipient}</div>
                <div className="donation-items">{donation.items}</div>
                <div className={`donation-status ${
                  donation.status === "Completed" ? "completed" : 
                  donation.status === "Claimed" ? "claimed" :
                  donation.status === "Ready for Pickup" ? "pending" :
                  donation.status === "Available" ? "available" :
                  donation.status === "Expired" || donation.status === "Not Completed" ? "expired" : 
                  "pending"
                }`}>
                  {donation.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
