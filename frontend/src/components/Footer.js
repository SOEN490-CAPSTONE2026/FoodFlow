import React from 'react';
import Logo from "../assets/Logo.png";
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        <div className="footer-left">
          <div className="logo-section">
            <img src={Logo} alt="FoodFlow Logo" className="footer-logo" />
          </div>
          <p className="footer-description">
            Discover a charity shop platform designed to revolutionize food distribution. 
            Connect charities with food sources across distances, enhance communications 
            and ensure fresh food reaches those in need. FoodFlow boosts an intuitive and 
            user-friendly interface.
          </p>
        </div>

        <div className="footer-right">
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="column-title">Company</h3>
              <ul className="footer-links">
                <li><a href='#home'>Home</a></li>
                <li><a href='#how-it-works'>How it works</a></li>
                <li><a href='#about'>About Us</a></li>
                <li><a href='#faqs'>FAQs</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3 className="column-title">Contact</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <a href="mailto:foodflow.group@gmail.com" className="contact-email">foodflow.group@gmail.com</a>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <a href="tel:18001224567" className="contact-phone">1-800-122-4567</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-divider"></div>
        <div className="bottom-content">
          <div className="copyright">
            Copyright © 2025. All right reserved to FoodFlow
          </div>
          <div className="legal-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <span className="separator">|</span>
            <a href="/terms-conditions">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;