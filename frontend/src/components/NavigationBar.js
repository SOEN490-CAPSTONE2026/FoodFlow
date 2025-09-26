import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from "react-router-dom";
import Logo from "../assets/Logo.png";

const NavigationBar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav style={{ padding: '1rem', background: '#ffffffff', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Link to="/">
          <img src={Logo} alt="Logo" height={50} width={50} />
        </Link>      </div>
      <div>
        {!isLoggedIn && (
          <button onClick={handleLogin} style={{ fontSize: '1rem', padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
            Login
          </button>
        )}
        {isLoggedIn && (
          <button onClick={handleLogout} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
