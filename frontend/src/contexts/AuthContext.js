import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken'));
  });

  useEffect(() => {
    // Listen for storage changes (e.g., in other tabs)
    const handleStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (token, useSession = false) => {
    if (useSession) {
      sessionStorage.setItem('jwtToken', token);
    } else {
      localStorage.setItem('jwtToken', token);
    }
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    sessionStorage.removeItem('jwtToken');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

