import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  Link,
  useNavigationType,
} from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Heart,
  Calendar as CalendarIcon,
  FileText,
  Mail,
  ChevronRight,
  ChevronLeft,
  Settings,
  HelpCircle,
  MoreVertical,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import Logo from '../../assets/Logo_White.png';
import './Donor_Styles/DonorLayout.css';
import MessageNotification from '../MessagingDashboard/MessageNotification';
import { connectToUserQueue, disconnect } from '../../services/socket';

export default function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { logout, organizationName, role } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menuRef = useRef(null);
  const [notification, setNotification] = useState(null);

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/donor':
      case '/donor/dashboard':
        return 'Donor Dashboard';
      case '/donor/list':
        return 'Donate Now';
      case '/donor/requests':
        return 'Requests & Claims';
      case '/donor/search':
        return ' Pickup Schdule';
      case '/donor/messages':
        return 'Messages';
      case '/donor/settings':
        return 'Settings';
      case '/donor/help':
        return 'Help';
      default:
        return 'Donor';
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case '/donor':
      case '/donor/dashboard':
        return 'Overview and quick actions';
      case '/donor/list':
        return 'Create and manage donation listings';
      case '/donor/requests':
        return 'Incoming requests and status';
      case '/donor/search':
        return 'Recent activity and history';
      case '/donor/messages':
        return 'Incoming communications';
      case '/donor/settings':
        return 'Manage your preferences and account settings';
      case '/donor/help':
        return 'Guides and support';
      default:
        return 'FoodFlow Donor Portal';
    }
  })();

  useEffect(() => {
    const onDocClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Connect to websocket for user-specific notifications (donor)
  useEffect(() => {
    const onMessage = payload => {
      const senderName =
        payload.senderName ||
        payload.sender?.email ||
        payload.senderEmail ||
        '';
      const message =
        payload.messageBody || payload.message || payload.body || '';
      if (message) {
        setNotification({ senderName, message });
      }
    };

    const onClaimNotification = payload => {
      // Handle claim notifications from receivers
      console.log('DONOR: Claim notification received:', payload);
      const receiverName = payload.receiverEmail || 'A receiver';
      const foodTitle = payload.surplusPostTitle || 'your food item';
      const message = `${receiverName} has claimed your "${foodTitle}"`;
      console.log('DONOR: Setting notification with message:', message);
      setNotification({
        senderName: 'New Claim',
        message,
      });
    };

    const onClaimCancelled = payload => {
      // Handle claim cancellation notifications
      console.log('DONOR: Claim cancellation received:', payload);
      const receiverName = payload.receiverEmail || 'A receiver';
      const foodTitle = payload.surplusPostTitle || 'your food item';
      const message = `${receiverName} cancelled their claim on "${foodTitle}"`;
      console.log('DONOR: Setting notification with message:', message);
      setNotification({
        senderName: 'Claim Cancelled',
        message,
      });
    };

    connectToUserQueue(onMessage, onClaimNotification, onClaimCancelled);
    return () => {
      try {
        disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (navType === 'POP' && !location.pathname.startsWith('/donor')) {
      navigate('/donor/dashboard', { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate('/', { replace: true, state: { scrollTo: 'home' } });
    }
  };

  const isActive = path => location.pathname === path;

  const isMessagesPage = location.pathname === '/donor/messages';

  // Close menu when navigating
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="donor-layout">
      <div className="mobile-header">
        <Link to="/" state={{ scrollTo: 'home', from: 'donor' }}>
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

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`donor-sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div className="donor-sidebar-header">
          <Link
            to="/"
            state={{ scrollTo: 'home', from: 'donor' }}
            aria-label="FoodFlow Home"
          >
            <img src={Logo} alt="FoodFlow" className="donor-logo" />
          </Link>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="donor-nav-links">
          <Link
            to="/donor"
            className={`donor-nav-link ${isActive('/donor') ? 'active' : ''}`}
            data-tooltip="Home"
          >
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            Home
          </Link>

          <Link
            to="/donor/dashboard"
            className={`donor-nav-link ${isActive('/donor/dashboard') ? 'active' : ''}`}
            data-tooltip="Dashboard"
          >
            <span className="nav-icon" aria-hidden>
              <LayoutGrid size={18} className="lucide" />
            </span>
            Dashboard
          </Link>

          <Link
            to="/donor/list"
            className={`donor-nav-link ${isActive('/donor/list') ? 'active' : ''}`}
            data-tooltip="Donate Now"
          >
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            Donate Now
          </Link>

          <Link
            to="/donor/messages"
            className={`donor-nav-link ${isActive('/donor/messages') ? 'active' : ''}`}
            data-tooltip="Messages"
          >
            <span className="nav-icon" aria-hidden>
              <Mail size={18} className="lucide" />
            </span>
            Messages
          </Link>
        </nav>

        <div className="donor-nav-bottom">
          <Link
            to="/donor/settings"
            className={`donor-nav-link ${isActive('/donor/settings') ? 'active' : ''}`}
            data-tooltip="Settings"
          >
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            Settings
          </Link>
          <Link
            to="/donor/help"
            className={`donor-nav-link ${isActive('/donor/help') ? 'active' : ''}`}
            data-tooltip="Help"
          >
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            Help
          </Link>
        </div>

        <div className="donor-sidebar-footer donor-user" ref={menuRef}>
          <div className="account-row">
            <button className="user-profile-pic" type="button">
              <div className="account-avatar"></div>
              <div className="account-text">
                <span className="account-name">
                  {organizationName || 'Donor'}
                </span>
                <span className="account-role">
                  {role?.toLowerCase() || 'donor'}
                </span>
              </div>
            </button>
            <button
              className="account-dotted-menu"
              onClick={() => setOpen(s => !s)}
              aria-label="Menu"
            >
              <MoreVertical size={18} className="lucide" />
            </button>
          </div>
          {open && (
            <div className="account-menu">
              <button
                className="account-menu-item logout"
                onClick={handleLogout}
              >
                <LogOut size={16} className="lucide" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="donor-main">
        {!isMessagesPage &&
          location.pathname !== '/donor' &&
          location.pathname !== '/donor/' && (
            <header className="donor-topbar">
              <div className="donor-topbar-left">
                <h1>{pageTitle}</h1>
                <p>{pageDesc}</p>
              </div>
            </header>
          )}

        <section
          className={`donor-content ${isMessagesPage ? 'messages-page' : ''}`}
        >
          <Outlet />

          {notification && (
            <MessageNotification
              notification={notification}
              onClose={() => setNotification(null)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
