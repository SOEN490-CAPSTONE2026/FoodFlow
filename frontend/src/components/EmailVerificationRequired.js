import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import '../style/EmailVerificationRequired.css';

export default function EmailVerificationRequired() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  // Auto-dismiss success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const handleResendEmail = async () => {
    setLoading(true);
    setShowSuccessModal(false);
    setError('');
    
    try {
      // Call the resend verification email endpoint
      await authAPI.resendVerificationEmail();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="email-verification-required">
      <div className="verification-overlay" />
      <div className="verification-card">
        <div className="verification-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M21 8L12 13L3 8M21 8V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V8M21 8L12 3L3 8" 
              stroke="#224d68" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <circle cx="17" cy="7" r="5" fill="#f39c12" />
            <text x="17" y="10.5" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">!</text>
          </svg>
        </div>
        
        <h1>Email Verification Required</h1>
        
        <p className="verification-message">
          Your account is almost ready! To access the FoodFlow platform, you need to verify your email address.
        </p>

        <div className="info-box">
          <h3>📧 Check Your Email</h3>
          <p>
            We've sent a verification link to your registered email address. 
            Click the link in the email to activate your account and start using FoodFlow.
          </p>
        </div>

        <div className="verification-note">
          <p><strong>Can't find the email?</strong></p>
          <ul>
            <li>Check your spam or junk folder</li>
            <li>Make sure you're checking the correct email address</li>
            <li>The verification link expires in 24 hours</li>
          </ul>
        </div>

        {error && (
          <div className="error-message">
            ✕ {error}
          </div>
        )}

        <div className="verification-actions">
          <button 
            onClick={handleResendEmail} 
            disabled={loading}
            className="resend-button"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
          
          <button 
            onClick={handleLogout} 
            className="logout-button"
          >
            Log Out
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <>
          <div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)} />
          <div className="success-modal">
            <div className="success-modal-icon">✓</div>
            <p className="success-modal-text">Verification email sent successfully!</p>
            <p className="success-modal-subtext">Please check your inbox</p>
          </div>
        </>
      )}
    </div>
  );
}
