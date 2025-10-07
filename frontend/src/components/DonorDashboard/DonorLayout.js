
import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    try {
      
      
    } catch (e) {
     
    } finally {
      
      localStorage.removeItem("token");
      sessionStorage.clear();

      setShowDropdown(false);

      navigate("/", {
        replace: true,
        state: { scrollTo: "home" }, 
      });
    }
  };
  

  return (
    <div className="donor-layout">
      <div className="donor-sidebar">
        <div className="donor-sidebar-header">
          <h2>FoodFlow</h2>
        </div>
        
        <div className="donor-nav-links">
          <a 
            href="/donor" 
            className={`donor-nav-link ${location.pathname === "/donor" ? "active" : ""}`}
          >
            Home
          </a>
          <a 
            href="/donor/dashboard" 
            className={`donor-nav-link ${location.pathname === "/donor/dashboard" ? "active" : ""}`}
          >
            Dashboard
          </a>
          <a 
            href="/donor/list" 
            className={`donor-nav-link ${location.pathname === "/donor/list" ? "active" : ""}`}
          >
            List Your Food
          </a>
          <a 
            href="/donor/requests" 
            className={`donor-nav-link ${location.pathname === "/donor/requests" ? "active" : ""}`}
          >
            Requests
          </a>
          <a 
            href="/donor/search" 
            className={`donor-nav-link ${location.pathname === "/donor/search" ? "active" : ""}`}
          >
            Search
          </a>
        </div>
      </div>

      <div className="donor-main">
        <div className="donor-topbar">
          <div className="donor-topbar-left">
            <h1>{getPageTitle()}</h1>
            <p>{getPageDescription()}</p>
          </div>
          <div className="donor-user-info" ref={dropdownRef}>
            <div className="user-menu" onClick={toggleDropdown}>
              Donor Account
              <span className="dropdown-arrow">▼</span>
            </div>
            
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

        <div className="donor-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
