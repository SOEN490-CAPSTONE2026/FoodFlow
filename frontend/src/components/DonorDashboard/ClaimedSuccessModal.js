import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import ReportUserModal from '../ReportUserModal';
import { reportAPI } from '../../services/api';
import './Donor_Styles/ClaimedSuccessModal.css';

const ClaimedSuccessModal = ({ isOpen, onClose, receiverInfo, donationId }) => {
  const [showReportModal, setShowReportModal] = useState(false);

  if (!isOpen) return null;

  const handleReportSubmit = async (reportData) => {
    try {
      await reportAPI.createReport(reportData);
      alert('Report submitted successfully! An admin will review it shortly.');
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  return (
    <>
      <div className="claimed-success-overlay" onClick={onClose}>
        <div className="claimed-success-modal" onClick={(e) => e.stopPropagation()}>
          <button className="claimed-success-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="claimed-success-content">
            <h2 className="claimed-success-title">Your donation has been claimed !</h2>
            <p className="claimed-success-subtitle">
              Your generosity is making a real difference.
            </p>

            <div className="claimed-success-icon">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Heart */}
                <path
                  d="M80 140C80 140 20 110 20 60C20 32 35 15 55 15C67 15 77 22 80 35C83 22 93 15 105 15C125 15 140 32 140 60C140 110 80 140 80 140Z"
                  fill="#A7F3D0"
                />
              </svg>
            </div>

            {receiverInfo && (
              <div className="claimed-success-actions">
                <button 
                  className="report-issue-btn"
                  onClick={() => setShowReportModal(true)}
                >
                  <AlertTriangle size={16} />
                  Report an Issue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {receiverInfo && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUser={receiverInfo}
          donationId={donationId}
          onSubmit={handleReportSubmit}
        />
      )}
    </>
  );
};

export default ClaimedSuccessModal;
