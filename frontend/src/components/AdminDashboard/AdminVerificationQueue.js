import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ChevronRight, ChevronDown, Search, UserCheck, Clock, Mail, Phone, MapPin, Building2, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { adminVerificationAPI } from '../../services/api';
import './Admin_Styles/AdminVerificationQueue.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// Modals
const ApprovalModal = ({ user, onClose, onConfirm, loading }) => {
  const [mouseDownInsideModal, setMouseDownInsideModal] = useState(false);

  const handleBackdropClick = (e) => {
    if (!mouseDownInsideModal && e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
    setMouseDownInsideModal(false);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onMouseDown={(e) => {
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
            <p><strong>Organization:</strong> {user.organizationName}</p>
            <p><strong>Contact:</strong> {user.contactName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Type:</strong> {user.role}</p>
          </div>
          <p className="approval-note">
            The user will receive an approval email and their status will be set to ACTIVE.
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

  const handleBackdropClick = (e) => {
    if (!mouseDownInsideModal && e.target.classList.contains('modal-backdrop')) {
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
      onMouseDown={(e) => {
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
            <p><strong>Organization:</strong> {user.organizationName}</p>
            <p><strong>Contact:</strong> {user.contactName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Type:</strong> {user.role}</p>
          </div>
          
          <div className="form-group">
            <label>Rejection Reason *</label>
            <Select
              options={rejectionReasons}
              value={rejectionReasons.find(r => r.value === reason)}
              onChange={(option) => setReason(option.value)}
              placeholder="Select a reason..."
              className="rejection-reason-select"
              classNamePrefix="select"
            />
          </div>

          <div className="form-group">
            <label>Additional Message (Optional)</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any additional information for the user..."
              rows={4}
              className="rejection-message-input"
            />
          </div>

          <p className="rejection-note">
            The user will receive a rejection email with the reason and can re-register if needed.
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

// Main Component
const AdminVerificationQueue = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    pendingDonors: 0,
    pendingReceivers: 0,
    avgWaitTime: 0,
  });

  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState('');
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
      const filters = {
        userType: userTypeFilter || undefined,
        search: debouncedSearchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        page: currentPage,
        size: pageSize,
      };

      const response = await adminVerificationAPI.getPendingUsers(filters);
      const content = response.data.content || [];
      const totalPagesCount = response.data.totalPages || 0;

      // Calculate stats
      const pendingDonors = content.filter(u => u.role === 'DONOR').length;
      const pendingReceivers = content.filter(u => u.role === 'RECEIVER').length;
      
      // Calculate average wait time in hours
      const now = new Date();
      const waitTimes = content.map(u => {
        const createdDate = new Date(u.createdAt);
        return (now - createdDate) / (1000 * 60 * 60); // hours
      });
      const avgWaitTime = waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

      setStats({
        totalPending: content.length,
        pendingDonors,
        pendingReceivers,
        avgWaitTime,
      });

      setPendingUsers(content);
      setFilteredUsers(content);
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

  // Fetch users when filters change
  useEffect(() => {
    fetchPendingUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, userTypeFilter, debouncedSearchTerm, sortBy, sortOrder]);

  // Toggle row expansion
  const toggleRowExpansion = (userId) => {
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
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await adminVerificationAPI.approveUser(selectedUser.id);
      
      // Update UI optimistically
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      
      showToast(`${selectedUser.organizationName} has been approved successfully!`, 'success');
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
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await adminVerificationAPI.rejectUser(selectedUser.id, reason, message);
      
      // Update UI optimistically
      setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      
      showToast(`${selectedUser.organizationName} has been rejected.`, 'success');
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

  // Calculate waiting time
  const getWaitingTime = (createdAt) => {
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
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // User type filter options
  const userTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'DONOR', label: 'Donors' },
    { value: 'RECEIVER', label: 'Receivers' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'date', label: 'Registration Date' },
    { value: 'userType', label: 'User Type' },
    { value: 'waitingTime', label: 'Waiting Time' },
  ];

  if (loading && pendingUsers.length === 0) {
    return <div className="admin-verification-loading">Loading pending users...</div>;
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-users-search"
            />
          </div>

          <Select
            options={userTypeOptions}
            value={userTypeOptions.find(opt => opt.value === userTypeFilter)}
            onChange={(option) => {
              setUserTypeFilter(option.value);
              setCurrentPage(0);
            }}
            className="filter-select"
            classNamePrefix="select"
            placeholder="Filter by type"
          />

          <Select
            options={sortOptions}
            value={sortOptions.find(opt => opt.value === sortBy)}
            onChange={(option) => setSortBy(option.value)}
            className="filter-select"
            classNamePrefix="select"
            placeholder="Sort by"
          />

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '40px' }}></TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Waiting Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow className={expandedRows.has(user.id) ? 'expanded-row' : ''}>
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
                      <TableCell>
                        <strong>{user.organizationName}</strong>
                      </TableCell>
                      <TableCell>{user.contactName}</TableCell>
                      <TableCell>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <span className="waiting-time">
                          <Clock size={14} />
                          {getWaitingTime(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="action-buttons">
                          <button
                            className="btn-approve-small"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowApprovalModal(true);
                            }}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                            Approve
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
                            Reject
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Details */}
                    {expandedRows.has(user.id) && (
                      <TableRow className="expanded-details">
                        <TableCell colSpan={8}>
                          <div className="user-details-grid">
                            <div className="detail-section">
                              <h4>Contact Information</h4>
                              <div className="detail-item">
                                <Mail size={16} />
                                <span><strong>Email:</strong> {user.email}</span>
                              </div>
                              <div className="detail-item">
                                <Phone size={16} />
                                <span><strong>Phone:</strong> {user.phoneNumber || 'Not provided'}</span>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Address</h4>
                              <div className="detail-item">
                                <MapPin size={16} />
                                <span>
                                  {user.address?.street}, {user.address?.city}, {user.address?.state} {user.address?.zipCode}
                                </span>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Organization Details</h4>
                              <div className="detail-item">
                                <Building2 size={16} />
                                <span><strong>Organization:</strong> {user.organizationName}</span>
                              </div>
                              <div className="detail-item">
                                <Calendar size={16} />
                                <span><strong>Registered:</strong> {formatDate(user.createdAt)}</span>
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
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
