import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ChevronRight, ChevronDown, Search, Gift, Users, Flag, Eye, Sparkles, Star } from 'lucide-react';
import './Admin_Styles/AdminDonations.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { adminDonationAPI, feedbackAPI } from '../../services/api';

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
  const [feedbackData, setFeedbackData] = useState({});

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

  const fetchFeedbackForDonation = async (donation) => {
    if (!donation.claimId || feedbackData[donation.id]) return;
    
    try {
      const feedbackResponse = await feedbackAPI.getFeedbackForClaim(donation.claimId);
      const feedbacks = feedbackResponse.data || [];
      
      const donorFeedback = feedbacks.find(f => f.reviewerId === donation.receiverId);
      const receiverFeedback = feedbacks.find(f => f.reviewerId === donation.donorId);
      
      setFeedbackData(prev => ({
        ...prev,
        [donation.id]: { donorFeedback, receiverFeedback }
      }));
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const toggleExpandRow = async (donation) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(donation.id)) {
      newExpanded.delete(donation.id);
    } else {
      newExpanded.add(donation.id);
      // Fetch feedback when expanding
      if (donation.claimId) {
        await fetchFeedbackForDonation(donation);
      }
    }
    setExpandedRows(newExpanded);
  };

  const openDetailModal = async (donation) => {
    try {
      // Fetch full details including timeline
      const response = await adminDonationAPI.getDonationById(donation.id);
      const donationData = response.data;
      
      // Fetch feedback if claim exists
      if (donationData.claimId) {
        try {
          const feedbackResponse = await feedbackAPI.getFeedbackForClaim(donationData.claimId);
          const feedbacks = feedbackResponse.data || [];
          
          // Separate donor and receiver feedback
          const donorFeedback = feedbacks.find(f => f.reviewerId === donationData.receiverId);
          const receiverFeedback = feedbacks.find(f => f.reviewerId === donationData.donorId);
          
          donationData.donorFeedback = donorFeedback;
          donationData.receiverFeedback = receiverFeedback;
        } catch (feedbackErr) {
          console.error('Error fetching feedback:', feedbackErr);
          // Continue without feedback data
        }
      }
      
      setSelectedDonation(donationData);
      setShowDetailModal(true);
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
              styles={selectStyles}
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
                <TableHead>Rating</TableHead>
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
                          onClick={() => toggleExpandRow(donation)}
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
                      <TableCell>
                        {!donation.claimId ? (
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>No claim</span>
                        ) : feedbackData[donation.id] ? (
                          (feedbackData[donation.id].donorFeedback || feedbackData[donation.id].receiverFeedback) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                              <span style={{ fontSize: '13px' }}>
                                {feedbackData[donation.id].donorFeedback?.rating || feedbackData[donation.id].receiverFeedback?.rating}
                              </span>
                              {(feedbackData[donation.id].donorFeedback?.rating <= 2 || feedbackData[donation.id].receiverFeedback?.rating <= 2) && (
                                <Flag size={12} color="#ef4444" />
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No feedback</span>
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                        )}
                      </TableCell>
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
                            </div>
                            <div className="details-section">
                              <h4>Description</h4>
                              <p className="details-value">{donation.description || 'No description'}</p>
                            </div>
                            
                            {/* Feedback in expanded row */}
                            {donation.claimId && (
                              <div className="details-section" style={{ width: '100%', marginTop: '12px' }}>
                                <h4>Feedback & Ratings</h4>
                                {!feedbackData[donation.id] ? (
                                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>
                                    Click to expand and load feedback...
                                  </div>
                                ) : (feedbackData[donation.id].donorFeedback || feedbackData[donation.id].receiverFeedback) ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {feedbackData[donation.id].receiverFeedback && (
                                      <div style={{ width: '100%', padding: '12px', background: feedbackData[donation.id].receiverFeedback.rating <= 2 ? '#fef2f2' : '#f9fafb', borderRadius: '6px', border: feedbackData[donation.id].receiverFeedback.rating <= 2 ? '1px solid #fecaca' : '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>Donor → Receiver</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={14} fill={star <= feedbackData[donation.id].receiverFeedback.rating ? '#fbbf24' : 'none'} stroke={star <= feedbackData[donation.id].receiverFeedback.rating ? '#fbbf24' : '#d1d5db'} />
                                          ))}
                                          <span style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>{feedbackData[donation.id].receiverFeedback.rating}/5</span>
                                          {feedbackData[donation.id].receiverFeedback.rating <= 2 && <Flag size={12} color="#ef4444" style={{ marginLeft: '4px' }} />}
                                        </div>
                                        {feedbackData[donation.id].receiverFeedback.reviewText && (
                                          <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280' }}>"{feedbackData[donation.id].receiverFeedback.reviewText}"</div>
                                        )}
                                      </div>
                                    )}
                                    {feedbackData[donation.id].donorFeedback && (
                                      <div style={{ width: '100%', padding: '12px', background: feedbackData[donation.id].donorFeedback.rating <= 2 ? '#fef2f2' : '#f9fafb', borderRadius: '6px', border: feedbackData[donation.id].donorFeedback.rating <= 2 ? '1px solid #fecaca' : '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>Receiver → Donor</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={14} fill={star <= feedbackData[donation.id].donorFeedback.rating ? '#fbbf24' : 'none'} stroke={star <= feedbackData[donation.id].donorFeedback.rating ? '#fbbf24' : '#d1d5db'} />
                                          ))}
                                          <span style={{ fontSize: '13px', fontWeight: '600', marginLeft: '4px' }}>{feedbackData[donation.id].donorFeedback.rating}/5</span>
                                          {feedbackData[donation.id].donorFeedback.rating <= 2 && <Flag size={12} color="#ef4444" style={{ marginLeft: '4px' }} />}
                                        </div>
                                        {feedbackData[donation.id].donorFeedback.reviewText && (
                                          <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280' }}>"{feedbackData[donation.id].donorFeedback.reviewText}"</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', color: '#6b7280', fontSize: '13px', fontStyle: 'italic', textAlign: 'center' }}>
                                    No feedback has been provided yet for this donation.
                                  </div>
                                )}
                              </div>
                            )}
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
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-donation-detail" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            <h2>Donation Details</h2>
            
            <div className="modal-section">
              <h3>Basic Information</h3>
              <div><strong>ID:</strong> {selectedDonation.id}</div>
              <div><strong>Title:</strong> {selectedDonation.title}</div>
              <div><strong>Status:</strong> <span className={`pill pill-status-${selectedDonation.status?.toLowerCase()}`}>{selectedDonation.status}</span></div>
              <div><strong>Flagged:</strong> {selectedDonation.flagged ? <span style={{color: 'red'}}>Yes - {selectedDonation.flagReason}</span> : 'No'}</div>
              <div><strong>Created:</strong> {formatDate(selectedDonation.createdAt)}</div>
              <div><strong>Updated:</strong> {formatDate(selectedDonation.updatedAt)}</div>
            </div>

            <div className="modal-section">
              <h3>Participants</h3>
              <div><strong>Donor:</strong> {selectedDonation.donorName} ({selectedDonation.donorEmail})</div>
              {selectedDonation.donorOrganization && <div><strong>Donor Organization:</strong> {selectedDonation.donorOrganization}</div>}
              {selectedDonation.receiverName && (
                <>
                  <div><strong>Receiver:</strong> {selectedDonation.receiverName} ({selectedDonation.receiverEmail})</div>
                  {selectedDonation.receiverOrganization && <div><strong>Receiver Organization:</strong> {selectedDonation.receiverOrganization}</div>}
                  <div><strong>Claimed At:</strong> {formatDate(selectedDonation.claimedAt)}</div>
                </>
              )}
            </div>

            {/* Feedback Section */}
            {selectedDonation.claimId && (selectedDonation.donorFeedback || selectedDonation.receiverFeedback) && (
              <div className="modal-section feedback-section">
                <h3>Feedback & Ratings</h3>
                
                {selectedDonation.receiverFeedback && (
                  <div className={`feedback-card ${selectedDonation.receiverFeedback.rating <= 2 ? 'low-rating' : ''}`}>
                    <div className="feedback-header">
                      <h4>From Donor to Receiver</h4>
                      <div className="rating-display">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={18}
                            fill={star <= selectedDonation.receiverFeedback.rating ? '#fbbf24' : 'none'}
                            stroke={star <= selectedDonation.receiverFeedback.rating ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                        <span className="rating-value">{selectedDonation.receiverFeedback.rating}/5</span>
                        {selectedDonation.receiverFeedback.rating <= 2 && (
                          <Flag size={16} color="#ef4444" style={{ marginLeft: '8px' }} title="Low rating" />
                        )}
                      </div>
                    </div>
                    {selectedDonation.receiverFeedback.reviewText && (
                      <p className="feedback-text">"{selectedDonation.receiverFeedback.reviewText}"</p>
                    )}
                    <div className="feedback-meta">
                      Given on {formatDate(selectedDonation.receiverFeedback.createdAt)}
                    </div>
                  </div>
                )}
                
                {selectedDonation.donorFeedback && (
                  <div className={`feedback-card ${selectedDonation.donorFeedback.rating <= 2 ? 'low-rating' : ''}`}>
                    <div className="feedback-header">
                      <h4>From Receiver to Donor</h4>
                      <div className="rating-display">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={18}
                            fill={star <= selectedDonation.donorFeedback.rating ? '#fbbf24' : 'none'}
                            stroke={star <= selectedDonation.donorFeedback.rating ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                        <span className="rating-value">{selectedDonation.donorFeedback.rating}/5</span>
                        {selectedDonation.donorFeedback.rating <= 2 && (
                          <Flag size={16} color="#ef4444" style={{ marginLeft: '8px' }} title="Low rating" />
                        )}
                      </div>
                    </div>
                    {selectedDonation.donorFeedback.reviewText && (
                      <p className="feedback-text">"{selectedDonation.donorFeedback.reviewText}"</p>
                    )}
                    <div className="feedback-meta">
                      Given on {formatDate(selectedDonation.donorFeedback.createdAt)}
                    </div>
                  </div>
                )}
                
                {!selectedDonation.receiverFeedback && !selectedDonation.donorFeedback && (
                  <div className="no-feedback">No feedback provided yet for this donation.</div>
                )}
              </div>
            )}

            <div className="timeline-section">
              <h3>Timeline <span style={{fontSize: '14px', color: '#666'}}>(Admin Only - Timestamps Visible)</span></h3>
              <ul className="timeline-list">
                {selectedDonation.timeline && selectedDonation.timeline.length > 0 ? (
                  selectedDonation.timeline.map((event, idx) => (
                    <li key={idx} style={{
                      padding: '10px',
                      borderLeft: event.visibleToUsers === false ? '3px solid #9c27b0' : '3px solid #2196f3',
                      marginBottom: '10px',
                      background: event.visibleToUsers === false ? '#f3e5f5' : '#f5f5f5'
                    }}>
                      <div><strong>{event.eventType}</strong></div>
                      <div style={{fontSize: '13px', color: '#666'}}>
                        {formatDate(event.timestamp)} | Actor: {event.actor}
                        {event.visibleToUsers === false && <span style={{marginLeft: '10px', color: '#9c27b0', fontWeight: 'bold'}}>🔒 ADMIN ONLY</span>}
                      </div>
                      {event.oldStatus && event.newStatus && (
                        <div style={{fontSize: '13px', marginTop: '5px'}}>
                          Status: <strong>{event.oldStatus}</strong> → <strong>{event.newStatus}</strong>
                        </div>
                      )}
                      {event.details && <div style={{fontSize: '13px', marginTop: '5px', fontStyle: 'italic'}}>{event.details}</div>}
                    </li>
                  ))
                ) : (
                  <li>No timeline events available.</li>
                )}
              </ul>
            </div>

            <div className="override-section" style={{marginTop: '20px', padding: '15px', background: '#fff8e1', borderRadius: '6px'}}>
              <h3>Override Status</h3>
              <label style={{display: 'block', marginBottom: '5px'}}>New Status:</label>
              <Select
                value={statusOptions.find(opt => opt.value === overrideStatus)}
                onChange={option => setOverrideStatus(option.value)}
                options={statusOptions.filter(opt => opt.value && opt.value !== selectedDonation.status)}
                styles={selectStyles}
                className="filter-select-react"
                placeholder="Select new status"
                isSearchable={false}
              />
              <label style={{display: 'block', marginTop: '15px', marginBottom: '5px'}}>Reason:</label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Provide a reason for the status override..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <button 
                className="btn-confirm" 
                onClick={handleOverrideStatus} 
                disabled={overrideLoading}
                style={{marginTop: '15px', width: '100%'}}
              >
                {overrideLoading ? 'Updating...' : 'Override Status'}
              </button>
              {overrideError && <div className="error-message" style={{marginTop: '10px', color: '#c00'}}>{overrideError}</div>}
              {overrideSuccess && <div className="success-message" style={{marginTop: '10px', color: '#4caf50'}}>{overrideSuccess}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
