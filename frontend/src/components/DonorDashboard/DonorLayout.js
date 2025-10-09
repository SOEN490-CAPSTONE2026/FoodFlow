import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate, NavLink, Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Logo from "../../assets/logo_dark_background.png";

export default function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const getPageTitle = () => {
    const p = location.pathname;
    if (p === "/donor" || p === "/donor/") return "Donate Food Now";
    if (p.startsWith("/donor/dashboard")) return "Dashboard";
    if (p.startsWith("/donor/list")) return "List Your Food";
    if (p.startsWith("/donor/requests")) return "Requests";
    if (p.startsWith("/donor/search")) return "Search";
    return "Donor Dashboard";
  };

  const getPageDescription = () => {
    const p = location.pathname;
    if (p === "/donor" || p === "/donor/") return "Every gift makes a difference";
    if (p.startsWith("/donor/dashboard")) return "Overview of your donations";
    if (p.startsWith("/donor/list")) return "Add new food donations";
    if (p.startsWith("/donor/requests")) return "Manage donation requests";
    if (p.startsWith("/donor/search")) return "Find organizations";
    return "FoodFlow Donor Portal";
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
      await logout();      
    } catch (e) {
           
    } finally {
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
          <h2>
            <a href="http://localhost:3002">
              <img src={Logo} alt="FoodFlow Logo" className="donor-logo" />
            </a>
          </h2>
        </div>
        
        <div className="donor-nav-links">
          <NavLink
            to="."
            end
            className={({ isActive }) => `donor-nav-link ${isActive ? "active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="dashboard"
            className={({ isActive }) => `donor-nav-link ${isActive ? "active" : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="list"
            className={({ isActive }) => `donor-nav-link ${isActive ? "active" : ""}`}
          >
            List Your Food
          </NavLink>
          <NavLink
            to="requests"
            className={({ isActive }) => `donor-nav-link ${isActive ? "active" : ""}`}
          >
            Requests
          </NavLink>
          <NavLink
            to="search"
            className={({ isActive }) => `donor-nav-link ${isActive ? "active" : ""}`}
          >
            Search
          </NavLink>
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
