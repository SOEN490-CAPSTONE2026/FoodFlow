import React, { useEffect, useRef, useState, useContext } from "react";
import { Outlet, useLocation, useNavigate, Link, useNavigationType } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Users,
  UserCheck,
  Heart,
  Calendar as CalendarIcon,
  FileText,
  Mail,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  HelpCircle,
  MoreVertical,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from "lucide-react";
import Logo from "../../assets/Logo_White.png";
import { AuthContext } from "../../contexts/AuthContext";
import "./Admin_Styles/AdminLayout.css";

export default function AdminLayout() {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const [open, setOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        return "Admin Dashboard";
      case "/admin/users":
        return "User Management";
      case "/admin/verification-queue":
        return "Verification Queue";
      case "/admin/analytics":
        return "Analytics";
      case "/admin/calendar":
        return "Calendar";
      case "/admin/messages":
        return "Messages";
      case "/admin/disputes":
        return "Disputes & Reports";
      case "/admin/help":
        return "Help";
      default:
        if (location.pathname.startsWith("/admin/disputes/")) {
          return "Dispute Details";
        }
        return "Admin";
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/dashboard":
        return "Overview and quick actions";
      case "/admin/verification-queue":
        return "Review and approve pending user registrations";
      case "/admin/users":
        return "Manage and monitor all platform users";
      case "/admin/analytics":
        return "Metrics and insights";
      case "/admin/calendar":
        return "Events and schedules";
      case "/admin/messages":
        return "Incoming communications";
      case "/admin/disputes":
        return "Track, review, and resolve reported issues";
      case "/admin/help":
        return "Guides and support";
      default:
        if (location.pathname.startsWith("/admin/disputes/")) {
          return "View and manage case details";
        }
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

  useEffect(() => {
    if (navType === "POP" && !location.pathname.startsWith("/admin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const handleLogout = () => {
    logout(); // Use AuthContext logout to clear all auth state
    setOpen(false);
    navigate("/", { replace: true, state: { scrollTo: "home" } });
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

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" replace state={{ scrollTo: "home", from: "admin" }} aria-label="FoodFlow Home">
            <img src={Logo} alt="FoodFlow" className="admin-logo" />
          </Link>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="admin-nav-links" style={{ flex: '0 1 auto' }}>
          <Link to="/admin/welcome" className={`admin-nav-link ${isActive("/admin/welcome") ? "active" : ""}`} data-tooltip="Home">
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            Home
          </Link>

          <Link to="/admin/verification-queue" className={`admin-nav-link ${isActive("/admin/verification-queue") ? "active" : ""}`} data-tooltip="Verification Queue">
            <span className="nav-icon" aria-hidden>
              <UserCheck size={18} className="lucide" />
            </span>
            Verification
          </Link>

          <Link to="/admin/users" className={`admin-nav-link ${isActive("/admin/users") ? "active" : ""}`} data-tooltip="Users">
            <span className="nav-icon" aria-hidden>
              <Users size={18} className="lucide" />
            </span>
            Users
          </Link>


          <Link to="/admin/donations" className={`admin-nav-link ${isActive("/admin/donations") ? "active" : ""}`} data-tooltip="Donations">
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            Donations
          </Link>

          <Link to="/admin/disputes" className={`admin-nav-link ${isActive("/admin/disputes") ? "active" : ""}`} data-tooltip="Disputes">
            <span className="nav-icon" aria-hidden>
              <AlertTriangle size={18} className="lucide" />
            </span>
            Disputes
          </Link>

          <div className={`admin-nav-link messages-link ${isActive("/admin/messages") ? "active" : ""}`} data-tooltip="Messages">
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

        <div style={{ flex: 1 }} />
        <div className="admin-nav-bottom">
          <Link to="/admin/settings" className={`admin-nav-link ${isActive("/admin/settings") ? "active" : ""}`} data-tooltip="Settings">
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            Settings
          </Link>
          <div className="admin-nav-link disabled" data-tooltip="Help">
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            Help
          </div>
          <button onClick={handleLogout} className="admin-nav-link logout-btn" data-tooltip="Logout">
            <span className="nav-icon" aria-hidden>
              <LogOut size={18} className="lucide" />
            </span>
            Logout
          </button>
        </div>

        <div className="admin-sidebar-footer admin-user" ref={menuRef}>
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
