import { useNavigate, Link } from 'react-router-dom';
import '../style/LoginPage.css';
import React, { useState, useContext } from 'react';
import { authAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { trackButtonClick, trackLogin } = useAnalytics();

  const handleLogin = async (e) => {
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

    console.log('Login response - organizationName:', organizationName);

    if (!token || !userRole || !userId) {
      throw new Error('Invalid server response');
    }

    login(token, userRole, userId, organizationName); // this automatically updates localStorage and context
    trackLogin(true);

    // redirect based on role
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
    console.error(err);
    trackLogin(false);
    setError('Invalid email or password');
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
        <img src="https://i.ibb.co/HLxDnk57/Untitled-design-6.png" alt="Donation example" className="main" />
        <Link to="/">
          <img src="https://i.ibb.co/jkF1r5xL/logo-white.png" alt="FoodFlow logo" className="login-logo" />
        </Link>
      </div>

      <div className="login-right">
        <div className="login-container">
          <div className="login-inner">
            <div className="login-card" role="region" aria-labelledby="login-title">
              <button
                className="back-home-button"
                onClick={() => navigate("/")}
                aria-label="Go back to homepage"
              >
                ← Back Home
              </button>
              <h1 id="login-title" className="login-title">Log in to your account</h1>

              <form onSubmit={handleLogin} noValidate>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input id="email" type="email" className="form-input" placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
                </div>

                <div className="form-field">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-wrapper">
                    <input id="password" type={showPassword? 'text':'password'} className="form-input" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required />
                    <button type="button" className="password-toggle" aria-label={showPassword? 'Hide password':'Show password'} onClick={()=>setShowPassword(s=>!s)}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M2 12s4-7 10-7 10 7 10 7c-.9 1.6-4.9 7-10 7-2.2 0-4.2-.8-5.9-1.9" stroke="#0f172a" strokeWidth="2" fill="none"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#0f172a" strokeWidth="2" fill="none"/>
                          <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="forgot-link">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  onClick={() => trackButtonClick('login_submit', 'login_page')}
                >
                  {loading ? 'Logging in…' : 'LOG IN'}
                </button>

                <p className="form-footer">Don't have an account? <Link to="/register" className="link-button">Sign up</Link></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
