import React, { useState } from 'react';
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
import '../DonorDashboard/Donor_Styles/DonorImpactDashboard.css';

export default function ReceiverImpactDashboard() {
  const { t } = useTranslation();
  const [metrics] = useState({
    foodClaimed: 5873,
    co2Avoided: 52481,
    mealsProvided: 14683,
    waterSaved: 5873332,
    peopleFed: 7342,
    claimsCompleted: 171,
    totalClaims: 171,
  });
  const [loading] = useState(false);
  const [error] = useState(null);
  const [dateRange, setDateRange] = useState('WEEKLY');
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

  // Dynamic chart data based on date range
  const getChartData = () => {
    const today = new Date();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (dateRange === 'WEEKLY') {
      // Last 7 days with actual dates
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        return {
          month: `${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`,
          claims: Math.floor(Math.random() * 6) + 3, // Random 3-8
        };
      });
    } else if (dateRange === 'MONTHLY') {
      // Last 30 days grouped by week (4 weeks)
      return Array.from({ length: 4 }, (_, i) => {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        return {
          month: `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()} ${weekEnd.getFullYear()}`,
          claims: Math.floor(Math.random() * 20) + 25, // Random 25-44
        };
      }).reverse();
    } else {
      // Last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(today);
        date.setMonth(today.getMonth() - (5 - i));
        return {
          month: `${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`,
          claims: Math.floor(Math.random() * 20) + 20, // Random 20-39
        };
      });
    }
  };

  const chartData = getChartData();

  const getChartTitle = () => {
    if (dateRange === 'WEEKLY') {
      return t('impactDashboard.claimsByDay', 'Claims by Day');
    } else if (dateRange === 'MONTHLY') {
      return t('impactDashboard.claimsByWeek', 'Claims by Week');
    } else {
      return t('impactDashboard.claimsByMonth', 'Claims by Month');
    }
  };

  const handleExport = () => {
    const csvContent = `Metric,Value\nFood Claimed,${metrics.foodClaimed} kg\nCO2 Avoided,${metrics.co2Avoided} kg\nMeals Provided,${metrics.mealsProvided}\nClaims Completed,${metrics.claimsCompleted}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receiver-dashboard-${dateRange.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

  // Get only the first 4 visible metrics
  const getDisplayedMetrics = () => {
    const visibleKeys = Object.entries(visibleMetrics)
      .filter(([_, value]) => value)
      .map(([key, _]) => key)
      .slice(0, 4);

    return Object.fromEntries(visibleKeys.map(key => [key, true]));
  };

  const displayedMetrics = getDisplayedMetrics();

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
              {t('impactDashboard.weekly', 'Last 7 days')}
            </option>
            <option value="MONTHLY">
              {t('impactDashboard.monthly', 'Last 30 days')}
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
                {metrics.foodClaimed.toLocaleString()}
                <span className="metric-unit"> kg</span>
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +15% vs previous period
              </div>
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
                {metrics.co2Avoided.toLocaleString()}
                <span className="metric-unit"> kg</span>
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +2% vs previous period
              </div>
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
                {metrics.mealsProvided.toLocaleString()}
              </div>
              <div className="metric-trend negative">
                <TrendingDown size={14} />
                -4% vs previous period
              </div>
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
                {metrics.waterSaved.toLocaleString()}
                <span className="metric-unit"> L</span>
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +12% vs previous period
              </div>
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
                {metrics.peopleFed.toLocaleString()}
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +8% vs previous period
              </div>
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
                {metrics.claimsCompleted}
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +5% vs previous period
              </div>
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
              <div className="metric-value-large">{metrics.totalClaims}</div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                +5% vs previous period
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claims by Month Chart */}
      <div className="chart-section">
        <h2>{getChartTitle()}</h2>
        <div className="chart-container">
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
            <span className="summary-value">{metrics.totalClaims}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.peopleFed', 'People Fed (estimate)')}
            </span>
            <span className="summary-value">
              {metrics.peopleFed.toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.co2Avoided', 'CO₂ Avoided')}
            </span>
            <span className="summary-value">
              {metrics.co2Avoided.toLocaleString()} kg
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">
              {t('impactDashboard.waterSaved', 'Water Saved')}
            </span>
            <span className="summary-value">
              {metrics.waterSaved.toLocaleString()} L
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
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.foodWeight}
                    onChange={() => toggleMetric('foodWeight')}
                    disabled={
                      !visibleMetrics.foodWeight &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>
                    {t('impactDashboard.foodWeight', 'Food Weight Saved')}
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.mealsProvided}
                    onChange={() => toggleMetric('mealsProvided')}
                    disabled={
                      !visibleMetrics.mealsProvided &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>
                    {t('impactDashboard.mealsProvided', 'Meals Provided')}
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.co2Avoided}
                    onChange={() => toggleMetric('co2Avoided')}
                    disabled={
                      !visibleMetrics.co2Avoided &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>{t('impactDashboard.co2Avoided', 'CO₂ Avoided')}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.waterSaved}
                    onChange={() => toggleMetric('waterSaved')}
                    disabled={
                      !visibleMetrics.waterSaved &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>{t('impactDashboard.waterSaved', 'Water Saved')}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.peopleFed}
                    onChange={() => toggleMetric('peopleFed')}
                    disabled={
                      !visibleMetrics.peopleFed &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>{t('impactDashboard.peopleFed', 'People Fed')}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.claimsCompleted}
                    onChange={() => toggleMetric('claimsCompleted')}
                    disabled={
                      !visibleMetrics.claimsCompleted &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>
                    {t('impactDashboard.claimsCompleted', 'Claims Completed')}
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.totalClaims}
                    onChange={() => toggleMetric('totalClaims')}
                    disabled={
                      !visibleMetrics.totalClaims &&
                      Object.values(visibleMetrics).filter(Boolean).length >= 4
                    }
                  />
                  <span>
                    {t('impactDashboard.totalClaims', 'Total Claims')}
                  </span>
                </label>
              </div>
              <div className="modal-actions">
                <button onClick={selectAllMetrics} className="btn-secondary">
                  {t('common.selectAll', 'Select All')}
                </button>
                <button onClick={clearAllMetrics} className="btn-secondary">
                  {t('common.clearAll', 'Clear All')}
                </button>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="btn-primary"
                >
                  {t('common.done', 'Done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
