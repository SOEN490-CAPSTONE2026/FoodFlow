import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./ReceiverDashboard.css"; 
export default function ReceiverLayout() {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/receiver":
        return "Find Food Nearby";
      case "/receiver/browse":
        return "Browse Available Food";
      case "/receiver/requests":
        return "My Requests";
      case "/receiver/search":
        return "Search Organizations";
      default:
        return "Receiver Dashboard";
    }
  };

  // Page description
  const getPageDescription = () => {
    switch (location.pathname) {
      case "/receiver":
        return "Find food donations in your area";
      case "/receiver/browse":
        return "Browse available food listings";
      case "/receiver/requests":
        return "Manage your food requests";
      case "/receiver/search":
        return "Search for food donors";
      default:
        return "FoodFlow Receiver Portal";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setShowDropdown((s) => !s);

  return (
    <div className="receiver-layout">
      {/* Sidebar */}
      <div className="receiver-sidebar">
        <div className="receiver-sidebar-header">
          <h2>FoodFlow</h2>
        </div>

        <div className="receiver-nav-links">
          <a
            href="/receiver"
            className={`receiver-nav-link ${location.pathname === "/receiver" ? "active" : ""}`}
          >
            Dashboard
          </a>
          <a
            href="/receiver/browse"
            className={`receiver-nav-link ${location.pathname === "/receiver/browse" ? "active" : ""}`}
          >
            Find Food
          </a>
          <a
            href="/receiver/requests"
            className={`receiver-nav-link ${location.pathname === "/receiver/requests" ? "active" : ""}`}
          >
            My Requests
          </a>
          <a
            href="/receiver/search"
            className={`receiver-nav-link ${location.pathname === "/receiver/search" ? "active" : ""}`}
          >
            Search
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="receiver-main">
        {/* Top Bar */}
        <div className="receiver-topbar">
          <div className="receiver-topbar-left">
            <h1>{getPageTitle()}</h1>
            <p>{getPageDescription()}</p>
          </div>

          <div className="receiver-user-info" ref={dropdownRef}>
            <div className="user-menu" onClick={toggleDropdown}>
              Receiver Account
              <span className="dropdown-arrow">▼</span>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  Profile
                </div>
                <div className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  Settings
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item dropdown-item-logout">
                  Log Out
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="receiver-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
