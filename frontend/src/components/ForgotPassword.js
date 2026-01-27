import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  Smartphone,
  Lock,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authAPI } from '../services/api';
import { auth } from '../services/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import PhoneInput from './PhoneInput';
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
  const [codeIncorrect, setCodeIncorrect] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const timerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  // Check password matching in real-time
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Ensure a method is selected
    if (!selectedMethod) {
      setError('Please choose Email or SMS');
      return;
    }

    // Validation depending on method
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      // Enforce E.164 format: must start with + and have country code
      if (!phone.startsWith('+')) {
        setError('Please select a country code from the dropdown');
        return;
      }
      // Validate E.164 format: +[1-3 digits country code][4-15 digits phone number]
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phone)) {
        setError('Please enter a valid phone number with country code');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (selectedMethod === 'email') {
        // Call backend API for email reset
        const response = await authAPI.forgotPassword({
          email,
          method: 'email',
        });
        console.log('Password reset email sent:', response.data);
      } else {
        // SMS flow - verify phone exists in backend BEFORE sending OTP
        // Assume phone is already in E.164 format with country code (e.g., +15145551234)
        await authAPI.forgotPassword({
          phone: phone.trim(),
          method: 'sms',
        });
        console.log('Phone number verified in database');

        // Initialize reCAPTCHA if not already done
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
              size: 'invisible',
              callback: () => {
                console.log('reCAPTCHA solved');
              },
            }
          );
        }

        // Send SMS via Firebase
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          phone.trim(),
          recaptchaVerifierRef.current
        );
        confirmationResultRef.current = confirmationResult;
        console.log('Firebase SMS sent to:', phone.trim());
      }

      // mark submitted and reset expiry/timer state when we request a code
      setCodeExpired(false);
      setSecondsLeft(selectedMethod === 'sms' ? 30 : 60);
      setIsSubmitted(true);
      // focus first input after render
      setTimeout(() => inputsRef.current[0]?.focus(), 0);
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError(
          'Invalid phone number format. Please use format: +14165551234'
        );
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to send verification code. Please try again.'
        );
      }
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

  const handleResend = async () => {
    // Reset code inputs and timer
    setVerificationCode(Array(6).fill(''));
    setError('');
    setCodeExpired(false);
    setCodeIncorrect(false);
    setSecondsLeft(selectedMethod === 'sms' ? 30 : 60);
    setIsSubmitted(false);

    // Re-submit to resend the verification code
    setTimeout(async () => {
      await handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    const code = verificationCode.join('');
    if (code.length === 6 && isSubmitted && !codeExpired) {
      handleVerifyCode(code);
    }
  }, [verificationCode, isSubmitted, codeExpired]);

  const handleVerifyCode = async code => {
    if (selectedMethod === 'sms' && confirmationResultRef.current) {
      try {
        setIsLoading(true);
        const result = await confirmationResultRef.current.confirm(code);
        console.log('Phone verified successfully:', result.user.phoneNumber);
        setCodeVerified(true);
        setCodeIncorrect(false);
        setCodeExpired(false); // Reset expired state when code is verified
        // Stop the timer when code is verified
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (err) {
        console.error('Code verification error:', err);
        setCodeIncorrect(true);
        setVerificationCode(Array(6).fill(''));
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } finally {
        setIsLoading(false);
      }
    } else if (selectedMethod === 'email') {
      try {
        setIsLoading(true);
        await authAPI.verifyResetCode({ email, code });
        console.log('Email code verified successfully');
        setCodeVerified(true);
        setCodeIncorrect(false);
        setCodeExpired(false); // Reset expired state when code is verified
        // Stop the timer when code is verified
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (err) {
        console.error('Code verification error:', err);
        setCodeIncorrect(true);
        setVerificationCode(Array(6).fill(''));
        setTimeout(() => inputsRef.current[0]?.focus(), 100);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // start/stop countdown when code view becomes active
  useEffect(() => {
    // clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't start timer if code is already verified
    if (isSubmitted && !codeExpired && !codeVerified) {
      const initialTime = selectedMethod === 'sms' ? 30 : 60;
      setSecondsLeft(initialTime);
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
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
  }, [isSubmitted, selectedMethod, codeExpired, codeVerified]);

  return (
    <div className="forgot-password-page">
      {/* Left Side - Image */}
      <div className="forgot-password-left">
        <div className="background-spots">
          <div className="background-spot s1"></div>
          <div className="background-spot s2"></div>
          <div className="background-spot s3"></div>
        </div>
        <img
          src="https://i.ibb.co/HLxDnk57/Untitled-design-6.png"
          alt="Donation example"
          className="main"
        />
        <Link to="/">
          <img
            src="https://i.ibb.co/jkF1r5xL/logo-white.png"
            alt="FoodFlow logo"
            className="forgot-password-logo"
          />
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
                  <div
                    className="icon-wrapper"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Lock size={36} strokeWidth={1.5} />
                  </div>
                  <h1 className="forgot-password-title">Forgot Password?</h1>
                  <p className="forgot-password-subtitle">
                    No worries! Please select how you would like to receive your
                    OTP. After entering the code, you will be eligible for a
                    password reset.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <div className="method-options">
                      <button
                        type="button"
                        data-testid="option-email"
                        aria-pressed={selectedMethod === 'email'}
                        onClick={() => {
                          setSelectedMethod('email');
                          setError('');
                        }}
                        className={`method-option ${selectedMethod === 'email' ? 'method-option--selected' : ''}`}
                      >
                        <Mail size={20} />
                        <div className="method-text">
                          <div className="method-title">Email</div>
                          <div className="method-subtitle">
                            Receive a reset link by email
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        data-testid="option-sms"
                        aria-pressed={selectedMethod === 'sms'}
                        onClick={() => {
                          setSelectedMethod('sms');
                          setError('');
                        }}
                        className={`method-option ${selectedMethod === 'sms' ? 'method-option--selected' : ''}`}
                      >
                        <Smartphone size={20} />
                        <div className="method-text">
                          <div className="method-title">SMS</div>
                          <div className="method-subtitle">
                            Receive a code by text
                          </div>
                        </div>
                      </button>
                    </div>

                    {selectedMethod && (
                      <div className="method-input-wrapper">
                        {selectedMethod === 'email' ? (
                          <>
                            <label htmlFor="email" className="form-label">
                              Email Address
                            </label>
                            <input
                              id="email"
                              type="email"
                              className="form-input"
                              placeholder="Enter your email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              disabled={isLoading}
                            />
                          </>
                        ) : (
                          <>
                            <label htmlFor="phone" className="form-label">
                              Phone Number
                            </label>
                            <PhoneInput
                              value={phone}
                              onChange={setPhone}
                              disabled={isLoading}
                              placeholder="Phone number"
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
                  {codeExpired || codeIncorrect ? (
                    <XCircle
                      size={64}
                      strokeWidth={1.5}
                      style={{ color: '#b91c1c' }}
                    />
                  ) : resetSuccess ? (
                    <div style={{ fontSize: 64 }}>🎉</div>
                  ) : codeVerified ? (
                    <CheckCircle
                      size={64}
                      strokeWidth={1.5}
                      style={{ color: '#16a34a' }}
                    />
                  ) : (
                    <CheckCircle
                      size={64}
                      strokeWidth={1.5}
                      style={{ color: '#16a34a' }}
                    />
                  )}
                </div>
                {resetSuccess ? (
                  <div className="code-entry" style={{ textAlign: 'center' }}>
                    <h1
                      className="success-title"
                      style={{ color: '#16a34a', marginTop: 16 }}
                    >
                      Password Reset!
                    </h1>
                    <p
                      className="success-message"
                      style={{ marginTop: 12, fontSize: 16 }}
                    >
                      Your password has been successfully reset.
                    </p>
                    <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>
                      You will be redirected to the login page now...
                    </p>
                  </div>
                ) : codeExpired ? (
                  <div className="code-entry" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#b91c1c' }}>
                      Oops! You did not submit in time.
                    </h2>
                    <p style={{ color: '#6b7280', marginTop: 8 }}>
                      The code has expired. You can resend a new code or go back
                      to login.
                    </p>
                    <div style={{ marginTop: 24 }}>
                      <button
                        className="resend-link"
                        type="button"
                        onClick={handleResend}
                      >
                        Resend code
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link to="/login" className="back-to-login-btn">
                        Back to Login
                      </Link>
                    </div>
                  </div>
                ) : codeIncorrect ? (
                  <div className="code-entry" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#b91c1c' }}>
                      Oops! The code you submitted is incorrect.
                    </h2>
                    <p style={{ color: '#6b7280', marginTop: 8 }}>
                      Please check the code and try again, or request a new one.
                    </p>
                    <div
                      style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}
                    >
                      Time remaining: {secondsLeft}s
                    </div>
                    <div style={{ marginTop: 24 }}>
                      <button
                        className="resend-link"
                        type="button"
                        onClick={() => {
                          setCodeIncorrect(false);
                          setTimeout(() => inputsRef.current[0]?.focus(), 100);
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="resend-link"
                        type="button"
                        onClick={handleResend}
                      >
                        Resend code
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link to="/login" className="back-to-login-btn">
                        Back to Login
                      </Link>
                    </div>
                  </div>
                ) : codeVerified ? (
                  <div className="code-entry" style={{ textAlign: 'center' }}>
                    <h1 className="success-title" style={{ color: '#16a34a' }}>
                      Success!
                    </h1>
                    <p className="success-message" style={{ marginTop: 8 }}>
                      Your identity has been verified. Please enter your new
                      password below.
                    </p>

                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setError('');
                        setPasswordError('');

                        if (!newPassword || !confirmPassword) {
                          setPasswordError('Please enter both password fields');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPasswordError('Passwords do not match');
                          return;
                        }
                        if (newPassword.length < 8) {
                          setPasswordError(
                            'Password must be at least 8 characters'
                          );
                          return;
                        }

                        setIsLoading(true);
                        try {
                          // Call backend to reset password
                          const resetData =
                            selectedMethod === 'sms'
                              ? {
                                  phone: phone,
                                  code: verificationCode.join(''),
                                  newPassword: newPassword,
                                }
                              : {
                                  email: email,
                                  code: verificationCode.join(''),
                                  newPassword: newPassword,
                                };

                          await authAPI.resetPassword(resetData);

                          setResetSuccess(true);
                          // Redirect after 3 seconds
                          setTimeout(() => {
                            window.location.href = '/login';
                          }, 3000);
                        } catch (err) {
                          setPasswordError(
                            err.response?.data?.message ||
                              'Failed to reset password. Please try again.'
                          );
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      style={{ marginTop: 24, width: '100%' }}
                    >
                      <div style={{ marginBottom: 16, position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="New Password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="input-field"
                          style={{
                            width: '100%',
                            padding: 12,
                            paddingRight: 45,
                            fontSize: 16,
                            borderRadius: 5,
                            border: '1px solid #d1d5db',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                          }}
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                      <div style={{ marginBottom: 16, position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="input-field"
                          style={{
                            width: '100%',
                            padding: 12,
                            paddingRight: 45,
                            fontSize: 16,
                            borderRadius: 5,
                            border: '1px solid #d1d5db',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                          }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <p
                          style={{
                            color: '#b91c1c',
                            fontSize: 14,
                            marginBottom: 12,
                            textAlign: 'left',
                          }}
                        >
                          {passwordError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={
                          isLoading ||
                          !!passwordError ||
                          !newPassword ||
                          !confirmPassword
                        }
                        className="submit-btn"
                        style={{
                          width: '100%',
                          padding: 12,
                          fontSize: 16,
                          opacity:
                            isLoading ||
                            !!passwordError ||
                            !newPassword ||
                            !confirmPassword
                              ? 0.5
                              : 1,
                        }}
                      >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <h1 className="success-title">Code Sent</h1>
                    <p className="success-message">
                      We've sent a 6-digit verification code to{' '}
                      <strong>
                        {selectedMethod === 'sms' ? phone : email}
                      </strong>
                    </p>
                    <p className="success-info">
                      Enter the 6 digits you received via{' '}
                      {selectedMethod === 'sms' ? 'text message' : 'email'}.
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
                            onChange={e =>
                              handleCodeChange(idx, e.target.value)
                            }
                            onKeyDown={e => handleCodeKeyDown(e, idx)}
                            onPaste={e => {
                              const paste = e.clipboardData.getData('text');
                              e.preventDefault();
                              handleCodeChange(idx, paste);
                            }}
                            ref={el => (inputsRef.current[idx] = el)}
                          />
                        ))}
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>
                          Expires in {secondsLeft}s
                        </div>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <button
                          className="resend-link"
                          type="button"
                          onClick={handleResend}
                        >
                          Resend code
                        </button>
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <Link to="/login" className="back-to-login-btn">
                          Back to Login
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Hidden reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
