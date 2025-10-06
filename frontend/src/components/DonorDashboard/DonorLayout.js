// DonorLayout.jsx
import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

export default function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // ---- LOGOUT HANDLER (connect your existing logout here if needed) ----
  const handleLogout = async () => {
    try {
      // If you have an auth service/hook, call it here:
      // await auth.logout();
      await logout();
    } catch (e) {
      // optional: log error
    } finally {
      // Safety cleanup in case you store tokens locally
      setShowDropdown(false);
      navigate("/", { replace: true, state: { scrollTo: "home" } });

      // Navigate to landing page; scroll to a section via location.state
      navigate("/", {
        replace: true,
        state: { scrollTo: "home" }, 
      });
    }
  };
  // --------------------------------------------------------------------

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
          <div className="ff-donor-user-info" ref={dropdownRef}>
            <div className="ff-user-menu" onClick={toggleDropdown}>
              Donor Account
              <span className="ff-dropdown-arrow">▼</span>
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="ff-dropdown-menu">
                <div className="ff-dropdown-item" onClick={() => setShowDropdown(false)}>
                  Profile
                </div>
                <div className="ff-dropdown-item" onClick={() => setShowDropdown(false)}>
                  Settings
                </div>
                <div className="ff-dropdown-divider"></div>
                <div className="ff-dropdown-item ff-dropdown-item-logout" onClick={handleLogout}>
                  Log Out
                </div>
              </div>
            )}
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
