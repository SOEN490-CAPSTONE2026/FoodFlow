import React, { useState, useEffect } from 'react';
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
          <h3>Approve Registration</h3>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to approve this registration?</p>
          <div className="user-info-summary">
            <p>
              <strong>Organization:</strong> {user.organizationName}
            </p>
            <p>
              <strong>Contact:</strong> {user.contactName}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Type:</strong> {user.role}
            </p>
          </div>
          <p className="approval-note">
            The user will receive an approval email and their status will be set
            to ACTIVE.
          </p>
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
            className="btn-approve"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve User'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectionModal = ({ user, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const rejectionReasons = [
    { value: 'incomplete_info', label: 'Incomplete Information' },
    { value: 'invalid_organization', label: 'Invalid Organization' },
    { value: 'duplicate_account', label: 'Duplicate Account' },
    { value: 'suspicious_activity', label: 'Suspicious Activity' },
    { value: 'does_not_meet_criteria', label: 'Does Not Meet Criteria' },
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
          <h3>Reject Registration</h3>
        </div>
        <div className="modal-body">
          <p>Please provide a reason for rejecting this registration:</p>
          <div className="user-info-summary">
            <p>
              <strong>Organization:</strong> {user.organizationName}
            </p>
            <p>
              <strong>Contact:</strong> {user.contactName}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Type:</strong> {user.role}
            </p>
          </div>

          <div className="form-group">
            <label>Rejection Reason *</label>
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
            <label>Additional Message (Optional)</label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Add any additional information for the user..."
              rows={4}
              className="rejection-message-input"
            />
          </div>

          <p className="rejection-note">
            The user will receive a rejection email with the reason and can
            re-register if needed.
          </p>
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
            {loading ? 'Rejecting...' : 'Reject User'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManualVerifyModal = ({ user, onClose, onConfirm, loading }) => {
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
          <h3>Manually Verify Email</h3>
        </div>
        <div className="modal-body">
          <p>
            This will mark the user's email as verified and move them to the
            admin approval queue.
          </p>
          <div className="user-info-summary">
            <p>
              <strong>Organization:</strong> {user.organizationName}
            </p>
            <p>
              <strong>Contact:</strong> {user.contactName}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Type:</strong> {user.role}
            </p>
          </div>
          <p className="approval-note">
            Use this only when the verification link fails.
          </p>
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
            className="btn-approve"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const AdminVerificationQueue = () => {
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
        return (now - createdDate) / (1000 * 60 * 60); // hours
      });
      const avgWaitTime =
        waitTimes.length > 0
          ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
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
        `${selectedUser.organizationName} has been approved successfully!`,
        'success'
      );
      setShowApprovalModal(false);
      setSelectedUser(null);

      // Refresh data
      fetchPendingUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      showToast('Failed to approve user. Please try again.', 'error');
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
        `${selectedUser.organizationName} has been rejected.`,
        'success'
      );
      setShowRejectionModal(false);
      setSelectedUser(null);

      // Refresh data
      fetchPendingUsers();
    } catch (err) {
      console.error('Error rejecting user:', err);
      showToast('Failed to reject user. Please try again.', 'error');
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
      showToast('Email verified manually');
      setShowManualVerifyModal(false);
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (err) {
      console.error('Error manually verifying email:', err);
      showToast(
        err.response?.data?.message ||
          'Failed to verify email. Please try again.',
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
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
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
    { value: '', label: 'All Types' },
    { value: 'DONOR', label: 'Donors' },
    { value: 'RECEIVER', label: 'Receivers' },
  ];

  const statusOptions = [
    { value: 'PENDING_ADMIN_APPROVAL', label: 'Email Verified' },
    { value: 'PENDING_VERIFICATION', label: 'Email Not Verified' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'date', label: 'Registration Date' },
    { value: 'userType', label: 'User Type' },
    { value: 'waitingTime', label: 'Waiting Time' },
  ];

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="admin-verification-loading">Loading pending users...</div>
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
            <div className="stat-label">Total Pending</div>
            <div className="stat-value">{stats.totalPending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Building2 size={24} color="#f59e0b" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Donors</div>
            <div className="stat-value">{stats.pendingDonors}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <Building2 size={24} color="#10b981" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Receivers</div>
            <div className="stat-value">{stats.pendingReceivers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Clock size={24} color="#6366f1" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg. Wait Time</div>
            <div className="stat-value">{stats.avgWaitTime}h</div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>Pending Registrations</h2>
          <div className="pagination-info">
            Showing {filteredUsers.length} of {stats.totalPending} pending users
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by organization name or email..."
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
            placeholder="Filter by type"
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
            placeholder="Filter by status"
          />

          <Select
            options={sortOptions}
            value={sortOptions.find(opt => opt.value === sortBy)}
            onChange={option => setSortBy(option.value)}
            className="filter-select"
            classNamePrefix="select"
            placeholder="Sort by"
          />

          <button
            className="sort-order-btn"
            onClick={() =>
              setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
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
            <h3>No Pending Registrations</h3>
            <p>All user registrations have been reviewed.</p>
          </div>
        ) : (
          <>
            <div className="users-table-container">
              <Table className="users-table verification-table">
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Waiting Time</TableHead>
                    <TableHead>Actions</TableHead>
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
                            {user.role === 'DONOR' ? 'Donor' : 'Receiver'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.accountStatus === 'PENDING_VERIFICATION' ? (
                            <span className="pill pill-email-pending">
                              Email Not Verified
                            </span>
                          ) : (
                            <span className="pill pill-pending">
                              Pending Approval
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="email-cell">
                          {user.email}
                        </TableCell>
                        <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
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
                                title="Verify Email"
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
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  className="btn-reject-small"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRejectionModal(true);
                                  }}
                                  title="Reject"
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
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
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
