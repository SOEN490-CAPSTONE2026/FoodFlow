import React from "react";
import "./Dashboards.css";

// Mock data functions
async function fetchTileStats() {
  return { 
    totalListed: 12, 
    completed: 8, 
    rejected: 2, 
    allRequests: 10, 
    newRequests: 3 
  };
}

async function fetchChartData() {
  return {
    monthlyDonations: [
      { month: 'Jan', value: 3 },
      { month: 'Feb', value: 5 },
      { month: 'Mar', value: 2 },
      { month: 'Apr', value: 8 },
      { month: 'May', value: 4 },
      { month: 'Jun', value: 7 },
      { month: 'Jul', value: 6 }
    ],
    requestStatus: [
      { status: 'Completed', value: 8, color: '#28a745' },
      { status: 'Pending', value: 2, color: '#ffc107' },
      { status: 'Rejected', value: 2, color: '#dc3545' }
    ],
    foodCategories: [
      { category: 'Produce', value: 35, color: '#4a9cc9' },
      { category: 'Dairy', value: 25, color: '#28a745' },
      { category: 'Bakery', value: 20, color: '#083041' },
      { category: 'Meat', value: 15, color: '#b2ebf2' },
      { category: 'Prepared', value: 5, color: '#e0f7fa' }
    ],
    weeklyTrends: [
      { week: 'Week 1', value: 3 },
      { week: 'Week 2', value: 7 },
      { week: 'Week 3', value: 5 },
      { week: 'Week 4', value: 9 }
    ]
  };
}

// Helper function to calculate doughnut chart values
const calculateDoughnut = (data) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const circumference = 2 * Math.PI * 45; // radius 45
  let currentOffset = 0;
  
  const segments = data.map(item => {
    const percentage = item.value / total;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage);
    const offset = currentOffset;
    currentOffset += percentage;
    
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset: circumference - (circumference * percentage),
      offset: offset * circumference
    };
  });
  
  return { segments, total };
};

export default function DonorDashboardHome() {
  const [stats, setStats] = React.useState(null);
  const [chartData, setChartData] = React.useState(null);

  React.useEffect(() => { 
    (async() => {
      setStats(await fetchTileStats());
      setChartData(await fetchChartData());
    })(); 
  }, []);

  if (!chartData) {
    return <div>Loading...</div>;
  }

  const statusDoughnut = calculateDoughnut(chartData.requestStatus);
  const foodDoughnut = calculateDoughnut(chartData.foodCategories);

  // Calculate max value for bar chart scaling
  const maxBarValue = Math.max(...chartData.monthlyDonations.map(d => d.value));
  const maxTrendValue = Math.max(...chartData.weeklyTrends.map(d => d.value));

  return (
    <div className="donor-dashboard-home">
      <h1>Dashboard</h1>
      <p className="subtitle">Overview of your donations</p>

      {/* Quick Metrics Overview */}
      <div className="donor-metrics-overview">
        <div className="metric-card">
          <div className="metric-value">{stats?.totalListed ?? 0}</div>
          <div className="metric-label">Total Listed Items</div>
        </div>
        <div className="metric-card green">
          <div className="metric-value">{stats?.completed ?? 0}</div>
          <div className="metric-label">Completed Requests</div>
        </div>
        <div className="metric-card navy">
          <div className="metric-value">{stats?.newRequests ?? 0}</div>
          <div className="metric-label">Pending Requests</div>
        </div>
        <div className="metric-card mint">
          <div className="metric-value">{stats?.rejected ?? 0}</div>
          <div className="metric-label">Rejected Requests</div>
        </div>
      </div>

      {/* Main Tiles Grid */}
      <div className="donor-tile-grid">
        <div className="donor-tile sky">
          <h2>Total Listed Food</h2>
          <div className="big">{stats?.totalListed ?? 0}</div>
        </div>
        
        <div className="donor-tile green">
          <h2>Take Away / Request Completed</h2>
          <div className="big">{stats?.completed ?? 0}</div>
        </div>
        
        <div className="donor-tile navy">
          <h2>Rejected Requests</h2>
          <div className="big">{stats?.rejected ?? 0}</div>
        </div>

        <div className="donor-tile ice">
          <h2>All Requests</h2>
          <div className="big">{stats?.allRequests ?? 0}</div>
        </div>
        
        <div className="donor-tile mint">
          <h2>New Requests</h2>
          <div className="big">{stats?.newRequests ?? 0}</div>
        </div>
        
        <div className="donor-tile ice">
          <h2>Tips</h2>
          <div className="regular-text">Keep listings up to date for faster matching.</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="donor-charts-section">
        <h2>Analytics & Insights</h2>
        <div className="donor-charts-grid">
          {/* Bar Chart */}
          <div className="donor-chart-card">
            <h3>Monthly Donation Activity</h3>
            <div className="css-bar-chart">
              {chartData.monthlyDonations.map((item, index) => (
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
          
          {/* Doughnut Chart - Request Status */}
          <div className="donor-chart-card">
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
              {chartData.requestStatus.map((item, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Line Chart */}
          <div className="donor-chart-card">
            <h3>Request Trends</h3>
            <div className="css-line-chart">
              <div className="line-chart-grid">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid-line" />
                ))}
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
                    L ${0},${200 - (chartData.weeklyTrends[0].value / maxTrendValue) * 200}
                    ${chartData.weeklyTrends.map((item, i) => 
                      `L ${(i / (chartData.weeklyTrends.length - 1)) * 400},${200 - (item.value / maxTrendValue) * 200}`
                    ).join(' ')}
                    L 400,200
                    Z
                  `}
                  fill="url(#areaGradient)"
                />
                <path
                  className="line-path"
                  d={`
                    M ${0},${200 - (chartData.weeklyTrends[0].value / maxTrendValue) * 200}
                    ${chartData.weeklyTrends.map((item, i) => 
                      `L ${(i / (chartData.weeklyTrends.length - 1)) * 400},${200 - (item.value / maxTrendValue) * 200}`
                    ).join(' ')}
                  `}
                />
              </svg>
              <div className="line-points">
                {chartData.weeklyTrends.map((item, i) => (
                  <div
                    key={i}
                    className="line-point"
                    style={{
                      left: `${(i / (chartData.weeklyTrends.length - 1)) * 100}%`,
                      top: `${100 - (item.value / maxTrendValue) * 100}%`
                    }}
                  />
                ))}
              </div>
              <div className="line-labels">
                {chartData.weeklyTrends.map((item, i) => (
                  <div key={i} className="line-label">{item.week}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Doughnut Chart - Food Categories */}
          <div className="donor-chart-card">
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
              {chartData.foodCategories.map((item, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.category} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}