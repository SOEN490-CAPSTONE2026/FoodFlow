import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from "../assets/Logo.png";
import '../style/NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, role } = useContext(AuthContext);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');

  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'ZH', name: '中文', flag: '🇨🇳' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'PT', name: 'Português', flag: '🇵🇹' },
  ];

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

  const toggleMenu = () => setIsMenuOpen((o) => !o);

  const scrollToSection = (sectionId, event) => {
    event.preventDefault();
    setIsMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId, from: from || undefined } });
    } else {
      setTimeout(() => {
        scrollToElement(sectionId);
      }, 100);
    }
  };

  const scrollToElement = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
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
      role === 'RECEIVER' ? '/receiver/browse' :
      role === 'DONOR' ? '/donor' :
      role === 'ADMIN' ? '/admin/dashboard' :
      null;
    
    if (target) {
      navigate(target);
      setIsMenuOpen(false);
    }
  };

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    setIsLangDropdownOpen(false);
    console.log(`Language selected: ${langCode}`);
  };

  const toggleLangDropdown = () => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLangDropdownOpen && !event.target.closest('.lang-selector')) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangDropdownOpen]);

  return (
    <nav className="navbar">
      <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={Logo} alt="Logo" width="80" height="70" />
      </div>

      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
        aria-controls="primary-menu"
      >
        {isMenuOpen ? <FaTimes size={28} color="#1B4965" /> : <FaBars size={28} color="#1B4965" />}
      </button>

      <div id="primary-menu" className={`menu ${isMenuOpen ? 'active' : ''}`}>
        <ul>
          <li>
            <a href="#home" onClick={(e) => scrollToSection('home', e)}>Home</a>
          </li>
          <li>
            <a href="#how-it-works" onClick={(e) => scrollToSection('how-it-works', e)}>How it works</a>
          </li>
          <li>
            <a href="#about" onClick={(e) => scrollToSection('about', e)}>About Us</a>
          </li>
          <li>
            <a href="#faqs" onClick={(e) => scrollToSection('faqs', e)}>FAQs</a>
          </li>
          <li>
            <a href="#contact" onClick={(e) => scrollToSection('contact', e)}>Contact Us</a>
          </li>
        </ul>

        <div className="mobile-buttons">
          {isLoggedIn ? (
            <button className="signup-button" onClick={handleReturnToDashboard}>
              Return to Dashboard
            </button>
          ) : (
            <>
              <button className="login-button" onClick={handleLogin}>Login</button>
              <button className="signup-button" onClick={handleSignUp}>Register</button>
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
                {selectedLanguage} ▼
              </button>
              
              {isLangDropdownOpen && (
                <div className="lang-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`lang-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-name">{lang.name}</span>
                      {selectedLanguage === lang.code && <span className="lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
                    {selectedLanguage === lang.code && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="buttons">
        {isLoggedIn ? (
          <button className="signup-button" onClick={handleReturnToDashboard}>
            Return to Dashboard
          </button>
        ) : (
          <>
            <button className="login-button" onClick={handleLogin}>Login</button>
            <button className="signup-button" onClick={handleSignUp}>Register</button>
          </>
        )}
        
        {/* Language Selector */}
        <div className="lang-selector">
          <button 
            className="lang-button"
            onClick={toggleLangDropdown}
            aria-label="Select Language"
          >
            {selectedLanguage} ▼
          </button>
          
          {isLangDropdownOpen && (
            <div className="lang-dropdown">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {selectedLanguage === lang.code && <span className="lang-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
