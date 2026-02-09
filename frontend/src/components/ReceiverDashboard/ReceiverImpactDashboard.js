import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { impactDashboardAPI } from '../../services/api';
import {
  TrendingUp,
  Leaf,
  Droplets,
  Users,
  Package,
  Award,
  Download,
  Calendar,
} from 'lucide-react';
import '../DonorDashboard/DonorImpactDashboard.css';

export default function ReceiverImpactDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('ALL_TIME');

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await impactDashboardAPI.getMetrics(dateRange);
      setMetrics(response.data);
    } catch (err) {
      console.error('Error fetching impact metrics:', err);
      setError(t('impactDashboard.errorLoading', 'Failed to load metrics'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await impactDashboardAPI.exportMetrics(dateRange);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `impact-metrics-${dateRange.toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting metrics:', err);
      alert(t('impactDashboard.exportError', 'Failed to export metrics'));
    }
  };

  if (loading) {
    return (
      <div className="impact-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="impact-dashboard">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchMetrics} className="retry-button">
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="impact-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <TrendingUp size={32} />
            {t('impactDashboard.title', 'Your Impact Dashboard')}
          </h1>
          <p className="subtitle">
            {t(
              'impactDashboard.receiverSubtitle',
              'See the environmental and social impact of the food you have received'
            )}
          </p>
        </div>

        <div className="header-controls">
          <div className="date-range-selector">
            <Calendar size={18} />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="date-range-dropdown"
            >
              <option value="WEEKLY">
                {t('impactDashboard.weekly', 'Last 7 Days')}
              </option>
              <option value="MONTHLY">
                {t('impactDashboard.monthly', 'Last 30 Days')}
              </option>
              <option value="ALL_TIME">
                {t('impactDashboard.allTime', 'All Time')}
              </option>
            </select>
          </div>

          <button onClick={handleExport} className="export-button">
            <Download size={18} />
            {t('impactDashboard.export', 'Export CSV')}
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Food Weight Card */}
        <div className="metric-card primary">
          <div className="metric-icon">
            <Package size={28} />
          </div>
          <div className="metric-content">
            <h3>{t('impactDashboard.foodReceived', 'Food Received')}</h3>
            <p className="metric-value">
              {metrics?.totalFoodWeightKg?.toFixed(2) || '0.00'}
              <span className="metric-unit"> kg</span>
            </p>
          </div>
        </div>

        {/* Meals Provided Card */}
        <div className="metric-card success">
          <div className="metric-icon">
            <Users size={28} />
          </div>
          <div className="metric-content">
            <h3>{t('impactDashboard.mealsServed', 'Meals Served')}</h3>
            <p className="metric-value">
              {metrics?.estimatedMealsProvided || 0}
              <span className="metric-unit"> meals</span>
            </p>
            <p className="metric-subtext">
              ~{metrics?.peopleFedEstimate || 0}{' '}
              {t('impactDashboard.peopleFed', 'people fed')}
            </p>
          </div>
        </div>

        {/* CO2 Saved Card */}
        <div className="metric-card eco">
          <div className="metric-icon">
            <Leaf size={28} />
          </div>
          <div className="metric-content">
            <h3>{t('impactDashboard.co2Avoided', 'CO₂ Emissions Avoided')}</h3>
            <p className="metric-value">
              {metrics?.co2EmissionsAvoidedKg?.toFixed(2) || '0.00'}
              <span className="metric-unit"> kg</span>
            </p>
          </div>
        </div>

        {/* Water Saved Card */}
        <div className="metric-card water">
          <div className="metric-icon">
            <Droplets size={28} />
          </div>
          <div className="metric-content">
            <h3>{t('impactDashboard.waterSaved', 'Water Saved')}</h3>
            <p className="metric-value">
              {metrics?.waterSavedLiters?.toFixed(0) || '0'}
              <span className="metric-unit"> liters</span>
            </p>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="activity-section">
        <h2>
          <Award size={24} />
          {t('impactDashboard.activityStats', 'Activity Statistics')}
        </h2>
        <div className="activity-grid">
          <div className="stat-item">
            <span className="stat-label">
              {t('impactDashboard.totalClaims', 'Total Claims Made')}
            </span>
            <span className="stat-value">{metrics?.totalClaimsMade || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">
              {t('impactDashboard.completedClaims', 'Claims Completed')}
            </span>
            <span className="stat-value">
              {metrics?.totalDonationsCompleted || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Impact Message */}
      <div className="impact-message">
        <div className="message-content">
          <h3>
            {t(
              'impactDashboard.thankYou',
              'Thank you for making a difference! 🎉'
            )}
          </h3>
          <p>
            {t(
              'impactDashboard.receiverMessage',
              'By claiming food donations, you are helping reduce food waste and supporting your community. Together we make an impact!'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
