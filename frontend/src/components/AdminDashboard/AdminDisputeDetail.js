import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { adminDisputeAPI } from '../../services/api';
import './Admin_Styles/AdminDisputeDetail.css';

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchDisputeDetails();
  }, [id]);

  const fetchDisputeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminDisputeAPI.getDisputeById(id);
      const data = response.data;

      if (data) {
        // Map backend field names to frontend expected names
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
          // Format date and time from createdAt
          createdDate: data.createdAt
            ? new Date(data.createdAt).toLocaleDateString('en-CA')
            : 'N/A',
          createdTime: data.createdAt
            ? new Date(data.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : 'N/A',
        };

        setDispute(mappedData);
        setSelectedStatus(data.status);
      }
    } catch (err) {
      console.error('Error fetching dispute details:', err);
      setError(err.response?.data?.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/admin/disputes');
  };

  const handleStatusChange = async () => {
    if (selectedStatus === dispute.status) {
      alert('Status is already set to ' + selectedStatus);
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to change the status to "${selectedStatus}"?`
      )
    ) {
      try {
        await adminDisputeAPI.updateDisputeStatus(id, selectedStatus, '');
        alert('Status updated successfully');
        fetchDisputeDetails(); // Refresh the data
      } catch (err) {
        console.error('Error updating status:', err);
        alert(
          'Failed to update status: ' +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  const handleDeactivateUser = () => {
    if (
      window.confirm('Are you sure you want to deactivate this user account?')
    ) {
      alert('User account deactivation requested');
    }
  };

  const handleOverrideDonation = () => {
    alert('Override donation status');
  };

  const handleFlagUser = () => {
    alert('User flagged for review');
  };

  const handleCloseCase = () => {
    if (selectedStatus !== 'Resolved' && selectedStatus !== 'RESOLVED') {
      alert('Case must be marked as Resolved before closing');
      return;
    }

    if (window.confirm('Are you sure you want to close this case?')) {
      handleStatusChange();
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="detail-error">
        <p>{error}</p>
        <button onClick={handleClose} className="back-btn">
          Back to Disputes
        </button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="detail-error">
        <p>Case not found</p>
        <button onClick={handleClose} className="back-btn">
          Back to Disputes
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
            <h1>Case {dispute.caseId}</h1>
            <span
              className={`status-pill status-${dispute.status.toLowerCase()}`}
            >
              {dispute.status}
            </span>
          </div>
          <div className="header-title-row">
            <span className="created-text">
              Created on {dispute.createdDate} at {dispute.createdTime}
            </span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-columns">
            {/* Left Column */}
            <div className="left-column">
              {/* Case Information */}
              <div className="info-section">
                <h3 className="section-title">CASE INFORMATION</h3>
                <div className="info-row">
                  <span className="info-label">Case ID</span>
                  <span className="info-value">{dispute.caseId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created Date</span>
                  <span className="info-value">{dispute.createdDate}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created Time</span>
                  <span className="info-value">{dispute.createdTime}</span>
                </div>
              </div>

              {/* Reporter */}
              <div className="info-section">
                <h3 className="section-title">REPORTER</h3>
                <div className="info-row">
                  <span className="info-label">Name</span>
                  <span className="info-value-right">
                    {dispute.reporterName}
                    <span className="user-tag">{dispute.reporterType}</span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">User ID</span>
                  <span className="info-value">{dispute.reporterId}</span>
                </div>
              </div>

              {/* Reported User */}
              <div className="info-section">
                <h3 className="section-title">REPORTED USER</h3>
                <div className="info-row">
                  <span className="info-label">Name</span>
                  <span className="info-value">{dispute.reportedUserName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">User ID</span>
                  <span className="info-value">{dispute.reportedUserId}</span>
                </div>
              </div>

              {/* Related Donation */}
              <div className="info-section">
                <h3 className="section-title">RELATED DONATION</h3>
                <div className="info-row">
                  <span className="info-label">Donation ID</span>
                  <a href="#" className="donation-link">
                    DON-2024-{dispute.donationId}
                  </a>
                </div>
              </div>

              {/* Report Description */}
              <div className="info-section">
                <h3 className="section-title">REPORT DESCRIPTION</h3>
                <div className="description-text">{dispute.description}</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Case Status */}
              <div className="status-section">
                <h3 className="section-title">CASE STATUS</h3>
                <div className="info-row">
                  <span className="info-label">Current Status</span>
                  <span
                    className={`status-pill status-${dispute.status.toLowerCase()}`}
                  >
                    {dispute.status}
                  </span>
                </div>
                <div className="status-dropdown-row">
                  <span className="info-label">Update Status</span>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="OPEN">Open</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <button
                  className="action-btn"
                  onClick={handleStatusChange}
                  disabled={selectedStatus === dispute.status}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  Save Status Change
                </button>
                <p className="status-hint">
                  Status changes require confirmation
                </p>
              </div>

              {/* Administrative Actions */}
              <div className="actions-section">
                <h3 className="section-title">ADMINISTRATIVE ACTIONS</h3>
                <button className="action-btn" onClick={handleDeactivateUser}>
                  Deactivate User Account
                </button>
                <button className="action-btn" onClick={handleOverrideDonation}>
                  Override Donation Status
                </button>
                <button className="action-btn" onClick={handleFlagUser}>
                  Flag User for Review
                </button>
                <p className="actions-hint">
                  All actions are admin-only and not visible to platform users.
                </p>
              </div>

              {/* Case Resolution */}
              <div className="resolution-section">
                <h3 className="section-title">CASE RESOLUTION</h3>
                <button className="close-case-btn" onClick={handleCloseCase}>
                  Close Case
                </button>
                <p className="resolution-hint">
                  Case must be marked as Resolved before closing
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
