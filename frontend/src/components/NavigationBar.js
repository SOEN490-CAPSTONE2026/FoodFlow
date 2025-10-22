import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from "../assets/Logo.png";
import '../style/NavigationBar.css';
import ReturnToDashboardButton from "../components/ReceiverDashboard/ReturnToDashboardButton";

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, logout } = useContext(AuthContext);

  const [from, setFrom] = useState(
    () => location.state?.from || sessionStorage.getItem('returnFrom') || null
  );

  useEffect(() => {
    if (location.state?.from) {
      sessionStorage.setItem('returnFrom', location.state.from);
      setFrom(location.state.from);
    }
  }, [location.state?.from]);

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem('returnFrom');
    navigate('/login');
    setIsMenuOpen(false);
  };

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

  const showReturnButton = Boolean(from) && Boolean(isLoggedIn);

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
          {showReturnButton ? (
            <ReturnToDashboardButton onNavigate={() => setIsMenuOpen(false)} />
          ) : !isLoggedIn ? (
            <>
              <button className="login-button" onClick={handleLogin}>Login</button>
              <button className="signup-button" onClick={handleSignUp}>Register</button>
            </>
          ) : (
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>

      <div className="buttons">
        {showReturnButton ? (
          <ReturnToDashboardButton onNavigate={() => setIsMenuOpen(false)} />
        ) : !isLoggedIn ? (
          <>
            <button className="login-button" onClick={handleLogin}>Login</button>
            <button className="signup-button" onClick={handleSignUp}>Register</button>
          </>
        ) : (
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
