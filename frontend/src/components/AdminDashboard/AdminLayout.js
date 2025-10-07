import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, Calendar as CalendarIcon, Mail, HelpCircle } from "lucide-react";
import "./AdminLayout.css";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

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
      if (ddRef.current && !ddRef.current.contains(e.target)) setOpen(false);
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
          <a href="/admin" className={`admin-nav-link ${isActive("/admin") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            Dashboard
          </a>

          <a href="/admin/analytics" className={`admin-nav-link ${isActive("/admin/analytics") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <BarChart3 size={18} className="lucide" />
            </span>
            Analytics
          </a>

          <a href="/admin/calendar" className={`admin-nav-link ${isActive("/admin/calendar") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <CalendarIcon size={18} className="lucide" />
            </span>
            Calendar
          </a>

          <a href="/admin/messages" className={`admin-nav-link ${isActive("/admin/messages") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Mail size={18} className="lucide" />
            </span>
            Messages
          </a>

          <a href="/admin/help" className={`admin-nav-link ${isActive("/admin/help") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            Help
          </a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>{pageTitle}</h1>
            <p>{pageDesc}</p>
          </div>

          <div className="admin-user" ref={ddRef}>
            <button className="user-chip" onClick={() => setOpen((s) => !s)}>
              Admin Account <span className="chev">▼</span>
            </button>
            {open && (
              <div className="admin-dd">
                <button className="admin-dd-item" onClick={() => setOpen(false)}>Profile</button>
                <button className="admin-dd-item" onClick={() => setOpen(false)}>Notifications</button>
                <div className="admin-dd-divider" />
                <button className="admin-dd-item logout" onClick={handleLogout}>Log Out</button>
              </div>
            )}
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
