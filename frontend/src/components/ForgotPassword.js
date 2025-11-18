import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import '../style/ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await authAPI.forgotPassword({ email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {/* Left Side - Image */}
      <div className="forgot-password-left">
        <div className="background-spots">
          <div className="background-spot s1"></div>
          <div className="background-spot s2"></div>
          <div className="background-spot s3"></div>
        </div>
        <img src="https://i.ibb.co/HLxDnk57/Untitled-design-6.png" alt="Donation example" className="main" />
        <Link to="/">
          <img src="https://i.ibb.co/jkF1r5xL/logo-white.png" alt="FoodFlow logo" className="forgot-password-logo" />
        </Link>
      </div>

      {/* Right Side - Form */}
      <div className="forgot-password-right">
        <div className="forgot-password-container">
          <div className="forgot-password-inner">
            {!isSubmitted ? (
              <div className="forgot-password-card">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={18} />
                  Back to Login
                </Link>

                <div className="forgot-password-header">
                  <div className="icon-wrapper">
                    <Mail size={32} strokeWidth={1.5} />
                  </div>
                  <h1 className="forgot-password-title">Forgot Password?</h1>
                  <p className="forgot-password-subtitle">
                    No worries! Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && <p className="form-error">{error}</p>}

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="forgot-password-card success-card">
                <div className="success-icon">
                  <CheckCircle size={64} strokeWidth={1.5} />
                </div>
                <h1 className="success-title">Check Your Email</h1>
                <p className="success-message">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="success-info">
                  Please check your inbox and click on the link to reset your password. 
                  The link will expire in 1 hour.
                </p>
                <p className="success-note">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button 
                    className="resend-link"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                  >
                    try again
                  </button>
                </p>
                <Link to="/login" className="back-to-login-btn">
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
