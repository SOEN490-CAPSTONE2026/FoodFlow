import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
// import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">FoodFlow</h1>
          <h2 className="hero-subtitle">Reduce Food Waste, Feed Communities</h2>
          <p className="hero-description">
            Connect surplus food with those who need it most. 
            Join our platform to make a difference in your community.
          </p>
          <button 
            className="cta-button"
            onClick={() => navigate('/register')}
          >
            Register Now
          </button>
          <button 
            className="cta-button"
            style={{ marginTop: '10px' }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </header>
    
      <section className="features-section">
        <div className="container">
          <h3>How FoodFlow Works</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>For Donors</h4>
              <p>Restaurants, grocery stores, and event organizers can easily list surplus food</p>
            </div>
            <div className="feature-card">
              <h4>Smart Matching</h4>
              <p>Our system connects donors with nearby charities and community organizations</p>
            </div>
            <div className="feature-card">
              <h4>For Receivers</h4>
              <p>Charities and shelters get access to fresh food to serve their communities</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage;
