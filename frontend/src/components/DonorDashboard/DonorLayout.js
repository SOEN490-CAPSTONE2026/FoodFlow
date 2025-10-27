import React, { useEffect, useRef, useState, useContext } from "react";
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
import { AuthContext } from "../../contexts/AuthContext";
import Logo from "../../assets/Logo_White.png";
import "./Donor_Styles/DonorLayout.css";

export default function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { logout } = useContext(AuthContext);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getMaxContacts = () => {
    if (screenHeight <= 650) return 1;
    if (screenHeight <= 800) return 2;
    return 4;
  };

  const visibleContacts = contacts.slice(0, getMaxContacts());

  const pageTitle = (() => {
    switch (location.pathname) {
      case "/donor":
      case "/donor/dashboard":
        return "Donor Dashboard";
      case "/donor/list":
        return "Donate Now";
      case "/donor/requests":
        return "Requests & Claims";
      case "/donor/search":
        return " Pickup Schdule";
      case "/donor/messages":
        return "Messages";
      case "/donor/help":
        return "Help";
      default:
        return "Donor";
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case "/donor":
      case "/donor/dashboard":
        return "Overview and quick actions";
      case "/donor/list":
        return "Create and manage donation listings";
      case "/donor/requests":
        return "Incoming requests and status";
      case "/donor/search":
        return "Recent activity and history";
      case "/donor/messages":
        return "Incoming communications";
      case "/donor/help":
        return "Guides and support";
      default:
        return "FoodFlow Donor Portal";
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
    if (navType === "POP" && !location.pathname.startsWith("/donor")) {
      navigate("/donor/dashboard", { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate("/", { replace: true, state: { scrollTo: "home" } });
    }
  };

  const isActive = (path) => location.pathname === path;

  const isMessagesPage = location.pathname === "/donor/messages";

  return (
    <div className="donor-layout">
      <div className="mobile-header">
        <Link to="/" state={{ scrollTo: "home", from: "donor" }}>
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

      <aside className={`donor-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="donor-sidebar-header">
          <Link to="/" state={{ scrollTo: "home", from: "donor" }} aria-label="FoodFlow Home">
            <img src={Logo} alt="FoodFlow" className="donor-logo" />
          </Link>
        </div>

        <nav className="donor-nav-links">
          <Link to="/donor" className={`donor-nav-link ${isActive("/donor") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            Home
          </Link>

          <Link to="/donor/dashboard" className={`donor-nav-link ${isActive("/donor/dashboard") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <LayoutGrid size={18} className="lucide" />
            </span>
            Dashboard
          </Link>

          <Link to="/donor/list" className={`donor-nav-link ${isActive("/donor/list") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            Donate Now
          </Link>

          <Link to="/donor/requests" className={`donor-nav-link ${isActive("/donor/requests") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <CalendarIcon size={18} className="lucide" />
            </span>
            Requests & Claims 
          </Link>

          <Link to="/donor/search" className={`donor-nav-link ${isActive("/donor/search") ? "active" : ""}`}>
            <span className="nav-icon" aria-hidden>
              <FileText size={18} className="lucide" />
            </span>
            Pickup Schedule
          </Link>

          <div className={`donor-nav-link messages-link ${isActive("/donor/messages") ? "active" : ""}`}>
            <div onClick={() => navigate("/donor/messages")} className="messages-left">
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

        <div className="donor-nav-bottom nav-bottom-abs">
          <div className="donor-nav-link disabled">
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            Settings
          </div>
          <div className="donor-nav-link disabled">
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            Help
          </div>
        </div>

        <div className="donor-sidebar-footer donor-user footer-abs" ref={menuRef}>
          <div className="account-row">
            <button className="user-profile-pic" type="button">
              <div className="account-avatar"></div>
              <div className="account-text">
                <span className="account-name">Donor</span>
                <span className="account-role">donor</span>
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

      <main className="donor-main">
        {!isMessagesPage && (
          <header className="donor-topbar">
            <div className="donor-topbar-left">
              <h1>{pageTitle}</h1>
              <p>{pageDesc}</p>
            </div>
          </header>
        )}

        <section className={`donor-content ${isMessagesPage ? 'messages-page' : ''}`}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}