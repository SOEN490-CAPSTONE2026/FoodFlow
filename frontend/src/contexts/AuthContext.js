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
    // Save auth values to the chosen storage (session or local).
    // Explicitly set or remove organizationName to avoid leaving a stale value
    // from a previous session (which required clearing caches).
    const storage = useSession ? sessionStorage : localStorage;
    const otherStorage = useSession ? localStorage : sessionStorage;

    storage.setItem("jwtToken", token);
    storage.setItem("userRole", userRole);
    storage.setItem("userId", userId);

    if (orgName !== undefined && orgName !== null) {
      // backend provided organizationName (could be empty string). Save it
      storage.setItem("organizationName", orgName);
      // make sure the other storage doesn't keep a stale value
      otherStorage.removeItem("organizationName");
    } else {
      // backend didn't send organizationName -> remove any previous value
      localStorage.removeItem("organizationName");
      sessionStorage.removeItem("organizationName");
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
