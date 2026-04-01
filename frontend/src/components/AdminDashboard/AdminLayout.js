import { useEffect, useState, useContext } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  Link,
  useNavigationType,
} from 'react-router-dom';
import {
  Home,
  Users,
  UserCheck,
  Heart,
  Mail,
  ChevronRight,
  ChevronLeft,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  BarChart3,
  UserPlus,
  Image,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/Logo_White.png';
import { AuthContext } from '../../contexts/AuthContext';
import { profileAPI } from '../../services/api';
import { connectToUserQueue, disconnect } from '../../services/socket';
import MessageNotification from '../MessagingDashboard/MessageNotification';
import './Admin_Styles/AdminLayout.css';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { logout, organizationName, role } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notification, setNotification] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const isMessagesPage = location.pathname === '/admin/messages';

  const getProfilePhotoUrl = photoUrl => {
    if (!photoUrl) {
      return null;
    }
    if (
      photoUrl.startsWith('http://') ||
      photoUrl.startsWith('https://') ||
      photoUrl.startsWith('data:')
    ) {
      return photoUrl;
    }
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const backendBaseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');
    if (photoUrl.startsWith('/uploads/')) {
      const filename = photoUrl.substring('/uploads/'.length);
      return `${backendBaseUrl}/api/files/uploads/${filename}`;
    }
    if (photoUrl.startsWith('/api/files/')) {
      return `${backendBaseUrl}${photoUrl}`;
    }
    return `${backendBaseUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProfilePhoto = async () => {
      try {
        const response = await profileAPI.get();
        if (isMounted) {
          const url = getProfilePhotoUrl(response.data?.profilePhoto);
          setProfilePhotoUrl(url);
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };
    fetchProfilePhoto();
    return () => {
      isMounted = false;
    };
  }, []);

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
        setNotification({
          senderName,
          message,
          type: payload.type,
          alertType: payload.alertType,
          preferredLanguage: payload.preferredLanguage,
        });
      }
    };

    connectToUserQueue(
      onMessage,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    );
    return () => {
      try {
        disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/admin':
      case '/admin/dashboard':
        return t('admin.dashboard');
      case '/admin/users':
        return t('admin.users');
      case '/admin/verification-queue':
        return t('admin.verificationQueue');
      case '/admin/analytics':
        return t('admin.analytics');
      case '/admin/impact':
        return t('admin.impact');
      case '/admin/calendar':
        return t('admin.calendar');
      case '/admin/messages':
        return t('admin.messages');
      case '/admin/disputes':
        return t('admin.disputes');
      case '/admin/referrals':
        return t('admin.referrals');
      case '/admin/help':
        return t('admin.help');
      case '/admin/images':
        return t('admin.images');
      default:
        return t('admin.dashboard');
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case '/admin':
      case '/admin/dashboard':
        return t('admin.overview');
      case '/admin/verification-queue':
        return t('admin.verificationQueueDesc');
      case '/admin/users':
        return t('admin.usersDesc');
      case '/admin/analytics':
        return t('admin.metrics');
      case '/admin/impact':
        return t('admin.impactDesc');
      case '/admin/calendar':
        return t('admin.events');
      case '/admin/messages':
        return t('admin.communications');
      case '/admin/disputes':
        return t('admin.disputesDesc');
      case '/admin/referrals':
        return t('admin.referralsDesc');
      case '/admin/help':
        return t('admin.guides');
      case '/admin/images':
        return t('admin.imagesDesc');
      default:
        return t('admin.administration');
    }
  })();

  useEffect(() => {
    if (navType === 'POP' && !location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navType, location.pathname, navigate]);

  const handleLogout = () => {
    logout(); // Use AuthContext logout to clear all auth state
    navigate('/', { replace: true, state: { scrollTo: 'home' } });
  };

  const isActive = path => {
    if (path === '/admin' || path === '/admin/dashboard') {
      return (
        location.pathname === '/admin' ||
        location.pathname === '/admin/dashboard'
      );
    }
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      <div className="mobile-header">
        <Link to="/" replace state={{ scrollTo: 'home', from: 'admin' }}>
          <img src={Logo} alt="FoodFlow" className="mobile-logo" />
        </Link>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t('admin.toggleMenu')}
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
        className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        <div className="admin-sidebar-header">
          <Link
            to="/"
            replace
            state={{ scrollTo: 'home', from: 'admin' }}
            aria-label={t('admin.foodflowHome')}
          >
            <img src={Logo} alt="FoodFlow" className="admin-logo" />
          </Link>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={t('admin.toggleSidebar')}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="admin-nav-links">
          <Link
            to="/admin"
            className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}
            data-tooltip={t('admin.dashboard')}
          >
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            {t('admin.dashboard')}
          </Link>

          <Link
            to="/admin/verification-queue"
            className={`admin-nav-link ${isActive('/admin/verification-queue') ? 'active' : ''}`}
            data-tooltip={t('admin.verificationQueue')}
          >
            <span className="nav-icon" aria-hidden>
              <UserCheck size={18} className="lucide" />
            </span>
            {t('admin.verificationQueue')}
          </Link>

          <Link
            to="/admin/users"
            className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
            data-tooltip={t('admin.users')}
          >
            <span className="nav-icon" aria-hidden>
              <Users size={18} className="lucide" />
            </span>
            {t('admin.users')}
          </Link>

          <Link
            to="/admin/donations"
            className={`admin-nav-link ${isActive('/admin/donations') ? 'active' : ''}`}
            data-tooltip={t('admin.donations')}
          >
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            {t('admin.donations')}
          </Link>

          <Link
            to="/admin/images"
            className={`admin-nav-link ${isActive('/admin/images') ? 'active' : ''}`}
            data-tooltip={t('admin.images')}
          >
            <span className="nav-icon" aria-hidden>
              <Image size={18} className="lucide" />
            </span>
            {t('admin.images')}
          </Link>

          <Link
            to="/admin/impact"
            className={`admin-nav-link ${isActive('/admin/impact') ? 'active' : ''}`}
            data-tooltip={t('admin.impact')}
          >
            <span className="nav-icon" aria-hidden>
              <BarChart3 size={18} className="lucide" />
            </span>
            {t('admin.impact')}
          </Link>

          <Link
            to="/admin/disputes"
            className={`admin-nav-link ${isActive('/admin/disputes') ? 'active' : ''}`}
            data-tooltip={t('admin.disputes')}
          >
            <span className="nav-icon" aria-hidden>
              <AlertTriangle size={18} className="lucide" />
            </span>
            {t('admin.disputes')}
          </Link>

          <Link
            to="/admin/referrals"
            className={`admin-nav-link ${isActive('/admin/referrals') ? 'active' : ''}`}
            data-tooltip={t('admin.referrals')}
          >
            <span className="nav-icon" aria-hidden>
              <UserPlus size={18} className="lucide" />
            </span>
            {t('admin.referrals')}
          </Link>

          <Link
            to="/admin/messages"
            className={`admin-nav-link ${isActive('/admin/messages') ? 'active' : ''}`}
            data-tooltip={t('admin.messages')}
          >
            <span className="nav-icon" aria-hidden>
              <Mail size={18} className="lucide" />
            </span>
            {t('admin.messages')}
          </Link>
        </nav>

        <div className="admin-nav-bottom">
          <Link
            to="/admin/settings"
            className={`admin-nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
            data-tooltip={t('admin.settings')}
          >
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            {t('admin.settings')}
          </Link>
          <button
            onClick={handleLogout}
            className="admin-nav-link logout-btn"
            data-tooltip={t('admin.logout')}
          >
            <span className="nav-icon" aria-hidden>
              <LogOut size={18} className="lucide" />
            </span>
            {t('admin.logout')}
          </button>
        </div>

        <div className="admin-sidebar-footer admin-user">
          <div className="account-row">
            <button className="user-profile-pic" type="button">
              <div
                className="account-avatar"
                style={
                  profilePhotoUrl
                    ? {
                        backgroundImage: `url(${profilePhotoUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              ></div>
              <div className="account-text">
                <span className="account-name">
                  {organizationName || 'Admin'}
                </span>
                <span className="account-role">
                  {role?.toLowerCase() || 'admin'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        {location.pathname !== '/admin' &&
          location.pathname !== '/admin/dashboard' && (
            <header className="admin-topbar">
              <div className="admin-topbar-left">
                <h1>{pageTitle}</h1>
                <p>{pageDesc}</p>
              </div>
            </header>
          )}

        <section
          className={`admin-content ${isMessagesPage ? 'messages-page' : ''}`}
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
