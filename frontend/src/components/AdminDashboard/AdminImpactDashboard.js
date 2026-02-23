import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  Repeat,
  Settings,
  X,
  Utensils,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import './Admin_Styles/AdminImpactDashboard.css';

export default function AdminImpactDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('ALL_TIME');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    foodSaved: false,
    co2Reduced: false,
    mealsDonated: false,
    waterSaved: false,
    activeDonors: true,
    activeReceivers: true,
    completedDonations: true,
    completionRate: true,
  });

  const metricLabels = useMemo(
    () => ({
      foodSaved: t('impactDashboard.foodWeight', 'Food Saved'),
      co2Reduced: t('impactDashboard.co2Avoided', 'CO2 Reduced'),
      mealsDonated: t('impactDashboard.mealsProvided', 'Meals Donated'),
      waterSaved: t('impactDashboard.waterSaved', 'Water Saved'),
      activeDonors: t('impactDashboard.activeDonors', 'Active Donors'),
      activeReceivers: t('impactDashboard.activeReceivers', 'Active Receivers'),
      completedDonations: t('impactDashboard.completed', 'Completed Donations'),
      completionRate: t('impactDashboard.completionRate', 'Completion Rate'),
    }),
    [t]
  );

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await impactDashboardAPI.getMetrics(dateRange);
        setMetrics(response?.data || null);
      } catch (err) {
        console.error('Error fetching impact metrics:', err);
        setError(
          t(
            'impactDashboard.loadError',
            'Unable to load impact metrics. Please try again.'
          )
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [dateRange, t]);

  const handleExport = async () => {
    try {
      const response = await impactDashboardAPI.exportMetrics(dateRange);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `platform-impact-metrics-${dateRange.toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting metrics:', err);
      setError(
        t('impactDashboard.exportError', 'Unable to export metrics right now.')
      );
    }
  };

  const toggleMetric = metric => {
    setVisibleMetrics(prev => {
      const currentCount = Object.values(prev).filter(Boolean).length;
      const isCurrentlyChecked = prev[metric];

      // If trying to check a new metric and already at max (4), don't allow it
      if (!isCurrentlyChecked && currentCount >= 4) {
        return prev;
      }

      return { ...prev, [metric]: !prev[metric] };
    });
  };

  const selectAllMetrics = () => {
    // Select only first 4 metrics
    setVisibleMetrics({
      foodSaved: false,
      co2Reduced: false,
      mealsDonated: false,
      waterSaved: false,
      activeDonors: true,
      activeReceivers: true,
      completedDonations: true,
      completionRate: true,
    });
  };

  const clearAllMetrics = () => {
    setVisibleMetrics({
      foodSaved: false,
      co2Reduced: false,
      mealsDonated: false,
      waterSaved: false,
      activeDonors: false,
      activeReceivers: false,
      completedDonations: false,
      completionRate: false,
    });
  };

  // Get only the first 4 visible metrics
  const getDisplayedMetrics = () => {
    const visibleKeys = Object.entries(visibleMetrics)
      .filter(([_, value]) => value)
      .map(([key, _]) => key)
      .slice(0, 4);

    return Object.fromEntries(visibleKeys.map(key => [key, true]));
  };

  const displayedMetrics = getDisplayedMetrics();

  // Build chart data from time series
  const timeSeriesChartData = useMemo(() => {
    if (
      !metrics?.foodSavedTimeSeries ||
      metrics.foodSavedTimeSeries.length === 0
    ) {
      return [];
    }
    return metrics.foodSavedTimeSeries.map(point => ({
      date: point.label,
      foodKg: parseFloat(point.foodWeightKg?.toFixed(2) || 0),
    }));
  }, [metrics]);

  // Build comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        name: t('impactDashboard.impactMetrics', 'Impact Metrics'),
        foodKg: parseFloat(metrics.totalFoodWeightKg?.toFixed(2) || 0),
        co2Kg: parseFloat(metrics.co2EmissionsAvoidedKg?.toFixed(2) || 0),
        waterL: parseFloat((metrics.waterSavedLiters / 1000)?.toFixed(2) || 0), // Convert to thousands
        meals: metrics.estimatedMealsProvided || 0,
      },
    ];
  }, [metrics, t]);

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
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="impact-dashboard-modern">
      {/* Header Controls */}
      <div className="dashboard-controls">
        <button
          className="customize-btn"
          onClick={() => setShowCustomizeModal(true)}
        >
          <Settings size={18} />
          {t('impactDashboard.customizeMetrics', 'Customize Metrics')}
          <span className="badge-count">
            {Object.values(visibleMetrics).filter(Boolean).length}
          </span>
        </button>

        <div className="controls-right">
          <select
            className="date-range-selector"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
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

          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            {t('impactDashboard.export', 'Export CSV')}
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="metrics-cards-grid">
        {displayedMetrics.foodSaved && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper green">
                <Package size={24} />
              </div>
              <h3>{t('impactDashboard.totalFoodSaved', 'Total Food Saved')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.totalFoodWeightKg?.toFixed(2) || '0.00'}
                <span className="metric-unit">kg</span>
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.co2Reduced && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper eco">
                <Leaf size={24} />
              </div>
              <h3>{t('impactDashboard.co2Avoided', 'CO₂ Reduced')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.co2EmissionsAvoidedKg?.toFixed(2) || '0.00'}
                <span className="metric-unit">kg</span>
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.mealsDonated && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper meals">
                <Utensils size={24} />
              </div>
              <h3>{t('impactDashboard.mealsProvided', 'Meals Provided')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.estimatedMealsProvided || 0}
              </div>
              <p className="metric-subtext">
                ~{metrics?.peopleFedEstimate || 0}{' '}
                {t('impactDashboard.peopleFed', 'people fed')}
              </p>
            </div>
          </div>
        )}

        {displayedMetrics.waterSaved && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper water">
                <Droplets size={24} />
              </div>
              <h3>{t('impactDashboard.waterSaved', 'Water Saved')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.waterSavedLiters?.toFixed(0) || '0'}
                <span className="metric-unit">L</span>
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.activeDonors && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper people">
                <Users size={24} />
              </div>
              <h3>{t('impactDashboard.activeDonors', 'Active Donors')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.activeDonors || 0}
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.activeReceivers && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper people">
                <Users size={24} />
              </div>
              <h3>
                {t('impactDashboard.activeReceivers', 'Active Receivers')}
              </h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.activeReceivers || 0}
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.completedDonations && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper completed">
                <CheckCircle size={24} />
              </div>
              <h3>{t('impactDashboard.completed', 'Completed Donations')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.totalDonationsCompleted || 0}
              </div>
            </div>
          </div>
        )}

        {displayedMetrics.completionRate && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper rate">
                <TrendingUp size={24} />
              </div>
              <h3>{t('impactDashboard.completionRate', 'Completion Rate')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.donationCompletionRate?.toFixed(1) || '0.0'}
                <span className="metric-unit">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {timeSeriesChartData.length > 0 && (
        <div className="charts-section">
          <h2>
            {t('impactDashboard.foodSavedOverTime', 'Food Saved Over Time')}
          </h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesChartData}>
                <defs>
                  <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#64748b"
                  label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={value => `Date: ${value}`}
                  formatter={value => [`${value} kg`, 'Food Saved']}
                />
                <Area
                  type="monotone"
                  dataKey="foodKg"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFood)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Impact Metrics Comparison */}
      <div className="charts-section">
        <h2>{t('impactDashboard.impactOverview', 'Impact Overview')}</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Bar
                dataKey="foodKg"
                name="Food (kg)"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="co2Kg"
                name="CO₂ Saved (kg)"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="waterL"
                name="Water Saved (1000L)"
                fill="#06b6d4"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="meals"
                name="Meals"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary">
        <h2>{t('impactDashboard.platformActivity', 'Platform Activity')}</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.totalPosts', 'Total Posts Created')}
            </span>
            <span className="summary-value">
              {metrics?.totalPostsCreated || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.totalClaims', 'Total Claims Made')}
            </span>
            <span className="summary-value">
              {metrics?.totalClaimsMade || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.repeatDonors', 'Repeat Donors')}
            </span>
            <span className="summary-value">{metrics?.repeatDonors || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.repeatReceivers', 'Repeat Receivers')}
            </span>
            <span className="summary-value">
              {metrics?.repeatReceivers || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Customize Metrics Modal */}
      {showCustomizeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCustomizeModal(false)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {t('impactDashboard.customizeMetrics', 'Customize Metrics')}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowCustomizeModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                {t(
                  'impactDashboard.selectMetrics',
                  'Select which metrics you want to display on your dashboard (maximum 4):'
                )}
              </p>
              <div className="metrics-checkboxes">
                {Object.entries(visibleMetrics).map(([key, value]) => {
                  const selectedCount =
                    Object.values(visibleMetrics).filter(Boolean).length;
                  const isDisabled = !value && selectedCount >= 4;

                  return (
                    <label key={key} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleMetric(key)}
                        disabled={isDisabled}
                      />
                      <span>{metricLabels[key] || key}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={selectAllMetrics} className="btn-secondary">
                {t('impactDashboard.selectAll', 'Select All')}
              </button>
              <button onClick={clearAllMetrics} className="btn-secondary">
                {t('impactDashboard.clearAll', 'Clear All')}
              </button>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="btn-primary"
              >
                {t('impactDashboard.done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
