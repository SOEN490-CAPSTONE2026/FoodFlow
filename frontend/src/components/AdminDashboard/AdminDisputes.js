import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminDisputeAPI } from '../../services/api';
import './Admin_Styles/AdminDisputes.css';

const AdminDisputes = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [filteredDisputes, setFilteredDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [disputes, searchTerm, statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminDisputeAPI.getAllDisputes();

      // Backend returns Spring Page object with content array
      const disputeData = response.data.content || [];

      // Transform backend data to match frontend expectations
      const transformedData = disputeData.map(dispute => ({
        id: dispute.id,
        caseId: `DR-${new Date().getFullYear()}-${String(dispute.id).padStart(3, '0')}`,
        reporterId: dispute.reporterId,
        reporterName: dispute.reporterName,
        reporterType: dispute.reporterType || 'DONOR',
        reportedUserId: dispute.reportedUserId,
        reportedUserName: dispute.reportedUserName,
        reportedUserType: dispute.reportedUserType || 'RECEIVER',
        donationId: dispute.donationId,
        donationTitle: dispute.donationTitle || '',
        description: dispute.description,
        status: dispute.status,
        createdAt: dispute.createdAt,
        resolvedAt: dispute.resolvedAt,
      }));

      setDisputes(transformedData);
      calculateStats(transformedData);
    } catch (err) {
      setError('Error loading disputes');
      console.error('Failed to fetch disputes:', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = disputeList => {
    const stats = {
      total: disputeList.length,
      open: disputeList.filter(d => d.status === 'OPEN').length,
      underReview: disputeList.filter(d => d.status === 'UNDER_REVIEW').length,
      resolved: disputeList.filter(d => d.status === 'RESOLVED').length,
      closed: disputeList.filter(d => d.status === 'CLOSED').length,
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...disputes];

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.caseId.toLowerCase().includes(search) ||
          d.reporterName.toLowerCase().includes(search) ||
          d.reportedUserName.toLowerCase().includes(search) ||
          (d.donationId && d.donationId.toString().includes(search))
      );
    }

    setFilteredDisputes(filtered);
  };

  const handleSearch = e => {
    e.preventDefault();
    applyFilters();
  };

  const getStatusBadgeClass = status => {
    switch (status) {
      case 'OPEN':
        return 'status-badge status-open';
      case 'UNDER_REVIEW':
        return 'status-badge status-under-review';
      case 'RESOLVED':
        return 'status-badge status-resolved';
      case 'CLOSED':
        return 'status-badge status-closed';
      default:
        return 'status-badge';
    }
  };

  const formatStatus = status => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = dateString => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loading) {
    return (
      <div className="admin-disputes-container">
        <div className="loading-spinner">Loading disputes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-disputes-container">
        <div className="error-message">
          {error}
          <button onClick={fetchDisputes} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-disputes-container">
      {/* Header with Stats inline */}
      <div className="disputes-header-section">
        <div className="disputes-header-stats">
          <span className="stat-item">
            Total cases: <strong>{stats.total}</strong>
          </span>
          <span className="stat-item">
            Open: <strong>{stats.open}</strong>
          </span>
          <span className="stat-item">
            Resolved today: <strong>0</strong>
          </span>
          <span className="stat-item">
            Avg resolution: <strong>2.4 days</strong>
          </span>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="disputes-controls">
        <div className="disputes-tabs">
          <button
            className={statusFilter === 'ALL' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setStatusFilter('ALL')}
          >
            All Cases
          </button>
          <button
            className={statusFilter === 'OPEN' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setStatusFilter('OPEN')}
          >
            Open
          </button>
          <button
            className={
              statusFilter === 'UNDER_REVIEW' ? 'tab-btn active' : 'tab-btn'
            }
            onClick={() => setStatusFilter('UNDER_REVIEW')}
          >
            Under Review
          </button>
          <button
            className={
              statusFilter === 'RESOLVED' ? 'tab-btn active' : 'tab-btn'
            }
            onClick={() => setStatusFilter('RESOLVED')}
          >
            Resolved
          </button>
          <button
            className={statusFilter === 'CLOSED' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setStatusFilter('CLOSED')}
          >
            Closed
          </button>
        </div>

        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Disputes Table */}
      <div className="disputes-table-container">
        {filteredDisputes.length === 0 ? (
          <div className="empty-state">
            <h3>No disputes found</h3>
            <p>There are no disputes matching your current filters.</p>
          </div>
        ) : (
          <table className="disputes-table">
            <thead>
              <tr>
                <th>CASE ID</th>
                <th>REPORTER</th>
                <th>REPORTED USER</th>
                <th>DONATION ID</th>
                <th>CREATED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map(dispute => (
                <tr key={dispute.id}>
                  <td className="case-id">{dispute.caseId}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{dispute.reporterName}</div>
                      <div className="user-type">
                        {dispute.reporterType === 'DONOR'
                          ? 'Donor'
                          : 'Receiver'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="reported-user-name">
                      {dispute.reportedUserName}
                    </div>
                  </td>
                  <td>
                    {dispute.donationId ? (
                      <span className="donation-id">
                        DON-2024-{String(dispute.donationId).padStart(4, '0')}
                      </span>
                    ) : (
                      <span className="no-donation">—</span>
                    )}
                  </td>
                  <td>
                    <div className="date-cell">
                      <div className="date-main">
                        {formatDate(dispute.createdAt)}
                      </div>
                      <div className="date-time">
                        {formatTime(dispute.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(dispute.status)}>
                      {formatStatus(dispute.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;
