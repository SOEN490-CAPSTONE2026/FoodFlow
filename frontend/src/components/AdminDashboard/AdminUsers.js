import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { ChevronRight, ChevronDown, Power, Bell, Edit3, Search, Users, Gift, Sparkles, Handshake } from 'lucide-react';
import './Admin_Styles/AdminUsers.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

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
  const [alertType, setAlertType] = useState('');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

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
      // Remove search from API call - handle it frontend only
      
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
      setTotalPages(totalPagesCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
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
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             org.includes(searchLower) ||
             phone.includes(searchLower);
    });
    
    setFilteredUsers(filtered);
  }, [users, debouncedSearchTerm]);

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
      closeAlertModal();
    } catch (err) {
      console.error('Error sending alert:', err);
      alert('Failed to send alert');
    }
  };

  // Close alert modal and reset states
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertMessage('');
    setAlertType('');
    setSelectedUser(null);
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
        <Table className="users-table">
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan="10" className="no-users">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <TableRow className={expandedRows.has(user.id) ? 'expanded' : ''}>
                    <TableCell>
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
                    </TableCell>
                  <TableCell className="id-cell">{user.id}</TableCell>
                  <TableCell>
                    <div className="user-name-info">
                      <div className="user-name">{user.contactPerson || 'N/A'}</div>
                      <div className="user-org">{user.organizationName || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`pill pill-${user.role.toLowerCase()}`}>
                      {user.role === 'DONOR' ? 'Donor' : user.role === 'RECEIVER' ? 'Receiver' : 'Admin'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.verificationStatus && (
                      <span className={`pill pill-${user.verificationStatus.toLowerCase()}`}>
                        {user.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`pill pill-status-${user.accountStatus.toLowerCase()}`}>
                      {user.accountStatus === 'ACTIVE' ? 'Active' : 'Deactivated'}
                    </span>
                  </TableCell>
                  <TableCell className="email-cell">{user.email}</TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell className="activity-cell">
                    {user.role === 'DONOR' && (user.donationCount || 0)}
                    {user.role === 'RECEIVER' && (user.claimCount || 0)}
                    {user.role === 'ADMIN' && '-'}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
                
                {/* Expanded details row */}
                {expandedRows.has(user.id) && (
                  <TableRow className="details-row">
                    <TableCell colSpan="10">
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
        <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal-content modal-alert" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDeactivateModal(false)}>×</button>
            <h2>Deactivate User:</h2>
            <p className="alert-user-name">{selectedUser?.email}</p>
            
            <textarea
              placeholder="Enter reason for deactivation (required)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="modal-textarea"
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={() => setShowDeactivateModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleDeactivate} className="btn-confirm">
                Deactivate
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
        <div className="modal-overlay" onClick={closeAlertModal}>
          <div className="modal-content modal-alert" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAlertModal}>×</button>
            <h2>Send Alert to:</h2>
            <p className="alert-user-name">{selectedUser?.contactPerson || selectedUser?.email}</p>
            
            <div className="alert-type-section">
              <label className="alert-section-label">Alert Type</label>
              
              <div className="alert-options">
                <label 
                  className={`alert-option ${alertType === 'warning' ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setAlertType(alertType === 'warning' ? '' : 'warning');
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
                    <div className="alert-option-title">Warning</div>
                    <div className="alert-option-desc">Send a warning about policy violations</div>
                  </div>
                </label>

                <label 
                  className={`alert-option ${alertType === 'safety' ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setAlertType(alertType === 'safety' ? '' : 'safety');
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
                    <div className="alert-option-title">Safety Notice</div>
                    <div className="alert-option-desc">Important safety information</div>
                  </div>
                </label>

                <label 
                  className={`alert-option ${alertType === 'compliance' ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setAlertType(alertType === 'compliance' ? '' : 'compliance');
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
                    <div className="alert-option-title">Compliance Reminder</div>
                    <div className="alert-option-desc">Remind about compliance requirements</div>
                  </div>
                </label>

                <label 
                  className={`alert-option ${alertType === 'custom' ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setAlertType(alertType === 'custom' ? '' : 'custom');
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
                    <div className="alert-option-title">Custom Alert</div>
                    <div className="alert-option-desc">Send a custom message</div>
                  </div>
                </label>
              </div>
            </div>

            {alertType === 'custom' && (
              <div className="custom-message-section">
                <textarea
                  placeholder="Enter your custom message..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="modal-textarea"
                  rows="4"
                />
              </div>
            )}

            <div className="modal-actions">
              <button onClick={closeAlertModal} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSendAlert} className="btn-confirm btn-send-alert">
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
