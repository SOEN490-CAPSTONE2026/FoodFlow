import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../style/LoginPage.css';

const BRAND = '#1B4965';
const ACCENT = '#609B7E';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response?.data?.token);
      navigate('/dashboard');
    } catch (err) {
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
        <img src="https://i.ibb.co/jkF1r5xL/logo-white.png" alt="FoodFlow logo" className="login-logo" />
      </div>

      <div className="login-right">
        <div className="login-container">
          <div className="login-inner">
            <div className="login-card" role="region" aria-labelledby="login-title">
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

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Logging in…' : 'LOG IN'}
                </button>

                <p className="form-footer">Don't have an account? <Link to="/signup">Sign up</Link></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
