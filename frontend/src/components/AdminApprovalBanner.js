import React from 'react';
import { useTranslation } from 'react-i18next';
import '../style/AdminApprovalBanner.css';

const AdminApprovalBanner = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-approval-banner">
      <div className="admin-approval-icon">⏳</div>
      <div className="admin-approval-content">
        <h3>
          {t('adminApprovalBanner.title', 'Account Pending Admin Approval')}
        </h3>
        <p>
          {t(
            'adminApprovalBanner.message',
            "Your email has been verified! Your account is currently awaiting approval from our admin team. This process typically takes up to 48 hours. You'll receive an email notification once your account is approved."
          )}
        </p>
        <p className="admin-approval-note">
          {t('adminApprovalBanner.thankYou', 'Thank you for your patience!')}
        </p>
      </div>
    </div>
  );
};

export default AdminApprovalBanner;
