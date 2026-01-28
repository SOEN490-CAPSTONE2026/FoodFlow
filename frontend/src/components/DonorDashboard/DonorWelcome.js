import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Package2, UtensilsCrossed, Sprout, ArrowRight, BarChart3, PlusCircle, Sparkles, Star } from "lucide-react";
import { surplusAPI, feedbackAPI } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";
import "./Donor_Styles/DonorWelcome.css";

export default function DonorWelcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { organizationName } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalDonations: 0,
    mealsServed: 0,
    co2Saved: 0,
    averageRating: 0,
    totalReviews: 0,
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
          return total + quantity * 5; // Rough estimate
        }, 0);

        // Calculate CO2 saved (estimate: ~0.5kg CO2 per meal)
        const co2Saved = Math.round(mealsServed * 0.5 * 10) / 10;

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
          totalReviews,
        });

        // Format recent donations (last 4)
        const recentDonations = donations
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.pickupDate) -
              new Date(a.createdAt || a.pickupDate)
          )
          .slice(0, 4)
          .map(donation => {
            // Format date
            const date = new Date(donation.createdAt || donation.pickupDate);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            // Get recipient or show status
            console.log('🔍 Donation receiver info:', {
              receiverOrganization: donation.receiverOrganization,
              receiverName: donation.receiverName,
              receiverEmail: donation.receiverEmail,
              status: donation.status,
              id: donation.id,
            });

            const recipient = donation.claimant?.organizationName || 
                            donation.claimant?.name || 
                            t('donorWelcome.noNameYet');

            // Items is just the title
            const items = donation.title || t('donorWelcome.foodDonation');

            // Map status to display text
            let status = t('donorWelcome.status.available');
            if (donation.status === "COMPLETED") status = t('donorWelcome.status.completed');
            else if (donation.status === "CLAIMED") status = t('donorWelcome.status.claimed');
            else if (donation.status === "READY_FOR_PICKUP") status = t('donorWelcome.status.readyForPickup');
            else if (donation.status === "NOT_COMPLETED") status = t('donorWelcome.status.notCompleted');
            else if (donation.status === "EXPIRED") status = t('donorWelcome.status.expired');
            else if (donation.status === "AVAILABLE") status = t('donorWelcome.status.available');

            return {
              date: dateStr,
              recipient,
              items,
              status,
            };
          });

        setRecentDonations(recentDonations);
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      // Set default mock data for development if API fails
      setStats({
        totalDonations: 0,
        mealsServed: 0,
        co2Saved: 0,
        averageRating: 0,
        totalReviews: 0,
      });
      setRecentDonations([]);
    }
  };

  const handleCreateDonation = () => {
    navigate('/donor/list');
  };

  const handleViewReports = () => {
    navigate('/donor/dashboard');
  };

  const handleViewAll = () => {
    navigate('/donor/list');
  };

  return (
    <div className="donor-welcome-page">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>
          {t('donorWelcome.welcomeBack', { name: organizationName || 'Donor' })}
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
            <div className="stat-label">{t('donorWelcome.totalDonations')}</div>
            <div className="stat-value">{stats.totalDonations}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <UtensilsCrossed size={24} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('donorWelcome.mealsServed')}</div>
            <div className="stat-value">{stats.mealsServed}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Sprout size={24} strokeWidth={2} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('donorWelcome.co2Saved')}</div>
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
                  <div className="rating-number">
                    {stats.averageRating.toFixed(1)}
                  </div>
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
              <h3>{t('donorWelcome.donateFood.title')}</h3>
              <p>{t('donorWelcome.donateFood.description')}</p>
            </div>
          </div>
          <button className="action-btn primary" onClick={handleCreateDonation}>
            {t('donorWelcome.donateFood.button')}
          </button>
        </div>

        <div className="action-card">
          <div className="action-icon-wrapper">
            <div className="action-icon green">
              <BarChart3 size={24} strokeWidth={2} />
            </div>
            <div className="action-text">
              <h3>{t('donorWelcome.impactReports.title')}</h3>
              <p>{t('donorWelcome.impactReports.description')}</p>
            </div>
          </div>
          <button className="action-btn secondary" onClick={handleViewReports}>
            {t('donorWelcome.impactReports.button')}
          </button>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="recent-donations-section">
        <div className="section-header">
          <h2>{t('donorWelcome.recentDonations')}</h2>
          {recentDonations.length > 0 && (
            <button className="view-all-btn" onClick={handleViewAll}>
              {t('donorWelcome.viewAll')} <ArrowRight size={16} />
            </button>
          )}
        </div>

        {recentDonations.length === 0 ? (
          <div className="empty-state">
            <Package2 size={48} strokeWidth={1.5} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
            <p style={{ color: '#6B7280', margin: 0 }}>{t('donorWelcome.noDonationsYet')}</p>
          </div>
        ) : (
          <div className="donations-table">
            {recentDonations.map((donation, index) => (
              <div key={index} className="donation-row">
                <div className="donation-date">{donation.date}</div>
                <div className="donation-recipient">{donation.recipient}</div>
                <div className="donation-items">{donation.items}</div>
                <div className={`donation-status ${
                  donation.status === t('donorWelcome.status.completed') ? "completed" : 
                  donation.status === t('donorWelcome.status.claimed') ? "claimed" :
                  donation.status === t('donorWelcome.status.readyForPickup') ? "pending" :
                  donation.status === t('donorWelcome.status.available') ? "available" :
                  donation.status === t('donorWelcome.status.expired') || donation.status === t('donorWelcome.status.notCompleted') ? "expired" : 
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
