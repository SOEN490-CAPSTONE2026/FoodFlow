import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, role } = useContext(AuthContext);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      dir: 'ltr',
      icon: ENIcon,
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      dir: 'ltr',
      icon: FRIcon,
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      dir: 'ltr',
      icon: ESIcon,
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      dir: 'ltr',
      icon: ZHIcon,
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      dir: 'rtl',
      icon: ARIcon,
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      dir: 'ltr',
      icon: PRIcon,
    },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

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

  const handleLanguageSelect = lang => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);
    console.log(`Language selected: ${lang.code}`);
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
              Home
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              onClick={e => scrollToSection('how-it-works', e)}
            >
              How it works
            </a>
          </li>
          <li>
            <a href="#about" onClick={e => scrollToSection('about', e)}>
              About Us
            </a>
          </li>
          <li>
            <a href="#faqs" onClick={e => scrollToSection('faqs', e)}>
              FAQs
            </a>
          </li>
          <li>
            <a href="#contact" onClick={e => scrollToSection('contact', e)}>
              Contact Us
            </a>
          </li>
        </ul>

        <div className="mobile-buttons">
          {isLoggedIn ? (
            <button className="signup-button" onClick={handleReturnToDashboard}>
              Return to Dashboard
            </button>
          ) : (
            <>
              <button className="login-button" onClick={handleLogin}>
                Login
              </button>
              <button className="signup-button" onClick={handleSignUp}>
                Register
              </button>
            </>
          )}

          {/* Mobile Language Selector - Only show when not logged in */}
          {!isLoggedIn && (
            <div className="lang-selector mobile-lang">
              <button
                className="lang-button"
                onClick={toggleLangDropdown}
                aria-label="Select Language"
              >
                <span className="lang-icon">
                  <img src={selectedLanguage.icon} alt="" />
                </span>
                <span className="lang-name">
                  {selectedLanguage.code.toUpperCase()}
                </span>
                ▼
              </button>

              {isLangDropdownOpen && (
                <div className="lang-dropdown">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`lang-option ${selectedLanguage.code === lang.code ? 'selected' : ''}`}
                      onClick={() => handleLanguageSelect(lang)}
                    >
                      <span className="lang-icon">
                        <img src={lang.icon} alt={`${lang.name} icon`} />
                      </span>
                      <span className="lang-name">{lang.name}</span>
                      {selectedLanguage.code === lang.code && (
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
            Return to Dashboard
          </button>
        ) : (
          <>
            <button className="login-button" onClick={handleLogin}>
              Login
            </button>
            <button className="signup-button" onClick={handleSignUp}>
              Register
            </button>
          </>
        )}

        {/* Language Selector - Only show when not logged in */}
        {!isLoggedIn && (
          <div className="lang-selector">
            <button
              className="lang-button"
              onClick={toggleLangDropdown}
              aria-label="Select Language"
            >
              <span className="lang-icon">
                <img src={selectedLanguage.icon} alt="" />
              </span>
              <span className="lang-name">
                {selectedLanguage.code.toUpperCase()}
              </span>
              ▼
            </button>

            {isLangDropdownOpen && (
              <div className="lang-dropdown">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-option ${selectedLanguage.code === lang.code ? 'selected' : ''}`}
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    <span className="lang-icon">
                      <img src={lang.icon} alt={`${lang.name} icon`} />
                    </span>
                    <span className="lang-name">{lang.name}</span>
                    {selectedLanguage.code === lang.code && (
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
