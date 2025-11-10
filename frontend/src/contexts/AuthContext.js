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

  const [organizationName, setOrganizationName] = useState(() => {
    return localStorage.getItem("organizationName") || sessionStorage.getItem("organizationName") || null;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken")));
      setRole(localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || null);
      setUserId(localStorage.getItem("userId") || sessionStorage.getItem("userId") || null);
      setOrganizationName(localStorage.getItem("organizationName") || sessionStorage.getItem("organizationName") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, userRole, userId, orgName = null, useSession = false) => {
    console.log('AuthContext.login - Setting organizationName:', orgName);
    if (useSession) {
      sessionStorage.setItem("jwtToken", token);
      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem("userId", userId);
      if (orgName) sessionStorage.setItem("organizationName", orgName);
    } else {
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", userId);
      if (orgName) localStorage.setItem("organizationName", orgName);
    }
    setIsLoggedIn(true);
    setRole(userRole);
    setUserId(userId);
    setOrganizationName(orgName);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    sessionStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    localStorage.removeItem('organizationName');
    sessionStorage.removeItem('organizationName');
    setIsLoggedIn(false);
    setRole(null);
    setUserId(null);
    setOrganizationName(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userId, organizationName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
