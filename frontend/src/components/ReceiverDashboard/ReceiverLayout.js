import React, { useState, useRef, useEffect } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  Link,
  useNavigationType,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Receiver_Styles/ReceiverLayout.css';
import Logo from '../../assets/Logo.png';
import ProfilePhoto from './pfp.png';
import { AuthContext } from '../../contexts/AuthContext';
import {
  NotificationProvider,
  useNotification,
} from '../../contexts/NotificationContext';
import MessageNotification from '../MessagingDashboard/MessageNotification';
import AchievementNotification from '../shared/AchievementNotification';
import ReceiverPreferences from './ReceiverPreferences';
import EmailVerificationRequired from '../EmailVerificationRequired';
import AdminApprovalBanner from '../AdminApprovalBanner';
import { connectToUserQueue, disconnect } from '../../services/socket';
import api, { profileAPI } from '../../services/api';
import {
  Settings as IconSettings,
  HelpCircle as IconHelpCircle,
  LogOut as IconLogOut,
  Inbox as IconInbox,
  CheckCircle,
  User as IconUser,
} from 'lucide-react';

function ReceiverLayoutContent() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const {
    logout,
    organizationName,
    organizationVerificationStatus,
    accountStatus,
    role,
  } = React.useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [achievementNotification, setAchievementNotification] = useState(null);
  const dropdownRef = useRef(null);
  const isActive = path => location.pathname === path;
  const { notification, showNotification, clearNotification } =
    useNotification();

  const isMessagesPage = location.pathname === '/receiver/messages';

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

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/receiver':
      case '/receiver/dashboard':
        return t('receiverLayout.pageTitles.receiverDashboard');
      case '/receiver/welcome':
        return t('receiverLayout.pageTitles.welcome');
      case '/receiver/browse':
        return t('receiverLayout.pageTitles.browse');
      case '/receiver/messages':
        return t('receiverLayout.pageTitles.messages');
      case '/receiver/settings':
        return t('receiverLayout.pageTitles.settings');
      default:
        return t('receiverLayout.pageTitles.default');
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/receiver':
      case '/receiver/dashboard':
        return t('receiverLayout.pageDescriptions.receiverDashboard');
      case '/receiver/welcome':
        return t('receiverLayout.pageDescriptions.welcome');
      case '/receiver/browse':
        return t('receiverLayout.pageDescriptions.browse');
      case '/receiver/messages':
        return t('receiverLayout.pageDescriptions.messages');
      case '/receiver/settings':
        return t('receiverLayout.pageDescriptions.settings');
      default:
        return t('receiverLayout.pageDescriptions.default');
    }
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/conversations');
        const totalUnread = response.data.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(totalUnread);
      } catch (err) {
        console.error('Error fetching unread message count:', err);
      }
    };

    fetchUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Connect to websocket for user-specific notifications (receiver)
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
        showNotification(senderName, message);
        // Increment unread count when receiving a new message
        setUnreadMessagesCount(prev => prev + 1);
      }
    };

    const onClaimNotification = payload => {
      console.log('RECEIVER: Claim confirmation received:', payload);
      const foodTitle = payload.surplusPostTitle || 'a food item';
      const donorName = payload.surplusPost?.donorEmail || 'a donor';
      const status = payload.status || '';
      let message = t('notifications.successfullyClaimed', {
        foodTitle,
        donorName,
      });

      if (status === 'READY_FOR_PICKUP' || status === 'Ready for Pickup') {
        message = t('notifications.readyForPickup', { foodTitle });
      }

      console.log('RECEIVER: Setting notification with message:', message);
      showNotification(t('notifications.claimConfirmed'), message);
    };

    const onClaimCancelled = payload => {
      console.log('RECEIVER: Claim cancellation received:', payload);
      const foodTitle = payload.surplusPostTitle || 'a food item';
      const message = t('notifications.claimCancelled', { foodTitle });
      console.log('RECEIVER: Setting notification with message:', message);
      showNotification(t('notifications.claimStatus'), message);
    };

    const onNewPostNotification = payload => {
      console.log('RECEIVER: New post notification received:', payload);
      const title = payload.title || 'New donation';
      const quantity = payload.quantity || 0;
      const matchReason = payload.matchReason || 'Matches your preferences';
      const message = `${title} (${quantity} items) - ${matchReason}`;
      console.log('RECEIVER: Showing notification:', message);
      showNotification('🔔 New Donation Available', message);
    };

    const onAchievementUnlocked = payload => {
      // Handle achievement unlock notifications
      console.log('RECEIVER: Achievement unlocked:', payload);
      setAchievementNotification(payload);
    };

    connectToUserQueue(
      onMessage,
      onClaimNotification,
      onClaimCancelled,
      onNewPostNotification,
      onAchievementUnlocked
    );
    return () => {
      try {
        disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [showNotification]);

  useEffect(() => {
    if (navType === 'POP' && !location.pathname.startsWith('/receiver')) {
      navigate('/receiver/dashboard', { replace: true });
    }
    // Refresh unread count when navigating away from messages page
    if (!isMessagesPage) {
      const fetchUnreadCount = async () => {
        try {
          const response = await api.get('/conversations');
          const totalUnread = response.data.reduce(
            (sum, conv) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadMessagesCount(totalUnread);
        } catch (err) {
          console.error('Error fetching unread message count:', err);
        }
      };
      fetchUnreadCount();
    }
  }, [navType, location.pathname, navigate, isMessagesPage]);

  const toggleDropdown = () => setShowDropdown(s => !s);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setShowDropdown(false);
      navigate('/', { replace: true, state: { scrollTo: 'home' } });
    }
  };

  return (
    <div className="receiver-layout">
      <div className="receiver-sidebar">
        <div className="receiver-sidebar-header">
          <Link to="/" state={{ scrollTo: 'home', from: 'receiver' }}>
            <img src={Logo} alt="FoodFlow" className="receiver-logo" />
          </Link>
        </div>

        <div className="receiver-nav-links">
          <Link
            to="/receiver"
            className={`receiver-nav-link ${location.pathname === '/receiver' || location.pathname === '/receiver/browse' ? 'active' : ''}`}
          >
            {t('receiverLayout.donations')}
          </Link>

          <Link
            to="/receiver/my-claims"
            className={`receiver-nav-link ${isActive('/receiver/my-claims') || isActive('/receiver/dashboard') ? 'active' : ''}`}
          >
            {t('receiverLayout.myClaims')}
          </Link>

          <Link
            to="/receiver/achievements"
            className={`receiver-nav-link ${isActive('/receiver/achievements') ? 'active' : ''}`}
          >
            {t('receiverLayout.achievements', 'Achievements')}
          </Link>

          <Link
            to="/receiver/welcome"
            className={`receiver-nav-link ${location.pathname === '/receiver/welcome' ? 'active' : ''}`}
          >
            {t('receiverLayout.savedDonations')}
          </Link>
        </div>

        <div className="receiver-user-info" ref={dropdownRef}>
          <div className="user-actions">
            <button
              className="inbox-btn"
              type="button"
              aria-label="Messages"
              onClick={() => navigate('/receiver/messages')}
            >
              <IconInbox size={32} />
              {unreadMessagesCount > 0 && (
                <span className="badge">{unreadMessagesCount}</span>
              )}
            </button>

            <button
              className="avatar-btn"
              type="button"
              aria-label="Account menu"
              onClick={toggleDropdown}
              title={t('receiverLayout.account')}
            >
              <img src={profilePhotoUrl || ProfilePhoto} alt="Profile" />
            </button>
          </div>

          {showDropdown && (
            <div className="dropdown-menu dropdown-menu--card">
              <div className="dropdown-header">
                {t('receiverLayout.hello', {
                  name: organizationName || t('receiverLayout.user'),
                })}
              </div>
              <div className="dropdown-divider"></div>

              <div
                className="dropdown-item dropdown-item--settings"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/receiver/settings');
                }}
              >
                <IconSettings size={18} />
                <span>{t('receiverLayout.settings')}</span>
              </div>

              <div
                className="dropdown-item dropdown-item--preferences"
                onClick={() => {
                  setShowDropdown(false);
                  setShowPreferences(true);
                }}
              >
                <IconUser size={18} />
                <span>{t('receiverLayout.preferences')}</span>
              </div>

              <div
                className="dropdown-item dropdown-item--help"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/receiver/help');
                }}
              >
                <IconHelpCircle size={18} />
                <span>{t('receiverLayout.help')}</span>
              </div>

              <div className="dropdown-divider"></div>

              <div
                className="dropdown-item dropdown-item-logout"
                onClick={handleLogout}
              >
                <IconLogOut size={18} />
                <span>{t('receiverLayout.logout')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="receiver-main">
        {/* Show email verification screen if account not verified */}
        {accountStatus === 'PENDING_VERIFICATION' ? (
          <EmailVerificationRequired />
        ) : (
          <>
            {/* Show admin approval banner if waiting for approval */}
            {accountStatus === 'PENDING_ADMIN_APPROVAL' && (
              <AdminApprovalBanner />
            )}

            {!isMessagesPage && (
              <div className="receiver-topbar">
                <div className="receiver-topbar-left">
                  <h1>{getPageTitle()}</h1>
                  <p>{getPageDescription()}</p>
                </div>
              </div>
            )}

            <div
              className={`receiver-content ${isMessagesPage ? 'messages-page' : ''}`}
            >
              <Outlet />
              <MessageNotification
                notification={notification}
                onClose={clearNotification}
              />
              {achievementNotification && (
                <AchievementNotification
                  achievement={achievementNotification}
                  onClose={() => setAchievementNotification(null)}
                />
              )}
            </div>
          </>
        )}
      </div>

      <ReceiverPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={savedPreferences => {
          console.log('Preferences saved:', savedPreferences);
          // You can add additional logic here if needed
        }}
      />
    </div>
  );
}

export default function ReceiverLayout() {
  return (
    <NotificationProvider>
      <ReceiverLayoutContent />
    </NotificationProvider>
  );
}
