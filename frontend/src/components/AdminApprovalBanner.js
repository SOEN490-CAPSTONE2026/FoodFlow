import React from 'react';
import '../style/AdminApprovalBanner.css';

const AdminApprovalBanner = () => {
  return (
    <div className="admin-approval-banner">
      <div className="admin-approval-icon">⏳</div>
      <div className="admin-approval-content">
        <h3>Account Pending Admin Approval</h3>
        <p>
          Your email has been verified! Your account is currently awaiting
          approval from our admin team. This process typically takes up to 48
          hours. You'll receive an email notification once your account is
          approved.
        </p>
        <p className="admin-approval-note">Thank you for your patience!</p>
      </div>
    </div>
  );
};

export default AdminApprovalBanner;
