import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Home from './Home';
// import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Home />
      <Footer />
    </div>
  );
};

export default LandingPage;
