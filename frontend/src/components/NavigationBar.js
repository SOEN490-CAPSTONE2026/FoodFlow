import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from "../assets/Logo.png";
import './NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId, event) => {
    event.preventDefault();

    setIsMenuOpen(false);

    // Navigate to home first if not on landing page 
    if (location.pathname !== '/') {
      navigate('/', {
        state: { scrollTo: sectionId }
      });
    } else {
      // Scroll to the section if we are already on the landing page
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

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    } else {
      navigate('.', {
        replace: true,
        state: null
      });
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };
  return (
    <nav className='navbar'>
      <div className='logo' onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={Logo} alt="Logo" width={"80px"} height={"70px"} />
      </div>

      <div className="menu-toggle" onClick={toggleMenu}>
        {isMenuOpen ? (
          <FaTimes size={28} color="#1B4965" />
        ) : (
          <FaBars size={28} color="#1B4965" />
        )}
      </div>
      <div className={`menu ${isMenuOpen ? 'active' : ''}`}>
        <ul>
          <li>
            <a
              href='#home'
              onClick={(e) => scrollToSection('home', e)}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href='#how-it-works'
              onClick={(e) => scrollToSection('how-it-works', e)}
            >
              How it works
            </a>
          </li>
          <li>
            <a
              href='#about'
              onClick={(e) => scrollToSection('about', e)}
            >
              About Us
            </a>
          </li>
          <li>
            <a
              href='#faqs'
              onClick={(e) => scrollToSection('faqs', e)}
            >
              FAQs
            </a>
          </li>
          <li>
            <a
              href='#contact'
              onClick={(e) => scrollToSection('contact', e)}
            >
              Contact Us
            </a>
          </li>
          {isLoggedIn && (
            <li>
              <a
                href='/surplus'
                onClick={(e) => { e.preventDefault(); navigate('/surplus'); setIsMenuOpen(false); }}
              >
                Surplus Feed
              </a>
            </li>
          )}
        </ul>

        <div className='mobile-buttons'>
          {!isLoggedIn ? (
            <>
              <button className='login-button' onClick={handleLogin}>Login</button>
              <button className='signup-button' onClick={handleSignUp}>Register</button>
            </>
          ) : (
            <button className='logout-button' onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>

      <div className='buttons'>
        {!isLoggedIn ? (
          <>
            <button className='login-button' onClick={handleLogin}>Login</button>
            <button className='signup-button' onClick={handleSignUp}>Register</button>
          </>
        ) : (
          <button className='logout-button' onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;