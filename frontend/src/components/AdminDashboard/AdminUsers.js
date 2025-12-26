import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin_Styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      const params = {
        page: currentPage,
        size: pageSize,
      };
      
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.accountStatus = statusFilter;
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      // Handle paginated response
      const content = response.data.content || [];
      const totalPagesCount = response.data.totalPages || 0;
      
      setUsers(content);
      setFilteredUsers(content);
      setTotalPages(totalPagesCount);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when debounced search term or other filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, debouncedSearchTerm]);

  // Deactivate user
  const handleDeactivate = async () => {
    if (!selectedUser || !adminNotes.trim()) {
      alert('Please provide a reason for deactivation');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/deactivate`,
        { adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User deactivated successfully');
      setShowDeactivateModal(false);
      setAdminNotes('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert(err.response?.data || 'Failed to deactivate user');
    }
  };

  // Reactivate user
  const handleReactivate = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User reactivated successfully');
      setShowReactivateModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error reactivating user:', err);
      alert(err.response?.data || 'Failed to reactivate user');
    }
  };

  // Send alert
  const handleSendAlert = async () => {
    if (!selectedUser || !alertMessage.trim()) {
      alert('Please enter an alert message');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/admin/users/${selectedUser.id}/send-alert`,
        { message: alertMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Alert sent successfully');
      setShowAlertModal(false);
      setAlertMessage('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending alert:', err);
      alert('Failed to send alert');
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
  const getBadgeColor = (status) => {
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

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h1>User Management</h1>
        <p>Manage and monitor all platform users</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search by Email:</label>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="DONOR">Donor</option>
            <option value="RECEIVER">Receiver</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>

        <button onClick={handleResetFilters} className="btn-reset">
          Reset Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Organization</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Account Status</th>
              <th>Verification</th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-users">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.organizationName || 'N/A'}</td>
                  <td>{user.contactPerson || 'N/A'}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge ${getBadgeColor(user.accountStatus)}`}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td>
                    {user.verificationStatus ? (
                      <span className={`badge ${getBadgeColor(user.verificationStatus)}`}>
                        {user.verificationStatus}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {user.role === 'DONOR' && `${user.donationCount || 0} donations`}
                    {user.role === 'RECEIVER' && `${user.claimCount || 0} claims`}
                    {user.role === 'ADMIN' && 'Admin'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="btn-view"
                        title="View Details"
                      >
                        👁️
                      </button>
                      {user.accountStatus === 'ACTIVE' && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeactivateModal(true);
                          }}
                          className="btn-deactivate"
                          title="Deactivate"
                        >
                          🚫
                        </button>
                      )}
                      {user.accountStatus === 'DEACTIVATED' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowReactivateModal(true);
                          }}
                          className="btn-reactivate"
                          title="Reactivate"
                        >
                          ✅
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAlertModal(true);
                        }}
                        className="btn-alert"
                        title="Send Alert"
                      >
                        📧
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="btn-page"
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage + 1} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages - 1}
          className="btn-page"
        >
          Next
        </button>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Deactivate User</h2>
            <p>
              Are you sure you want to deactivate <strong>{selectedUser?.email}</strong>?
            </p>
            <textarea
              placeholder="Enter reason for deactivation (required)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="modal-textarea"
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={handleDeactivate} className="btn-confirm">
                Deactivate
              </button>
              <button onClick={() => setShowDeactivateModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {showReactivateModal && (
        <div className="modal-overlay" onClick={() => setShowReactivateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reactivate User</h2>
            <p>
              Are you sure you want to reactivate <strong>{selectedUser?.email}</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={handleReactivate} className="btn-confirm">
                Reactivate
              </button>
              <button onClick={() => setShowReactivateModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Alert Modal */}
      {showAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Send Alert</h2>
            <p>
              Send an alert to <strong>{selectedUser?.email}</strong>
            </p>
            <textarea
              placeholder="Enter alert message..."
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              className="modal-textarea"
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={handleSendAlert} className="btn-confirm">
                Send Alert
              </button>
              <button onClick={() => setShowAlertModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>User Details</h2>
            <div className="user-details">
              <div className="detail-row">
                <strong>ID:</strong> {selectedUser.id}
              </div>
              <div className="detail-row">
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div className="detail-row">
                <strong>Role:</strong> {selectedUser.role}
              </div>
              <div className="detail-row">
                <strong>Account Status:</strong> {selectedUser.accountStatus}
              </div>
              <div className="detail-row">
                <strong>Organization:</strong> {selectedUser.organizationName || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Contact Person:</strong> {selectedUser.contactPerson || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Verification Status:</strong> {selectedUser.verificationStatus || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Created At:</strong>{' '}
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
              </div>
              {selectedUser.deactivatedAt && (
                <div className="detail-row">
                  <strong>Deactivated At:</strong>{' '}
                  {new Date(selectedUser.deactivatedAt).toLocaleString()}
                </div>
              )}
              {selectedUser.adminNotes && (
                <div className="detail-row">
                  <strong>Admin Notes:</strong>
                  <p className="admin-notes">{selectedUser.adminNotes}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDetailsModal(false)} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
