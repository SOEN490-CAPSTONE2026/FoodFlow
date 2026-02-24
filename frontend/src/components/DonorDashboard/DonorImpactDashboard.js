import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Leaf,
  Utensils,
  Droplets,
  Users,
  Calendar,
  Download,
  Settings,
  X,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { impactDashboardAPI } from '../../services/api';
import './Donor_Styles/DonorImpactDashboard.css';

export default function DonorImpactDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('DAYS_30');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    foodSaved: true,
    co2Reduced: true,
    mealsDonated: true,
    waterSaved: true,
    peopleFed: true,
    completedDonations: true,
    completionRate: true,
    activeDays: true,
  });
  const metricLabels = useMemo(
    () => ({
      foodSaved: t('impactDashboard.foodWeight', 'Food Saved'),
      co2Reduced: t('impactDashboard.co2Avoided', 'CO2 Reduced'),
      mealsDonated: t('impactDashboard.mealsProvided', 'Meals Donated'),
      waterSaved: t('impactDashboard.waterSaved', 'Water Saved'),
      peopleFed: t('impactDashboard.peopleFed', 'People Fed'),
      completedDonations: t('impactDashboard.completed', 'Completed Donations'),
      completionRate: t('impactDashboard.completionRate', 'Completion Rate'),
      activeDays: t('impactDashboard.activeDays', 'Active Days'),
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

  const handleExport = () => {
    impactDashboardAPI
      .exportMetrics(dateRange)
      .then(response => {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `impact-metrics-${dateRange.toLowerCase()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setError(
          t(
            'impactDashboard.exportError',
            'Unable to export metrics right now.'
          )
        );
      });
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
      foodSaved: true,
      co2Reduced: true,
      mealsDonated: true,
      waterSaved: true,
      peopleFed: false,
      completedDonations: false,
      completionRate: false,
      activeDays: false,
    });
  };

  const clearAllMetrics = () => {
    setVisibleMetrics({
      foodSaved: false,
      co2Reduced: false,
      mealsDonated: false,
      waterSaved: false,
      peopleFed: false,
      completedDonations: false,
      completionRate: false,
      activeDays: false,
    });
  };

  const renderTrend = pctValue => {
    if (pctValue === null || pctValue === undefined) {
      return (
        <div className="metric-trend neutral">
          {t('impactDashboard.noPreviousData', 'No previous-period data')}
        </div>
      );
    }
    const positive = pctValue >= 0;
    return (
      <div className={`metric-trend ${positive ? 'positive' : 'negative'}`}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {positive ? '+' : ''}
        {pctValue.toFixed(1)}%{' '}
        {t('impactDashboard.vsPrevious', 'vs previous period')}
      </div>
    );
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
  const chartSeries = useMemo(() => {
    const rawSeries = Array.isArray(metrics?.foodSavedTimeSeries)
      ? metrics.foodSavedTimeSeries
      : [];
    return rawSeries.map((point, index) => ({
      label: point?.label || `${index + 1}`,
      value: Number(point?.foodWeightKg) || 0,
    }));
  }, [metrics?.foodSavedTimeSeries]);

  const chartGeometry = useMemo(() => {
    if (!chartSeries.length) {
      return null;
    }

    const width = 1000;
    const height = 300;
    const horizontalPadding = 30;
    const verticalPadding = 30;
    const maxValue = Math.max(...chartSeries.map(point => point.value), 0);
    const range = maxValue > 0 ? maxValue : 1;
    const usableWidth = width - horizontalPadding * 2;
    const usableHeight = height - verticalPadding * 2;

    const points = chartSeries.map((point, index) => {
      const x =
        chartSeries.length === 1
          ? width / 2
          : horizontalPadding +
            (index * usableWidth) / (chartSeries.length - 1);
      const y =
        verticalPadding + ((range - point.value) / range) * usableHeight;
      return { ...point, x, y };
    });

    const linePoints = points.map(point => `${point.x},${point.y}`).join(' ');
    const areaPoints = [
      `${points[0].x},${height - verticalPadding}`,
      linePoints,
      `${points[points.length - 1].x},${height - verticalPadding}`,
    ].join(' ');

    return { points, linePoints, areaPoints };
  }, [chartSeries]);

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
        </button>

        <div className="controls-right">
          <select
            className="date-range-selector"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          >
            <option value="DAYS_7">
              {t('impactDashboard.days7', '7 Days')}
            </option>
            <option value="DAYS_30">
              {t('impactDashboard.days30', '30 Days')}
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
              <h3>{t('impactDashboard.foodWeight', 'Food Saved')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.totalFoodWeightKg?.toFixed(2) || '0.00'}
                <span className="metric-unit">kg</span>
              </div>
              {renderTrend(metrics?.weightVsPreviousPct)}
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
              {renderTrend(metrics?.co2VsPreviousPct)}
            </div>
          </div>
        )}

        {displayedMetrics.mealsDonated && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper meals">
                <Utensils size={24} />
              </div>
              <h3>{t('impactDashboard.mealsProvided', 'Meals Donated')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.estimatedMealsProvided || 0}
              </div>
              {renderTrend(metrics?.mealsVsPreviousPct)}
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
              {renderTrend(metrics?.waterVsPreviousPct)}
            </div>
          </div>
        )}

        {displayedMetrics.peopleFed && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper people">
                <Users size={24} />
              </div>
              <h3>{t('impactDashboard.peopleFed', 'People Fed')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.peopleFedEstimate || 0}
              </div>
              {renderTrend(metrics?.mealsVsPreviousPct)}
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
              {renderTrend(metrics?.weightVsPreviousPct)}
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
              {renderTrend(metrics?.weightVsPreviousPct)}
            </div>
          </div>
        )}

        {displayedMetrics.activeDays && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper days">
                <Calendar size={24} />
              </div>
              <h3>{t('impactDashboard.activeDays', 'Active Days')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.activeDonationDays || 0}
              </div>
              {renderTrend(metrics?.weightVsPreviousPct)}
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <h2>
          {t('impactDashboard.foodSavedOverTime', 'Food Saved Over Time')}
        </h2>
        <div className="chart-container">
          {chartGeometry ? (
            <svg viewBox="0 0 1000 300" className="line-chart">
              <defs>
                <linearGradient
                  id="chartGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgba(52, 152, 219, 0.4)" />
                  <stop offset="100%" stopColor="rgba(52, 152, 219, 0.0)" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#3498db"
                strokeWidth="3"
                points={chartGeometry.linePoints}
              />
              <polygon
                fill="url(#chartGradient)"
                points={chartGeometry.areaPoints}
              />
            </svg>
          ) : (
            <div className="empty-chart-message">
              {t('impactDashboard.noChartData', 'No data for selected period')}
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary">
        <h2>{t('impactDashboard.activityStats', 'Activity Summary')}</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.totalPosts', 'Total Donations')}
            </span>
            <span className="summary-value">
              {metrics?.totalPostsCreated || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.pendingPickups', 'Pending Pickups')}
            </span>
            <span className="summary-value">
              {metrics?.pendingPickups || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.activeReceivers', 'Active Receivers')}
            </span>
            <span className="summary-value">
              {metrics?.activeReceivers || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.avgResponseTime', 'Avg Response Time')}
            </span>
            <span className="summary-value">
              {metrics?.avgResponseTime || 0}h
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.cancelledDonations', 'Cancelled Donations')}
            </span>
            <span className="summary-value">
              {metrics?.cancelledDonations || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.impactScore', 'Total Impact Score')}
            </span>
            <span className="summary-value">{metrics?.impactScore || 0}</span>
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
        </div>
      )}
    </div>
  );
}
