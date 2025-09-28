// DonorLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function DonorLayout() {
  const location = useLocation();
  
  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/donor":
        return "Donate Food Now";
      case "/donor/dashboard":
        return "Dashboard";
      case "/donor/list":
        return "List Your Food";
      case "/donor/requests":
        return "Requests";
      case "/donor/search":
        return "Search";
      default:
        return "Donor Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case "/donor":
        return "Every gift makes a difference";
      case "/donor/dashboard":
        return "Overview of your donations";
      case "/donor/list":
        return "Add new food donations";
      case "/donor/requests":
        return "Manage donation requests";
      case "/donor/search":
        return "Find organizations";
      default:
        return "FoodFlow Donor Portal";
    }
  };

  return (
    <div className="ff-donor-layout">
      {/* Sidebar */}
      <div className="ff-donor-sidebar">
        <div className="ff-donor-sidebar-header">
          <h2>FoodFlow</h2>
        </div>
        
        <div className="ff-donor-nav-links">
          <a 
            href="/donor" 
            className={`ff-donor-nav-link ${location.pathname === "/donor" ? "active" : ""}`}
          >
            Home
          </a>
          <a 
            href="/donor/dashboard" 
            className={`ff-donor-nav-link ${location.pathname === "/donor/dashboard" ? "active" : ""}`}
          >
            Dashboard
          </a>
          <a 
            href="/donor/list" 
            className={`ff-donor-nav-link ${location.pathname === "/donor/list" ? "active" : ""}`}
          >
            List Your Food
          </a>
          <a 
            href="/donor/requests" 
            className={`ff-donor-nav-link ${location.pathname === "/donor/requests" ? "active" : ""}`}
          >
            Requests
          </a>
          <a 
            href="/donor/search" 
            className={`ff-donor-nav-link ${location.pathname === "/donor/search" ? "active" : ""}`}
          >
            Search
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="ff-donor-main">
        {/* Top Bar */}
        <div className="ff-donor-topbar">
          <div className="ff-donor-topbar-left">
            <h1>{getPageTitle()}</h1>
            <p>{getPageDescription()}</p>
          </div>
          <div className="ff-donor-user-info">
            Donor Account
          </div>
        </div>

        {/* Page Content */}
        <div className="ff-donor-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}