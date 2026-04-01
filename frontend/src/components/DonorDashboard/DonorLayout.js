import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  Link,
  useNavigationType,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Heart,
  Award,
  Mail,
  ChevronRight,
  ChevronLeft,
  Settings,
  HelpCircle,
  MoreVertical,
  LogOut,
  Menu,
  X,
  BarChart3,
  Building2,
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import Logo from '../../assets/Logo_White.png';
import './Donor_Styles/DonorLayout.css';
import MessageNotification from '../MessagingDashboard/MessageNotification';
import AchievementNotification from '../shared/AchievementNotification';
import EmailVerificationRequired from '../EmailVerificationRequired';
import AdminApprovalBanner from '../AdminApprovalBanner';
import { connectToUserQueue, disconnect } from '../../services/socket';
import BadgeDisplay from '../shared/BadgeDisplay';
import api, { profileAPI } from '../../services/api';

export default function DonorLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { logout, organizationName, accountStatus, role } =
    useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menuRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [achievementNotification, setAchievementNotification] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const isMessagesPage = location.pathname === '/donor/messages';

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/donor':
      case '/donor/dashboard':
        return t('donorLayout.pageTitles.donorDashboard');
      case '/donor/list':
        return t('donorLayout.pageTitles.donateNow');
      case '/donor/impact':
        return t('donorLayout.pageTitles.impact', 'Impact Dashboard');
      case '/donor/achievements':
        return t('donorLayout.pageTitles.achievements', 'Achievements');
      case '/donor/messages':
        return t('donorLayout.pageTitles.messages');
      case '/donor/settings':
        return t('donorLayout.pageTitles.settings');
      case '/donor/help':
        return t('donorLayout.pageTitles.help');
      case '/donor/suggest-business':
        return t(
          'donorLayout.pageTitles.suggestBusiness',
          'Suggest a Business'
        );
      default:
        return t('donorLayout.pageTitles.donor');
    }
  })();

  const pageDesc = (() => {
    switch (location.pathname) {
      case '/donor':
      case '/donor/dashboard':
        return t('donorLayout.pageDescriptions.donorDashboard');
      case '/donor/list':
        return t('donorLayout.pageDescriptions.donateNow');
      case '/donor/impact':
        return t(
          'donorLayout.pageDescriptions.impact',
          'View your environmental and social impact'
        );
      case '/donor/achievements':
        return t(
          'donorLayout.pageDescriptions.achievements',
          'View your achievements and badges'
        );
      case '/donor/messages':
        return t('donorLayout.pageDescriptions.messages');
      case '/donor/settings':
        return t('donorLayout.pageDescriptions.settings');
      case '/donor/help':
        return t('donorLayout.pageDescriptions.help');
      case '/donor/suggest-business':
        return t(
          'donorLayout.pageDescriptions.suggestBusiness',
          'Suggest a business to join FoodFlow as a food donor'
        );
      default:
        return t('donorLayout.pageDescriptions.donorPortal');
    }
  })();

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
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/conversations');
        const conversations = Array.isArray(response?.data)
          ? response.data
          : [];
        const totalUnread = conversations.reduce(
          (sum, conv) => sum + (conv?.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(totalUnread);
      } catch (err) {
        console.error('Error fetching unread message count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
        setNotification({
          senderName,
          message,
          type: payload.type,
          alertType: payload.alertType,
          preferredLanguage: payload.preferredLanguage,
        });
        setUnreadMessagesCount(prev => prev + 1);
      }
    };

    const onClaimNotification = payload => {
      // Handle claim notifications from receivers
      console.log('DONOR: Claim notification received:', payload);
      const receiverName = payload.receiverEmail || 'A receiver';
      const foodTitle = payload.surplusPostTitle || 'your food item';
      const message = t('donorLayout.notifications.hasClaimed', {
        receiverName,
        foodTitle,
      });
      console.log('DONOR: Setting notification with message:', message);
      setNotification({
        senderName: t('donorLayout.notifications.newClaim'),
        message,
      });
    };

    const onClaimCancelled = payload => {
      // Handle claim cancellation notifications
      console.log('DONOR: Claim cancellation received:', payload);
      const receiverName = payload.receiverEmail || 'A receiver';
      const foodTitle = payload.surplusPostTitle || 'your food item';
      const message = t('donorLayout.notifications.cancelledClaim', {
        receiverName,
        foodTitle,
      });
      console.log('DONOR: Setting notification with message:', message);
      setNotification({
        senderName: t('donorLayout.notifications.claimCancelled'),
        message,
      });
    };

    const onAchievementUnlocked = payload => {
      // Handle achievement unlock notifications
      console.log('DONOR: Achievement unlocked:', payload);
      setAchievementNotification(payload);
    };

    const onReviewReceived = payload => {
      console.log('DONOR: Review received:', payload);
      // Show a notification to the donor that they received a review
      if (payload.rating) {
        const stars = '⭐'.repeat(payload.rating);
        setNotification({
          senderName: payload.reviewerName || 'Receiver',
          message: `left you a ${payload.rating}-star review ${stars}`,
        });
      }
    };

    const onDonationExpired = payload => {
      console.log('DONOR: Donation expired:', payload);
      const message = `Your donation "${payload.title}" has expired and been removed from listings.`;
      setNotification({
        senderName: t('donorLayout.notifications.donationExpired'),
        message,
      });
    };

    const onDonationStatusUpdated = payload => {
      console.log('DONOR: Donation status updated by admin:', payload);
      setNotification({
        senderName: t('donorLayout.notifications.donationStatusUpdated'),
        message: payload.message,
      });
    };

    const onVerificationApproved = payload => {
      console.log('DONOR: Verification approved:', payload);
      setNotification({
        senderName: t('donorLayout.notifications.verificationApproved'),
        message: payload.message,
      });
    };

    connectToUserQueue(
      onMessage,
      onClaimNotification,
      onClaimCancelled,
      null, // no new post notifications for donors
      onAchievementUnlocked,
      onReviewReceived,
      null, // no donation completion notifications for donors
      null, // no donation ready for pickup for donors
      onDonationExpired,
      onDonationStatusUpdated,
      null, // no donation status changed for donors
      onVerificationApproved
    );
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

    if (!isMessagesPage) {
      const refreshUnreadCount = async () => {
        try {
          const response = await api.get('/conversations');
          const conversations = Array.isArray(response?.data)
            ? response.data
            : [];
          const totalUnread = conversations.reduce(
            (sum, conv) => sum + (conv?.unreadCount || 0),
            0
          );
          setUnreadMessagesCount(totalUnread);
        } catch (err) {
          console.error('Error refreshing unread message count:', err);
        }
      };

      refreshUnreadCount();
    }
  }, [navType, location.pathname, navigate, isMessagesPage]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate('/', { replace: true, state: { scrollTo: 'home' } });
    }
  };

  const isActive = path => location.pathname === path;

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

        <BadgeDisplay />

        <nav className="donor-nav-links">
          <Link
            to="/donor"
            className={`donor-nav-link ${isActive('/donor') ? 'active' : ''}`}
            data-tour="donor-nav-home"
            data-tooltip={t('donorLayout.home')}
          >
            <span className="nav-icon" aria-hidden>
              <Home size={18} className="lucide" />
            </span>
            {t('donorLayout.home')}
          </Link>

          <Link
            to="/donor/list"
            className={`donor-nav-link ${isActive('/donor/list') ? 'active' : ''}`}
            data-tour="donor-nav-donate"
            data-tooltip={t('donorLayout.donateNow')}
          >
            <span className="nav-icon" aria-hidden>
              <Heart size={18} className="lucide" />
            </span>
            {t('donorLayout.donateNow')}
          </Link>

          <Link
            to="/donor/achievements"
            className={`donor-nav-link ${isActive('/donor/achievements') ? 'active' : ''}`}
            data-tooltip={t('donorLayout.achievements', 'Achievements')}
          >
            <span className="nav-icon" aria-hidden>
              <Award size={18} className="lucide" />
            </span>
            {t('donorLayout.achievements', 'Achievements')}
          </Link>

          <Link
            to="/donor/messages"
            className={`donor-nav-link donor-nav-link--with-badge ${isActive('/donor/messages') ? 'active' : ''}`}
            data-tour="donor-nav-messages"
            data-tooltip={t('donorLayout.messages')}
          >
            <span className="nav-icon" aria-hidden>
              <Mail size={18} className="lucide" />
            </span>
            {t('donorLayout.messages')}
            {unreadMessagesCount > 0 && (
              <span className="donor-nav-count-badge">
                {unreadMessagesCount}
              </span>
            )}
          </Link>

          <Link
            to="/donor/impact"
            className={`donor-nav-link ${isActive('/donor/impact') ? 'active' : ''}`}
            data-tour="donor-nav-impact"
            data-tooltip={t('donorLayout.impact', 'Impact Dashboard')}
          >
            <span className="nav-icon" aria-hidden>
              <BarChart3 size={18} className="lucide" />
            </span>
            {t('donorLayout.impact', 'Impact')}
          </Link>

          <Link
            to="/donor/suggest-business"
            className={`donor-nav-link ${isActive('/donor/suggest-business') ? 'active' : ''}`}
            data-tooltip={t(
              'donorLayout.suggestBusiness',
              'Suggest a Business'
            )}
          >
            <span className="nav-icon" aria-hidden>
              <Building2 size={18} className="lucide" />
            </span>
            {t('donorLayout.suggestBusiness', 'Suggest Business')}
          </Link>
        </nav>

        <div className="donor-nav-bottom">
          <Link
            to="/donor/settings"
            className={`donor-nav-link ${isActive('/donor/settings') ? 'active' : ''}`}
            data-tour="donor-nav-settings"
            data-tooltip={t('donorLayout.settings')}
          >
            <span className="nav-icon" aria-hidden>
              <Settings size={18} className="lucide" />
            </span>
            {t('donorLayout.settings')}
          </Link>
          <Link
            to="/donor/help"
            className={`donor-nav-link ${isActive('/donor/help') ? 'active' : ''}`}
            data-tooltip={t('donorLayout.help')}
          >
            <span className="nav-icon" aria-hidden>
              <HelpCircle size={18} className="lucide" />
            </span>
            {t('donorLayout.help')}
          </Link>
        </div>

        <div className="donor-sidebar-footer donor-user" ref={menuRef}>
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
                  {organizationName ||
                    t('donorLayout.pageTitles.donor', 'Donor')}
                </span>
                <span className="account-role">
                  {role
                    ? t(`roles.${role.toLowerCase()}`, role)
                    : t('donorLayout.pageTitles.donor', 'Donor')}
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
                {t('donorLayout.logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="donor-main">
        {accountStatus === 'PENDING_VERIFICATION' ? (
          <EmailVerificationRequired />
        ) : (
          <>
            {/* Show admin approval banner if waiting for approval */}
            {accountStatus === 'PENDING_ADMIN_APPROVAL' && (
              <AdminApprovalBanner />
            )}

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

              {achievementNotification && (
                <AchievementNotification
                  achievement={achievementNotification}
                  onClose={() => setAchievementNotification(null)}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
