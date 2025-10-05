import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
      // await auth.logout?.(); // if you have a service, call it here
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
              <svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" /></svg>
            </span>
            Dashboard
          </a>

          <a href="/admin/analytics" className={`admin-nav-link ${isActive("/admin/analytics") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M3 20h18v1H3zM6 10h3v8H6zM11 6h3v12h-3zM16 13h3v5h-3z"/></svg>
            </span>
            Analytics
          </a>

          <a href="/admin/calendar" className={`admin-nav-link ${isActive("/admin/calendar") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M7 2h2v2h6V2h2v2h3a2 2 0 012 2v13a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V2zm13 7H4v10h16V9z"/></svg>
            </span>
            Calendar
          </a>

          <a href="/admin/messages" className={`admin-nav-link ${isActive("/admin/messages") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2zm1 3v1l7 4 7-4V7l-7 4-7-4z"/></svg>
            </span>
            Messages
          </a>

          <a href="/admin/help" className={`admin-nav-link ${isActive("/admin/help") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92A2 2 0 0012 12h-1v-1a3 3 0 011-2.24l1.2-1.2a1.5 1.5 0 10-2.12-2.12 1.73 1.73 0 00-.5 1.23H8a3.5 3.5 0 016.07 2.08z"/></svg>
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
