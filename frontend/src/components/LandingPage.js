import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';
import Home from './Home';
import AboutUs from './AboutUs';
import FAQ from './FAQ';
import HowItWorks from './HowItWorks';

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle scroll to section when navigating with state
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300); 
    }
  }, [location]);

  return (
    <div className="landing-page">
      <section id="home">
        <Home />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="about">
        <AboutUs />
      </section>
      <section id="faqs">
        <FAQ />
      </section>
      <section id="contact">
        <Footer />
      </section>
    </div>
  );
};

export default LandingPage;