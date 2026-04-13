import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import {
  ChevronRight,
  ChevronDown,
  Search,
  UserCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { adminVerificationAPI } from '../../services/api';
import './Admin_Styles/AdminVerificationQueue.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

// Modals
const ApprovalModal = ({ user, onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const handleBackdropClick = e => {
    if (
      !mouseDownInsideModal &&
      e.target.classList.contains('modal-backdrop')
    ) {
      onClose();
    }
    setMouseDownInsideModal(false);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onMouseDown={e => {
        if (e.target.classList.contains('modal-backdrop')) {
          setMouseDownInsideModal(false);
        }
      }}
    >
      <div
        className="modal-content verification-modal"
        onMouseDown={() => setMouseDownInsideModal(true)}
      >
        <div className="modal-header">
          <CheckCircle size={24} color="#10b981" />
          <h3>{t('adminVerificationQueue.modals.approval.title')}</h3>
        </div>
        <div className="modal-body">
          <p>{t('adminVerificationQueue.modals.approval.confirm')}</p>
          <div className="user-info-summary">
            <p>
              <strong>
                {t('adminVerificationQueue.labels.organization')}:
              </strong>{' '}
              {user.organizationName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.contact')}:</strong>{' '}
              {user.contactName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.email')}:</strong>{' '}
              {user.email}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.type')}:</strong>{' '}
              {user.role}
            </p>
          </div>
          <p className="approval-note">
            {t('adminVerificationQueue.modals.approval.note')}
          </p>
        </div>
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn-approve"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? t('adminVerificationQueue.modals.approval.loading')
              : t('adminVerificationQueue.modals.approval.action')}
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectionModal = ({ user, onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const rejectionReasons = [
    {
      value: 'incomplete_info',
      label: t('adminVerificationQueue.rejectionReasons.incompleteInfo'),
    },
    {
      value: 'invalid_organization',
      label: t('adminVerificationQueue.rejectionReasons.invalidOrganization'),
    },
    {
      value: 'duplicate_account',
      label: t('adminVerificationQueue.rejectionReasons.duplicateAccount'),
    },
    {
      value: 'suspicious_activity',
      label: t('adminVerificationQueue.rejectionReasons.suspiciousActivity'),
    },
    {
      value: 'does_not_meet_criteria',
      label: t('adminVerificationQueue.rejectionReasons.doesNotMeetCriteria'),
    },
    {
      value: 'other',
      label: t('adminVerificationQueue.rejectionReasons.other'),
    },
  ];

  const handleBackdropClick = e => {
    if (
      !mouseDownInsideModal &&
      e.target.classList.contains('modal-backdrop')
    ) {
      onClose();
    }
    setMouseDownInsideModal(false);
  };

  const handleSubmit = () => {
    if (!reason) {
      alert(t('adminVerificationQueue.modals.rejection.selectReason'));
      return;
    }
    onConfirm(reason, customMessage);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onMouseDown={e => {
        if (e.target.classList.contains('modal-backdrop')) {
          setMouseDownInsideModal(false);
        }
      }}
    >
      <div
        className="modal-content verification-modal"
        onMouseDown={() => setMouseDownInsideModal(true)}
      >
        <div className="modal-header">
          <XCircle size={24} color="#ef4444" />
          <h3>{t('adminVerificationQueue.modals.rejection.title')}</h3>
        </div>
        <div className="modal-body">
          <p>{t('adminVerificationQueue.modals.rejection.prompt')}</p>
          <div className="user-info-summary">
            <p>
              <strong>
                {t('adminVerificationQueue.labels.organization')}:
              </strong>{' '}
              {user.organizationName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.contact')}:</strong>{' '}
              {user.contactName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.email')}:</strong>{' '}
              {user.email}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.type')}:</strong>{' '}
              {user.role}
            </p>
          </div>

          <div className="form-group">
            <label>
              {t('adminVerificationQueue.modals.rejection.reason')} *
            </label>
            <Select
              options={rejectionReasons}
              value={rejectionReasons.find(r => r.value === reason)}
              onChange={option => setReason(option.value)}
              placeholder={t(
                'adminVerificationQueue.modals.rejection.reasonPlaceholder'
              )}
              className="rejection-reason-select"
              classNamePrefix="select"
            />
          </div>

          <div className="form-group">
            <label>
              {t('adminVerificationQueue.modals.rejection.additionalMessage')}
            </label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder={t(
                'adminVerificationQueue.modals.rejection.messagePlaceholder'
              )}
              rows={4}
              className="rejection-message-input"
            />
          </div>

          <p className="rejection-note">
            {t('adminVerificationQueue.modals.rejection.note')}
          </p>
        </div>
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn-reject"
            onClick={handleSubmit}
            disabled={loading || !reason}
          >
            {loading
              ? t('adminVerificationQueue.modals.rejection.loading')
              : t('adminVerificationQueue.modals.rejection.action')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManualVerifyModal = ({ user, onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const handleBackdropClick = e => {
    if (
      !mouseDownInsideModal &&
      e.target.classList.contains('modal-backdrop')
    ) {
      onClose();
    }
    setMouseDownInsideModal(false);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onMouseDown={e => {
        if (e.target.classList.contains('modal-backdrop')) {
          setMouseDownInsideModal(false);
        }
      }}
    >
      <div
        className="modal-content verification-modal"
        onMouseDown={() => setMouseDownInsideModal(true)}
      >
        <div className="modal-header">
          <Mail size={24} color="#2563eb" />
          <h3>{t('adminVerificationQueue.modals.manualVerify.title')}</h3>
        </div>
        <div className="modal-body">
          <p>{t('adminVerificationQueue.modals.manualVerify.prompt')}</p>
          <div className="user-info-summary">
            <p>
              <strong>
                {t('adminVerificationQueue.labels.organization')}:
              </strong>{' '}
              {user.organizationName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.contact')}:</strong>{' '}
              {user.contactName}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.email')}:</strong>{' '}
              {user.email}
            </p>
            <p>
              <strong>{t('adminVerificationQueue.labels.type')}:</strong>{' '}
              {user.role}
            </p>
          </div>
          <p className="approval-note">
            {t('adminVerificationQueue.modals.manualVerify.note')}
          </p>
        </div>
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn-approve"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? t('adminVerificationQueue.modals.manualVerify.loading')
              : t('adminVerificationQueue.modals.manualVerify.action')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileChangeRejectionModal = ({
  change,
  onClose,
  onConfirm,
  loading,
}) => {
  const [reason, setReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const rejectionReasons = [
    { value: 'incorrect_information', label: 'Incorrect Information' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'duplicate_entry', label: 'Duplicate Entry' },
    { value: 'does_not_meet_policy', label: 'Does Not Meet Policy' },
    { value: 'other', label: 'Other' },
  ];

  const handleBackdropClick = e => {
    if (
      !mouseDownInsideModal &&
      e.target.classList.contains('modal-backdrop')
    ) {
      onClose();
    }
    setMouseDownInsideModal(false);
  };

  const handleSubmit = () => {
    if (!reason) {
      alert('Please select a rejection reason');
      return;
    }
    onConfirm(reason, customMessage);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onMouseDown={e => {
        if (e.target.classList.contains('modal-backdrop')) {
          setMouseDownInsideModal(false);
        }
      }}
    >
      <div
        className="modal-content verification-modal"
        onMouseDown={() => setMouseDownInsideModal(true)}
      >
        <div className="modal-header">
          <XCircle size={24} color="#ef4444" />
          <h3>Reject Profile Change</h3>
        </div>
        <div className="modal-body">
          <p>Please provide a reason for rejecting this profile change.</p>
          <div className="user-info-summary">
            <p>
              <strong>User:</strong> {change.userName}
            </p>
            <p>
              <strong>Field:</strong> {change.fieldName}
            </p>
            <p>
              <strong>Current Value:</strong> {change.oldValue || 'N/A'}
            </p>
            <p>
              <strong>Requested Value:</strong> {change.newValue}
            </p>
          </div>

          <div className="form-group">
            <label>Reason *</label>
            <Select
              options={rejectionReasons}
              value={rejectionReasons.find(r => r.value === reason)}
              onChange={option => setReason(option.value)}
              placeholder="Select a reason..."
              className="rejection-reason-select"
              classNamePrefix="select"
            />
          </div>

          <div className="form-group">
            <label>Custom Message (optional)</label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Add a message to send to the user..."
              rows={4}
              className="rejection-message-input"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-reject"
            onClick={handleSubmit}
            disabled={loading || !reason}
          >
            {loading ? 'Rejecting...' : 'Reject Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const AdminVerificationQueue = () => {
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalPending: 0,
    pendingDonors: 0,
    pendingReceivers: 0,
    avgWaitTime: 0,
  });

  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_ADMIN_APPROVAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showManualVerifyModal, setShowManualVerifyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Notification
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Profile change state
  const [pendingProfileChanges, setPendingProfileChanges] = useState([]);
  const [selectedChange, setSelectedChange] = useState(null);
  const [rejectingChange, setRejectingChange] = useState(false);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = {
        page: currentPage,
        size: pageSize,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };

      if (userTypeFilter) {
        params.role = userTypeFilter;
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await adminVerificationAPI.getPendingUsers(params);
      const content = response.data.content || [];
      const totalElements = response.data.totalElements || 0;
      const totalPagesCount = response.data.totalPages || 0;

      // Calculate stats
      const pendingDonors = content.filter(u => u.role === 'DONOR').length;
      const pendingReceivers = content.filter(
        u => u.role === 'RECEIVER'
      ).length;

      // Calculate average wait time in hours
      const now = new Date();
      const waitTimes = content.map(u => {
        const createdDate = new Date(u.createdAt);
        if (isNaN(createdDate)) {
          return 0;
        }
        const diffMs = now - createdDate;
        // Guard: never allow negative wait time (e.g. future createdAt due to clock skew)
        return Math.max(0, diffMs / (1000 * 60 * 60));
      });
      const avgWaitTime =
        waitTimes.length > 0
          ? Math.max(
              0,
              Math.round(
                waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
              )
            )
          : 0;

      setStats({
        totalPending: totalElements,
        pendingDonors,
        pendingReceivers,
        avgWaitTime,
      });

      setPendingUsers(content);
      setTotalPages(totalPagesCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Failed to load pending users. Please try again.');
      setLoading(false);
    }
  };

  // Fetch pending profile changes
  const fetchPendingProfileChanges = async () => {
    try {
      const res = await adminVerificationAPI.getPendingProfileChanges();
      setPendingProfileChanges(res.data || []);
    } catch (err) {
      console.error('Error fetching profile changes:', err);
    }
  };

  const handleApproveChange = async id => {
    try {
      await adminVerificationAPI.approveProfileChange(id);
      setPendingProfileChanges(prev => prev.filter(change => change.id !== id));
      showToast('Profile change approved');
    } catch (err) {
      console.error(err);
      showToast('Failed to approve change', 'error');
    }
  };

  const handleRejectChange = async (reason, customMessage) => {
    if (!selectedChange) {
      return;
    }
    try {
      setRejectingChange(true);
      await adminVerificationAPI.rejectProfileChange(
        selectedChange.id,
        reason,
        customMessage
      );
      setPendingProfileChanges(prev =>
        prev.filter(change => change.id !== selectedChange.id)
      );
      showToast('Profile change rejected');
      setSelectedChange(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to reject change', 'error');
    } finally {
      setRejectingChange(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply client-side status filter
  useEffect(() => {
    if (pendingUsers.length === 0) {
      setFilteredUsers([]);
      return;
    }

    const filtered = statusFilter
      ? pendingUsers.filter(user => user.accountStatus === statusFilter)
      : pendingUsers;

    setFilteredUsers(filtered);
  }, [pendingUsers, statusFilter]);

  // Fetch users when filters change
  useEffect(() => {
    fetchPendingUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, userTypeFilter, debouncedSearchTerm, sortBy, sortOrder]);

  // Fetch pending profile changes on mount
  useEffect(() => {
    fetchPendingProfileChanges();
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = userId => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  // Show notification
  const showToast = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Handle approve user
  const handleApproveUser = async () => {
    if (!selectedUser) {
      return;
    }

    setActionLoading(true);
    try {
      await adminVerificationAPI.approveUser(selectedUser.id);

      // Update UI optimistically
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== selectedUser.id));

      showToast(
        t('adminVerificationQueue.toasts.approved', {
          name: selectedUser.organizationName,
        }),
        'success'
      );
      setShowApprovalModal(false);
      setSelectedUser(null);

      // Refresh data
      fetchPendingUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      showToast(t('adminVerificationQueue.toasts.approveFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject user
  const handleRejectUser = async (reason, message) => {
    if (!selectedUser) {
      return;
    }

    setActionLoading(true);
    try {
      await adminVerificationAPI.rejectUser(selectedUser.id, reason, message);

      // Update UI optimistically
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== selectedUser.id));

      showToast(
        t('adminVerificationQueue.toasts.rejected', {
          name: selectedUser.organizationName,
        }),
        'success'
      );
      setShowRejectionModal(false);
      setSelectedUser(null);

      // Refresh data
      fetchPendingUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
      showToast(t('adminVerificationQueue.toasts.rejectFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!selectedUser) {
      return;
    }

    setActionLoading(true);
    try {
      await adminVerificationAPI.verifyEmail(selectedUser.id);
      showToast(t('adminVerificationQueue.toasts.verified'));
      setShowManualVerifyModal(false);
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (err) {
      console.error('Error manually verifying email:', err);
      showToast(
        err.response?.data?.message ||
          t('adminVerificationQueue.toasts.verifyFailed'),
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate waiting time
  const getWaitingTime = createdAt => {
    const now = new Date();
    const created = new Date(createdAt);
    if (isNaN(created)) {
      return `0 ${t('adminVerificationQueue.time.hours')}`;
    }
    const diffMs = now - created;
    // Guard: never show negative waiting time
    const safeDiffMs = Math.max(0, diffMs);
    const diffHours = Math.floor(safeDiffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${t(
        diffDays > 1
          ? 'adminVerificationQueue.time.days'
          : 'adminVerificationQueue.time.day'
      )}`;
    }
    if (diffHours === 1) {
      return `${diffHours} ${t('adminVerificationQueue.time.hour')}`;
    }
    return `${diffHours} ${t('adminVerificationQueue.time.hours')}`;
  };

  // Format date
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format organization type
  const formatOrgType = type => {
    if (!type) {
      return 'N/A';
    }
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Handle document view
  const handleViewDocument = documentUrl => {
    // If it's a URL (contains http), open in a new tab; otherwise show alert
    if (documentUrl && documentUrl.startsWith('http')) {
      window.open(documentUrl, '_blank');
    } else if (documentUrl) {
      // Fallback for document names - construct URL
      window.open(
        `${process.env.REACT_APP_API_BASE_URL}/api/files/licenses/${documentUrl}`,
        '_blank'
      );
    } else {
      alert('No document available');
    }
  };

  // User type filter options
  const userTypeOptions = [
    { value: '', label: t('adminVerificationQueue.filters.allTypes') },
    { value: 'DONOR', label: t('adminVerificationQueue.filters.donors') },
    { value: 'RECEIVER', label: t('adminVerificationQueue.filters.receivers') },
  ];

  const statusOptions = [
    {
      value: 'PENDING_ADMIN_APPROVAL',
      label: t('adminVerificationQueue.status.emailVerified'),
    },
    {
      value: 'PENDING_VERIFICATION',
      label: t('adminVerificationQueue.status.emailNotVerified'),
    },
  ];

  // Sort options
  const sortOptions = [
    { value: 'date', label: t('adminVerificationQueue.sort.registrationDate') },
    { value: 'userType', label: t('adminVerificationQueue.sort.userType') },
    {
      value: 'waitingTime',
      label: t('adminVerificationQueue.sort.waitingTime'),
    },
  ];

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="admin-verification-loading">
        {t('adminVerificationQueue.loading')}
      </div>
    );
  }

  return (
    <div className="admin-verification-container">
      {/* Header */}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <UserCheck size={24} color="#3b82f6" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminVerificationQueue.stats.totalPending')}
            </div>
            <div className="stat-value">{stats.totalPending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Building2 size={24} color="#f59e0b" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminVerificationQueue.stats.pendingDonors')}
            </div>
            <div className="stat-value">{stats.pendingDonors}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <Building2 size={24} color="#10b981" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminVerificationQueue.stats.pendingReceivers')}
            </div>
            <div className="stat-value">{stats.pendingReceivers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Clock size={24} color="#6366f1" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminVerificationQueue.stats.avgWaitTime')}
            </div>
            <div className="stat-value">{Math.max(0, stats.avgWaitTime)}h</div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>{t('adminVerificationQueue.title')}</h2>
          <div className="pagination-info">
            {t('adminVerificationQueue.showing', {
              shown: filteredUsers.length,
              total: stats.totalPending,
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder={t('adminVerificationQueue.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-users-search"
            />
          </div>

          <Select
            options={userTypeOptions}
            value={userTypeOptions.find(opt => opt.value === userTypeFilter)}
            onChange={option => {
              setUserTypeFilter(option.value);
              setCurrentPage(0);
            }}
            className="filter-select"
            classNamePrefix="select"
            placeholder={t('adminVerificationQueue.filters.byType')}
          />

          <Select
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === statusFilter)}
            onChange={option => {
              setStatusFilter(option.value);
              setCurrentPage(0);
            }}
            className="filter-select"
            classNamePrefix="select"
            placeholder={t('adminVerificationQueue.filters.byStatus')}
          />

          <Select
            options={sortOptions}
            value={sortOptions.find(opt => opt.value === sortBy)}
            onChange={option => setSortBy(option.value)}
            className="filter-select"
            classNamePrefix="select"
            placeholder={t('adminVerificationQueue.filters.sortBy')}
          />

          <button
            className="sort-order-btn"
            onClick={() =>
              setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title={t('adminVerificationQueue.sort.toggle', {
              order:
                sortOrder === 'asc'
                  ? t('adminVerificationQueue.sort.descending')
                  : t('adminVerificationQueue.sort.ascending'),
            })}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} color="#9ca3af" />
            <h3>{t('adminVerificationQueue.empty.title')}</h3>
            <p>{t('adminVerificationQueue.empty.description')}</p>
          </div>
        ) : (
          <>
            <div className="users-table-container">
              <Table className="users-table verification-table">
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.id')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.organization')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.type')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.status')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.email')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.phone')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.waitingTime')}
                    </TableHead>
                    <TableHead>
                      {t('adminVerificationQueue.table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <React.Fragment key={user.id}>
                      <TableRow
                        className={expandedRows.has(user.id) ? 'expanded' : ''}
                      >
                        <TableCell>
                          <button
                            className="expand-btn"
                            onClick={() => toggleRowExpansion(user.id)}
                          >
                            {expandedRows.has(user.id) ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="id-cell">{user.id}</TableCell>
                        <TableCell>
                          <div className="user-name-info">
                            <div className="user-name">
                              {user.organizationName}
                            </div>
                            <div className="user-org">{user.contactName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`pill pill-${user.role.toLowerCase()}`}
                          >
                            {user.role === 'DONOR'
                              ? t('adminDisputes.userTypes.donor')
                              : t('adminDisputes.userTypes.receiver')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.accountStatus === 'PENDING_VERIFICATION' ? (
                            <span className="pill pill-email-pending">
                              {t(
                                'adminVerificationQueue.status.emailNotVerified'
                              )}
                            </span>
                          ) : (
                            <span className="pill pill-pending">
                              {t(
                                'adminVerificationQueue.status.pendingApproval'
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="email-cell">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {user.phoneNumber ||
                            t('adminVerificationQueue.notAvailable')}
                        </TableCell>
                        <TableCell>
                          <span className="waiting-time">
                            <Clock size={14} />
                            {getWaitingTime(user.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="action-buttons">
                            {user.accountStatus === 'PENDING_VERIFICATION' ? (
                              <button
                                className="btn-verify-small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowManualVerifyModal(true);
                                }}
                                title={t(
                                  'adminVerificationQueue.actions.verifyEmail'
                                )}
                              >
                                <Mail size={16} />
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn-approve-small"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowApprovalModal(true);
                                  }}
                                  title={t(
                                    'adminVerificationQueue.actions.approve'
                                  )}
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  className="btn-reject-small"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRejectionModal(true);
                                  }}
                                  title={t(
                                    'adminVerificationQueue.actions.reject'
                                  )}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {expandedRows.has(user.id) && (
                        <TableRow className="details-row">
                          <TableCell colSpan="9">
                            <div className="verification-detail-container">
                              {/* Content Grid */}
                              <div className="detail-content-grid">
                                {/* Organization Identity */}
                                <div className="detail-card">
                                  <h3 className="card-title">
                                    Organization Identity
                                  </h3>
                                  <div className="detail-item">
                                    <span className="detail-label">
                                      Organization Name
                                    </span>
                                    <span className="detail-value">
                                      {user.organizationName}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">
                                      Organization Type
                                    </span>
                                    <span className="detail-value">
                                      {formatOrgType(user.organizationType)}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">
                                      Contact Person
                                    </span>
                                    <span className="detail-value">
                                      {user.contactName}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <Mail size={16} className="detail-icon" />
                                    <span className="detail-label">Email</span>
                                    <a
                                      href={`mailto:${user.email}`}
                                      className="detail-value-link"
                                    >
                                      {user.email}
                                    </a>
                                  </div>
                                  <div className="detail-item">
                                    <Phone size={16} className="detail-icon" />
                                    <span className="detail-label">Phone</span>
                                    <a
                                      href={`tel:${user.phoneNumber}`}
                                      className="detail-value-link"
                                    >
                                      {user.phoneNumber || 'Not provided'}
                                    </a>
                                  </div>
                                  <div className="detail-item">
                                    <MapPin size={16} className="detail-icon" />
                                    <span className="detail-label">
                                      Location
                                    </span>
                                    <span className="detail-value">
                                      {user.address?.street}
                                      {user.address?.unit
                                        ? `, ${user.address.unit}`
                                        : ''}
                                      <br />
                                      {user.address?.city},{' '}
                                      {user.address?.state}{' '}
                                      {user.address?.zipCode}
                                    </span>
                                  </div>
                                </div>

                                {/* Verification & Trust */}
                                <div className="detail-card">
                                  <h3 className="card-title">
                                    Verification & Trust
                                  </h3>
                                  {user.role === 'RECEIVER' ? (
                                    <>
                                      <div className="detail-item-highlight">
                                        <CheckCircle
                                          size={18}
                                          className="verify-icon"
                                        />
                                        <div>
                                          <span className="detail-label">
                                            Charity Registration Number
                                          </span>
                                          <span className="detail-value-emphasis">
                                            {user.charityRegistrationNumber ||
                                              'Not provided'}
                                          </span>
                                        </div>
                                      </div>
                                      {user.supportingDocument && (
                                        <div className="detail-item-document">
                                          <div className="document-header">
                                            <CheckCircle
                                              size={16}
                                              className="verified-badge"
                                            />
                                            <span className="document-label">
                                              Supporting Document
                                            </span>
                                          </div>
                                          <button
                                            className="document-preview-btn"
                                            onClick={() =>
                                              handleViewDocument(
                                                user.supportingDocument
                                              )
                                            }
                                          >
                                            <FileText size={18} />
                                            <div className="document-info">
                                              <span className="document-name">
                                                {user.supportingDocument}
                                              </span>
                                              <span className="document-action">
                                                Click to preview
                                              </span>
                                            </div>
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div className="detail-item-highlight">
                                        <CheckCircle
                                          size={18}
                                          className="verify-icon"
                                        />
                                        <div>
                                          <span className="detail-label">
                                            Business License Number
                                          </span>
                                          <span className="detail-value-emphasis">
                                            {user.businessLicense ||
                                              'Not provided'}
                                          </span>
                                        </div>
                                      </div>
                                      {user.supportingDocument && (
                                        <div className="detail-item-document">
                                          <div className="document-header">
                                            <CheckCircle
                                              size={16}
                                              className="verified-badge"
                                            />
                                            <span className="document-label">
                                              Supporting Document
                                            </span>
                                          </div>
                                          <button
                                            className="document-preview-btn"
                                            onClick={() =>
                                              handleViewDocument(
                                                user.supportingDocument
                                              )
                                            }
                                          >
                                            <FileText size={18} />
                                            <div className="document-info">
                                              <span className="document-name">
                                                {user.supportingDocument}
                                              </span>
                                              <span className="document-action">
                                                Click to preview
                                              </span>
                                            </div>
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Capacity & Impact (for Receivers) or Additional Info (for Donors) */}
                                <div className="detail-card">
                                  {user.role === 'RECEIVER' ? (
                                    <>
                                      <h3 className="card-title">
                                        Capacity & Impact
                                      </h3>
                                      <div className="capacity-stat-card">
                                        <div className="capacity-number">
                                          {user.capacity
                                            ? user.capacity.split(' ')[0]
                                            : 'N/A'}
                                        </div>
                                        <div className="capacity-label">
                                          {user.capacity
                                            ? user.capacity
                                                .split(' ')
                                                .slice(1)
                                                .join(' ')
                                            : 'Not specified'}
                                        </div>
                                      </div>
                                      <div className="verification-checklist">
                                        <h4>Verification Checklist</h4>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>
                                            Organization type provided
                                          </span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>Capacity provided</span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>
                                            Supporting documents uploaded
                                          </span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>Contact details complete</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <h3 className="card-title">
                                        Registration Details
                                      </h3>
                                      <div className="detail-item">
                                        <Calendar
                                          size={16}
                                          className="detail-icon"
                                        />
                                        <span className="detail-label">
                                          Submitted
                                        </span>
                                        <span className="detail-value">
                                          {formatDate(user.createdAt)}
                                        </span>
                                      </div>
                                      <div className="detail-item">
                                        <Clock
                                          size={16}
                                          className="detail-icon"
                                        />
                                        <span className="detail-label">
                                          Waiting Time
                                        </span>
                                        <span className="detail-value">
                                          {getWaitingTime(user.createdAt)}
                                        </span>
                                      </div>
                                      <div className="verification-checklist">
                                        <h4>Verification Checklist</h4>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>
                                            Organization type provided
                                          </span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>Business license provided</span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>
                                            Supporting documents uploaded
                                          </span>
                                        </div>
                                        <div className="checklist-item">
                                          <CheckCircle
                                            size={16}
                                            className="check-icon"
                                          />
                                          <span>Contact details complete</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="pagination-btn"
                >
                  {t('adminVerificationQueue.pagination.previous')}
                </button>
                <span className="pagination-info">
                  {t('adminVerificationQueue.pagination.pageOf', {
                    page: currentPage + 1,
                    total: totalPages,
                  })}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="pagination-btn"
                >
                  {t('adminVerificationQueue.pagination.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pending Profile Changes Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>Pending Profile Changes</h2>
        </div>
        {pendingProfileChanges.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} color="#9ca3af" />
            <h3>No Pending Profile Changes</h3>
            <p>All profile updates have been reviewed.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <Table className="users-table verification-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Requested Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProfileChanges.map(change => (
                  <TableRow key={change.id}>
                    <TableCell>{change.userName}</TableCell>
                    <TableCell>{change.fieldName}</TableCell>
                    <TableCell>{change.oldValue || 'N/A'}</TableCell>
                    <TableCell>{change.newValue}</TableCell>
                    <TableCell>
                      <div className="action-buttons">
                        <button
                          className="btn-approve-small"
                          onClick={() => handleApproveChange(change.id)}
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="btn-reject-small"
                          onClick={() => setSelectedChange(change)}
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showApprovalModal && selectedUser && (
        <ApprovalModal
          user={selectedUser}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleApproveUser}
          loading={actionLoading}
        />
      )}

      {showRejectionModal && selectedUser && (
        <RejectionModal
          user={selectedUser}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleRejectUser}
          loading={actionLoading}
        />
      )}

      {showManualVerifyModal && selectedUser && (
        <ManualVerifyModal
          user={selectedUser}
          onClose={() => {
            setShowManualVerifyModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleManualVerify}
          loading={actionLoading}
        />
      )}

      {selectedChange && (
        <ProfileChangeRejectionModal
          change={selectedChange}
          onClose={() => setSelectedChange(null)}
          onConfirm={handleRejectChange}
          loading={rejectingChange}
        />
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className={`notification-toast ${notificationType}`}>
          {notificationType === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{notificationMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationQueue;
