import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ChevronRight, ChevronDown, ChevronLeft, Search, Gift, Users, Flag, Eye, Sparkles, Calendar, Clock, User, Building2, CheckCircle, AlertCircle, Info, ShieldAlert, Star } from 'lucide-react';
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
      
      // Fetch feedback for all donations with claims
      const donationsWithClaims = (data.content || []).filter(d => d.claimId);
      donationsWithClaims.forEach(donation => {
        fetchFeedbackForDonation(donation);
      });
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
      console.log('🔍 Fetching feedback for donation:', donation.id, 'claimId:', donation.claimId);
      console.log('🔍 Donation donorId:', donation.donorId, 'receiverId:', donation.receiverId);
      
      const feedbackResponse = await feedbackAPI.getFeedbackForClaim(donation.claimId);
      console.log('📦 Full response:', feedbackResponse);
      
      const feedbacks = feedbackResponse.data || [];
      console.log('📦 Received feedbacks array:', feedbacks);
      console.log('📦 Number of feedbacks:', feedbacks.length);
      
      if (feedbacks.length > 0) {
        feedbacks.forEach((fb, idx) => {
          console.log(`📦 Feedback ${idx}:`, fb);
          console.log(`   - reviewerId: ${fb.reviewerId}, revieweeId: ${fb.revieweeId}`);
        });
      }
      
      // Donor feedback: reviewer is donor (donorId), reviewee is receiver (receiverId)
      const donorFeedback = feedbacks.find(f => f.reviewerId === donation.donorId);
      // Receiver feedback: reviewer is receiver (receiverId), reviewee is donor (donorId)
      const receiverFeedback = feedbacks.find(f => f.reviewerId === donation.receiverId);
      
      console.log('✅ Donor feedback (reviewerId should be donorId):', donorFeedback);
      console.log('✅ Receiver feedback (reviewerId should be receiverId):', receiverFeedback);
      
      setFeedbackData(prev => ({
        ...prev,
        [donation.id]: { donorFeedback, receiverFeedback }
      }));
    } catch (err) {
      // 404 means no feedback yet - this is normal, not an error
      if (err.response?.status === 404) {
        console.log('ℹ️ No feedback found for claim', donation.claimId);
        setFeedbackData(prev => ({
          ...prev,
          [donation.id]: { donorFeedback: null, receiverFeedback: null }
        }));
      } else {
        console.error('❌ Error fetching feedback:', err);
      }
    }
  };

  const toggleExpandRow = async (donation) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(donation.id)) {
      newExpanded.delete(donation.id);
    } else {
      newExpanded.add(donation.id);
      // Fetch feedback when expanding (if not already fetched)
      if (donation.claimId && !feedbackData[donation.id]) {
        await fetchFeedbackForDonation(donation);
      }
    }
    setExpandedRows(newExpanded);
  };

  // Calculate average rating for a donation
  const getAverageRating = (donation) => {
    if (!feedbackData[donation.id]) return null;
    
    const donorRating = feedbackData[donation.id].donorFeedback?.rating;
    const receiverRating = feedbackData[donation.id].receiverFeedback?.rating;
    
    if (donorRating && receiverRating) {
      return ((donorRating + receiverRating) / 2).toFixed(1);
    } else if (donorRating) {
      return donorRating.toFixed(1);
    } else if (receiverRating) {
      return receiverRating.toFixed(1);
    }
    return null;
  };

  // Check if any rating is low (≤2)
  const hasLowRating = (donation) => {
    if (!feedbackData[donation.id]) return false;
    const donorRating = feedbackData[donation.id].donorFeedback?.rating;
    const receiverRating = feedbackData[donation.id].receiverFeedback?.rating;
    return (donorRating && donorRating <= 2) || (receiverRating && receiverRating <= 2);
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
                          <span className="table-muted">—</span>
                        ) : (() => {
                          const avgRating = getAverageRating(donation);
                          return avgRating ? (
                            <div className="rating-cell">
                              <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                              <span>{avgRating}</span>
                            </div>
                          ) : (
                            <span className="table-muted">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {donation.flagged ? (
                          <div className="flagged-cell" title={donation.flagReason || 'Flagged donation'}>
                            <Flag color="#ef4444" size={16} />
                            <span className="flagged-text">Yes</span>
                          </div>
                        ) : hasLowRating(donation) ? (
                          <div className="flagged-cell" title="Low rating (≤2 stars)">
                            <Flag color="#ef4444" size={16} />
                          </div>
                        ) : (
                          <span className="table-muted">—</span>
                        )}
                      </TableCell>
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
                            
                            {/* Feedback in expanded row */}
                            {donation.claimId && (
                              <div className="feedback-section">
                                <h4>Feedback & Ratings</h4>
                                {!feedbackData[donation.id] ? (
                                  <div className="feedback-loading">
                                    Click to expand and load feedback...
                                  </div>
                                ) : (feedbackData[donation.id].donorFeedback || feedbackData[donation.id].receiverFeedback) ? (
                                  <div className="feedback-container">
                                    {feedbackData[donation.id].receiverFeedback && (
                                      <div className={`feedback-card ${feedbackData[donation.id].receiverFeedback.rating <= 2 ? 'low-rating' : ''}`}>
                                        <div className="feedback-header">
                                          <div className="feedback-direction">Donor → Receiver</div>
                                          <div className="rating-display">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} size={16} fill={star <= feedbackData[donation.id].receiverFeedback.rating ? '#fbbf24' : 'none'} stroke={star <= feedbackData[donation.id].receiverFeedback.rating ? '#fbbf24' : '#d1d5db'} />
                                            ))}
                                            <span className="rating-value">{feedbackData[donation.id].receiverFeedback.rating}/5</span>
                                            {feedbackData[donation.id].receiverFeedback.rating <= 2 && <Flag size={14} color="#ef4444" className="low-rating-flag" />}
                                          </div>
                                        </div>
                                        {feedbackData[donation.id].receiverFeedback.reviewText && (
                                          <div className="feedback-text">"{feedbackData[donation.id].receiverFeedback.reviewText}"</div>
                                        )}
                                      </div>
                                    )}
                                    {feedbackData[donation.id].donorFeedback && (
                                      <div className={`feedback-card ${feedbackData[donation.id].donorFeedback.rating <= 2 ? 'low-rating' : ''}`}>
                                        <div className="feedback-header">
                                          <div className="feedback-direction">Receiver → Donor</div>
                                          <div className="rating-display">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} size={16} fill={star <= feedbackData[donation.id].donorFeedback.rating ? '#fbbf24' : 'none'} stroke={star <= feedbackData[donation.id].donorFeedback.rating ? '#fbbf24' : '#d1d5db'} />
                                            ))}
                                            <span className="rating-value">{feedbackData[donation.id].donorFeedback.rating}/5</span>
                                            {feedbackData[donation.id].donorFeedback.rating <= 2 && <Flag size={14} color="#ef4444" className="low-rating-flag" />}
                                          </div>
                                        </div>
                                        {feedbackData[donation.id].donorFeedback.reviewText && (
                                          <div className="feedback-text">"{feedbackData[donation.id].donorFeedback.reviewText}"</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="feedback-empty">
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
                styles={overrideSelectStyles}
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