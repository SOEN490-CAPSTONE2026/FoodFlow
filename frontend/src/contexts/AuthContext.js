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

  const [organizationVerificationStatus, setOrganizationVerificationStatus] = useState(() => {
    return localStorage.getItem("organizationVerificationStatus") || sessionStorage.getItem("organizationVerificationStatus") || null;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken")));
      setRole(localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || null);
      setUserId(localStorage.getItem("userId") || sessionStorage.getItem("userId") || null);
      setOrganizationName(localStorage.getItem("organizationName") || sessionStorage.getItem("organizationName") || null);
      setOrganizationVerificationStatus(localStorage.getItem("organizationVerificationStatus") || sessionStorage.getItem("organizationVerificationStatus") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, userRole, userId, arg4 = null, arg5 = null, arg6 = false) => {
    // Backwards-compatible handling of older call signatures:
    // - login(token, role, userId)
    // - login(token, role, userId, orgName)
    // - login(token, role, userId, orgName, useSession)
    // New signature supports login(token, role, userId, orgName, orgVerificationStatus, useSession)
    let orgName = null;
    let orgVerificationStatus = null;
    let useSession = false;

    if (typeof arg4 === 'boolean') {
      // login(token, role, userId, useSession)
      useSession = arg4;
    } else if (typeof arg5 === 'boolean') {
      // login(token, role, userId, orgName, useSession)
      orgName = arg4;
      useSession = arg5;
    } else {
      // login(token, role, userId, orgName, orgVerificationStatus, useSession?)
      orgName = arg4;
      orgVerificationStatus = arg5;
      useSession = arg6;
    }

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

    if (orgVerificationStatus !== undefined && orgVerificationStatus !== null) {
      storage.setItem("organizationVerificationStatus", orgVerificationStatus);
      otherStorage.removeItem("organizationVerificationStatus");
    } else {
      localStorage.removeItem("organizationVerificationStatus");
      sessionStorage.removeItem("organizationVerificationStatus");
    }

    setIsLoggedIn(true);
    setRole(userRole);
    setUserId(userId);
    setOrganizationName(orgName);
    setOrganizationVerificationStatus(orgVerificationStatus);
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
    localStorage.removeItem('organizationVerificationStatus');
    sessionStorage.removeItem('organizationVerificationStatus');
    setIsLoggedIn(false);
    setRole(null);
    setUserId(null);
    setOrganizationName(null);
    setOrganizationVerificationStatus(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userId, organizationName, organizationVerificationStatus, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
