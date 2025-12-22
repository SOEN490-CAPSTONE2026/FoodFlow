import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { ChevronRight, ChevronDown, Power, Bell, Edit3, Search, Users, Gift, Sparkles, Handshake } from 'lucide-react';
import './Admin_Styles/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalReceivers: 0,
    newUsers: 0
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    // TEMPORARY: Hardcoded user for UI preview - REMOVE LATER
    const tempUser = {
      id: 1,
      email: 'donor@foodflow.com',
      role: 'DONOR',
      organizationName: 'Fresh Foods Inc.',
      contactPerson: 'John Smith',
      phone: '514-555-0123',
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      donationCount: 24,
      createdAt: '2025-01-15T10:30:00',
      adminNotes: null
    };
    
    setStats({
      totalUsers: 1,
      totalDonors: 1,
      totalReceivers: 0,
      newUsers: 1
    });
    
    setUsers([tempUser]);
    setFilteredUsers([tempUser]);
    setTotalPages(1);
    setLoading(false);
    return;
    // END TEMPORARY - REMOVE ABOVE SECTION LATER
    
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
        newUsers
      });
      
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

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#34495e'];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  // React Select options
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'DONOR', label: 'Donor' },
    { value: 'RECEIVER', label: 'Receiver' },
    { value: 'ADMIN', label: 'Admin' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DEACTIVATED', label: 'Deactivated' }
  ];

  // Custom styles for React Select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#d1d5db'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    })
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
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>
            <Gift style={{ color: '#4caf50' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Donors</div>
            <div className="stat-value">{stats.totalDonors}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <Sparkles style={{ color: '#ff9800' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">New Users</div>
            <div className="stat-value">{stats.newUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5' }}>
            <Handshake style={{ color: '#9c27b0' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Receivers</div>
            <div className="stat-value">{stats.totalReceivers}</div>
          </div>
        </div>
      </div>

      {/* All Users Section */}
      <div className="users-section">
        <div className="users-section-header">
          <h2>All Users</h2>
          <div className="pagination-info">
            {filteredUsers.length > 0 && (
              <span>1 - {filteredUsers.length} of {stats.totalUsers}</span>
            )}
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filters-wrapper">
            <Select
              value={roleOptions.find(opt => opt.value === roleFilter)}
              onChange={(option) => setRoleFilter(option.value)}
              options={roleOptions}
              styles={selectStyles}
              className="filter-select-react"
              placeholder="All Roles"
              isSearchable={false}
            />

            <Select
              value={statusOptions.find(opt => opt.value === statusFilter)}
              onChange={(option) => setStatusFilter(option.value)}
              options={statusOptions}
              styles={selectStyles}
              className="filter-select-react"
              placeholder="All Status"
              isSearchable={false}
            />

            <button onClick={handleResetFilters} className="filter-reset-btn">
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Email</th>
              <th>Phone</th>
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
                <React.Fragment key={user.id}>
                  <tr className={expandedRows.has(user.id) ? 'expanded' : ''}>
                    <td>
                      <button 
                        className="expand-btn"
                        onClick={() => {
                          const newExpanded = new Set(expandedRows);
                          if (newExpanded.has(user.id)) {
                            newExpanded.delete(user.id);
                          } else {
                            newExpanded.add(user.id);
                          }
                          setExpandedRows(newExpanded);
                        }}
                      >
                        {expandedRows.has(user.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>
                  <td className="id-cell">{user.id}</td>
                  <td>
                    <div className="user-name-info">
                      <div className="user-name">{user.contactPerson || 'N/A'}</div>
                      <div className="user-org">{user.organizationName || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`pill pill-${user.role.toLowerCase()}`}>
                      {user.role === 'DONOR' ? 'Donor' : user.role === 'RECEIVER' ? 'Receiver' : 'Admin'}
                    </span>
                  </td>
                  <td>
                    {user.verificationStatus && (
                      <span className={`pill pill-${user.verificationStatus.toLowerCase()}`}>
                        {user.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`pill pill-status-${user.accountStatus.toLowerCase()}`}>
                      {user.accountStatus === 'ACTIVE' ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="email-cell">{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td className="activity-cell">
                    {user.role === 'DONOR' && (user.donationCount || 0)}
                    {user.role === 'RECEIVER' && (user.claimCount || 0)}
                    {user.role === 'ADMIN' && '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.accountStatus === 'ACTIVE' && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeactivateModal(true);
                          }}
                          className="action-btn action-btn-power"
                          title="Deactivate"
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
                          title="Reactivate"
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
                        title="Send Alert"
                      >
                        <Bell size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded details row */}
                {expandedRows.has(user.id) && (
                  <tr className="details-row">
                    <td colSpan="10">
                      <div className="user-details-expanded">
                        <div className="details-grid">
                          <div className="details-section">
                            <h4>Total Activity</h4>
                            <p className="details-value">
                              {user.role === 'DONOR' && `${user.donationCount || 0} donations`}
                              {user.role === 'RECEIVER' && `${user.claimCount || 0} claims`}
                              {user.role === 'ADMIN' && 'N/A'}
                            </p>
                          </div>
                          
                          <div className="details-section">
                            <h4>Disputes</h4>
                            <p className="details-value">0</p>
                          </div>
                          
                          <div className="details-section">
                            <h4>Feedback Score</h4>
                            <p className="details-value">4.9/5</p>
                          </div>
                          
                          <div className="details-section">
                            <h4>Member Since</h4>
                            <p className="details-value">
                              {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="details-activity">
                          <h4>Recent Activity</h4>
                          <ul className="activity-list">
                            <li>• Donated 50kg of produce on Dec 15, 2025</li>
                            <li>• Donated 30kg of bakery items on Dec 10, 2025</li>
                            <li>• Completed verification on Dec 1, 2024</li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
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
    </div>
  );
};

export default AdminUsers;
