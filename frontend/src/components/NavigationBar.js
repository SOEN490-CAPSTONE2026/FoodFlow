import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Logo from "../assets/Logo.png";
import './NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
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

  return (
    <nav className='navbar'>
      <div className='logo'>
        <img src={Logo} alt="Logo" width={"80px"} height={"70px"} />
      </div>
      
      <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div className={`menu ${isMenuOpen ? 'active' : ''}`}>
        <ul>
          <li><a href='#' onClick={() => setIsMenuOpen(false)}>Home</a></li>
          <li><a href='#' onClick={() => setIsMenuOpen(false)}>How it works</a></li>
          <li><a href='#' onClick={() => setIsMenuOpen(false)}>Features</a></li>
          <li><a href='#' onClick={() => setIsMenuOpen(false)}>FAQs</a></li>
          <li><a href='#contact' onClick={() => setIsMenuOpen(false)}>Contact Us</a></li>
        </ul>
      </div>
      
      <div className='buttons'>
        {!isLoggedIn ? (
          <>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleSignUp}>Register</button>
          </>
        ) : (
          <button onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;