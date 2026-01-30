import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  const styles = {
    wrapper: {
      backgroundColor: '#F9FAF9',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '4rem 1rem',
      fontFamily: 'Poppins, sans-serif',
    },
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      padding: '4.5rem 3rem',
      maxWidth: '1000px',
      width: '100%',
      color: '#1a1a1a',
      lineHeight: 1.7,
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? 'translateY(0)' : 'translateY(15px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      fontSize: '1.1rem',
    },
    title: {
      color: '#1B4965',
      fontSize: '2.25rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
      textAlign: 'center',
    },
    updated: {
      color: '#777',
      fontSize: '1rem',
      marginBottom: '2.5rem',
      textAlign: 'center',
    },
    section: {
      marginBottom: '2rem',
    },
    heading: {
      color: '#1B4965',
      fontSize: '1.4rem',
      fontWeight: '600',
      marginBottom: '0.6rem',
    },
    list: {
      paddingLeft: '1rem',
      margin: 0,
    },
    link: {
      color: '#609B7E',
      textDecoration: 'none',
      fontWeight: 500,
    },
    button: {
      display: 'inline-block',
      marginTop: '2rem',
      backgroundColor: '#609B7E',
      color: '#fff',
      padding: '0.75rem 1.5rem',
      borderRadius: '10px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#4f866d',
    },
    footer: {
      textAlign: 'center',
      marginTop: '1.5rem',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: October 2025</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Introduction</h2>
          <p>
            FoodFlow (“we”, “our”, “us”) respects your privacy and is committed
            to protecting your personal data. This Privacy Policy explains how
            we collect, use, and protect your information when you use our
            platform to donate or receive surplus food.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Information We Collect</h2>
          <ul style={styles.list}>
            <li>
              <strong>Account Information:</strong> Name, email, and phone
              number provided during registration.
            </li>
            <li>
              <strong>Donation Details:</strong> Food type, quantity, expiry
              date, pickup location, and notes you submit.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited and interactions to
              help us improve our service.
            </li>
            <li>
              <strong>Device Data:</strong> Browser, operating system, and IP
              address for security and debugging.
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. How We Use Your Information</h2>
          <ul style={styles.list}>
            <li>To connect donors with nearby receivers.</li>
            <li>To manage your account and improve your experience.</li>
            <li>To maintain safety and prevent fraudulent activity.</li>
            <li>To comply with legal and regulatory obligations.</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Data Sharing</h2>
          <p>
            We never sell your personal data. We may share limited information
            with trusted third parties such as:
          </p>
          <ul style={styles.list}>
            <li>
              Service providers (hosting, analytics) helping us operate the
              platform.
            </li>
            <li>
              Authorities when required by law or to prevent harm or misuse.
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Data Retention</h2>
          <p>
            We retain your information only as long as necessary to provide our
            services. You may request deletion at any time by emailing{' '}
            <a href="mailto:support@foodflow.ca" style={styles.link}>
              support@foodflow.ca
            </a>
            .
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your data and to
            withdraw consent to processing at any time. Requests can be made by
            contacting us directly.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Security</h2>
          <p>
            We apply technical and organizational measures such as encryption
            and restricted access to protect your data. However, no online
            service is entirely risk-free.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Any changes will be
            reflected on this page with an updated revision date.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy,
            reach out to:
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:support@foodflow.ca" style={styles.link}>
              support@foodflow.ca
            </a>
            <br />
            <strong>Address:</strong> Montréal, QC, Canada
          </p>
        </section>

        <div style={styles.footer}>
          <button
            style={
              hover
                ? { ...styles.button, ...styles.buttonHover }
                : styles.button
            }
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
