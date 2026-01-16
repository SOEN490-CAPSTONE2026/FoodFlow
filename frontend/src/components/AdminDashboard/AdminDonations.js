import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ChevronRight, ChevronDown, ChevronLeft, Search, Gift, Users, Flag, Eye, Sparkles, Calendar, Clock, User, Building2, CheckCircle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import './Admin_Styles/AdminDonations.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { adminDonationAPI } from '../../services/api';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'CLAIMED', label: 'Claimed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NOT_COMPLETED', label: 'Not Completed' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
];

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDonations: 0,
    active: 0,
    completed: 0,
    flagged: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalPage, setModalPage] = useState(1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch donations when filters change
  useEffect(() => {
    fetchDonations();
  }, [debouncedSearchTerm, statusFilter, fromDate, toDate, currentPage]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {
        search: debouncedSearchTerm || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: currentPage,
        size: 20,
      };

      const response = await adminDonationAPI.getAllDonations(filters);
      const data = response.data;

      setDonations(data.content || []);
      setFilteredDonations(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);

      // Calculate stats
      calculateStats(data.content || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationsList) => {
    const stats = {
      totalDonations: donationsList.length,
      active: donationsList.filter(d => ['AVAILABLE', 'CLAIMED', 'READY_FOR_PICKUP'].includes(d.status)).length,
      completed: donationsList.filter(d => d.status === 'COMPLETED').length,
      flagged: donationsList.filter(d => d.flagged === true).length,
    };
    setStats(stats);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setCurrentPage(0);
  };

  const openDetailModal = async (donation) => {
    try {
      // Fetch full details including timeline
      const response = await adminDonationAPI.getDonationById(donation.id);
      setSelectedDonation(response.data);
      setShowDetailModal(true);
      setModalPage(1); // Reset to first page
      setOverrideStatus('');
      setOverrideReason('');
      setOverrideError('');
      setOverrideSuccess('');
    } catch (err) {
      console.error('Error fetching donation details:', err);
      setError('Failed to load donation details');
    }
  };

  const handleOverrideStatus = async () => {
    if (!overrideStatus) {
      setOverrideError('Please select a new status');
      return;
    }
    if (!overrideReason.trim()) {
      setOverrideError('Please provide a reason for the override');
      return;
    }

    setOverrideLoading(true);
    setOverrideError('');
    setOverrideSuccess('');

    try {
      const response = await adminDonationAPI.overrideStatus(
        selectedDonation.id,
        overrideStatus,
        overrideReason
      );
      
      setOverrideSuccess('Status updated successfully!');
      setSelectedDonation(response.data);
      
      // Refresh the donations list
      setTimeout(() => {
        fetchDonations();
        setShowDetailModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error overriding status:', err);
      setOverrideError(err.response?.data || 'Failed to update status');
    } finally {
      setOverrideLoading(false);
    }
  };

  const overrideSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      border: '2px solid #fbbf24',
      borderRadius: '6px',
      boxShadow: 'none',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#f59e0b'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#f59e0b' : state.isFocused ? '#fef3c7' : 'white',
      color: state.isSelected ? 'white' : '#92400e',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
      border: '1px solid #fbbf24'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#92400e'
    })
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="admin-users-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd' }}>
            <Gift style={{ color: '#2196f3' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Donations</div>
            <div className="stat-value">{totalElements}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>
            <Users style={{ color: '#4caf50' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <Sparkles style={{ color: '#ff9800' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5' }}>
            <Flag style={{ color: '#9c27b0' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Flagged</div>
            <div className="stat-value">{stats.flagged}</div>
          </div>
        </div>
      </div>

      <div className="users-section">
        <div className="users-section-header">
          <h2>All Donations</h2>
          <div className="pagination-info">
            {totalElements > 0 && (
              <span>
                {currentPage * 20 + 1} - {Math.min((currentPage + 1) * 20, totalElements)} of {totalElements}
              </span>
            )}
          </div>
        </div>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by title, donor, receiver, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters-wrapper">
            <Select
              value={statusOptions.find(opt => opt.value === statusFilter)}
              onChange={option => setStatusFilter(option.value)}
              options={statusOptions}
              className="filter-select-react"
              placeholder="All Status"
              isSearchable={false}
            />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              placeholder="From Date"
              style={{
                minHeight: '42px',
                padding: '0 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              placeholder="To Date"
              style={{
                minHeight: '42px',
                padding: '0 10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button onClick={handleResetFilters} className="filter-reset-btn">Reset</button>
          </div>
        </div>
      </div>

      {error && <div className="error-message" style={{margin: '20px', padding: '15px', background: '#fee', color: '#c00', borderRadius: '6px'}}>{error}</div>}

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>Loading donations...</div>
      ) : (
        <div className="users-table-container">
          <Table className="users-table">
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Flagged</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="10" className="no-users">No donations found</TableCell>
                </TableRow>
              ) : (
                filteredDonations.map(donation => (
                  <React.Fragment key={donation.id}>
                    <TableRow className={expandedRows.has(donation.id) ? 'expanded' : ''}>
                      <TableCell>
                        <button
                          className="expand-btn"
                          onClick={() => {
                            const newExpanded = new Set(expandedRows);
                            if (newExpanded.has(donation.id)) newExpanded.delete(donation.id);
                            else newExpanded.add(donation.id);
                            setExpandedRows(newExpanded);
                          }}
                        >
                          {expandedRows.has(donation.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </TableCell>
                      <TableCell className="id-cell">{donation.id}</TableCell>
                      <TableCell>{donation.title}</TableCell>
                      <TableCell>
                        <span className={`pill pill-status-${donation.status?.toLowerCase()}`}>{donation.status}</span>
                      </TableCell>
                      <TableCell>{donation.donorName || 'N/A'}</TableCell>
                      <TableCell>{donation.receiverName || 'N/A'}</TableCell>
                      <TableCell>{donation.flagged ? <Flag color="red" size={16} /> : ''}</TableCell>
                      <TableCell>{formatDate(donation.createdAt)}</TableCell>
                      <TableCell>{formatDate(donation.updatedAt)}</TableCell>
                      <TableCell>
                        <button className="action-btn" onClick={() => openDetailModal(donation)} title="View Details">
                          <Eye size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(donation.id) && (
                      <TableRow className="details-row">
                        <TableCell colSpan="10">
                          <div className="user-details-expanded">
                            <div className="details-grid">
                              <div className="details-section">
                                <h4>Food Categories</h4>
                                <p className="details-value">{donation.foodCategories?.join(', ') || 'N/A'}</p>
                              </div>
                              <div className="details-section">
                                <h4>Quantity</h4>
                                <p className="details-value">
                                  {donation.quantity ? `${donation.quantity.value} ${donation.quantity.unit}` : 'N/A'}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>Expiry Date</h4>
                                <p className="details-value">{donation.expiryDate || 'N/A'}</p>
                              </div>
                              <div className="details-section">
                                <h4>Pickup Date</h4>
                                <p className="details-value">{donation.pickupDate || 'N/A'}</p>
                              </div>
                              <div className="details-section">
                                <h4>Temperature</h4>
                                <p className="details-value">{donation.temperature || 'N/A'}</p>
                              </div>
                              <div className="details-section">
                                <h4>Packaging Conditions</h4>
                                <p className="details-value">{donation.packagingConditions || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="details-section">
                              <h4>Description</h4>
                              <p className="details-value">{donation.description || 'No description'}</p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px'}}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="filter-reset-btn"
              >
                Previous
              </button>
              <span style={{padding: '10px'}}>Page {currentPage + 1} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="filter-reset-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showDetailModal && selectedDonation && (
        <div className="donation-admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="donation-admin-modal-content donation-admin-modal-detail" onClick={e => e.stopPropagation()}>
            <button className="donation-admin-modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            
            <div className="donation-admin-modal-header">
              <h2 className="donation-admin-modal-title">
                Donation Details {modalPage === 1 && '- Basic Info & Participants'}
                {modalPage === 2 && '- Timeline'}
                {modalPage === 3 && '- Override Status'}
              </h2>
            </div>
            
            <div className="donation-admin-modal-body">
              {/* Page 1: Basic Information and Participants */}
              {modalPage === 1 && (
                <>
                  <div className="donation-admin-info-card">
                    <div className="donation-admin-info-card-header">
                      <Info size={20} />
                      <h3>Basic Information</h3>
                    </div>
                    <div className="donation-admin-info-grid">
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">ID:</span>
                        <span className="donation-admin-info-value">{selectedDonation.id}</span>
                      </div>
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">Title:</span>
                        <span className="donation-admin-info-value">{selectedDonation.title}</span>
                      </div>
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">Status:</span>
                        <span className="donation-admin-info-value">{selectedDonation.status}</span>
                      </div>
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">Flagged:</span>
                        <span className="donation-admin-info-value">
                          {selectedDonation.flagged ? `Yes - ${selectedDonation.flagReason}` : 'No'}
                        </span>
                      </div>
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">
                          <Calendar size={14} style={{ marginRight: '4px' }} />
                          Created:
                        </span>
                        <span className="donation-admin-info-value">{formatDate(selectedDonation.createdAt)}</span>
                      </div>
                      <div className="donation-admin-info-item">
                        <span className="donation-admin-info-label">
                          <Clock size={14} style={{ marginRight: '4px' }} />
                          Updated:
                        </span>
                        <span className="donation-admin-info-value">{formatDate(selectedDonation.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="donation-admin-info-card">
                    <div className="donation-admin-info-card-header">
                      <Users size={20} />
                      <h3>Participants</h3>
                    </div>
                    <div className="donation-admin-participants-grid">
                      <div className="donation-admin-participant-card">
                        <div className="donation-admin-participant-header">
                          <User size={18} />
                          <span className="donation-admin-participant-role">Donor</span>
                        </div>
                        <div className="donation-admin-participant-info">
                          <div className="donation-admin-participant-name">{selectedDonation.donorName}</div>
                          <div className="donation-admin-participant-email">{selectedDonation.donorEmail}</div>
                          {selectedDonation.donorOrganization && (
                            <div className="donation-admin-participant-org">
                              <Building2 size={14} />
                              {selectedDonation.donorOrganization}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedDonation.receiverName && (
                        <div className="donation-admin-participant-card">
                          <div className="donation-admin-participant-header">
                            <User size={18} />
                            <span className="donation-admin-participant-role">Receiver</span>
                          </div>
                          <div className="donation-admin-participant-info">
                            <div className="donation-admin-participant-name">{selectedDonation.receiverName}</div>
                            <div className="donation-admin-participant-email">{selectedDonation.receiverEmail}</div>
                            {selectedDonation.receiverOrganization && (
                              <div className="donation-admin-participant-org">
                                <Building2 size={14} />
                                {selectedDonation.receiverOrganization}
                              </div>
                            )}
                            <div className="donation-admin-claimed-at">
                              <CheckCircle size={14} />
                              Claimed: {formatDate(selectedDonation.claimedAt)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Page 2: Timeline */}
              {modalPage === 2 && (
                <div className="donation-admin-info-card donation-admin-timeline-card">
                  <div className="donation-admin-info-card-header">
                    <Clock size={20} />
                    <h3>Timeline</h3>
                  </div>
                  <div className="donation-admin-timeline-container">
                    {selectedDonation.timeline && selectedDonation.timeline.length > 0 ? (
                      selectedDonation.timeline.map((event, idx) => (
                        <div 
                          key={idx} 
                          className={`donation-admin-timeline-item ${event.visibleToUsers === false ? 'donation-admin-only' : ''}`}
                        >
                          <div className="donation-admin-timeline-marker" />
                          <div className="donation-admin-timeline-content">
                            <div className="donation-admin-timeline-event-type">{event.eventType}</div>
                            <div className="donation-admin-timeline-meta">
                              <span>{formatDate(event.timestamp)}</span>
                              <span className="donation-admin-timeline-actor">Actor: {event.actor}</span>
                              {event.visibleToUsers === false && (
                                <span className="donation-admin-only-badge">
                                  <ShieldAlert size={14} />
                                  ADMIN ONLY
                                </span>
                              )}
                            </div>
                            {event.oldStatus && event.newStatus && (
                              <div className="donation-admin-timeline-status-change">
                                Status: <span className="donation-admin-old-status">{event.oldStatus}</span>
                                <span className="donation-admin-arrow">→</span>
                                <span className="donation-admin-new-status">{event.newStatus}</span>
                              </div>
                            )}
                            {event.details && (
                              <div className="donation-admin-timeline-details">{event.details}</div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="donation-admin-no-timeline">No timeline events available.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Page 3: Override Status */}
              {modalPage === 3 && (
                <div className="donation-admin-info-card donation-admin-override-card">
                  <div className="donation-admin-info-card-header donation-admin-override-header">
                    <AlertCircle size={20} />
                    <h3>Override Status</h3>
                  </div>
                  <div className="donation-admin-override-form">
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">Current Status:</label>
                      <div className="donation-admin-current-status-display">
                        <span className="donation-admin-current-status-text">
                          {selectedDonation.status}
                        </span>
                      </div>
                    </div>
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">New Status:</label>
                      <Select
                        value={statusOptions.find(opt => opt.value === overrideStatus)}
                        onChange={option => setOverrideStatus(option.value)}
                        options={statusOptions.filter(opt => opt.value && opt.value !== selectedDonation.status)}
                        styles={overrideSelectStyles}
                        className="filter-select-react"
                        placeholder="Select new status"
                        isSearchable={false}
                      />
                    </div>
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">Reason:</label>
                      <textarea
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="Provide a reason for the status override..."
                        className="donation-admin-override-textarea"
                      />
                    </div>
                    <button 
                      className="btn-confirm donation-admin-override-btn" 
                      onClick={handleOverrideStatus} 
                      disabled={overrideLoading}
                    >
                      {overrideLoading ? 'Updating...' : 'Override Status'}
                    </button>
                    {overrideError && (
                      <div className="donation-admin-alert donation-admin-alert-error">
                        <AlertCircle size={16} />
                        {overrideError}
                      </div>
                    )}
                    {overrideSuccess && (
                      <div className="donation-admin-alert donation-admin-alert-success">
                        <CheckCircle size={16} />
                        {overrideSuccess}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="donation-admin-modal-footer">
              <button 
                className="donation-admin-modal-nav-btn"
                onClick={() => setModalPage(modalPage - 1)}
                disabled={modalPage === 1}
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>
              
              <div className="donation-admin-modal-page-indicator">
                Page {modalPage} of 3
              </div>
              
              <button 
                className="donation-admin-modal-nav-btn"
                onClick={() => setModalPage(modalPage + 1)}
                disabled={modalPage === 3}
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;