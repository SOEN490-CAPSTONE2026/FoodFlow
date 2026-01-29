import React from 'react';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.png';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import '../style/Footer.css';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="logo-section">
            <img src={Logo} alt="FoodFlow Logo" className="footer-logo" />
          </div>
          <p className="footer-description">{t('footer.description')}</p>
        </div>

        <div className="footer-right">
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="column-title">{t('footer.company')}</h3>
              <ul className="footer-links">
                <li>
                  <a href="#home">{t('footer.home')}</a>
                </li>
                <li>
                  <a href="#how-it-works">{t('footer.howItWorks')}</a>
                </li>
                <li>
                  <a href="#about">{t('footer.about')}</a>
                </li>
                <li>
                  <a href="#faqs">{t('footer.faqs')}</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="column-title">{t('footer.contact')}</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <a
                    href="mailto:foodflow.group@gmail.com"
                    className="contact-email"
                  >
                    {t('footer.email')}
                  </a>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <a href="tel:18001224567" className="contact-phone">
                    {t('footer.phone')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-divider"></div>
        <div className="bottom-content">
          <div className="copyright">{t('footer.copyright')}</div>
          <div className="legal-links">
            <a href="/privacy-policy">{t('footer.privacyPolicy')}</a>
            <span className="separator">|</span>
            <a href="/terms-conditions">{t('footer.termsConditions')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
