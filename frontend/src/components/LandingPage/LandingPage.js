import React, { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../Footer';
import Home from './Home';
import AboutUs from './AboutUs';
import FAQ from './FAQ';
import HowItWorks from './HowItWorks';
import SEOHead from '../SEOHead';

const LandingPage = () => {
  const location = useLocation();

  const scrollWithOffset = useCallback(element => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToSection = useCallback(
    (sectionId, attempts = 8) => {
      const element = document.getElementById(sectionId);
      if (element) {
        scrollWithOffset(element);
        return;
      }

      if (attempts > 0) {
        setTimeout(() => scrollToSection(sectionId, attempts - 1), 80);
      }
    },
    [scrollWithOffset]
  );

  useEffect(() => {
    // Handle scroll to section when navigating with state
    const stateTarget = location.state?.scrollTo;
    const sessionTarget = sessionStorage.getItem('landingScrollTarget');
    const hashTarget = window.location.hash
      ? window.location.hash.slice(1)
      : null;
    const target = stateTarget || sessionTarget || hashTarget;

    if (!target) {
      return;
    }

    scrollToSection(target);

    if (sessionTarget) {
      sessionStorage.removeItem('landingScrollTarget');
    }
  }, [location, scrollToSection]);

  return (
    <div className="landing-page">
      <SEOHead
        title="Surplus Food Redistribution Platform"
        description="FoodFlow connects restaurants, grocery stores, and businesses with verified charities and shelters to redistribute surplus food in real time — reducing waste and fighting food insecurity."
        canonical="/"
        ogType="website"
      />
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
