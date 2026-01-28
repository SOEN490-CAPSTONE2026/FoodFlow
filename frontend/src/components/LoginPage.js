import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../style/LoginPage.css';
import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { trackButtonClick, trackLogin } = useAnalytics();

  // Check for success message from email verification
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location]);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      // get token, role, userId, and organizationName from backend response
      const token = response?.data?.token;
      const userRole = response?.data?.role;
      const userId = response?.data?.userId;
      const organizationName = response?.data?.organizationName;
      const verificationStatus = response?.data?.verificationStatus;
      const accountStatus = response?.data?.accountStatus;

      if (!token || !userRole || !userId) {
        throw new Error('Invalid server response');
      }

      login(
        token,
        userRole,
        userId,
        organizationName,
        verificationStatus,
        accountStatus
      ); // this automatically updates localStorage and context
      trackLogin(true);

      switch (userRole.toUpperCase()) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'DONOR':
          navigate('/donor');
          break;
        case 'RECEIVER':
          navigate('/receiver');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      trackLogin(false);

      let errorMessage = 'Invalid email or password';

      if (err.response) {
        const statusCode = err.response.status;
        const serverMessage =
          err.response.data?.message || err.response.data?.error;

        if (statusCode === 401) {
          errorMessage = serverMessage || 'Invalid email or password';
        } else if (statusCode === 403) {
          errorMessage =
            serverMessage || 'Access denied. Please contact support.';
        } else if (statusCode === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (statusCode >= 500) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (err.request) {
        errorMessage =
          'Unable to connect to server. Please check your connection.';
      } else if (err.message === 'Invalid server response') {
        errorMessage =
          'Login successful but received incomplete data. Please try again.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left" aria-hidden="true">
        <div className="background-spots">
          <span className="background-spot s1" />
          <span className="background-spot s2" />
          <span className="background-spot s3" />
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
            className="login-logo"
          />
        </Link>
      </div>

      <div className="login-right">
        <div className="login-container">
          <div className="login-inner">
            <div
              className="login-card"
              role="region"
              aria-labelledby="login-title"
            >
              <button
                className="back-home-button"
                onClick={() => navigate('/')}
                aria-label="Go back to homepage"
              >
                {t('login.backHome')}
              </button>
              <h1 id="login-title" className="login-title">
                Log in to your account
              </h1>

              <form onSubmit={handleLogin} noValidate>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">{t('login.emailLabel')}</label>
                  <input id="email" type="email" className="form-input" placeholder={t('login.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>

                <div className="form-field">
                  <label htmlFor="password" className="form-label">{t('login.passwordLabel')}</label>
                  <div className="password-wrapper">
                    <input id="password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748b" />
                      ) : (
                        <Eye size={20} color="#64748b" />
                      )}
                    </button>
                  </div>
                  <div className="forgot-link">
                    <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
                  </div>
                </div>

                {successMessage && (
                  <p className="form-success">{successMessage}</p>
                )}
                {error && <p className="form-error">{error}</p>}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  onClick={() => trackButtonClick('login_submit', 'login_page')}
                >
                  {loading ? t('login.loggingIn') : t('login.logIn')}
                </button>

                <p className="form-footer">{t('login.dontHaveAccount')} <Link to="/register" className="link-button">{t('login.signUp')}</Link></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
