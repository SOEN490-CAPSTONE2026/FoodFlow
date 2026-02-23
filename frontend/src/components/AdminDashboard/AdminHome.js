import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Gift,
  ShoppingBag,
  Activity,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Flag,
  UserX,
  Scale,
  Clock,
  Shield,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  impactDashboardAPI,
  adminVerificationAPI,
  adminDonationAPI,
  adminDisputeAPI,
} from '../../services/api';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import './Admin_Styles/AdminHome.css';

export default function AdminHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { organizationName } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    ongoingClaims: 0,
    activeDonations: 0,
    pendingVerifications: 0,
    completedToday: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const quickActions = [
    {
      id: 1,
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      iconColor: '#2196f3',
      iconBg: '#e3f2fd',
      route: '/admin/users',
    },
    {
      id: 2,
      title: 'Review Donations',
      description: 'Review and moderate donation posts',
      icon: Shield,
      iconColor: '#4caf50',
      iconBg: '#e8f5e9',
      route: '/admin/donations',
    },
    {
      id: 3,
      title: 'Dispute Dashboard',
      description: 'Handle disputes and reports',
      icon: Scale,
      iconColor: '#f44336',
      iconBg: '#ffebee',
      route: '/admin/disputes',
    },
    {
      id: 4,
      title: 'Messages',
      description: 'View platform communications',
      icon: MessageSquare,
      iconColor: '#009688',
      iconBg: '#e0f2f1',
      route: '/admin/messages',
    },
    {
      id: 5,
      title: 'Flagged Posts',
      description: 'Review flagged content',
      icon: Flag,
      iconColor: '#ff9800',
      iconBg: '#fff3e0',
      route: '/admin/flagged',
    },
    {
      id: 6,
      title: 'Pickup Schedule',
      description: 'View and manage pickup schedules',
      icon: Calendar,
      iconColor: '#9c27b0',
      iconBg: '#f3e5f5',
      route: '/admin/schedule',
    },
    {
      id: 7,
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: BarChart3,
      iconColor: '#3f51b5',
      iconBg: '#e8eaf6',
      route: '/admin/impact',
    },
    {
      id: 8,
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      iconColor: '#e91e63',
      iconBg: '#fce4ec',
      route: '/admin/settings',
    },
  ];

  const displayedActions = showAllActions
    ? quickActions
    : quickActions.slice(0, 2);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const recentActivities = [];

      // Fetch recent pending users (new registrations)
      const pendingResponse = await adminVerificationAPI.getPendingUsers({
        page: 0,
        size: 3,
        sortBy: 'date',
        sortOrder: 'desc',
      });
      const pendingUsers = pendingResponse.data.content || [];

      // Add new donor registrations with real data
      pendingUsers.forEach(user => {
        const userName = user.organizationName || user.email || 'New user';
        const userType = user.userType === 'DONOR' ? 'donor' : 'receiver';
        recentActivities.push({
          id: `new-user-${user.userId}`,
          type: 'user',
          icon: 'user',
          title: `${userName} registered as a new ${userType}`,
          subtitle: null,
          timestamp: user.registrationDate
            ? new Date(user.registrationDate)
            : new Date(),
        });
      });

      // Fetch recent donations
      const donationsResponse = await adminDonationAPI.getAllDonations({
        page: 0,
        size: 3,
      });
      const donations = donationsResponse.data.content || [];

      // Add recent donations with real data
      donations.forEach(donation => {
        const donorName =
          donation.donorOrganization ||
          donation.donorName ||
          donation.donorEmail ||
          'A donor';
        const donationTitle = donation.title || 'New donation';
        recentActivities.push({
          id: `new-donation-${donation.id}`,
          type: 'donation',
          icon: 'gift',
          title: `${donorName} posted a new donation`,
          subtitle:
            donationTitle.length > 50
              ? donationTitle.substring(0, 47) + '...'
              : donationTitle,
          timestamp: donation.createdAt
            ? new Date(donation.createdAt)
            : new Date(),
        });
      });

      // Fetch flagged posts with real data
      const flaggedResponse = await adminDonationAPI.getAllDonations({
        flagged: true,
        page: 0,
        size: 2,
      });
      const flaggedPosts = flaggedResponse.data.content || [];

      flaggedPosts.forEach(post => {
        recentActivities.push({
          id: `flagged-post-${post.id}`,
          type: 'flag',
          icon: 'flag',
          title: 'System flagged a post for review',
          subtitle: `Post #${post.id} - Inappropriate content detected`,
          timestamp: post.flaggedAt ? new Date(post.flaggedAt) : new Date(),
        });
      });

      // Fetch disputes with real data
      const disputesResponse = await adminDisputeAPI.getAllDisputes({
        status: 'RESOLVED',
        page: 0,
        size: 2,
      });
      const disputes = disputesResponse.data.content || [];

      disputes.forEach(dispute => {
        recentActivities.push({
          id: `dispute-resolved-${dispute.id}`,
          type: 'dispute',
          icon: 'dispute',
          title: 'Admin resolved a dispute',
          subtitle: `Case #${dispute.id}`,
          timestamp: dispute.resolvedAt
            ? new Date(dispute.resolvedAt)
            : dispute.updatedAt
              ? new Date(dispute.updatedAt)
              : new Date(),
        });
      });

      // Sort by timestamp (most recent first)
      recentActivities.sort((a, b) => b.timestamp - a.timestamp);

      // Take only the most recent 6 activities
      setActivities(recentActivities.slice(0, 6));
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  };

  const getTimeAgo = timestamp => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = iconType => {
    switch (iconType) {
      case 'user':
        return <Users size={20} />;
      case 'gift':
        return <Gift size={20} />;
      case 'flag':
        return <Flag size={20} />;
      case 'check':
        return <CheckCircle size={20} />;
      case 'dispute':
        return <Scale size={20} />;
      case 'rejected':
        return <UserX size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  const getActivityIconColor = iconType => {
    switch (iconType) {
      case 'user':
        return '#3b82f6'; // blue
      case 'gift':
        return '#10b981'; // green
      case 'flag':
        return '#ef4444'; // red
      case 'check':
        return '#10b981'; // green
      case 'dispute':
        return '#8b5cf6'; // purple
      case 'rejected':
        return '#f59e0b'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Only show loading on first load (when stats are all 0)
      if (stats.totalUsers === 0 && stats.totalDonations === 0) {
        setLoading(true);
      }
      setError(null);

      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

      // Fetch impact metrics (provides totalPostsCreated, totalDonationsCompleted, totalClaimsMade)
      const impactResponse = await impactDashboardAPI.getMetrics('ALL_TIME');
      const impactData = impactResponse.data;

      // Fetch total users count from admin/users endpoint
      const usersResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 0, size: 1 },
        }
      );

      // Fetch pending verifications from admin/pending-users endpoint
      const pendingResponse = await adminVerificationAPI.getPendingUsers({
        page: 0,
        size: 1,
      });

      // Map the data to our stats
      setStats({
        totalUsers: usersResponse.data.totalElements || 0,
        totalDonations: impactData.totalPostsCreated || 0,
        ongoingClaims: impactData.totalClaimsMade || 0,
        activeDonations: impactData.activeDonors || 0,
        pendingVerifications: pendingResponse.data.totalElements || 0,
        completedToday: impactData.totalDonationsCompleted || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && stats.totalUsers === 0) {
    return (
      <div className="admin-home-loading">Loading dashboard statistics...</div>
    );
  }

  return (
    <div className="admin-home-container">
      {error && <div className="admin-home-error">{error}</div>}

      {/* Welcome Header */}
      <div className="admin-home-welcome-header">
        <h1>
          {t('admin.welcomeBack', { name: 'Evian' })}
          <Sparkles
            className="admin-home-wave-icon"
            size={28}
            strokeWidth={2}
          />
        </h1>
      </div>

      {/* Stats Grid with 6 cards */}
      <div className="admin-home-stats-grid">
        {/* Total Users */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#e3f2fd' }}
          >
            <Users style={{ color: '#2196f3' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Total Users</div>
            <div className="admin-home-stat-value">
              {stats.totalUsers.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Donations */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#e8f5e9' }}
          >
            <Gift style={{ color: '#4caf50' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Total Donations</div>
            <div className="admin-home-stat-value">
              {stats.totalDonations.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Ongoing Claims */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#f3e5f5' }}
          >
            <ShoppingBag style={{ color: '#9c27b0' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Ongoing Claims</div>
            <div className="admin-home-stat-value">
              {stats.ongoingClaims.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Active Donations */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#fff3e0' }}
          >
            <Activity style={{ color: '#ff9800' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Active Donations</div>
            <div className="admin-home-stat-value">
              {stats.activeDonations.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#fff9c4' }}
          >
            <UserCheck style={{ color: '#fbc02d' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Pending Verifications</div>
            <div className="admin-home-stat-value">
              {stats.pendingVerifications.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="admin-home-stat-card">
          <div
            className="admin-home-stat-icon"
            style={{ background: '#d1fae5' }}
          >
            <CheckCircle style={{ color: '#10b981' }} size={28} />
          </div>
          <div className="admin-home-stat-content">
            <div className="admin-home-stat-label">Completed</div>
            <div className="admin-home-stat-value">
              {stats.completedToday.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="admin-home-quick-actions-section">
        <div className="admin-home-section-header">
          <div>
            <h2>Quick Actions</h2>
            <p className="admin-home-section-subtitle">
              Access the most critical admin tools
            </p>
          </div>
          <span
            className="admin-home-view-all-link"
            onClick={() => setShowAllActions(!showAllActions)}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {showAllActions ? 'View Less' : 'View All Tools'}
          </span>
        </div>
        <div className="admin-home-quick-actions-grid">
          {displayedActions.map(action => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.id}
                className="admin-home-action-card"
                onClick={() => navigate(action.route)}
                role="button"
                tabIndex={0}
              >
                <div
                  className="admin-home-action-icon"
                  style={{ background: action.iconBg }}
                >
                  <IconComponent
                    style={{ color: action.iconColor }}
                    size={24}
                  />
                </div>
                <div className="admin-home-action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <ChevronRight className="admin-home-action-arrow" size={20} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      {activities.length > 0 && (
        <div className="admin-home-recent-activity-section">
          <div className="admin-home-activity-header">
            <h2>Recent Activity</h2>
            <div className="admin-home-activity-header-right">
              <span
                className="admin-home-view-all-link"
                onClick={() => navigate('/admin/donations')}
              >
                View All Activity
              </span>
            </div>
          </div>
          <div className="admin-home-activity-list">
            {activities.map(activity => (
              <div key={activity.id} className="admin-home-activity-item">
                <div
                  className="admin-home-activity-icon"
                  style={{
                    backgroundColor: `${getActivityIconColor(activity.icon)}15`,
                    color: getActivityIconColor(activity.icon),
                  }}
                >
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="admin-home-activity-content">
                  <div className="admin-home-activity-title">
                    {activity.title}
                  </div>
                  {activity.subtitle && (
                    <div className="admin-home-activity-subtitle">
                      {activity.subtitle}
                    </div>
                  )}
                </div>
                <div className="admin-home-activity-time">
                  {getTimeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
