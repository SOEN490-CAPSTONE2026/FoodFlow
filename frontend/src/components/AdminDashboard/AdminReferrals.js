import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { referralAPI } from '../../services/api';
import { UserPlus, Building2, Share2, RefreshCw, Eye, X } from 'lucide-react';
import './Admin_Styles/AdminReferrals.css';

export default function AdminReferrals() {
  const { t, i18n } = useTranslation();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedMessageReferral, setSelectedMessageReferral] = useState(null);

  const fetchReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await referralAPI.getAll();
      setReferrals(response.data || []);
    } catch (err) {
      setError(t('adminReferrals.errors.loadFailed'));
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
      return t('adminReferrals.notAvailable');
    }
    return new Date(dateStr).toLocaleDateString(i18n.language || 'en-CA', {
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
                ? t('adminReferrals.filters.all')
                : type === 'INVITE_COMMUNITY'
                  ? t('adminReferrals.filters.inviteCommunity')
                  : t('adminReferrals.filters.suggestBusiness')}
            </button>
          ))}
        </div>
        <button
          className="referral-refresh-btn"
          onClick={fetchReferrals}
          disabled={loading}
          aria-label={t('adminReferrals.refresh')}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {t('adminReferrals.refresh')}
        </button>
      </div>

      {error && (
        <div className="admin-referrals-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-referrals-loading">
          {t('adminReferrals.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-referrals-empty">
          <UserPlus size={48} />
          <p>{t('adminReferrals.empty')}</p>
        </div>
      ) : (
        <div className="admin-referrals-table-wrapper">
          <table
            className="admin-referrals-table"
            data-testid="referrals-table"
          >
            <thead>
              <tr>
                <th>{t('adminReferrals.table.type')}</th>
                <th>{t('adminReferrals.table.organization')}</th>
                <th>{t('adminReferrals.table.contactEmail')}</th>
                <th>{t('adminReferrals.table.contactPhone')}</th>
                <th>{t('adminReferrals.table.message')}</th>
                <th>{t('adminReferrals.table.submittedBy')}</th>
                <th>{t('adminReferrals.table.date')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ref => (
                <tr key={ref.id}>
                  <td data-label={t('adminReferrals.table.type')}>
                    <span
                      className={`referral-type-badge referral-type-badge--${ref.referralType === 'INVITE_COMMUNITY' ? 'community' : 'business'}`}
                    >
                      {ref.referralType === 'INVITE_COMMUNITY' ? (
                        <>
                          <Share2 size={12} />{' '}
                          {t('adminReferrals.types.community')}
                        </>
                      ) : (
                        <>
                          <Building2 size={12} />{' '}
                          {t('adminReferrals.types.business')}
                        </>
                      )}
                    </span>
                  </td>
                  <td
                    data-label={t('adminReferrals.table.organization')}
                    className="referral-name"
                  >
                    {ref.businessName}
                  </td>
                  <td data-label={t('adminReferrals.table.contactEmail')}>
                    <a
                      href={`mailto:${ref.contactEmail}`}
                      className="referral-email-link"
                    >
                      {ref.contactEmail}
                    </a>
                  </td>
                  <td data-label={t('adminReferrals.table.contactPhone')}>
                    {ref.contactPhone || t('adminReferrals.notAvailable')}
                  </td>
                  <td
                    data-label={t('adminReferrals.table.message')}
                    className="referral-message-cell"
                  >
                    {ref.message ? (
                      <button
                        type="button"
                        className="referral-action-btn"
                        onClick={() => setSelectedMessageReferral(ref)}
                        title={t('adminReferrals.viewMessage')}
                        aria-label={t('adminReferrals.viewMessageFrom', {
                          name: ref.businessName,
                        })}
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <span className="referral-message-empty">
                        {t('adminReferrals.notAvailable')}
                      </span>
                    )}
                  </td>
                  <td
                    data-label={t('adminReferrals.table.submittedBy')}
                    className="referral-submitter"
                  >
                    {ref.submittedByEmail}
                  </td>
                  <td
                    data-label={t('adminReferrals.table.date')}
                    className="referral-date"
                  >
                    {formatDate(ref.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-referrals-count">
        {t('adminReferrals.showingCount', {
          count: filtered.length,
          shown: filtered.length,
          total: referrals.length,
        })}
      </div>

      {selectedMessageReferral && (
        <div
          className="referral-message-modal-overlay"
          onClick={() => setSelectedMessageReferral(null)}
        >
          <div
            className="referral-message-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="referral-message-modal-close"
              onClick={() => setSelectedMessageReferral(null)}
              aria-label={t('adminReferrals.closeMessage')}
            >
              <X size={20} />
            </button>
            <div className="referral-message-modal-header">
              <h2>{t('adminReferrals.messageTitle')}</h2>
              <p>{selectedMessageReferral.businessName}</p>
            </div>
            <div className="referral-message-modal-body">
              <div className="referral-message-modal-meta">
                <span>{selectedMessageReferral.submittedByEmail}</span>
                <span>{formatDate(selectedMessageReferral.createdAt)}</span>
              </div>
              <div className="referral-message-modal-content">
                {selectedMessageReferral.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
