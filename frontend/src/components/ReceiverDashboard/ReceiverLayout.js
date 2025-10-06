import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./ReceiverDashboard.css"; 
import { AuthContext } from "../../contexts/AuthContext";

export default function ReceiverLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/receiver":
      case "/receiver/dashboard":
        return "Receiver Dashboard";
      case "/receiver/welcome":            // <-- ADDED
        return "Welcome";
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
      case "/receiver/dashboard":
        return "Overview of nearby food and your activity";
      case "/receiver/welcome":            // <-- ADDED
        return "Start here: search the map or browse nearby food";
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

  // Logout → clear storage + go to LandingPage (scroll to home section)
  const handleLogout = async () => {
    try {
      // await auth.logout?.(); // if you have an auth service
      await logout();
    } catch (e) {
      // optional: log
    } finally {
      setShowDropdown(false);
      navigate("/", { replace: true, state: { scrollTo: "home" } });
    }
  };

  return (
    <div className="receiver-layout">
      {/* Sidebar */}
      <div className="receiver-sidebar">
        <div className="receiver-sidebar-header">
          <h2>FoodFlow</h2>
        </div>

        <div className="receiver-nav-links">
          {/* NEW Welcome link (keeps Dashboard too) */}
          <a
            href="/receiver/welcome"
            className={`receiver-nav-link ${location.pathname === "/receiver/welcome" ? "active" : ""}`}
          >
            Welcome
          </a>

          <a
            href="/receiver"
            className={`receiver-nav-link ${
              location.pathname === "/receiver" || location.pathname === "/receiver/dashboard" ? "active" : ""
            }`}
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
            href="/receiver/search#org-search"
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
                <div className="dropdown-item dropdown-item-logout" onClick={handleLogout}>
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
