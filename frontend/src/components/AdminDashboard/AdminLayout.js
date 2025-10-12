import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
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
  LogOut
} from "lucide-react";
import "./AdminLayout.css";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const menuRef = useRef(null);

  const contacts = [
    { name: "Olive Nacelle", online: true },
    { name: "Amélie Laurent", online: true },
    { name: "Amélie Jackson", online: false },
    { name: "Frankie Sullivan", online: false }
  ];

  const pageTitle = (() => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/dashboard":
        return "Admin Dashboard";
      case "/admin/analytics":
        return "Analytics";
      case "/admin/calendar":
        return "Calendar";
      case "/admin/messages":
        return "Messages";
      case "/admin/help":
        return "Help";
      default:
        return "Admin";
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/dashboard":
        return "Overview and quick actions";
      case "/admin/analytics":
        return "Metrics and insights";
      case "/admin/calendar":
        return "Events and schedules";
      case "/admin/messages":
        return "Incoming communications";
      case "/admin/help":
        return "Guides and support";
      default:
        return "Administration";
    }
  })();

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>FoodFlow</h2>
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
              {contacts.map((c, i) => (
                <div key={i} className="message-item">
                  <div className="message-avatar">
                    {c.online && <span className="message-status" />}
                  </div>
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
