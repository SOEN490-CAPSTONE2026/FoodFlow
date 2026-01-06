import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, Link, useNavigationType } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Heart,
  Calendar as CalendarIcon,
  FileText,
  Mail,
  ChevronRight,
  ChevronDown,
  Settings,
  HelpCircle,
  MoreVertical,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import Logo from "../../assets/Logo_White.png";
import "./Admin_Styles/AdminLayout.css";

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const [open, setOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const contacts = [
    { name: "Olive Nacelle", online: true },
    { name: "Amélie Laurent", online: true },
    { name: "Amélie Jackson", online: false },
    { name: "Frankie Sullivan", online: false }
  ];

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMaxContacts = () => {
    if (screenHeight <= 650) return 1;
    if (screenHeight <= 800) return 2;
    return 4;
  };

  const visibleContacts = contacts.slice(0, getMaxContacts());

  const pageTitle = (() => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/dashboard":
        return t('admin.dashboard');
      case "/admin/analytics":
        return t('admin.analytics');
      case "/admin/calendar":
        return t('admin.calendar');
      case "/admin/messages":
        return t('admin.messages');
      case "/admin/help":
        return t('admin.help');
      default:
        return t('admin.dashboard');
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/dashboard":
        return t('admin.overview');
      case "/admin/analytics":
        return t('admin.metrics');
      case "/admin/calendar":
        return t('admin.events');
      case "/admin/messages":
        return t('admin.communications');
      case "/admin/help":
        return t('admin.guides');
      default:
        return t('admin.administration');
    }
  })();

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (navType === "POP" && !location.pathname.startsWith("/admin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const handleLogout = () => {
    try {
    } finally {
      localStorage.removeItem("token");
      sessionStorage.clear();
      setOpen(false);
      navigate("/", { replace: true, state: { scrollTo: "home" } });
    }
  };

  const isActive = (path) => {
    if (path === "/admin" || path === "/admin/dashboard") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      <div className="mobile-header">
        <Link to="/" replace state={{ scrollTo: "home", from: "admin" }}>
          <img src={Logo} alt="FoodFlow" className="mobile-logo" />
        </Link>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" replace state={{ scrollTo: "home", from: "admin" }} aria-label="FoodFlow Home">
            <img src={Logo} alt="FoodFlow" className="admin-logo" />
          </Link>
        </div>

        <nav className="admin-nav-links">
          <Link to="/admin/welcome" className={`admin-nav-link ${isActive("/admin/welcome") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            Home
          </Link>

          <Link to="/admin" className={`admin-nav-link ${isActive("/admin") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <LayoutGrid size={18} className="lucide" />
            </span>
            Dashboard
          </Link>

          <Link to="/admin/analytics" className={`admin-nav-link ${isActive("/admin/analytics") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            Donations
          </Link>

          <Link to="/admin/calendar" className={`admin-nav-link ${isActive("/admin/calendar") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <CalendarIcon size={18} className="lucide" />
            </span>
            Compliance Queue
          </Link>

          <Link to="/admin/help" className={`admin-nav-link ${isActive("/admin/help") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <FileText size={18} className="lucide" />
            </span>
            Activity log
          </Link>

          <div className={`admin-nav-link messages-link ${isActive("/admin/messages") ? "active" : ""}`}>
            <div onClick={() => navigate("/admin/messages")} className="messages-left">
              <span className="nav-icon" aria-hidden>
                <Mail size={18} className="lucide" />
              </span>
              Messages
            </div>
            <button className="messages-toggle" onClick={() => setMessagesOpen((s) => !s)} aria-label="Toggle Messages">
              {messagesOpen ? <ChevronDown size={16} className="lucide" /> : <ChevronRight size={16} className="lucide" />}
            </button>
          </div>

          {messagesOpen && (
            <div className="messages-dropdown">
              {visibleContacts.map((c, i) => (
                <div key={i} className="message-item">
                  <div className="message-avatar">{c.online && <span className="message-status" />}</div>
                  <span className="message-name">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="admin-nav-bottom nav-bottom-abs">
          <div className="admin-nav-link disabled">
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            Settings
          </div>
          <div className="admin-nav-link disabled">
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            Help
          </div>
        </div>

        <div className="admin-sidebar-footer admin-user footer-abs" ref={menuRef}>
          <div className="account-row">
            <button className="user-profile-pic" type="button">
              <div className="account-avatar"></div>
              <div className="account-text">
                <span className="account-name">Evian</span>
                <span className="account-role">admin</span>
              </div>
            </button>
            <button className="account-dotted-menu" onClick={() => setOpen((s) => !s)} aria-label="Menu">
              <MoreVertical size={18} className="lucide" />
            </button>
          </div>
          {open && (
            <div className="account-menu">
              <button className="account-menu-item logout" onClick={handleLogout}>
                <LogOut size={16} className="lucide" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>{pageTitle}</h1>
            <p>{pageDesc}</p>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}