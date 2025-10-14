
import React from "react";
import "./Receiver_Styles/ReceiverDashboard.css";

// Helper: compute doughnut segments for the SVG donuts
const calculateDoughnut = (data = []) => {
  const total = data.reduce((sum, item) => sum + (item.value ?? 0), 0) || 1;
  const circumference = 2 * Math.PI * 45; // r=45
  let currentOffset = 0;

  const segments = data.map((item) => {
    const pct = (item.value ?? 0) / total;
    const offset = currentOffset;
    currentOffset += pct;
    return {
      ...item,
      strokeDasharray: circumference,
      strokeDashoffset: circumference - circumference * pct,
      offset: offset * circumference,
    };
  });

  return { segments, total };
};

export default function ReceiverDashboardHome({ stats, chartData }) {
  
  if (!stats || !chartData) {
    return (
      <div className="dashboard-home">
        <h1>Dashboard</h1>
        <p className="subtitle">No data provided.</p>
      </div>
    );
  }

  const statusDoughnut = calculateDoughnut(chartData.requestStatus);
  const foodDoughnut = calculateDoughnut(chartData.foodCategories);

  const maxBarValue = Math.max(...(chartData.monthlyDonations || []).map(d => d.value || 0), 1);
  const maxTrendValue = Math.max(...(chartData.weeklyTrends || []).map(d => d.value || 0), 1);

  return (
    <div className="dashboard-home">
      <h1>Dashboard</h1>
      <p className="subtitle">Overview of your requests</p>

      {/* Quick Metrics as tiles */}
      <div className="tile-grid" style={{ marginBottom: 20 }}>
        <div className="tile sky">
          <h3>Total Listed Food</h3>
          <div className="big">{stats.totalListed ?? 0}</div>
        </div>
        <div className="tile green">
          <h3>Completed Requests</h3>
          <div className="big">{stats.completed ?? 0}</div>
        </div>
        <div className="tile navy">
          <h3>Pending Requests</h3>
          <div className="big">{stats.newRequests ?? 0}</div>
        </div>
        <div className="tile ice">
          <h3>Rejected Requests</h3>
          <div className="big">{stats.rejected ?? 0}</div>
        </div>
        <div className="tile mint">
          <h3>All Requests</h3>
          <div className="big">{stats.allRequests ?? 0}</div>
        </div>
        <div className="tile ice">
          <h3>Tips</h3>
          <p className="regular-text">Check expiry dates and request early.</p>
        </div>
      </div>

      {/* Charts */}
      <div className="tile-grid" style={{ height: "auto" }}>
        {/* Monthly Activity (Bar) */}
        <div className="card">
          <h3>Monthly Activity</h3>
          <div className="css-bar-chart">
            {(chartData.monthlyDonations || []).map((item, index) => (
              <div key={index} className="bar-container">
                <div
                  className="bar"
                  style={{ height: `${(item.value / maxBarValue) * 100}%` }}
                >
                  <span className="bar-value">{item.value}</span>
                </div>
                <div className="bar-label">{item.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Status (Doughnut) */}
        <div className="card">
          <h3>Request Status Distribution</h3>
          <div className="css-doughnut">
            <svg className="doughnut-svg" viewBox="0 0 100 100">
              <circle className="doughnut-circle-bg" cx="50" cy="50" r="45" />
              {statusDoughnut.segments.map((segment, index) => (
                <circle
                  key={index}
                  className="doughnut-circle"
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={segment.color}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                />
              ))}
            </svg>
            <div className="doughnut-center">
              <div className="doughnut-total">{statusDoughnut.total}</div>
              <div className="doughnut-label">Total</div>
            </div>
          </div>
          <div className="doughnut-legend">
            {(chartData.requestStatus || []).map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }} />
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trends (Line) */}
        <div className="card">
          <h3>Request Trends</h3>
          <div className="css-line-chart">
            <div className="line-chart-grid">
              {[...Array(5)].map((_, i) => <div key={i} className="grid-line" />)}
            </div>
            <svg viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(40, 167, 69, 0.3)" />
                  <stop offset="100%" stopColor="rgba(40, 167, 69, 0.05)" />
                </linearGradient>
              </defs>
              <path
                className="line-area"
                d={`
                  M 0,200 
                  L 0,${200 - ((chartData.weeklyTrends?.[0]?.value || 0) / maxTrendValue) * 200}
                  ${(chartData.weeklyTrends || [])
                    .map((item, i) =>
                      `L ${(i / ((chartData.weeklyTrends.length - 1) || 1)) * 400},${
                        200 - (item.value / maxTrendValue) * 200
                      }`
                    )
                    .join(" ")}
                  L 400,200
                  Z
                `}
                fill="url(#areaGradient)"
              />
              <path
                className="line-path"
                d={`
                  M 0,${200 - ((chartData.weeklyTrends?.[0]?.value || 0) / maxTrendValue) * 200}
                  ${(chartData.weeklyTrends || [])
                    .map((item, i) =>
                      `L ${(i / ((chartData.weeklyTrends.length - 1) || 1)) * 400},${
                        200 - (item.value / maxTrendValue) * 200
                      }`
                    )
                    .join(" ")}
                `}
              />
            </svg>
            <div className="line-points">
              {(chartData.weeklyTrends || []).map((item, i) => (
                <div
                  key={i}
                  className="line-point"
                  style={{
                    left: `${(i / ((chartData.weeklyTrends.length - 1) || 1)) * 100}%`,
                    top: `${100 - (item.value / maxTrendValue) * 100}%`,
                  }}
                />
              ))}
            </div>
            <div className="line-labels">
              {(chartData.weeklyTrends || []).map((item, i) => (
                <div key={i} className="line-label">
                  {item.week}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Food Categories (Doughnut) */}
        <div className="card">
          <h3>Food Categories</h3>
          <div className="css-doughnut">
            <svg className="doughnut-svg" viewBox="0 0 100 100">
              <circle className="doughnut-circle-bg" cx="50" cy="50" r="45" />
              {foodDoughnut.segments.map((segment, index) => (
                <circle
                  key={index}
                  className="doughnut-circle"
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={segment.color}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                />
              ))}
            </svg>
            <div className="doughnut-center">
              <div className="doughnut-total">100%</div>
              <div className="doughnut-label">Distribution</div>
            </div>
          </div>
          <div className="doughnut-legend">
            {(chartData.foodCategories || []).map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }} />
                <span>
                  {item.category} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
