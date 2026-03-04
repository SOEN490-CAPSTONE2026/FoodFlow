import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { calendarAPI } from '../services/api';

/**
 * OAuth Callback handler for Google Calendar authentication
 * Receives the authorization code from Google and exchanges it for tokens
 */
const CalendarOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { userId } = useContext(AuthContext);

  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState(
    t('calendar.processingAuth') || 'Processing authentication...'
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(
            t('calendar.authDenied') || `Authentication denied: ${error}`
          );
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage(
            t('calendar.missingAuthCode') || 'Authorization code not found'
          );
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Exchange code for tokens
        const response = await calendarAPI.handleOAuthCallback(code, state);

        if (response.data.success) {
          setStatus('success');
          setMessage(
            response.data.message ||
              t('calendar.authSuccess') ||
              'Calendar connected successfully!'
          );

          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          setStatus('error');
          setMessage(
            response.data.message ||
              t('calendar.authFailed') ||
              'Failed to connect calendar'
          );
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            t('calendar.authError') ||
            'An error occurred during authentication'
        );
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, t]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        {status === 'processing' && (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            >
              <Loader size={48} color="#1b4965" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
              {t('calendar.connecting') || 'Connecting...'}
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ margin: '0 auto 1rem' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
              {t('calendar.success') || 'Success!'}
            </h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ margin: '0 auto 1rem' }}>
              <AlertCircle size={48} color="#ef4444" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
              {t('calendar.error') || 'Error'}
            </h2>
          </>
        )}

        <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9375rem' }}>
          {message}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarOAuthCallback;
