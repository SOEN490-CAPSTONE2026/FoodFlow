import React from 'react';
import Footer from './Footer';
import Home from './Home';
import AboutUs from './AboutUs';
import FAQ from './FAQ';
import HowItWorks from './HowItWorks';

const LandingPage = () => {

  return (
    <div className="landing-page">
      <Home />
      <HowItWorks />
      <AboutUs />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;
