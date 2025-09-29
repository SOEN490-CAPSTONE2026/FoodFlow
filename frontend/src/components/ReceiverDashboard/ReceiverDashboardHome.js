import React from "react";
import "./ReceiverDashboard.css"; // Import the separate CSS file

// mock API – replace with your real endpoints
async function fetchReceiverStats(){
  return { available: 3, approved: 1, rejected: 0, pending: 2, completed: 4, nearby: 5 };
}

export default function ReceiverDashboardHome(){
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => { 
    async function loadStats() {
      try {
        const data = await fetchReceiverStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="receiver-dashboard-home">
        <h1>Receiver Dashboard</h1>
        <p className="subtitle">Welcome to your food receiving portal</p>
        <div className="receiver-loading">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="receiver-dashboard-home">
      <h1>Receiver Dashboard</h1>
      <p className="subtitle">Welcome to your food receiving portal</p>
      
      <div className="receiver-tile-grid">
        <div className="receiver-tile sky">
          <h3>Available Near You</h3>
          <div className="big">{stats?.available ?? 0}</div>
          <p className="regular-text">Food packages available for request</p>
        </div>
        
        <div className="receiver-tile green">
          <h3>Approved Requests</h3>
          <div className="big">{stats?.approved ?? 0}</div>
          <p className="regular-text">Requests that have been approved</p>
        </div>
        
        <div className="receiver-tile navy">
          <h3>Rejected Requests</h3>
          <div className="big">{stats?.rejected ?? 0}</div>
          <p className="regular-text">Requests that were not approved</p>
        </div>

        <div className="receiver-tile mint">
          <h3>Pending Requests</h3>
          <div className="big">{stats?.pending ?? 0}</div>
          <p className="regular-text">Awaiting approval</p>
        </div>
        
        <div className="receiver-tile ice">
          <h3>Completed Pickups</h3>
          <div className="big">{stats?.completed ?? 0}</div>
          <p className="regular-text">Successful pickups</p>
        </div>
        
        <div className="receiver-tile ice">
          <h3>Nearby Donors</h3>
          <div className="big">{stats?.nearby ?? 0}</div>
          <p className="regular-text">Donors in your area</p>
        </div>
      </div>
    </div>
  );
}