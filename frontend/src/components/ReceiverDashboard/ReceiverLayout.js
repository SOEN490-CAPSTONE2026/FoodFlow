import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link, useNavigationType } from "react-router-dom";
import "./Receiver_Styles/ReceiverLayout.css";
import Logo from "../../assets/Logo.png";
import { AuthContext } from "../../contexts/AuthContext";
import {
  Settings as IconSettings,
  HelpCircle as IconHelpCircle,
  LogOut as IconLogOut,
  Inbox as IconInbox,
  CheckCircle
} from "lucide-react";

export default function ReceiverLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { logout } = React.useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/receiver":
      case "/receiver/dashboard":
        return "Receiver Dashboard";
      case "/receiver/welcome":
        return "Welcome";
      case "/receiver/browse":
        return "Browse Available Food";
      case "/receiver/requests":
        return "My Requests";
      case "/receiver/search":
        return "Search Organizations";
      case "/receiver/messages":
        return "Messages";
      default:
        return "Receiver Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case "/receiver":
      case "/receiver/dashboard":
        return "Overview of nearby food and your activity";
      case "/receiver/welcome":
        return "Start here: search the map or browse nearby food";
      case "/receiver/browse":
        return "Browse available food listings";
      case "/receiver/requests":
        return "Manage your food requests";
      case "/receiver/search":
        return "Search for food donors";
      case "/receiver/messages":
        return "Communicate with donors and other users";
      default:
        return "FoodFlow Receiver Portal";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (navType === "POP" && !location.pathname.startsWith("/receiver")) {
      navigate("/receiver/dashboard", { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const toggleDropdown = () => setShowDropdown((s) => !s);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
    } finally {
      setShowDropdown(false);
      navigate("/", { replace: true, state: { scrollTo: "home" } });
    }
  };

  return (
    <div className="receiver-layout">
      <div className="receiver-sidebar">
        <div className="receiver-sidebar-header">
          <Link to="/" state={{ scrollTo: "home", from: "receiver" }}>
            <img src={Logo} alt="FoodFlow" className="receiver-logo" />
          </Link>
        </div>

        <div className="receiver-nav-links">
          <Link
            to="/receiver/welcome"
            className={`receiver-nav-link ${location.pathname === "/receiver/welcome" ? "active" : ""}`}
          >
            Donations
          </Link>

          <Link 
            to="/receiver/my-claims" 
            className={`receiver-nav-link ${
              isActive("/receiver/my-claims") || 
              isActive("/receiver") || 
              isActive("/receiver/dashboard") 
              ? "active" : ""
            }`}
          >
            <span className="nav-icon" aria-hidden>
              <CheckCircle size={18} className="lucide" />
            </span>
            My Claims
          </Link>

          <Link
            to="/receiver/browse"
            className={`receiver-nav-link ${location.pathname === "/receiver/browse" ? "active" : ""}`}
          >
            Saved Donations
          </Link>

          <Link
            to="/receiver/messages"
            className={`receiver-nav-link ${location.pathname === "/receiver/messages" ? "active" : ""}`}
          >
            Messages
          </Link>
        </div>

        <div className="receiver-user-info" ref={dropdownRef}>
          <div className="user-actions">
            <button className="inbox-btn" type="button" aria-label="Inbox">
              <IconInbox size={22} />
              <span className="badge">5</span>
            </button>

            <button
              className="avatar-btn"
              type="button"
              aria-label="Account menu"
              onClick={toggleDropdown}
              title="Account"
            >
              <img src="/pfp.png" alt="" />
            </button>
          </div>

          {showDropdown && (
            <div className="dropdown-menu dropdown-menu--card">
              <div className="dropdown-header">Hello John Doe!</div>
              <div className="dropdown-divider"></div>

              <div className="dropdown-item dropdown-item--settings" onClick={() => setShowDropdown(false)}>
                <IconSettings size={18} />
                <span>Settings</span>
              </div>

              <div
                className="dropdown-item dropdown-item--help"
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/receiver/help");
                }}
              >
                <IconHelpCircle size={18} />
                <span>Help</span>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-item dropdown-item-logout" onClick={handleLogout}>
                <IconLogOut size={18} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="receiver-main">
        <div className="receiver-topbar">
          <div className="receiver-topbar-left">
            <h1>{getPageTitle()}</h1>
            <p>{getPageDescription()}</p>
          </div>
        </div>

        <div className="receiver-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
