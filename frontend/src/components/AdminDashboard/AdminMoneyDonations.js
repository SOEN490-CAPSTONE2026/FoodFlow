import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronRight,
  Search,
  DollarSign,
  Receipt,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { adminPaymentAPI } from '../../services/api';
import './Admin_Styles/AdminMoneyDonations.css';

const paymentStatusOptions = [
  '',
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'REQUIRES_ACTION',
  'FAILED',
  'CANCELED',
  'REFUNDED',
];

const refundStatusOptions = [
  '',
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED',
];

const currencyOptions = ['', 'USD', 'CAD', 'EUR', 'GBP'];

function formatAmount(value, currency) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
}

const summaryCards = [
  { key: 'totalVolume', icon: DollarSign },
  { key: 'successfulTransactions', icon: ShieldCheck },
  { key: 'pendingRefundRequests', icon: RotateCcw },
  { key: 'netVolume', icon: Receipt },
];

export default function AdminMoneyDonations() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [refundDrafts, setRefundDrafts] = useState({});
  const [decisionNotes, setDecisionNotes] = useState({});
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [submittingKey, setSubmittingKey] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    refundStatus: '',
    currency: '',
    fromDate: '',
    toDate: '',
  });

  const requestFilters = useMemo(
    () => ({
      ...filters,
      page: currentPage,
      size: 12,
    }),
    [filters, currentPage]
  );

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const [transactionsResponse, summaryResponse] = await Promise.all([
        adminPaymentAPI.getTransactions(requestFilters),
        adminPaymentAPI.getSummary(filters),
      ]);
      setTransactions(transactionsResponse.data?.content || []);
      setTotalPages(transactionsResponse.data?.totalPages || 0);
      setSummary(summaryResponse.data || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          t('adminPayments.errors.loadFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [requestFilters]);

  const handleFilterChange = event => {
    const { name, value } = event.target;
    setCurrentPage(0);
    setFilters(current => ({
      ...current,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setCurrentPage(0);
    setFilters({
      search: '',
      status: '',
      refundStatus: '',
      currency: '',
      fromDate: '',
      toDate: '',
    });
  };

  const toggleRow = transactionId => {
    setExpandedRows(current => {
      const next = new Set(current);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  };

  const handleDraftChange = (paymentId, field, value) => {
    setRefundDrafts(current => ({
      ...current,
      [paymentId]: {
        amount: '',
        reason: '',
        ...(current[paymentId] || {}),
        [field]: value,
      },
    }));
  };

  const handleCreateRefundRequest = async paymentId => {
    const draft = refundDrafts[paymentId] || {};

    if (!draft.amount || Number(draft.amount) <= 0) {
      setError(t('adminPayments.errors.amountRequired'));
      return;
    }

    try {
      setSubmittingKey(`create-${paymentId}`);
      setError('');
      await adminPaymentAPI.createRefundRequest(paymentId, {
        amount: Number(draft.amount),
        reason: draft.reason || '',
      });
      setRefundDrafts(current => ({
        ...current,
        [paymentId]: { amount: '', reason: '' },
      }));
      await loadPayments();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          t('adminPayments.errors.createFailed')
      );
    } finally {
      setSubmittingKey('');
    }
  };

  const handleRefundDecision = async (refundId, action) => {
    try {
      setSubmittingKey(`${action}-${refundId}`);
      setError('');
      if (action === 'approve') {
        await adminPaymentAPI.approveRefund(
          refundId,
          decisionNotes[refundId] || ''
        );
      } else {
        await adminPaymentAPI.rejectRefund(
          refundId,
          decisionNotes[refundId] || ''
        );
      }
      await loadPayments();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          t('adminPayments.errors.decisionFailed')
      );
    } finally {
      setSubmittingKey('');
    }
  };

  if (loading) {
    return (
      <div className="admin-money-container">
        <div className="loading-spinner">{t('adminPayments.loading')}</div>
      </div>
    );
  }

  return (
    <div className="admin-money-container">
      {summary && (
        <div className="money-stats-grid">
          {summaryCards.map(card => {
            const Icon = card.icon;
            const isCurrency =
              card.key === 'totalVolume' || card.key === 'netVolume';
            const value = summary[card.key];
            return (
              <div key={card.key} className="stat-card">
                <div className="stat-icon" style={{ background: '#eef6fb' }}>
                  <Icon size={24} color="#1b4965" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">
                    {t(`adminPayments.kpis.${card.key}`)}
                  </div>
                  <div className="stat-value">
                    {isCurrency
                      ? formatAmount(value, filters.currency || 'USD')
                      : value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="money-section">
        <div className="money-header">
          <div className="money-section-header">
            <h2>{t('adminPayments.title')}</h2>
            <div className="pagination-info">
              {t('adminPayments.pagination', {
                current: currentPage + 1,
                total: Math.max(totalPages, 1),
              })}
            </div>
          </div>

          <div className="money-search-row">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                className="search-input"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={t('adminPayments.filters.searchPlaceholder')}
              />
            </div>

            <div className="money-filters">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">{t('adminPayments.filters.all')}</option>
                {paymentStatusOptions.filter(Boolean).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                name="refundStatus"
                value={filters.refundStatus}
                onChange={handleFilterChange}
              >
                <option value="">{t('adminPayments.filters.all')}</option>
                {refundStatusOptions.filter(Boolean).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                name="currency"
                value={filters.currency}
                onChange={handleFilterChange}
              >
                <option value="">
                  {t('adminPayments.filters.allCurrencies')}
                </option>
                {currencyOptions.filter(Boolean).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
              />
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
              />

              <button
                type="button"
                className="filter-reset-btn"
                onClick={handleResetFilters}
              >
                {t('adminPayments.actions.reset')}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {transactions.length === 0 ? (
          <div className="empty-state">{t('adminPayments.empty')}</div>
        ) : (
          <div className="money-table-container">
            <table className="money-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t('adminPayments.columns.transaction')}</th>
                  <th>{t('adminPayments.columns.organization')}</th>
                  <th>{t('adminPayments.columns.gross')}</th>
                  <th>{t('adminPayments.columns.refunded')}</th>
                  <th>{t('adminPayments.columns.net')}</th>
                  <th>{t('adminPayments.columns.invoice')}</th>
                  <th>{t('adminPayments.columns.paymentStatus')}</th>
                  <th>{t('adminPayments.columns.createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => {
                  const isExpanded = expandedRows.has(transaction.id);
                  const draft = refundDrafts[transaction.id] || {};
                  return (
                    <React.Fragment key={transaction.id}>
                      <tr
                        className={isExpanded ? 'expanded' : ''}
                        onClick={() => toggleRow(transaction.id)}
                      >
                        <td className="expand-cell">
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </td>
                        <td>#{transaction.id}</td>
                        <td>{transaction.organizationName}</td>
                        <td>
                          {formatAmount(
                            transaction.amount,
                            transaction.currency
                          )}
                        </td>
                        <td>
                          {formatAmount(
                            transaction.refundedAmount,
                            transaction.currency
                          )}
                        </td>
                        <td>
                          {formatAmount(
                            transaction.netAmount,
                            transaction.currency
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="invoice-link-btn"
                            onClick={event => {
                              event.stopPropagation();
                              setActiveInvoiceId(
                                activeInvoiceId === transaction.id
                                  ? null
                                  : transaction.id
                              );
                              if (!isExpanded) {
                                toggleRow(transaction.id);
                              }
                            }}
                          >
                            {transaction.invoiceNumber ||
                              t('adminPayments.invoiceMissing')}
                          </button>
                        </td>
                        <td>{transaction.status}</td>
                        <td>{formatDateTime(transaction.createdAt)}</td>
                      </tr>

                      {isExpanded && (
                        <tr className="money-row-details">
                          <td colSpan="9">
                            <div className="money-detail-grid">
                              <div className="detail-card">
                                <h4>
                                  {t('adminPayments.details.transaction')}
                                </h4>
                                <p>
                                  Stripe:{' '}
                                  {transaction.stripePaymentIntentId || 'N/A'}
                                </p>
                                <p>
                                  {t('adminPayments.columns.currency')}:{' '}
                                  {transaction.currency}
                                </p>
                                <p>
                                  {t('adminPayments.columns.paymentStatus')}:{' '}
                                  {transaction.status}
                                </p>
                                <p>
                                  {transaction.description ||
                                    t('adminPayments.noDescription')}
                                </p>
                              </div>

                              <div className="detail-card">
                                <h4>{t('adminPayments.columns.invoice')}</h4>
                                {transaction.invoiceNumber ? (
                                  <>
                                    <p>{transaction.invoiceNumber}</p>
                                    <p>
                                      {t('adminPayments.columns.invoiceStatus')}
                                      : {transaction.invoiceStatus || 'N/A'}
                                    </p>
                                    {activeInvoiceId === transaction.id && (
                                      <div className="invoice-preview">
                                        <p>
                                          {t('adminPayments.columns.gross')}:{' '}
                                          {formatAmount(
                                            transaction.amount,
                                            transaction.currency
                                          )}
                                        </p>
                                        <p>
                                          {t('adminPayments.columns.refunded')}:{' '}
                                          {formatAmount(
                                            transaction.refundedAmount,
                                            transaction.currency
                                          )}
                                        </p>
                                        <p>
                                          {t('adminPayments.columns.net')}:{' '}
                                          {formatAmount(
                                            transaction.invoiceTotalAmount ||
                                              transaction.netAmount,
                                            transaction.currency
                                          )}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p>{t('adminPayments.invoiceMissing')}</p>
                                )}
                              </div>

                              <div className="detail-card">
                                <h4>
                                  {t('adminPayments.refunds.createTitle')}
                                </h4>
                                <label className="detail-field">
                                  <span>
                                    {t('adminPayments.refunds.amount')}
                                  </span>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={draft.amount || ''}
                                    onChange={event =>
                                      handleDraftChange(
                                        transaction.id,
                                        'amount',
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                                <label className="detail-field">
                                  <span>
                                    {t('adminPayments.refunds.reason')}
                                  </span>
                                  <textarea
                                    rows="3"
                                    value={draft.reason || ''}
                                    onChange={event =>
                                      handleDraftChange(
                                        transaction.id,
                                        'reason',
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="primary-action-btn"
                                  disabled={
                                    submittingKey === `create-${transaction.id}`
                                  }
                                  onClick={() =>
                                    handleCreateRefundRequest(transaction.id)
                                  }
                                >
                                  {submittingKey === `create-${transaction.id}`
                                    ? t('adminPayments.actions.saving')
                                    : t(
                                        'adminPayments.actions.createRefundRequest'
                                      )}
                                </button>
                              </div>
                            </div>

                            <div className="refund-history-block">
                              <h4>{t('adminPayments.refunds.title')}</h4>
                              {!transaction.refunds?.length ? (
                                <div className="empty-state nested">
                                  {t('adminPayments.refunds.empty')}
                                </div>
                              ) : (
                                <div className="refund-list">
                                  {transaction.refunds.map(refund => (
                                    <div
                                      key={refund.id}
                                      className="refund-item"
                                    >
                                      <div className="refund-item__summary">
                                        <div>
                                          <strong>
                                            {formatAmount(
                                              refund.amount,
                                              transaction.currency
                                            )}
                                          </strong>
                                          <p>
                                            {refund.status} ·{' '}
                                            {refund.reason ||
                                              t(
                                                'adminPayments.refunds.noReason'
                                              )}
                                          </p>
                                          <p>
                                            {t(
                                              'adminPayments.refunds.requestedBy'
                                            )}
                                            : {refund.requestedByName || 'N/A'}
                                          </p>
                                        </div>
                                        <span>
                                          {formatDateTime(refund.createdAt)}
                                        </span>
                                      </div>

                                      {refund.status === 'PENDING' && (
                                        <div className="refund-decision-row">
                                          <textarea
                                            rows="2"
                                            value={
                                              decisionNotes[refund.id] || ''
                                            }
                                            onChange={event =>
                                              setDecisionNotes(current => ({
                                                ...current,
                                                [refund.id]: event.target.value,
                                              }))
                                            }
                                            placeholder={t(
                                              'adminPayments.refunds.notesPlaceholder'
                                            )}
                                          />
                                          <div className="refund-buttons">
                                            <button
                                              type="button"
                                              className="approve-btn"
                                              disabled={
                                                submittingKey ===
                                                `approve-${refund.id}`
                                              }
                                              onClick={() =>
                                                handleRefundDecision(
                                                  refund.id,
                                                  'approve'
                                                )
                                              }
                                            >
                                              {t(
                                                'adminPayments.actions.approveRefund'
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              className="reject-btn"
                                              disabled={
                                                submittingKey ===
                                                `reject-${refund.id}`
                                              }
                                              onClick={() =>
                                                handleRefundDecision(
                                                  refund.id,
                                                  'reject'
                                                )
                                              }
                                            >
                                              {t(
                                                'adminPayments.actions.rejectRefund'
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="money-pagination">
          <button
            type="button"
            className="filter-reset-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(page => Math.max(0, page - 1))}
          >
            {t('adminPayments.actions.previous')}
          </button>
          <button
            type="button"
            className="filter-reset-btn"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => setCurrentPage(page => page + 1)}
          >
            {t('adminPayments.actions.next')}
          </button>
        </div>
      </section>
    </div>
  );
}
