import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken"));
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || null;
  });

  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("userId") || sessionStorage.getItem("userId") || null;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken")));
      setRole(localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || null);
      setUserId(localStorage.getItem("userId") || sessionStorage.getItem("userId") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, userRole, userId, useSession = false) => {
    if (useSession) {
      sessionStorage.setItem("jwtToken", token);
      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem("userId", userId);
    } else {
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", userId);
    }
    setIsLoggedIn(true);
    setRole(userRole);
    setUserId(userId);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    sessionStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    setIsLoggedIn(false);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
