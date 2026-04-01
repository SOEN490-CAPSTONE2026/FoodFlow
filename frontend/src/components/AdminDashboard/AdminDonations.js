import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  Gift,
  Users,
  Flag,
  Eye,
  Sparkles,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  Info,
  ShieldAlert,
  Star,
} from 'lucide-react';
import './Admin_Styles/AdminDonations.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { adminDonationAPI, feedbackAPI } from '../../services/api';
import {
  parseBackendUtcTimestamp,
  parseExplicitUtcTimestamp,
} from '../../utils/timezoneUtils';

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
  const { t } = useTranslation();
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
      setError(t('adminDonations.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = donationsList => {
    const stats = {
      totalDonations: donationsList.length,
      active: donationsList.filter(d =>
        ['AVAILABLE', 'CLAIMED', 'READY_FOR_PICKUP'].includes(d.status)
      ).length,
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

  const fetchFeedbackForDonation = async donation => {
    if (!donation.claimId || feedbackData[donation.id]) {
      return;
    }

    try {
      console.log(
        '🔍 Fetching feedback for donation:',
        donation.id,
        'claimId:',
        donation.claimId
      );
      console.log(
        '🔍 Donation donorId:',
        donation.donorId,
        'receiverId:',
        donation.receiverId
      );

      const feedbackResponse = await feedbackAPI.getFeedbackForClaim(
        donation.claimId
      );
      console.log('📦 Full response:', feedbackResponse);
      const feedbacks = feedbackResponse.data || [];
      console.log('📦 Received feedbacks array:', feedbacks);
      console.log('📦 Number of feedbacks:', feedbacks.length);

      if (feedbacks.length > 0) {
        feedbacks.forEach((fb, idx) => {
          console.log(`📦 Feedback ${idx}:`, fb);
          console.log(
            `   - reviewerId: ${fb.reviewerId}, revieweeId: ${fb.revieweeId}`
          );
        });
      }

      // Donor feedback is written by the donor; receiver feedback is written by the receiver.
      const donorFeedback = feedbacks.find(
        f => f.reviewerId === donation.donorId
      );
      const receiverFeedback = feedbacks.find(
        f => f.reviewerId === donation.receiverId
      );

      console.log(
        '✅ Donor feedback (reviewerId should be donorId):',
        donorFeedback
      );
      console.log(
        '✅ Receiver feedback (reviewerId should be receiverId):',
        receiverFeedback
      );

      setFeedbackData(prev => ({
        ...prev,
        [donation.id]: { donorFeedback, receiverFeedback },
      }));
    } catch (err) {
      // 404 means no feedback yet - this is normal, not an error.
      if (err.response?.status === 404) {
        console.log('ℹ️ No feedback found for claim', donation.claimId);
        setFeedbackData(prev => ({
          ...prev,
          [donation.id]: { donorFeedback: null, receiverFeedback: null },
        }));
      } else {
        console.error('❌ Error fetching feedback:', err);
      }
    }
  };

  const toggleExpandRow = async donation => {
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
  const getAverageRating = donation => {
    if (!feedbackData[donation.id]) {
      return null;
    }

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

  // Check if any rating is low (<=2)
  const hasLowRating = donation => {
    if (!feedbackData[donation.id]) {
      return false;
    }
    const donorRating = feedbackData[donation.id].donorFeedback?.rating;
    const receiverRating = feedbackData[donation.id].receiverFeedback?.rating;
    return (
      (donorRating && donorRating <= 2) ||
      (receiverRating && receiverRating <= 2)
    );
  };

  const openDetailModal = async donation => {
    try {
      // Fetch full details including timeline
      const response = await adminDonationAPI.getDonationById(donation.id);
      const donationData = response.data;

      // Fetch feedback if claim exists
      if (donationData.claimId) {
        try {
          const feedbackResponse = await feedbackAPI.getFeedbackForClaim(
            donationData.claimId
          );
          const feedbacks = feedbackResponse.data || [];

          // Donor feedback is written by the donor; receiver feedback is written by the receiver.
          const donorFeedback = feedbacks.find(
            f => f.reviewerId === donationData.donorId
          );
          const receiverFeedback = feedbacks.find(
            f => f.reviewerId === donationData.receiverId
          );

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
    control: base => ({
      ...base,
      minHeight: '42px',
      border: '2px solid #62b6cb',
      borderRadius: '6px',
      boxShadow: 'none',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#1b4965',
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#1b4965'
        : state.isFocused
          ? '#eef7fb'
          : 'white',
      color: state.isSelected ? 'white' : '#1b4965',
      cursor: 'pointer',
    }),
    menu: base => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(98, 182, 203, 0.2)',
      border: '1px solid #62b6cb',
    }),
    singleValue: base => ({
      ...base,
      color: '#1b4965',
    }),
  };

  const formatDate = dateString => {
    if (!dateString) {
      return t('adminDonations.notAvailable');
    }
    const parsed =
      parseExplicitUtcTimestamp(dateString) ||
      parseBackendUtcTimestamp(dateString);
    if (!parsed) {
      return t('adminDonations.notAvailable');
    }
    return parsed.toLocaleString();
  };

  return (
    <div className="admin-donations-container">
      <div className="donations-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e3f2fd' }}>
            <Gift style={{ color: '#2196f3' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('adminDonations.stats.total')}</div>
            <div className="stat-value">{totalElements}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f5e9' }}>
            <Users style={{ color: '#4caf50' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('adminDonations.stats.active')}</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3e0' }}>
            <Sparkles style={{ color: '#ff9800' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminDonations.stats.completed')}
            </div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e5f5' }}>
            <Flag style={{ color: '#9c27b0' }} size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminDonations.stats.flagged')}
            </div>
            <div className="stat-value">{stats.flagged}</div>
          </div>
        </div>
      </div>

      <div className="donations-section">
        <div className="donations-section-header">
          <h2>{t('adminDonations.title')}</h2>
          <div className="pagination-info">
            {totalElements > 0 && (
              <span>
                {currentPage * 20 + 1} -{' '}
                {Math.min((currentPage + 1) * 20, totalElements)} of{' '}
                {totalElements}
              </span>
            )}
          </div>
        </div>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder={t('adminDonations.searchPlaceholder')}
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
              placeholder={t('adminDonations.filters.allStatus')}
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
                fontSize: '14px',
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
                fontSize: '14px',
              }}
            />
            <button onClick={handleResetFilters} className="filter-reset-btn">
              {t('adminDonations.filters.reset')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="error-message"
          style={{
            margin: '20px',
            padding: '15px',
            background: '#fee',
            color: '#c00',
            borderRadius: '6px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {t('adminDonations.loading')}
        </div>
      ) : (
        <div className="donations-table-container">
          <Table className="donations-table">
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>{t('adminDonations.table.id')}</TableHead>
                <TableHead>{t('adminDonations.table.title')}</TableHead>
                <TableHead>{t('adminDonations.table.status')}</TableHead>
                <TableHead>{t('adminDonations.table.donor')}</TableHead>
                <TableHead>{t('adminDonations.table.receiver')}</TableHead>
                <TableHead>{t('adminDonations.table.rating')}</TableHead>
                <TableHead>{t('adminDonations.table.flagged')}</TableHead>
                <TableHead>{t('adminDonations.table.created')}</TableHead>
                <TableHead>{t('adminDonations.table.updated')}</TableHead>
                <TableHead>{t('adminDonations.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="11" className="no-donations">
                    {t('adminDonations.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonations.map(donation => (
                  <React.Fragment key={donation.id}>
                    <TableRow
                      className={
                        expandedRows.has(donation.id) ? 'expanded' : ''
                      }
                    >
                      <TableCell data-label="">
                        <button
                          className="expand-btn"
                          onClick={() => toggleExpandRow(donation)}
                        >
                          {expandedRows.has(donation.id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                          <span className="mobile-expand-label">
                            {expandedRows.has(donation.id)
                              ? t('common.less', 'Less')
                              : t('common.more', 'More')}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell data-label="ID" className="id-cell">
                        {donation.id}
                      </TableCell>
                      <TableCell data-label="Title">{donation.title}</TableCell>
                      <TableCell data-label="Status">
                        <span
                          className={`pill pill-status-${donation.status?.toLowerCase()}`}
                        >
                          {donation.status}
                        </span>
                      </TableCell>
                      <TableCell data-label="Donor">
                        {donation.donorName || t('adminDonations.notAvailable')}
                      </TableCell>
                      <TableCell data-label="Receiver">
                        {donation.receiverName ||
                          t('adminDonations.notAvailable')}
                      </TableCell>
                      <TableCell data-label="Rating">
                        {!donation.claimId ? (
                          <span className="table-muted">—</span>
                        ) : (
                          (() => {
                            const avgRating = getAverageRating(donation);
                            return avgRating ? (
                              <div className="rating-cell">
                                <Star
                                  size={16}
                                  fill="#fbbf24"
                                  stroke="#fbbf24"
                                />
                                <span>{avgRating}</span>
                              </div>
                            ) : (
                              <span className="table-muted">—</span>
                            );
                          })()
                        )}
                      </TableCell>
                      <TableCell data-label="Flagged">
                        {donation.flagged ? (
                          <div
                            className="flagged-cell"
                            title={
                              donation.flagReason ||
                              t('adminDonations.flaggedDonation')
                            }
                          >
                            <Flag color="#ef4444" size={16} />
                            <span className="flagged-text">
                              {t('common.yes', 'Yes')}
                            </span>
                          </div>
                        ) : hasLowRating(donation) ? (
                          <div
                            className="flagged-cell"
                            title="Low rating (<=2 stars)"
                          >
                            <Flag color="#ef4444" size={16} />
                          </div>
                        ) : (
                          <span className="table-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Created">
                        {formatDate(donation.createdAt)}
                      </TableCell>
                      <TableCell data-label="Updated">
                        {formatDate(donation.updatedAt)}
                      </TableCell>
                      <TableCell data-label="Actions">
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            onClick={() => openDetailModal(donation)}
                            title={t('adminDonations.actions.viewDetails')}
                          >
                            <Eye size={16} />
                            <span className="mobile-action-label">
                              {t('adminDonations.actions.viewDetails')}
                            </span>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(donation.id) && (
                      <TableRow className="details-row">
                        <TableCell colSpan="11">
                          <div className="donation-details-expanded">
                            <div className="details-grid">
                              <div className="details-section">
                                <h4>
                                  {t('adminDonations.details.foodCategories')}
                                </h4>
                                <p className="details-value">
                                  {donation.foodCategories?.join(', ') ||
                                    t('adminDonations.notAvailable')}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>{t('adminDonations.details.quantity')}</h4>
                                <p className="details-value">
                                  {donation.quantity
                                    ? `${donation.quantity.value} ${donation.quantity.unit}`
                                    : t('adminDonations.notAvailable')}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>
                                  {t('adminDonations.details.expiryDate')}
                                </h4>
                                <p className="details-value">
                                  {donation.expiryDate ||
                                    t('adminDonations.notAvailable')}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>
                                  {t('adminDonations.details.pickupDate')}
                                </h4>
                                <p className="details-value">
                                  {donation.pickupDate ||
                                    t('adminDonations.notAvailable')}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>
                                  {t('adminDonations.details.temperature')}
                                </h4>
                                <p className="details-value">
                                  {donation.temperature ||
                                    t('adminDonations.notAvailable')}
                                </p>
                              </div>
                              <div className="details-section">
                                <h4>
                                  {t(
                                    'adminDonations.details.packagingConditions'
                                  )}
                                </h4>
                                <p className="details-value">
                                  {donation.packagingConditions ||
                                    t('adminDonations.notAvailable')}
                                </p>
                              </div>
                            </div>
                            <div className="details-section">
                              <h4>{t('adminDonations.details.description')}</h4>
                              <p className="details-value">
                                {donation.description ||
                                  t('adminDonations.details.noDescription')}
                              </p>
                            </div>

                            {/* Feedback in expanded row */}
                            {donation.claimId && (
                              <div className="feedback-section">
                                <h4>
                                  {t('adminDonations.details.feedbackRatings')}
                                </h4>
                                {!feedbackData[donation.id] ? (
                                  <div className="feedback-loading">
                                    {t(
                                      'adminDonations.details.clickToLoadFeedback'
                                    )}
                                  </div>
                                ) : feedbackData[donation.id].donorFeedback ||
                                  feedbackData[donation.id].receiverFeedback ? (
                                  <div className="feedback-container">
                                    {feedbackData[donation.id]
                                      .donorFeedback && (
                                      <div
                                        className={`feedback-card ${feedbackData[donation.id].donorFeedback.rating <= 2 ? 'low-rating' : ''}`}
                                      >
                                        <div className="feedback-header">
                                          <div className="feedback-direction">
                                            Donor {'→'} Receiver
                                          </div>
                                          <div className="rating-display">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star
                                                key={star}
                                                size={16}
                                                fill={
                                                  star <=
                                                  feedbackData[donation.id]
                                                    .donorFeedback.rating
                                                    ? '#fbbf24'
                                                    : 'none'
                                                }
                                                stroke={
                                                  star <=
                                                  feedbackData[donation.id]
                                                    .donorFeedback.rating
                                                    ? '#fbbf24'
                                                    : '#d1d5db'
                                                }
                                              />
                                            ))}
                                            <span className="rating-value">
                                              {
                                                feedbackData[donation.id]
                                                  .donorFeedback.rating
                                              }
                                              /5
                                            </span>
                                            {feedbackData[donation.id]
                                              .donorFeedback.rating <= 2 && (
                                              <Flag
                                                size={14}
                                                color="#ef4444"
                                                className="low-rating-flag"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        {feedbackData[donation.id].donorFeedback
                                          .reviewText && (
                                          <div className="feedback-text">
                                            "
                                            {
                                              feedbackData[donation.id]
                                                .donorFeedback.reviewText
                                            }
                                            "
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {feedbackData[donation.id]
                                      .receiverFeedback && (
                                      <div
                                        className={`feedback-card ${feedbackData[donation.id].receiverFeedback.rating <= 2 ? 'low-rating' : ''}`}
                                      >
                                        <div className="feedback-header">
                                          <div className="feedback-direction">
                                            Receiver {'→'} Donor
                                          </div>
                                          <div className="rating-display">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star
                                                key={star}
                                                size={16}
                                                fill={
                                                  star <=
                                                  feedbackData[donation.id]
                                                    .receiverFeedback.rating
                                                    ? '#fbbf24'
                                                    : 'none'
                                                }
                                                stroke={
                                                  star <=
                                                  feedbackData[donation.id]
                                                    .receiverFeedback.rating
                                                    ? '#fbbf24'
                                                    : '#d1d5db'
                                                }
                                              />
                                            ))}
                                            <span className="rating-value">
                                              {
                                                feedbackData[donation.id]
                                                  .receiverFeedback.rating
                                              }
                                              /5
                                            </span>
                                            {feedbackData[donation.id]
                                              .receiverFeedback.rating <= 2 && (
                                              <Flag
                                                size={14}
                                                color="#ef4444"
                                                className="low-rating-flag"
                                              />
                                            )}
                                          </div>
                                        </div>
                                        {feedbackData[donation.id]
                                          .receiverFeedback.reviewText && (
                                          <div className="feedback-text">
                                            "
                                            {
                                              feedbackData[donation.id]
                                                .receiverFeedback.reviewText
                                            }
                                            "
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="feedback-empty">
                                    {t('adminDonations.details.noFeedback')}
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                padding: '20px',
              }}
            >
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="filter-reset-btn"
              >
                {t('adminVerificationQueue.pagination.previous')}
              </button>
              <span style={{ padding: '10px' }}>
                {t('adminVerificationQueue.pagination.pageOf', {
                  page: currentPage + 1,
                  total: totalPages,
                })}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(p => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="filter-reset-btn"
              >
                {t('adminVerificationQueue.pagination.next')}
              </button>
            </div>
          )}
        </div>
      )}

      {showDetailModal && selectedDonation && (
        <div
          className="modal-overlay donation-admin-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-content modal-user-detail donation-admin-modal-content donation-admin-modal-detail"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close donation-admin-modal-close"
              onClick={() => setShowDetailModal(false)}
            >
              ×
            </button>

            <div className="modal-header donation-admin-modal-header">
              <h2 className="donation-admin-modal-title">
                {t('adminDonations.detailsModal.title')}{' '}
                {modalPage === 1 &&
                  `- ${t('adminDonations.detailsModal.pageTitles.basicInfoParticipants')}`}
                {modalPage === 2 &&
                  `- ${t('adminDonations.detailsModal.pageTitles.timeline')}`}
                {modalPage === 3 &&
                  `- ${t('adminDonations.detailsModal.pageTitles.overrideStatus')}`}
              </h2>
            </div>

            <div className="modal-body donation-admin-modal-body">
              {/* Page 1: Basic Information and Participants */}
              {modalPage === 1 && (
                <div className="donation-admin-page-one-layout">
                  <div className="info-card donation-admin-info-card donation-admin-info-card-basic">
                    <div className="info-card-header donation-admin-info-card-header donation-admin-page-one-header">
                      <Info size={20} />
                      <h3>
                        {t('adminDonations.detailsModal.basicInformation')}
                      </h3>
                    </div>
                    <div className="donation-admin-basic-card-surface">
                      <div className="info-grid donation-admin-info-grid donation-admin-page-one-grid">
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <User size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.id')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            {selectedDonation.id}
                          </span>
                        </div>
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <Gift size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.title')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            {selectedDonation.title}
                          </span>
                        </div>
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <Sparkles size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.status')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            <span
                              className={`pill pill-status-${selectedDonation.status?.toLowerCase()}`}
                            >
                              {selectedDonation.status}
                            </span>
                          </span>
                        </div>
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <Flag size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.flagged')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            {selectedDonation.flagged
                              ? `${t('adminDonations.detailsModal.values.yes')}${selectedDonation.flagReason ? ` - ${selectedDonation.flagReason}` : ''}`
                              : t('adminDonations.detailsModal.values.no')}
                          </span>
                        </div>
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <Calendar size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.created')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            {formatDate(selectedDonation.createdAt)}
                          </span>
                        </div>
                        <div className="info-item donation-admin-info-item donation-admin-page-one-item">
                          <span className="info-label donation-admin-info-label">
                            <Clock size={16} />{' '}
                            {t('adminDonations.detailsModal.fields.updated')}
                          </span>
                          <span className="info-value donation-admin-info-value">
                            {formatDate(selectedDonation.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="info-card donation-admin-info-card donation-admin-info-card-basic">
                    <div className="info-card-header donation-admin-info-card-header donation-admin-page-one-header">
                      <Users size={20} />
                      <h3>{t('adminDonations.detailsModal.participants')}</h3>
                    </div>
                    <div className="donation-admin-participants-grid">
                      <div className="donation-admin-participant-card">
                        <div className="donation-admin-participant-header">
                          <User size={18} />
                          <span className="donation-admin-participant-role">
                            {t('adminDonations.detailsModal.roles.donor')}
                          </span>
                        </div>
                        <div className="donation-admin-participant-info">
                          <div className="donation-admin-participant-field">
                            <span className="donation-admin-participant-label">
                              {t('adminDonations.detailsModal.fields.name')}
                            </span>
                            <div className="donation-admin-participant-name">
                              {selectedDonation.donorName ||
                                t('adminDonations.notAvailable')}
                            </div>
                          </div>
                          <div className="donation-admin-participant-field">
                            <span className="donation-admin-participant-label">
                              {t('adminDonations.detailsModal.fields.email')}
                            </span>
                            <div className="donation-admin-participant-email">
                              {selectedDonation.donorEmail ||
                                t('adminDonations.notAvailable')}
                            </div>
                          </div>
                          <div className="donation-admin-participant-field">
                            <span className="donation-admin-participant-label">
                              {t(
                                'adminDonations.detailsModal.fields.organization'
                              )}
                            </span>
                            <div className="donation-admin-participant-org">
                              <Building2 size={14} />
                              <span>
                                {selectedDonation.donorOrganization ||
                                  t('adminDonations.notAvailable')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedDonation.receiverName && (
                        <div className="donation-admin-participant-card">
                          <div className="donation-admin-participant-header">
                            <User size={18} />
                            <span className="donation-admin-participant-role">
                              {t('adminDonations.detailsModal.roles.receiver')}
                            </span>
                          </div>
                          <div className="donation-admin-participant-info">
                            <div className="donation-admin-participant-field">
                              <span className="donation-admin-participant-label">
                                {t('adminDonations.detailsModal.fields.name')}
                              </span>
                              <div className="donation-admin-participant-name">
                                {selectedDonation.receiverName}
                              </div>
                            </div>
                            <div className="donation-admin-participant-field">
                              <span className="donation-admin-participant-label">
                                {t('adminDonations.detailsModal.fields.email')}
                              </span>
                              <div className="donation-admin-participant-email">
                                {selectedDonation.receiverEmail ||
                                  t('adminDonations.notAvailable')}
                              </div>
                            </div>
                            <div className="donation-admin-participant-field">
                              <span className="donation-admin-participant-label">
                                {t(
                                  'adminDonations.detailsModal.fields.organization'
                                )}
                              </span>
                              <div className="donation-admin-participant-org">
                                <Building2 size={14} />
                                <span>
                                  {selectedDonation.receiverOrganization ||
                                    t('adminDonations.notAvailable')}
                                </span>
                              </div>
                            </div>
                            <div className="donation-admin-participant-field">
                              <span className="donation-admin-participant-label">
                                {t(
                                  'adminDonations.detailsModal.fields.claimedAt'
                                )}
                              </span>
                              <div className="donation-admin-claimed-at">
                                <CheckCircle size={14} />
                                {formatDate(selectedDonation.claimedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Page 2: Timeline */}
              {modalPage === 2 && (
                <div className="donation-admin-info-card donation-admin-timeline-card">
                  <div className="donation-admin-info-card-header">
                    <Clock size={20} />
                    <h3>{t('adminDonations.detailsModal.timeline')}</h3>
                  </div>
                  <div className="donation-admin-timeline-container">
                    {selectedDonation.timeline &&
                    selectedDonation.timeline.length > 0 ? (
                      selectedDonation.timeline.map((event, idx) => (
                        <div
                          key={idx}
                          className={`donation-admin-timeline-item ${event.visibleToUsers === false ? 'donation-admin-only' : ''}`}
                        >
                          <div className="donation-admin-timeline-marker" />
                          <div className="donation-admin-timeline-content">
                            <div className="donation-admin-timeline-event-type">
                              {event.eventType}
                            </div>
                            <div className="donation-admin-timeline-meta">
                              <span>{formatDate(event.timestamp)}</span>
                              <span className="donation-admin-timeline-actor">
                                {t('adminDonations.detailsModal.actor', {
                                  actor: event.actor,
                                })}
                              </span>
                              {event.visibleToUsers === false && (
                                <span className="donation-admin-only-badge">
                                  <ShieldAlert size={14} />
                                  {t('adminDonations.detailsModal.adminOnly')}
                                </span>
                              )}
                            </div>
                            {event.oldStatus && event.newStatus && (
                              <div className="donation-admin-timeline-status-change">
                                {t('adminDonations.detailsModal.statusChange')}
                                {': '}
                                <span className="donation-admin-old-status">
                                  {event.oldStatus}
                                </span>
                                <span className="donation-admin-arrow">
                                  {'→'}
                                </span>
                                <span className="donation-admin-new-status">
                                  {event.newStatus}
                                </span>
                              </div>
                            )}
                            {event.details && (
                              <div className="donation-admin-timeline-details">
                                {event.details}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="donation-admin-no-timeline">
                        {t('adminDonations.detailsModal.noTimeline')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Page 3: Override Status */}
              {modalPage === 3 && (
                <div className="donation-admin-info-card donation-admin-override-card">
                  <div className="donation-admin-info-card-header donation-admin-override-header">
                    <AlertCircle size={20} />
                    <h3>{t('adminDonations.detailsModal.overrideStatus')}</h3>
                  </div>
                  <div className="donation-admin-override-form">
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">
                        {t('adminDonations.detailsModal.currentStatus')}:
                      </label>
                      <div className="donation-admin-current-status-display">
                        <span className="donation-admin-current-status-text">
                          {selectedDonation.status}
                        </span>
                      </div>
                    </div>
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">
                        {t('adminDonations.detailsModal.newStatus')}:
                      </label>
                      <Select
                        value={statusOptions.find(
                          opt => opt.value === overrideStatus
                        )}
                        onChange={option => setOverrideStatus(option.value)}
                        options={statusOptions.filter(
                          opt =>
                            opt.value && opt.value !== selectedDonation.status
                        )}
                        styles={overrideSelectStyles}
                        className="filter-select-react"
                        placeholder={t(
                          'adminDonations.detailsModal.selectNewStatus'
                        )}
                        isSearchable={false}
                      />
                    </div>
                    <div className="donation-admin-form-group">
                      <label className="donation-admin-form-label">
                        {t('adminDonations.detailsModal.reason')}:
                      </label>
                      <textarea
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder={t(
                          'adminDonations.detailsModal.reasonPlaceholder'
                        )}
                        className="donation-admin-override-textarea"
                      />
                    </div>
                    <button
                      className="btn-confirm donation-admin-override-btn"
                      onClick={handleOverrideStatus}
                      disabled={overrideLoading}
                    >
                      {overrideLoading
                        ? t('adminDonations.detailsModal.updating')
                        : t('adminDonations.detailsModal.overrideStatus')}
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
                <span>{t('adminDonations.detailsModal.back')}</span>
              </button>

              <div className="donation-admin-modal-page-indicator">
                {t('adminDonations.detailsModal.pageOf', {
                  page: modalPage,
                  total: 3,
                })}
              </div>

              <button
                className="donation-admin-modal-nav-btn"
                onClick={() => setModalPage(modalPage + 1)}
                disabled={modalPage === 3}
              >
                <span>{t('adminDonations.detailsModal.next')}</span>
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
