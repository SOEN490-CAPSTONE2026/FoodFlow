import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import '../style/EmailVerification.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const hasVerifiedRef = useRef(false); // Use ref to prevent double verification

  useEffect(() => {
    // Prevent running verification multiple times
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage(
          'No verification token found. Please check your email link.'
        );
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');

        // If user is logged in, log them out so they can log in fresh with verified status
        logout();

        // Don't auto-redirect - let user click the button
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'Verification failed. The link may be invalid or expired.'
        );
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="email-verification-container">
      <div className="email-verification-card">
        {status === 'verifying' && (
          <>
            <div className="verification-spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <div className="verification-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  navigate('/login', {
                    state: {
                      message:
                        'Email verified successfully! Please log in to continue.',
                    },
                  })
                }
              >
                Go to Login
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon error-icon">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="verification-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/register')}
              >
                Register New Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
