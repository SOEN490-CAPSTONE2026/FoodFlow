import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link, useNavigationType } from "react-router-dom";
import "./Receiver_Styles/ReceiverLayout.css";
import Logo from "../../assets/Logo.png";
import ProfilePhoto from "./pfp.png";
import { AuthContext } from "../../contexts/AuthContext";
import { NotificationProvider, useNotification } from "../../contexts/NotificationContext";
import MessageNotification from "../MessagingDashboard/MessageNotification";
import ReceiverPreferences from "./ReceiverPreferences";
import EmailVerificationRequired from '../EmailVerificationRequired';
import AdminApprovalBanner from '../AdminApprovalBanner';
import { connectToUserQueue, disconnect } from '../../services/socket';
import api from '../../services/api';
import {
  Settings as IconSettings,
  HelpCircle as IconHelpCircle,
  LogOut as IconLogOut,
  Inbox as IconInbox,
  CheckCircle,
  User as IconUser,
} from 'lucide-react';

function ReceiverLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { logout, organizationName, organizationVerificationStatus, accountStatus, role } = React.useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const dropdownRef = useRef(null);
  const isActive = path => location.pathname === path;
  const { notification, showNotification, clearNotification } =
    useNotification();

  const isMessagesPage = location.pathname === '/receiver/messages';

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/receiver':
      case '/receiver/dashboard':
        return 'Receiver Dashboard';
      case '/receiver/welcome':
        return 'Welcome';
      case '/receiver/browse':
        return 'Browse Available Food';
      case '/receiver/messages':
        return 'Messages';
      case '/receiver/settings':
        return 'Settings';
      default:
        return 'Receiver Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/receiver':
      case '/receiver/dashboard':
        return 'Overview of nearby food and your activity';
      case '/receiver/welcome':
        return 'Start here: search the map or browse nearby food';
      case '/receiver/browse':
        return 'Browse available food listings';
      case '/receiver/messages':
        return 'Communicate with donors and other users';
      case '/receiver/settings':
        return 'Manage your preferences and account settings';
      default:
        return 'FoodFlow Receiver Portal';
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
      let message = `Successfully claimed "${foodTitle}" from ${donorName}`;

      if (status === 'READY_FOR_PICKUP' || status === 'Ready for Pickup') {
        message = `"${foodTitle}" is ready for pickup! Check your claims for details.`;
      }

      console.log('RECEIVER: Setting notification with message:', message);
      showNotification('Claim Confirmed', message);
    };

    const onClaimCancelled = payload => {
      console.log('RECEIVER: Claim cancellation received:', payload);
      const foodTitle = payload.surplusPostTitle || 'a food item';
      const message = `Your claim on "${foodTitle}" has been cancelled`;
      console.log('RECEIVER: Setting notification with message:', message);
      showNotification('Claim Status', message);
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

    connectToUserQueue(
      onMessage,
      onClaimNotification,
      onClaimCancelled,
      onNewPostNotification
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
            Donations
          </Link>

          <Link
            to="/receiver/my-claims"
            className={`receiver-nav-link ${isActive('/receiver/my-claims') || isActive('/receiver/dashboard') ? 'active' : ''}`}
          >
            My Claims
          </Link>

          <Link
            to="/receiver/welcome"
            className={`receiver-nav-link ${location.pathname === '/receiver/welcome' ? 'active' : ''}`}
          >
            Saved Donations
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
              title="Account"
            >
              <img src={ProfilePhoto} alt="Profile" />
            </button>
          </div>

          {showDropdown && (
            <div className="dropdown-menu dropdown-menu--card">
              <div className="dropdown-header">
                Hello {organizationName || 'User'}!
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
                <span>Settings</span>
              </div>

              <div
                className="dropdown-item dropdown-item--preferences"
                onClick={() => {
                  setShowDropdown(false);
                  setShowPreferences(true);
                }}
              >
                <IconUser size={18} />
                <span>Preferences</span>
              </div>

              <div
                className="dropdown-item dropdown-item--help"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/receiver/help');
                }}
              >
                <IconHelpCircle size={18} />
                <span>Help</span>
              </div>

              <div className="dropdown-divider"></div>

              <div
                className="dropdown-item dropdown-item-logout"
                onClick={handleLogout}
              >
                <IconLogOut size={18} />
                <span>Logout</span>
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
            {accountStatus === 'PENDING_ADMIN_APPROVAL' && <AdminApprovalBanner />}
            
            {!isMessagesPage && (
              <div className="receiver-topbar">
                <div className="receiver-topbar-left">
                  <h1>{getPageTitle()}</h1>
                  <p>{getPageDescription()}</p>
                </div>
              </div>
            )}

            <div className={`receiver-content ${isMessagesPage ? 'messages-page' : ''}`}>
              <Outlet />
              <MessageNotification
                notification={notification}
                onClose={clearNotification}
              />
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
