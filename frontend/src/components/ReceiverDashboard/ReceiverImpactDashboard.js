import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Leaf,
  Droplets,
  Users,
  Package,
  Download,
  Calendar,
  Settings,
  CheckCircle,
  Utensils,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { impactDashboardAPI } from '../../services/api';
import '../DonorDashboard/Donor_Styles/DonorImpactDashboard.css';

export default function ReceiverImpactDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('DAYS_30');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState({
    foodWeight: true,
    co2Avoided: true,
    mealsProvided: true,
    waterSaved: true,
    peopleFed: false,
    claimsCompleted: false,
    totalClaims: false,
  });
  const metricLabels = useMemo(
    () => ({
      foodWeight: t('impactDashboard.foodWeight', 'Food Claimed'),
      co2Avoided: t('impactDashboard.co2Avoided', 'CO₂ Avoided'),
      mealsProvided: t('impactDashboard.mealsProvided', 'Meals Provided'),
      waterSaved: t('impactDashboard.waterSaved', 'Water Saved'),
      peopleFed: t('impactDashboard.peopleFed', 'People Fed'),
      claimsCompleted: t('impactDashboard.claimsCompleted', 'Claims Completed'),
      totalClaims: t('impactDashboard.totalClaims', 'Total Claims'),
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
        link.download = `receiver-impact-metrics-${dateRange.toLowerCase()}.csv`;
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
      foodWeight: true,
      co2Avoided: true,
      mealsProvided: true,
      waterSaved: true,
      peopleFed: false,
      claimsCompleted: false,
      totalClaims: false,
    });
  };

  const clearAllMetrics = () => {
    setVisibleMetrics({
      foodWeight: false,
      co2Avoided: false,
      mealsProvided: false,
      waterSaved: false,
      peopleFed: false,
      claimsCompleted: false,
      totalClaims: false,
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

  // Build chart data from time series
  const chartData = useMemo(() => {
    const rawSeries = Array.isArray(metrics?.foodSavedTimeSeries)
      ? metrics.foodSavedTimeSeries
      : [];
    return rawSeries.map((point, index) => ({
      month: point?.label || `${index + 1}`,
      claims: Number(point?.foodWeightKg) || 0,
    }));
  }, [metrics?.foodSavedTimeSeries]);

  const getChartTitle = () => {
    if (dateRange === 'DAYS_7') {
      return t('impactDashboard.foodSavedByDay', 'Food Saved by Day');
    } else if (dateRange === 'DAYS_30') {
      return t('impactDashboard.foodSavedByWeek', 'Food Saved by Week');
    } else {
      return t('impactDashboard.foodSavedByMonth', 'Food Saved by Month');
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
        {/* Food Weight Card */}
        {displayedMetrics.foodWeight && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper green">
                <Package size={24} />
              </div>
              <h3>{t('impactDashboard.foodClaimed', 'Food Claimed')}</h3>
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

        {/* CO2 Avoided Card */}
        {displayedMetrics.co2Avoided && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper eco">
                <Leaf size={24} />
              </div>
              <h3>{t('impactDashboard.co2Avoided', 'CO₂ Avoided')}</h3>
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

        {/* Meals Provided Card */}
        {displayedMetrics.mealsProvided && (
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
              {renderTrend(metrics?.mealsVsPreviousPct)}
            </div>
          </div>
        )}

        {/* Water Saved Card */}
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

        {/* People Fed Card */}
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

        {/* Claims Completed Card */}
        {displayedMetrics.claimsCompleted && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper completed">
                <CheckCircle size={24} />
              </div>
              <h3>
                {t('impactDashboard.claimsCompleted', 'Claims Completed')}
              </h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.totalDonationsCompleted || 0}
              </div>
              {renderTrend(metrics?.weightVsPreviousPct)}
            </div>
          </div>
        )}

        {/* Total Claims Card */}
        {displayedMetrics.totalClaims && (
          <div className="metric-card-modern">
            <div className="metric-header">
              <div className="metric-icon-wrapper completed">
                <Package size={24} />
              </div>
              <h3>{t('impactDashboard.totalClaims', 'Total Claims')}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value-large">
                {metrics?.totalClaimsMade || 0}
              </div>
              {renderTrend(metrics?.weightVsPreviousPct)}
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <h2>{getChartTitle()}</h2>
        <div className="chart-container">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="claims" fill="#5eb3b7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart-message">
              {t('impactDashboard.noChartData', 'No data for selected period')}
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="activity-summary">
        <h2>{t('impactDashboard.activitySummary', 'Activity Summary')}</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.totalClaims', 'Total Claims')}
            </span>
            <span className="summary-value">
              {metrics?.totalClaimsMade || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.peopleFed', 'People Fed (estimate)')}
            </span>
            <span className="summary-value">
              {metrics?.peopleFedEstimate || 0}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.co2Avoided', 'CO₂ Avoided')}
            </span>
            <span className="summary-value">
              {metrics?.co2EmissionsAvoidedKg?.toFixed(2) || '0.00'} kg
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.waterSaved', 'Water Saved')}
            </span>
            <span className="summary-value">
              {metrics?.waterSavedLiters?.toFixed(0) || '0'} L
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
