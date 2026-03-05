import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { adminDisputeAPI } from '../../services/api';
import './Admin_Styles/AdminDisputes.css';

const AdminDisputes = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    avgResolutionDays: 0,
  });

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminDisputeAPI.getAllDisputes();

        const disputeData = response.data.content || [];

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
          resolvedAt: dispute.resolvedAt || null,
          updatedAt: dispute.updatedAt || null,
        }));

        setDisputes(transformedData);
        calculateStats(transformedData);
      } catch {
        setError(t('adminDisputes.errors.loadFailed'));
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, [t]);

  const calculateStats = disputeList => {
    const resolvedDisputes = disputeList.filter(
      d => d.status === 'RESOLVED' || d.status === 'CLOSED'
    );

    // Calculate average resolution time in days (submission → resolution)
    // Uses resolvedAt if available, otherwise falls back to updatedAt
    const resolutionTimes = resolvedDisputes
      .map(d => {
        const start = d.createdAt ? new Date(d.createdAt) : null;
        const end = d.resolvedAt
          ? new Date(d.resolvedAt)
          : d.updatedAt
            ? new Date(d.updatedAt)
            : null;

        if (!start || !end || isNaN(start) || isNaN(end)) return null;

        const diffMs = end - start;
        // Guard: never allow negative resolution time
        return diffMs >= 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
      })
      .filter(t => t !== null);

    const avgResolutionDays =
      resolutionTimes.length > 0
        ? Math.max(
            0,
            Math.round(
              (resolutionTimes.reduce((a, b) => a + b, 0) /
                resolutionTimes.length) *
                10
            ) / 10
          )
        : 0;

    const stats = {
      total: disputeList.length,
      open: disputeList.filter(d => d.status === 'OPEN').length,
      underReview: disputeList.filter(d => d.status === 'UNDER_REVIEW').length,
      resolved: disputeList.filter(d => d.status === 'RESOLVED').length,
      closed: disputeList.filter(d => d.status === 'CLOSED').length,
      avgResolutionDays,
    };
    setStats(stats);
  };

  useEffect(() => {
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
  }, [disputes, searchTerm, statusFilter]);

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
    const statusLabels = {
      OPEN: t('adminDisputes.status.open'),
      UNDER_REVIEW: t('adminDisputes.status.underReview'),
      RESOLVED: t('adminDisputes.status.resolved'),
      CLOSED: t('adminDisputes.status.closed'),
    };

    return statusLabels[status] || status.replace(/_/g, ' ');
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
        <div className="loading-spinner">{t('adminDisputes.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-disputes-container">
        <div className="error-message">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-disputes-container">
      {/* Stats Grid */}
      <div className="disputes-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2' }}>
            <FileText size={24} color="#ef4444" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminDisputes.stats.totalCases')}
            </div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <AlertTriangle size={24} color="#f59e0b" />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('adminDisputes.status.open')}</div>
            <div className="stat-value">{stats.open}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminDisputes.stats.resolvedToday')}
            </div>
            <div className="stat-value">0</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Clock size={24} color="#6366f1" />
          </div>
          <div className="stat-content">
            <div className="stat-label">
              {t('adminDisputes.stats.avgResolution')}
            </div>
            <div className="stat-value">
              {t('adminDisputes.stats.avgResolutionValue', {
                count: stats.avgResolutionDays,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cases Section */}
      <div className="disputes-section">
        <div className="disputes-section-header">
          <h2>{t('adminDisputes.allCases')}</h2>
        </div>

        {/* Tabs and Search */}
        <div className="disputes-controls">
          <div className="disputes-tabs">
            <button
              className={statusFilter === 'ALL' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setStatusFilter('ALL')}
            >
              {t('adminDisputes.allCases')}
            </button>
            <button
              className={statusFilter === 'OPEN' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setStatusFilter('OPEN')}
            >
              {t('adminDisputes.status.open')}
            </button>
            <button
              className={
                statusFilter === 'UNDER_REVIEW' ? 'tab-btn active' : 'tab-btn'
              }
              onClick={() => setStatusFilter('UNDER_REVIEW')}
            >
              {t('adminDisputes.status.underReview')}
            </button>
            <button
              className={
                statusFilter === 'RESOLVED' ? 'tab-btn active' : 'tab-btn'
              }
              onClick={() => setStatusFilter('RESOLVED')}
            >
              {t('adminDisputes.status.resolved')}
            </button>
            <button
              className={
                statusFilter === 'CLOSED' ? 'tab-btn active' : 'tab-btn'
              }
              onClick={() => setStatusFilter('CLOSED')}
            >
              {t('adminDisputes.status.closed')}
            </button>
          </div>

          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t('adminDisputes.searchPlaceholder')}
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
              <FileText size={48} color="#9ca3af" />
              <h3>{t('adminDisputes.emptyTitle')}</h3>
              <p>{t('adminDisputes.emptyDescription')}</p>
            </div>
          ) : (
            <table className="disputes-table">
              <thead>
                <tr>
                  <th>{t('adminDisputes.table.caseId')}</th>
                  <th>{t('adminDisputes.table.reporter')}</th>
                  <th>{t('adminDisputes.table.reportedUser')}</th>
                  <th>{t('adminDisputes.table.donationId')}</th>
                  <th>{t('adminDisputes.table.created')}</th>
                  <th>{t('adminDisputes.table.status')}</th>
                  <th>{t('adminDisputes.table.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.map(dispute => (
                  <tr key={dispute.id}>
                    <td
                      data-label={t('adminDisputes.table.caseId')}
                      className="case-id"
                    >
                      {dispute.caseId}
                    </td>
                    <td data-label={t('adminDisputes.table.reporter')}>
                      <div className="user-cell">
                        <div className="user-name">{dispute.reporterName}</div>
                        <div className="user-type">
                          {dispute.reporterType === 'DONOR'
                            ? t('adminDisputes.userTypes.donor')
                            : t('adminDisputes.userTypes.receiver')}
                        </div>
                      </div>
                    </td>
                    <td data-label={t('adminDisputes.table.reportedUser')}>
                      <div className="reported-user-name">
                        {dispute.reportedUserName}
                      </div>
                    </td>
                    <td data-label={t('adminDisputes.table.donationId')}>
                      {dispute.donationId ? (
                        <span className="donation-id">
                          DON-2024-{String(dispute.donationId).padStart(4, '0')}
                        </span>
                      ) : (
                        <span className="no-donation">—</span>
                      )}
                    </td>
                    <td data-label={t('adminDisputes.table.created')}>
                      <div className="date-cell">
                        <div className="date-main">
                          {formatDate(dispute.createdAt)}
                        </div>
                        <div className="date-time">
                          {formatTime(dispute.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td data-label={t('adminDisputes.table.status')}>
                      <span className={getStatusBadgeClass(dispute.status)}>
                        {formatStatus(dispute.status)}
                      </span>
                    </td>
                    <td data-label={t('adminDisputes.table.action')}>
                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(`/admin/disputes/${dispute.id}`)
                        }
                      >
                        <Eye size={16} />
                        {t('adminDisputes.table.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputes;
