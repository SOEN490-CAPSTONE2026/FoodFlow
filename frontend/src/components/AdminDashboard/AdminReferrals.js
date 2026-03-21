import React, { useState, useEffect } from 'react';
import { referralAPI } from '../../services/api';
import { UserPlus, Building2, Share2, RefreshCw } from 'lucide-react';
import './Admin_Styles/AdminReferrals.css';

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await referralAPI.getAll();
      setReferrals(response.data || []);
    } catch (err) {
      setError('Failed to load referral submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const filtered =
    filter === 'ALL'
      ? referrals
      : referrals.filter(r => r.referralType === filter);

  const formatDate = dateStr => {
    if (!dateStr) {
      return '—';
    }
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-referrals-page">
      <div className="admin-referrals-toolbar">
        <div className="admin-referrals-filters">
          {['ALL', 'INVITE_COMMUNITY', 'SUGGEST_BUSINESS'].map(type => (
            <button
              key={type}
              className={`referral-filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'ALL'
                ? 'All'
                : type === 'INVITE_COMMUNITY'
                  ? 'Invite Community'
                  : 'Suggest Business'}
            </button>
          ))}
        </div>
        <button
          className="referral-refresh-btn"
          onClick={fetchReferrals}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-referrals-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-referrals-loading">
          Loading referral submissions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-referrals-empty">
          <UserPlus size={48} />
          <p>No referral submissions yet.</p>
        </div>
      ) : (
        <div className="admin-referrals-table-wrapper">
          <table
            className="admin-referrals-table"
            data-testid="referrals-table"
          >
            <thead>
              <tr>
                <th>Type</th>
                <th>Business / Organization</th>
                <th>Contact Email</th>
                <th>Contact Phone</th>
                <th>Message</th>
                <th>Submitted By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ref => (
                <tr key={ref.id}>
                  <td data-label="Type">
                    <span
                      className={`referral-type-badge referral-type-badge--${ref.referralType === 'INVITE_COMMUNITY' ? 'community' : 'business'}`}
                    >
                      {ref.referralType === 'INVITE_COMMUNITY' ? (
                        <>
                          <Share2 size={12} /> Community
                        </>
                      ) : (
                        <>
                          <Building2 size={12} /> Business
                        </>
                      )}
                    </span>
                  </td>
                  <td
                    data-label="Business / Organization"
                    className="referral-name"
                  >
                    {ref.businessName}
                  </td>
                  <td data-label="Contact Email">
                    <a
                      href={`mailto:${ref.contactEmail}`}
                      className="referral-email-link"
                    >
                      {ref.contactEmail}
                    </a>
                  </td>
                  <td>{ref.contactPhone || '—'}</td>
                  <td data-label="Message" className="referral-message">
                    {ref.message ? (
                      <span title={ref.message}>
                        {ref.message.length > 80
                          ? ref.message.slice(0, 80) + '…'
                          : ref.message}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Submitted By" className="referral-submitter">
                    {ref.submittedByEmail}
                  </td>
                  <td data-label="Date" className="referral-date">
                    {formatDate(ref.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-referrals-count">
        Showing {filtered.length} of {referrals.length} submission
        {referrals.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
