import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Select from 'react-select';
import {
  ChevronRight,
  ChevronDown,
  Power,
  Bell,
  Edit3,
  Search,
  Users,
  Gift,
  Sparkles,
  Handshake,
  Eye,
  Info,
  User,
  Building2,
  Phone as PhoneIcon,
  Mail,
  FileText,
  Calendar,
  Clock,
  Download,
  Globe,
} from 'lucide-react';
import { feedbackAPI } from '../../services/api';
import './Admin_Styles/AdminUsers.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const AdminUsers = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalReceivers: 0,
    newUsers: 0,
  });

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);

  // Modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  // Document upload state
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadDocumentError, setUploadDocumentError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Notification modal
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // 'success', 'error', 'info'

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // User ratings
  const [userRatings, setUserRatings] = useState({});

  // User recent activities
  const [userActivities, setUserActivities] = useState({});

  // User detail modal
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const params = {
        page: currentPage,
        size: pageSize,
      };

      if (roleFilter) {
        params.role = roleFilter;
      }
      if (statusFilter) {
        params.accountStatus = statusFilter;
      }
      // Remove search from API call - handle it frontend only

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      // Handle paginated response
      const content = response.data.content || [];
      const totalPagesCount = response.data.totalPages || 0;

      // Calculate stats
      const totalDonors = content.filter(u => u.role === 'DONOR').length;
      const totalReceivers = content.filter(u => u.role === 'RECEIVER').length;
      const newUsers = content.filter(u => {
        const createdDate = new Date(u.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length;

      setStats({
        totalUsers: content.length,
        totalDonors,
        totalReceivers,
        newUsers,
      });

      setUsers(content);
      setTotalPages(totalPagesCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(t('adminUsers.errors.loadFailed'));
      setUsers([]);
      setLoading(false);
    }
  };

  // Fetch user rating
  const fetchUserRating = async userId => {
    if (userRatings[userId]) {
      return;
    } // Already fetched

    try {
      const response = await feedbackAPI.getUserRating(userId);
      if (response && response.data) {
        setUserRatings(prev => ({
          ...prev,
          [userId]: {
            averageRating: response.data.averageRating || 0,
            totalReviews: response.data.totalReviews || 0,
          },
        }));
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setUserRatings(prev => ({
        ...prev,
        [userId]: { averageRating: 0, totalReviews: 0 },
      }));
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when filters change (not search - that's frontend only)
  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  // Apply client-side filtering if backend doesn't support search
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredUsers(users);
      return;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = users.filter(user => {
      const name = (user.contactPerson || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const org = (user.organizationName || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();

      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        org.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });

    setFilteredUsers(filtered);
  }, [users, debouncedSearchTerm]);

  // Deactivate user
  const handleDeactivate = async () => {
    if (!selectedUser || !adminNotes.trim()) {
      setNotificationMessage(t('adminUsers.notifications.reasonRequired'));
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/deactivate`,
        { adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotificationMessage(t('adminUsers.notifications.deactivated'));
      setNotificationType('success');
      setShowNotification(true);
      setShowDeactivateModal(false);
      setAdminNotes('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      setNotificationMessage(
        err.response?.data || t('adminUsers.notifications.deactivateFailed')
      );
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  // Reactivate user
  const handleReactivate = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotificationMessage(t('adminUsers.notifications.reactivated'));
      setNotificationType('success');
      setShowNotification(true);
      setShowReactivateModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error reactivating user:', err);
      setNotificationMessage(
        err.response?.data || t('adminUsers.notifications.reactivateFailed')
      );
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  // Send alert
  const handleSendAlert = async () => {
    if (!selectedUser || !alertMessage.trim()) {
      setNotificationMessage(t('adminUsers.notifications.alertRequired'));
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/send-alert`,
        { message: alertMessage, alertType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotificationMessage(t('adminUsers.notifications.alertSent'));
      setNotificationType('success');
      setShowNotification(true);
      closeAlertModal();
    } catch (err) {
      console.error('Error sending alert:', err);
      setNotificationMessage(t('adminUsers.notifications.alertFailed'));
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  // Close alert modal and reset states
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertMessage('');
    setAlertType('');
    setSelectedUser(null);
  };

  // File upload handlers
  const handleFileSelect = file => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadDocumentError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    if (file.size > maxSize) {
      setUploadDocumentError('File size must not exceed 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadDocumentError('');
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !selectedUserForView) {
      setUploadDocumentError('Please select a file');
      return;
    }

    setUploadingDocument(true);
    setUploadDocumentError('');

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUserForView.id}/supporting-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update the user data with the new document URL
      setSelectedUserForView(response.data);
      setNotificationMessage('Document uploaded successfully');
      setNotificationType('success');
      setShowNotification(true);
      closeUploadDocumentModal();

      // Refresh the user list
      fetchUsers();
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = err.response?.data || 'Failed to upload document';
      setUploadDocumentError(errorMessage);
    } finally {
      setUploadingDocument(false);
    }
  };

  const closeUploadDocumentModal = () => {
    setShowUploadDocumentModal(false);
    setSelectedFile(null);
    setUploadDocumentError('');
    setIsDraggingFile(false);
  };

  // Fetch user recent activity
  const fetchUserActivity = async userId => {
    if (userActivities[userId]) {
      return;
    } // Already fetched

    try {
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${userId}/recent-activity?limit=3`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response && response.data) {
        setUserActivities(prev => ({
          ...prev,
          [userId]: response.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setUserActivities(prev => ({
        ...prev,
        [userId]: [],
      }));
    }
  };

  // Open user detail modal
  const openUserDetailModal = async user => {
    try {
      // Fetch detailed user information from backend
      const token =
        localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Backend user data:', response.data);
      console.log('Address:', response.data.address);
      console.log('BusinessLicense:', response.data.businessLicense);
      console.log(
        'CharityRegistrationNumber:',
        response.data.charityRegistrationNumber
      );

      // Set the detailed user data
      setSelectedUserForView(response.data);
      setShowUserDetailModal(true);

      // Fetch rating if not already loaded
      if (!userRatings[user.id]) {
        await fetchUserRating(user.id);
      }

      // Fetch recent activity if not already loaded
      if (!userActivities[user.id]) {
        await fetchUserActivity(user.id);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to using the user object from the table if API fails
      setSelectedUserForView(user);
      setShowUserDetailModal(true);

      // Still try to fetch rating
      if (!userRatings[user.id]) {
        await fetchUserRating(user.id);
      }

      // Still try to fetch activity
      if (!userActivities[user.id]) {
        await fetchUserActivity(user.id);
      }
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setCurrentPage(0);
  };

  // Get badge color
  const getBadgeColor = status => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'DEACTIVATED':
        return 'badge-danger';
      case 'VERIFIED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return <div className="admin-users-loading">Loading users...</div>;
  }

  // Get user initials for avatar
  const getInitials = name => {
    if (!name) {
      return '?';
    }
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = name => {
    const colors = [
      '#3498db',
      '#9b59b6',
      '#e74c3c',
      '#f39c12',
      '#1abc9c',
      '#34495e',
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  // Map language code to display name
  const getLanguageLabel = code => {
    const languageMap = {
      en: 'English',
      fr: 'Français',
      es: 'Español',
      zh: '中文',
      ar: 'العربية',
      pt: 'Português',
    };
    return languageMap[code] || code || 'N/A';
  };

  // React Select options
  const roleOptions = [
    { value: '', label: t('adminUsers.filters.allRoles') },
    { value: 'DONOR', label: t('adminUsers.roles.donor') },
    { value: 'RECEIVER', label: t('adminUsers.roles.receiver') },
    { value: 'ADMIN', label: t('adminUsers.roles.admin') },
  ];

  const statusOptions = [
    { value: '', label: t('adminUsers.filters.allStatus') },
    { value: 'ACTIVE', label: t('adminUsers.status.active') },
    { value: 'DEACTIVATED', label: t('adminUsers.status.deactivated') },
  ];

  // Custom styles for React Select
  const selectStyles = {
    control: base => ({
      ...base,
      minHeight: '42px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#d1d5db',
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
    }),
    menu: base => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }),
  };

  return (
    <div className="admin-users-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd' }}>
            <Users style={{ color: '#2196f3' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('adminUsers.stats.totalUsers')}</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>
            <Gift style={{ color: '#4caf50' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminUsers.stats.totalDonors')}
            </div>
            <div className="stat-value">{stats.totalDonors}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <Sparkles style={{ color: '#ff9800' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('adminUsers.stats.newUsers')}</div>
            <div className="stat-value">{stats.newUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5' }}>
            <Handshake style={{ color: '#9c27b0' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminUsers.stats.totalReceivers')}
            </div>
            <div className="stat-value">{stats.totalReceivers}</div>
          </div>
        </div>
      </div>

      {/* All Users Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>{t('adminUsers.title')}</h2>
          <div className="pagination-info">
            {filteredUsers.length > 0 && (
              <span>
                1 - {filteredUsers.length} of {stats.totalUsers}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="search-bar-container">
          <div className="search-input-wrapper admin-users-search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder={t('adminUsers.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input admin-users-search-input"
            />
          </div>

          <div className="filters-wrapper">
            <Select
              value={roleOptions.find(opt => opt.value === roleFilter)}
              onChange={option => setRoleFilter(option.value)}
              options={roleOptions}
              styles={selectStyles}
              className="filter-select-react"
              placeholder={t('adminUsers.filters.allRoles')}
              isSearchable={false}
            />

            <Select
              value={statusOptions.find(opt => opt.value === statusFilter)}
              onChange={option => setStatusFilter(option.value)}
              options={statusOptions}
              styles={selectStyles}
              className="filter-select-react"
              placeholder={t('adminUsers.filters.allStatus')}
              isSearchable={false}
            />

            <button onClick={handleResetFilters} className="filter-reset-btn">
              {t('adminUsers.filters.reset')}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Users Table */}
      <div className="users-table-container">
        <Table className="users-table">
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>{t('adminUsers.table.id')}</TableHead>
              <TableHead>{t('adminUsers.table.name')}</TableHead>
              <TableHead>{t('adminUsers.table.role')}</TableHead>
              <TableHead>{t('adminUsers.table.status')}</TableHead>
              <TableHead>{t('adminUsers.table.email')}</TableHead>
              <TableHead>{t('adminUsers.table.activity')}</TableHead>
              <TableHead>{t('adminUsers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" className="no-users">
                  {t('adminUsers.empty')}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <React.Fragment key={user.id}>
                  <TableRow
                    className={expandedRows.has(user.id) ? 'expanded' : ''}
                  >
                    <TableCell data-label="">
                      <button
                        className="expand-btn"
                        onClick={() => {
                          const newExpanded = new Set(expandedRows);
                          if (newExpanded.has(user.id)) {
                            newExpanded.delete(user.id);
                          } else {
                            newExpanded.add(user.id);
                            // Fetch rating and activity when expanding
                            fetchUserRating(user.id);
                            fetchUserActivity(user.id);
                          }
                          setExpandedRows(newExpanded);
                        }}
                      >
                        {expandedRows.has(user.id) ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        <span className="mobile-expand-label">
                          {t('adminUsers.moreLess')}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell data-label="ID" className="id-cell">
                      {user.id}
                    </TableCell>
                    <TableCell data-label="Name">
                      <div className="user-name-info">
                        <div className="user-name">
                          {user.contactPerson || t('adminUsers.notAvailable')}
                        </div>
                        <div className="user-org">
                          {user.organizationName ||
                            t('adminUsers.notAvailable')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-label="Role">
                      <span className={`pill pill-${user.role.toLowerCase()}`}>
                        {user.role === 'DONOR'
                          ? t('adminUsers.roles.donor')
                          : user.role === 'RECEIVER'
                            ? t('adminUsers.roles.receiver')
                            : t('adminUsers.roles.admin')}
                      </span>
                    </TableCell>
                    <TableCell data-label="Status">
                      <span
                        className={`pill pill-status-${user.accountStatus.toLowerCase()}`}
                      >
                        {user.accountStatus === 'ACTIVE'
                          ? t('adminUsers.status.active')
                          : t('adminUsers.status.deactivated')}
                      </span>
                    </TableCell>
                    <TableCell data-label="Email" className="email-cell">
                      {user.email}
                    </TableCell>
                    <TableCell data-label="Activity" className="activity-cell">
                      {user.role === 'DONOR' && (user.donationCount || 0)}
                      {user.role === 'RECEIVER' && (user.claimCount || 0)}
                      {user.role === 'ADMIN' && '-'}
                    </TableCell>
                    <TableCell data-label="Actions">
                      <div className="action-buttons">
                        <button
                          className="action-btn"
                          onClick={() => openUserDetailModal(user)}
                          title={t('adminUsers.actions.viewDetails')}
                        >
                          <Eye size={16} />
                          <span className="mobile-action-label">
                            {t('adminUsers.actions.viewDetails')}
                          </span>
                        </button>
                        {user.accountStatus === 'ACTIVE' &&
                          user.role !== 'ADMIN' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeactivateModal(true);
                              }}
                              className="action-btn action-btn-power"
                              title={t('adminUsers.actions.deactivate')}
                            >
                              <Power size={16} />
                            </button>
                          )}
                        {user.accountStatus === 'DEACTIVATED' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowReactivateModal(true);
                            }}
                            className="action-btn action-btn-power"
                            title={t('adminUsers.actions.reactivate')}
                          >
                            <Power size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAlertModal(true);
                          }}
                          className="action-btn action-btn-bell"
                          title={t('adminUsers.actions.sendAlert')}
                        >
                          <Bell size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded details row */}
                  {expandedRows.has(user.id) && (
                    <TableRow className="details-row">
                      <TableCell colSpan="8">
                        <div className="user-details-expanded">
                          <div className="details-grid">
                            <div className="details-section">
                              <h4>{t('adminUsers.details.totalActivity')}</h4>
                              <p className="details-value">
                                {user.role === 'DONOR' &&
                                  t('adminUsers.details.donationsCount', {
                                    count: user.donationCount || 0,
                                  })}
                                {user.role === 'RECEIVER' &&
                                  t('adminUsers.details.claimsCount', {
                                    count: user.claimCount || 0,
                                  })}
                                {user.role === 'ADMIN' &&
                                  t('adminUsers.notAvailable')}
                              </p>
                            </div>

                            <div className="details-section">
                              <h4>{t('adminUsers.details.disputes')}</h4>
                              <p className="details-value">0</p>
                            </div>

                            <div className="details-section">
                              <h4>{t('adminUsers.details.feedbackScore')}</h4>
                              <p className="details-value">
                                {userRatings[user.id]
                                  ? userRatings[user.id].totalReviews > 0
                                    ? `${userRatings[user.id].averageRating.toFixed(1)}/5 (${userRatings[user.id].totalReviews} reviews)`
                                    : t('adminUsers.details.noReviews')
                                  : t('common.loading')}
                              </p>
                            </div>

                            <div className="details-section">
                              <h4>{t('adminUsers.details.memberSince')}</h4>
                              <p className="details-value">
                                {new Date(user.createdAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="details-activity">
                            <h4>{t('adminUsers.details.recentActivity')}</h4>
                            <ul className="activity-list">
                              {userActivities[user.id] ? (
                                userActivities[user.id].length > 0 ? (
                                  userActivities[user.id].map(
                                    (activity, index) => {
                                      const item = activity.quantity
                                        ? t(
                                            'adminUsers.details.activityLog.quantityOf',
                                            {
                                              quantity: activity.quantity,
                                              title: activity.title,
                                            }
                                          )
                                        : activity.title || '';
                                      const actionText = t(
                                        `adminUsers.details.activityLog.${activity.action}`,
                                        { item }
                                      );
                                      const dateText = new Date(
                                        activity.timestamp
                                      ).toLocaleDateString(i18n.language, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      });
                                      return (
                                        <li key={index}>
                                          • {actionText}{' '}
                                          {t(
                                            'adminUsers.details.activityLog.on'
                                          )}{' '}
                                          {dateText}
                                        </li>
                                      );
                                    }
                                  )
                                ) : (
                                  <li>
                                    {t(
                                      'adminUsers.details.activityLog.noActivity'
                                    )}
                                  </li>
                                )
                              ) : (
                                <li>{t('common.loading')}</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            className="modal-content modal-alert"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowDeactivateModal(false)}
            >
              ×
            </button>
            <h2>{t('adminUsers.modals.deactivate.title')}</h2>
            <p className="alert-user-name">{selectedUser?.email}</p>

            <textarea
              placeholder={t('adminUsers.modals.deactivate.placeholder')}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="modal-textarea"
              rows="4"
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="btn-cancel"
              >
                {t('common.cancel')}
              </button>
              <button onClick={handleDeactivate} className="btn-confirm">
                {t('adminUsers.actions.deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {showReactivateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowReactivateModal(false)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{t('adminUsers.modals.reactivate.title')}</h2>
            <p>
              {t('adminUsers.modals.reactivate.confirmPrefix')}{' '}
              <strong>{selectedUser?.email}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={handleReactivate} className="btn-confirm">
                {t('adminUsers.actions.reactivate')}
              </button>
              <button
                onClick={() => setShowReactivateModal(false)}
                className="btn-cancel"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Alert Modal */}
      {showAlertModal && (
        <div
          className="modal-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setMouseDownInsideModal(false);
            }
          }}
          onClick={e => {
            if (e.target === e.currentTarget && !mouseDownInsideModal) {
              closeAlertModal();
            }
          }}
        >
          <div
            className="modal-content modal-alert"
            onMouseDown={() => setMouseDownInsideModal(true)}
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeAlertModal}>
              ×
            </button>
            <h2>{t('adminUsers.modals.alert.title')}</h2>
            <p className="alert-user-name">
              {selectedUser?.contactPerson || selectedUser?.email}
            </p>

            <div className="alert-type-section">
              <label className="alert-section-label">
                {t('adminUsers.modals.alert.alertType')}
              </label>

              <div className="alert-options">
                <label
                  className={`alert-option ${alertType === 'warning' ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    if (alertType === 'warning') {
                      setAlertType('');
                      setAlertMessage('');
                    } else {
                      setAlertType('warning');
                      setAlertMessage(t('adminUsers.alertTemplates.warning'));
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="alertType"
                    value="warning"
                    checked={alertType === 'warning'}
                    onChange={() => {}}
                    readOnly
                  />
                  <div className="alert-option-content">
                    <div className="alert-option-title">
                      {t('adminUsers.alertTypes.warning')}
                    </div>
                    <div className="alert-option-desc">
                      {t('adminUsers.alertDescriptions.warning')}
                    </div>
                  </div>
                </label>

                <label
                  className={`alert-option ${alertType === 'safety' ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    if (alertType === 'safety') {
                      setAlertType('');
                      setAlertMessage('');
                    } else {
                      setAlertType('safety');
                      setAlertMessage(t('adminUsers.alertTemplates.safety'));
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="alertType"
                    value="safety"
                    checked={alertType === 'safety'}
                    onChange={() => {}}
                    readOnly
                  />
                  <div className="alert-option-content">
                    <div className="alert-option-title">
                      {t('adminUsers.alertTypes.safety')}
                    </div>
                    <div className="alert-option-desc">
                      {t('adminUsers.alertDescriptions.safety')}
                    </div>
                  </div>
                </label>

                <label
                  className={`alert-option ${alertType === 'compliance' ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    if (alertType === 'compliance') {
                      setAlertType('');
                      setAlertMessage('');
                    } else {
                      setAlertType('compliance');
                      setAlertMessage(
                        t('adminUsers.alertTemplates.compliance')
                      );
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="alertType"
                    value="compliance"
                    checked={alertType === 'compliance'}
                    onChange={() => {}}
                    readOnly
                  />
                  <div className="alert-option-content">
                    <div className="alert-option-title">
                      {t('adminUsers.alertTypes.compliance')}
                    </div>
                    <div className="alert-option-desc">
                      {t('adminUsers.alertDescriptions.compliance')}
                    </div>
                  </div>
                </label>

                <label
                  className={`alert-option ${alertType === 'custom' ? 'selected' : ''}`}
                  onClick={e => {
                    e.preventDefault();
                    if (alertType === 'custom') {
                      setAlertType('');
                      setAlertMessage('');
                    } else {
                      setAlertType('custom');
                      setAlertMessage('');
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="alertType"
                    value="custom"
                    checked={alertType === 'custom'}
                    onChange={() => {}}
                    readOnly
                  />
                  <div className="alert-option-content">
                    <div className="alert-option-title">
                      {t('adminUsers.alertTypes.custom')}
                    </div>
                    <div className="alert-option-desc">
                      {t('adminUsers.alertDescriptions.custom')}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {alertType && (
              <div
                className="custom-message-section"
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              >
                <textarea
                  placeholder={
                    alertType === 'custom'
                      ? t('adminUsers.modals.alert.customPlaceholder')
                      : t('adminUsers.modals.alert.editPlaceholder')
                  }
                  value={alertMessage}
                  onChange={e => setAlertMessage(e.target.value)}
                  className="modal-textarea"
                  rows="4"
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onFocus={e => e.stopPropagation()}
                />
              </div>
            )}

            <div className="modal-actions">
              <button onClick={closeAlertModal} className="btn-cancel">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSendAlert}
                className="btn-confirm btn-send-alert"
              >
                {t('adminUsers.actions.sendAlert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
        <div
          className="modal-overlay"
          onClick={() => setShowNotification(false)}
        >
          <div
            className="modal-content modal-notification"
            onClick={e => e.stopPropagation()}
          >
            <div
              className={`notification-header notification-${notificationType}`}
            >
              <h3>
                {notificationType === 'success'
                  ? '✓ Success'
                  : notificationType === 'error'
                    ? 'Error'
                    : 'ℹ Notice'}
              </h3>
            </div>
            <div className="notification-body">
              <p>{notificationMessage}</p>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowNotification(false)}
                className="btn-confirm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUserForView && (
        <div
          className="modal-overlay"
          onClick={() => setShowUserDetailModal(false)}
        >
          <div
            className="modal-content modal-user-detail"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowUserDetailModal(false)}
            >
              ×
            </button>

            <div className="modal-header">
              <h2>User Details</h2>
            </div>

            <div className="modal-body">
              {/* Basic Information Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <Info size={20} />
                  <h3>Basic Information</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <User size={16} /> ID
                    </span>
                    <span className="info-value">{selectedUserForView.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <User size={16} /> Name
                    </span>
                    <span className="info-value">
                      {selectedUserForView.contactPerson ||
                        selectedUserForView.fullName ||
                        'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Building2 size={16} /> Organization
                    </span>
                    <span className="info-value">
                      {selectedUserForView.organizationName || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Mail size={16} /> Email
                    </span>
                    <span className="info-value">
                      {selectedUserForView.email}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <PhoneIcon size={16} /> Phone
                    </span>
                    <span className="info-value">
                      {selectedUserForView.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Globe size={16} /> Preferred Language
                    </span>
                    <span className="info-value">
                      {getLanguageLabel(selectedUserForView.languagePreference)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <FileText size={16} /> License Document
                    </span>
                    <span className="info-value">
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                        }}
                      >
                        {selectedUserForView.supportingDocumentUrl ||
                        selectedUserForView.licenseDocument ||
                        selectedUserForView.businessLicense ||
                        selectedUserForView.charityRegistrationNumber ? (
                          <a
                            href={
                              selectedUserForView.supportingDocumentUrl ||
                              selectedUserForView.licenseDocument ||
                              `${process.env.REACT_APP_API_BASE_URL}/api/files/licenses/${selectedUserForView.businessLicense || selectedUserForView.charityRegistrationNumber}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="license-document-link"
                          >
                            <Download size={16} />
                            View Document
                          </a>
                        ) : (
                          'No document uploaded'
                        )}
                        <button
                          className="btn-modify-document"
                          onClick={() => setShowUploadDocumentModal(true)}
                          title="Upload or replace document"
                        >
                          {Edit3 && (
                            <Edit3 size={16} style={{ marginRight: '4px' }} />
                          )}
                          Modify
                        </button>
                      </div>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <FileText size={16} /> Registration Number
                    </span>
                    <span className="info-value">
                      {selectedUserForView.businessLicense ||
                        selectedUserForView.charityRegistrationNumber ||
                        selectedUserForView.licenseNumber ||
                        'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity & Statistics Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <Sparkles size={20} />
                  <h3>Activity & Statistics</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <Calendar size={16} /> Registration Date
                    </span>
                    <span className="info-value">
                      {selectedUserForView.createdAt
                        ? new Date(
                            selectedUserForView.createdAt
                          ).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Clock size={16} /> Last Active
                    </span>
                    <span className="info-value">
                      {selectedUserForView.lastActive
                        ? new Date(
                            selectedUserForView.lastActive
                          ).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  {selectedUserForView.role === 'DONOR' && (
                    <div className="info-item">
                      <span className="info-label">
                        <Gift size={16} /> Total Donations
                      </span>
                      <span className="info-value">
                        {selectedUserForView.donationCount || 0}
                      </span>
                    </div>
                  )}
                  {selectedUserForView.role === 'RECEIVER' && (
                    <div className="info-item">
                      <span className="info-label">
                        <Handshake size={16} /> Total Claims
                      </span>
                      <span className="info-value">
                        {selectedUserForView.claimCount || 0}
                      </span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Rating</span>
                    <span className="info-value">
                      {userRatings[selectedUserForView.id] !== undefined &&
                      userRatings[selectedUserForView.id].averageRating
                        ? `${userRatings[selectedUserForView.id].averageRating.toFixed(1)} ⭐ (${userRatings[selectedUserForView.id].totalReviews} reviews)`
                        : 'No ratings yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Information Card */}
              {selectedUserForView.address && (
                <div className="info-card">
                  <div className="info-card-header">
                    <Building2 size={20} />
                    <h3>Address Information</h3>
                  </div>
                  <div className="info-grid">
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label">Address</span>
                      <span className="info-value">
                        {typeof selectedUserForView.address === 'string'
                          ? selectedUserForView.address
                          : `${selectedUserForView.address.street || ''}, ${selectedUserForView.address.city || ''}, ${selectedUserForView.address.province || ''} ${selectedUserForView.address.postalCode || ''}, ${selectedUserForView.address.country || ''}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Supporting Document Modal */}
      {showUploadDocumentModal && selectedUserForView && (
        <div
          className="modal-overlay"
          onClick={() => closeUploadDocumentModal()}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <button
              className="modal-close"
              onClick={() => closeUploadDocumentModal()}
            >
              ✕
            </button>
            <div className="modal-header">
              <h3>Upload Supporting Document</h3>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Upload a PDF, JPG, or PNG file (max 10MB) to replace the current
                document.
              </p>

              <div
                className={`file-upload-area ${isDraggingFile ? 'dragging' : ''} ${
                  uploadDocumentError ? 'error' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDraggingFile
                    ? '2px solid #0077b6'
                    : '2px dashed #cbd5e0',
                  borderRadius: '8px',
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: isDraggingFile ? '#e6f2ff' : '#f7fafc',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                {!selectedFile ? (
                  <>
                    <p style={{ fontSize: '2em', marginBottom: '10px' }}>📎</p>
                    <label
                      htmlFor="fileUploadAdmin"
                      style={{
                        cursor: 'pointer',
                        color: '#0077b6',
                        fontWeight: 'bold',
                      }}
                    >
                      Click to select or drag file here
                    </label>
                    <input
                      type="file"
                      id="fileUploadAdmin"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => handleFileSelect(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <p
                      style={{
                        fontSize: '0.9em',
                        color: '#a0aec0',
                        marginTop: '10px',
                      }}
                    >
                      PDF, JPG, PNG (Max 10MB)
                    </p>
                  </>
                ) : (
                  <div style={{ color: '#0077b6' }}>
                    <p style={{ fontSize: '2em', marginBottom: '10px' }}>✓</p>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {selectedFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Change File
                    </button>
                  </div>
                )}
              </div>

              {uploadDocumentError && (
                <div
                  style={{
                    color: '#e53e3e',
                    fontSize: '0.9em',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#fff5f5',
                    borderRadius: '4px',
                  }}
                >
                  {uploadDocumentError}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => closeUploadDocumentModal()}
                className="btn-secondary"
                disabled={uploadingDocument}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                className="btn-confirm"
                disabled={uploadingDocument || !selectedFile}
                style={{
                  opacity: uploadingDocument || !selectedFile ? 0.6 : 1,
                }}
              >
                {uploadingDocument ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
