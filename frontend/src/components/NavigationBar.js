import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from '../assets/Logo.png';
import '../style/NavigationBar.css';
import ENIcon from '../assets/lang-icons/EN.svg';
import FRIcon from '../assets/lang-icons/FR.svg';
import ESIcon from '../assets/lang-icons/ES.svg';
import ZHIcon from '../assets/lang-icons/ZH.svg';
import ARIcon from '../assets/lang-icons/AR.svg';
import PRIcon from '../assets/lang-icons/PR.svg';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, role } = useContext(AuthContext);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇬🇧' },
    { code: 'fr', name: t('language.french'), flag: '🇫🇷' },
    { code: 'es', name: t('language.spanish'), flag: '🇪🇸' },
    { code: 'zh', name: t('language.chinese'), flag: '🇨🇳' },
    { code: 'ar', name: t('language.arabic'), flag: '🇸🇦' },
    { code: 'pt', name: t('language.portuguese'), flag: '🇵🇹' },
  ];

  const currentLanguage =
    languages.find(lang => lang.code === i18n.language.split('-')[0]) ||
    languages[0];

  const [from, setFrom] = useState(
    () => location.state?.from || sessionStorage.getItem('returnFrom') || null
  );

  useEffect(() => {
    if (location.state?.from) {
      sessionStorage.setItem('returnFrom', location.state.from);
      setFrom(location.state.from);
    }
  }, [location.state?.from]);

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSignUp = () => {
    navigate('/register');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(o => !o);

  const scrollToSection = (sectionId, event) => {
    event.preventDefault();
    setIsMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/', {
        state: { scrollTo: sectionId, from: from || undefined },
      });
    } else {
      setTimeout(() => {
        scrollToElement(sectionId);
      }, 100);
    }
  };

  const scrollToElement = sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/', { state: { from: from || undefined, scrollTo: 'home' } });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleReturnToDashboard = () => {
    const target =
      role === 'RECEIVER'
        ? '/receiver/browse'
        : role === 'DONOR'
          ? '/donor'
          : role === 'ADMIN'
            ? '/admin/dashboard'
            : null;

    if (target) {
      navigate(target);
      setIsMenuOpen(false);
    }
  };

  const handleLanguageSelect = langCode => {
    i18n.changeLanguage(langCode);
    setIsLangDropdownOpen(false);
  };

  const toggleLangDropdown = () => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (isLangDropdownOpen && !event.target.closest('.lang-selector')) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangDropdownOpen]);

  return (
    <nav className="navbar">
      <div
        className="logo"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer' }}
      >
        <img src={Logo} alt="Logo" width="80" height="70" />
      </div>

      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
        aria-controls="primary-menu"
      >
        {isMenuOpen ? (
          <FaTimes size={28} color="#1B4965" />
        ) : (
          <FaBars size={28} color="#1B4965" />
        )}
      </button>

      <div id="primary-menu" className={`menu ${isMenuOpen ? 'active' : ''}`}>
        <ul>
          <li>
            <a href="#home" onClick={e => scrollToSection('home', e)}>
              {t('nav.home')}
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              onClick={e => scrollToSection('how-it-works', e)}
            >
              {t('nav.howItWorks')}
            </a>
          </li>
          <li>
            <a href="#about" onClick={e => scrollToSection('about', e)}>
              {t('nav.about')}
            </a>
          </li>
          <li>
            <a href="#faqs" onClick={e => scrollToSection('faqs', e)}>
              {t('nav.faqs')}
            </a>
          </li>
          <li>
            <a href="#contact" onClick={e => scrollToSection('contact', e)}>
              {t('nav.contact')}
            </a>
          </li>
        </ul>

        <div className="mobile-buttons">
          {isLoggedIn ? (
            <button className="signup-button" onClick={handleReturnToDashboard}>
              {t('nav.returnToDashboard')}
            </button>
          ) : (
            <>
              <button className="login-button" onClick={handleLogin}>
                {t('nav.login')}
              </button>
              <button className="signup-button" onClick={handleSignUp}>
                {t('nav.register')}
              </button>
            </>
          )}

          {/* Mobile Language Selector - Only show when not logged in */}
          {!isLoggedIn && (
            <div className="lang-selector mobile-lang">
              <button
                className="lang-button"
                onClick={toggleLangDropdown}
                aria-label={t('language.select')}
              >
                <span className="lang-flag">{currentLanguage.flag}</span>
                <span className="lang-name">
                  {currentLanguage.code.toUpperCase()}
                </span>
              </button>

              {isLangDropdownOpen && (
                <div className="lang-dropdown">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`lang-option ${i18n.language.split('-')[0] === lang.code ? 'selected' : ''}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-name">{lang.name}</span>
                      {i18n.language.split('-')[0] === lang.code && (
                        <span className="lang-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="buttons">
        {isLoggedIn ? (
          <button className="signup-button" onClick={handleReturnToDashboard}>
            {t('nav.returnToDashboard')}
          </button>
        ) : (
          <>
            <button className="login-button" onClick={handleLogin}>
              {t('nav.login')}
            </button>
            <button className="signup-button" onClick={handleSignUp}>
              {t('nav.register')}
            </button>
          </>
        )}

        {/* Language Selector - Only show when not logged in */}
        {!isLoggedIn && (
          <div className="lang-selector">
            <button
              className="lang-button"
              onClick={toggleLangDropdown}
              aria-label={t('language.select')}
            >
              <span className="lang-flag">{currentLanguage.flag}</span>
              <span className="lang-name">
                {currentLanguage.code.toUpperCase()}
              </span>
            </button>

            {isLangDropdownOpen && (
              <div className="lang-dropdown">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-option ${i18n.language.split('-')[0] === lang.code ? 'selected' : ''}`}
                    onClick={() => handleLanguageSelect(lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.name}</span>
                    {i18n.language.split('-')[0] === lang.code && (
                      <span className="lang-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
