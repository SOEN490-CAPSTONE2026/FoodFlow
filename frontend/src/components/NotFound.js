import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from './SEOHead';

/**
 * NotFound — rendered for any route that doesn't match a known path.
 *
 * noindex is set so Google does not index placeholder 404 pages.
 * The component exists so that a Googlebot that crawls an unknown URL
 * sees a clear "not found" signal rather than a soft-404 (200 + empty content).
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Page Not Found"
        description="The page you are looking for does not exist."
        noindex
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#374151',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '6rem',
            fontWeight: 700,
            margin: 0,
            color: '#d1d5db',
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          Page Not Found
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Go to Homepage
        </button>
      </div>
    </>
  );
};

export default NotFound;
