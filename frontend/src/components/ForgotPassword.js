import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Smartphone, Lock, XCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import '../style/ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null); // 'email' | 'sms'
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''));
  const inputsRef = useRef([]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [codeExpired, setCodeExpired] = useState(false);
  const timerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure a method is selected
    if (!selectedMethod) {
      setError('Please choose Email or SMS');
      return;
    }

    // Validation depending on method
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/; // simple international phone check

    if (selectedMethod === 'email') {
      if (!email) {
        setError('Please enter your email address');
        return;
      }
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
    } else if (selectedMethod === 'sms') {
      if (!phone) {
        setError('Please enter your phone number');
        return;
      }
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid phone number (e.g. +14165551234)');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (selectedMethod === 'email') {
        // Call backend API for email reset
        const response = await authAPI.forgotPassword({ email });
        console.log('Password reset email sent:', response.data);
      } else {
        // SMS flow - still simulated for now (TODO: backend SMS integration)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // mark submitted and reset expiry/timer state when we request a code
      setCodeExpired(false);
      setSecondsLeft(selectedMethod === 'sms' ? 10 : 60);
      setIsSubmitted(true);
      // focus first input after render
      setTimeout(() => inputsRef.current[0]?.focus(), 0);
    } catch (err) {
      console.error('Forgot password error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // accept only digits
    const val = value.replace(/[^0-9]/g, '').slice(0, 6);
    if (!val) {
      const copy = [...verificationCode];
      copy[index] = '';
      setVerificationCode(copy);
      return;
    }

    // If user pasted multiple digits, spread them
    if (val.length > 1) {
      const chars = val.split('');
      const copy = [...verificationCode];
      for (let i = 0; i < chars.length && index + i < 6; i++) {
        copy[index + i] = chars[i];
      }
      setVerificationCode(copy);
      const nextIndex = Math.min(5, index + val.length);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const copy = [...verificationCode];
    copy[index] = val;
    setVerificationCode(copy);
    // move focus to next
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    // Reset code inputs and timer
    setVerificationCode(Array(6).fill(''));
    setError('');
    setCodeExpired(false);
    setSecondsLeft(selectedMethod === 'sms' ? 10 : 60);
    // focus first input when resent
    setTimeout(() => inputsRef.current[0]?.focus(), 0);
    // in real flow we'd trigger resend API
  };

  // start/stop countdown when code view becomes active
  useEffect(() => {
    // clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isSubmitted && !codeExpired) {
      const initialTime = selectedMethod === 'sms' ? 10 : 60;
      setSecondsLeft(initialTime);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
              if (s <= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                setCodeExpired(true);
                return 0;
              }
          return s - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSubmitted, selectedMethod, codeExpired]);

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
                  <div className="icon-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={36} strokeWidth={1.5} />
                  </div>
                  <h1 className="forgot-password-title">Forgot Password?</h1>
                  <p className="forgot-password-subtitle">
                    No worries! Please select how you would like to receive your password reset to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <div className="method-options">
                      <button
                        type="button"
                        data-testid="option-email"
                        aria-pressed={selectedMethod === 'email'}
                        onClick={() => { setSelectedMethod('email'); setError(''); }}
                        className={`method-option ${selectedMethod === 'email' ? 'method-option--selected' : ''}`}
                      >
                        <Mail size={20} />
                        <div className="method-text">
                          <div className="method-title">Email</div>
                          <div className="method-subtitle">Receive a reset link by email</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        data-testid="option-sms"
                        aria-pressed={selectedMethod === 'sms'}
                        onClick={() => { setSelectedMethod('sms'); setError(''); }}
                        className={`method-option ${selectedMethod === 'sms' ? 'method-option--selected' : ''}`}
                      >
                        <Smartphone size={20} />
                        <div className="method-text">
                          <div className="method-title">SMS</div>
                          <div className="method-subtitle">Receive a code by text</div>
                        </div>
                      </button>
                    </div>

                    {selectedMethod && (
                      <div className="method-input-wrapper">
                        {selectedMethod === 'email' ? (
                          <>
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                              id="email"
                              type="email"
                              className="form-input"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              disabled={isLoading}
                            />
                          </>
                        ) : (
                          <>
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input
                              id="phone"
                              type="tel"
                              className="form-input"
                              placeholder="Enter your phone number"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              disabled={isLoading}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {error && <p className="form-error">{error}</p>}

                  {selectedMethod && (
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Code'}
                    </button>
                  )}
                </form>
              </div>
            ) : (
              <div className="forgot-password-card success-card">
                <div className="success-icon">
                  {codeExpired ? (
                    <XCircle size={64} strokeWidth={1.5} style={{ color: '#b91c1c' }} />
                  ) : (
                    <CheckCircle size={64} strokeWidth={1.5} style={{ color: '#16a34a' }} />
                  )}
                </div>
                {codeExpired ? (
                  <div className="code-entry" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#b91c1c' }}>Oops! You did not submit in time.</h2>
                    <p style={{ color: '#6b7280', marginTop: 8 }}>The code has expired. You can resend a new code or go back to login.</p>
                    <div style={{ marginTop: 24 }}>
                      <button className="resend-link" type="button" onClick={handleResend}>Resend code</button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link to="/login" className="back-to-login-btn">Back to Login</Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="success-title">Code Sent</h1>
                    <p className="success-message">
                      We've sent a 6-digit verification code to <strong>{selectedMethod === 'sms' ? phone : email}</strong>
                    </p>
                    <p className="success-info">
                      Enter the 6 digits you received via {selectedMethod === 'sms' ? 'text message' : 'email'}.
                    </p>

                    <div className="code-entry">
                      <div className="code-inputs">
                        {verificationCode.map((digit, idx) => (
                          <input
                            key={idx}
                            data-testid={`code-digit-${idx}`}
                            className="code-input"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(idx, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(e, idx)}
                            onPaste={(e) => {
                              const paste = e.clipboardData.getData('text');
                              e.preventDefault();
                              handleCodeChange(idx, paste);
                            }}
                            ref={(el) => (inputsRef.current[idx] = el)}
                          />
                        ))}
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>Expires in {secondsLeft}s</div>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <button className="resend-link" type="button" onClick={handleResend}>Resend code</button>
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <Link to="/login" className="back-to-login-btn">Back to Login</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 