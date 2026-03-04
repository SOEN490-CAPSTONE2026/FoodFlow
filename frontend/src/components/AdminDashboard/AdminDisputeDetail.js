import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { adminDisputeAPI } from '../../services/api';
import './Admin_Styles/AdminDisputeDetail.css';

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchDisputeDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminDisputeAPI.getDisputeById(id);
        const data = response.data;

        if (data) {
          const mappedData = {
            ...data,
            caseId: `DR-${data.id}`,
            reportedUserId: data.reportedId,
            reportedUserName: data.reportedName,
            reporterId: data.reporterId,
            reporterName: data.reporterName,
            donationId: data.donationId,
            description: data.description,
            status: data.status,
            createdDate: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString('en-CA')
              : t('adminDisputeDetail.notAvailable'),
            createdTime: data.createdAt
              ? new Date(data.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : t('adminDisputeDetail.notAvailable'),
          };

          setDispute(mappedData);
          setSelectedStatus(data.status);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            t('adminDisputeDetail.errors.loadFailed')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDisputeDetails();
  }, [id, t]);

  const handleClose = () => {
    navigate('/admin/disputes');
  };

  const handleStatusChange = async () => {
    if (selectedStatus === dispute.status) {
      alert(
        t('adminDisputeDetail.alerts.statusAlreadySet', {
          status: selectedStatus,
        })
      );
      return;
    }

    if (
      window.confirm(
        t('adminDisputeDetail.confirm.changeStatus', {
          status: selectedStatus,
        })
      )
    ) {
      try {
        await adminDisputeAPI.updateDisputeStatus(id, selectedStatus, '');
        alert(t('adminDisputeDetail.alerts.statusUpdated'));
        navigate(0);
      } catch (err) {
        alert(
          t('adminDisputeDetail.alerts.updateFailed', {
            message: err.response?.data?.message || err.message,
          })
        );
      }
    }
  };

  const handleDeactivateUser = () => {
    if (window.confirm(t('adminDisputeDetail.confirm.deactivateUser'))) {
      alert(t('adminDisputeDetail.alerts.deactivateRequested'));
    }
  };

  const handleOverrideDonation = () => {
    alert(t('adminDisputeDetail.alerts.overrideDonation'));
  };

  const handleFlagUser = () => {
    alert(t('adminDisputeDetail.alerts.userFlagged'));
  };

  const handleCloseCase = () => {
    if (selectedStatus !== 'Resolved' && selectedStatus !== 'RESOLVED') {
      alert(t('adminDisputeDetail.alerts.mustResolveBeforeClose'));
      return;
    }

    if (window.confirm(t('adminDisputeDetail.confirm.closeCase'))) {
      handleStatusChange();
    }
  };

  if (loading) {
    return <div className="detail-loading">{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="detail-error">
        <p>{error}</p>
        <button onClick={handleClose} className="back-btn">
          {t('adminDisputeDetail.backToDisputes')}
        </button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="detail-error">
        <p>{t('adminDisputeDetail.caseNotFound')}</p>
        <button onClick={handleClose} className="back-btn">
          {t('adminDisputeDetail.backToDisputes')}
        </button>
      </div>
    );
  }

  return (
    <div className="dispute-detail-modal-overlay">
      <div className="dispute-detail-modal">
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="case-title-row">
            <h1>
              {t('adminDisputeDetail.caseTitle', { caseId: dispute.caseId })}
            </h1>
            <span
              className={`status-pill status-${dispute.status.toLowerCase()}`}
            >
              {dispute.status}
            </span>
          </div>
          <div className="header-title-row">
            <span className="created-text">
              {t('adminDisputeDetail.createdOn', {
                date: dispute.createdDate,
                time: dispute.createdTime,
              })}
            </span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-columns">
            {/* Left Column */}
            <div className="left-column">
              {/* Case Information */}
              <div className="info-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.caseInformation')}
                </h3>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.caseId')}
                  </span>
                  <span className="info-value">{dispute.caseId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.createdDate')}
                  </span>
                  <span className="info-value">{dispute.createdDate}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.createdTime')}
                  </span>
                  <span className="info-value">{dispute.createdTime}</span>
                </div>
              </div>

              {/* Reporter */}
              <div className="info-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.reporter')}
                </h3>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.name')}
                  </span>
                  <span className="info-value-right">
                    {dispute.reporterName}
                    <span className="user-tag">{dispute.reporterType}</span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.userId')}
                  </span>
                  <span className="info-value">{dispute.reporterId}</span>
                </div>
              </div>

              {/* Reported User */}
              <div className="info-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.reportedUser')}
                </h3>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.name')}
                  </span>
                  <span className="info-value">{dispute.reportedUserName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.userId')}
                  </span>
                  <span className="info-value">{dispute.reportedUserId}</span>
                </div>
              </div>

              {/* Related Donation */}
              <div className="info-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.relatedDonation')}
                </h3>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.donationId')}
                  </span>
                  <button type="button" className="donation-link">
                    DON-2024-{dispute.donationId}
                  </button>
                </div>
              </div>

              {/* Report Description */}
              <div className="info-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.reportDescription')}
                </h3>
                <div className="description-text">{dispute.description}</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Case Status */}
              <div className="status-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.caseStatus')}
                </h3>
                <div className="info-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.currentStatus')}
                  </span>
                  <span
                    className={`status-pill status-${dispute.status.toLowerCase()}`}
                  >
                    {dispute.status}
                  </span>
                </div>
                <div className="status-dropdown-row">
                  <span className="info-label">
                    {t('adminDisputeDetail.labels.updateStatus')}
                  </span>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="OPEN">
                      {t('adminDisputes.status.open')}
                    </option>
                    <option value="UNDER_REVIEW">
                      {t('adminDisputes.status.underReview')}
                    </option>
                    <option value="RESOLVED">
                      {t('adminDisputes.status.resolved')}
                    </option>
                    <option value="CLOSED">
                      {t('adminDisputes.status.closed')}
                    </option>
                  </select>
                </div>
                <button
                  className="action-btn"
                  onClick={handleStatusChange}
                  disabled={selectedStatus === dispute.status}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  {t('adminDisputeDetail.saveStatusChange')}
                </button>
                <p className="status-hint">
                  {t('adminDisputeDetail.statusHint')}
                </p>
              </div>

              {/* Administrative Actions */}
              <div className="actions-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.adminActions')}
                </h3>
                <button className="action-btn" onClick={handleDeactivateUser}>
                  {t('adminDisputeDetail.actions.deactivateUser')}
                </button>
                <button className="action-btn" onClick={handleOverrideDonation}>
                  {t('adminDisputeDetail.actions.overrideDonation')}
                </button>
                <button className="action-btn" onClick={handleFlagUser}>
                  {t('adminDisputeDetail.actions.flagUser')}
                </button>
                <p className="actions-hint">
                  {t('adminDisputeDetail.actionsHint')}
                </p>
              </div>

              {/* Case Resolution */}
              <div className="resolution-section">
                <h3 className="section-title">
                  {t('adminDisputeDetail.sections.caseResolution')}
                </h3>
                <button className="close-case-btn" onClick={handleCloseCase}>
                  {t('adminDisputeDetail.actions.closeCase')}
                </button>
                <p className="resolution-hint">
                  {t('adminDisputeDetail.resolutionHint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeDetail;
