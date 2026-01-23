import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const AuthStorage = {
  getItem: (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },

  setItem: (key, value, useSession = false) => {
    const storage = useSession ? sessionStorage : localStorage;
    const otherStorage = useSession ? localStorage : sessionStorage;
    
    if (value !== null && value !== undefined) {
      storage.setItem(key, value);
      otherStorage.removeItem(key);
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },

  clearAll: () => {
    const keys = ["jwtToken", "userRole", "userId", "organizationName", "organizationVerificationStatus"];
    keys.forEach(key => AuthStorage.removeItem(key));
  },
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(AuthStorage.getItem("jwtToken"));
  });

  const [role, setRole] = useState(() => {
    return AuthStorage.getItem("userRole") || null;
  });

  const [userId, setUserId] = useState(() => {
    return AuthStorage.getItem("userId") || null;
  });

  const [organizationName, setOrganizationName] = useState(() => {
    return AuthStorage.getItem("organizationName") || null;
  });

  const [organizationVerificationStatus, setOrganizationVerificationStatus] = useState(() => {
    return AuthStorage.getItem("organizationVerificationStatus") || null;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(Boolean(AuthStorage.getItem("jwtToken")));
      setRole(AuthStorage.getItem("userRole") || null);
      setUserId(AuthStorage.getItem("userId") || null);
      setOrganizationName(AuthStorage.getItem("organizationName") || null);
      setOrganizationVerificationStatus(AuthStorage.getItem("organizationVerificationStatus") || null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (token, userRole, userId, arg4 = null, arg5 = null, arg6 = false) => {
    let orgName = null;
    let orgVerificationStatus = null;
    let useSession = false;

    if (typeof arg4 === 'boolean') {
      useSession = arg4;
    } else if (typeof arg5 === 'boolean') {
      orgName = arg4;
      useSession = arg5;
    } else {
      orgName = arg4;
      orgVerificationStatus = arg5;
      useSession = arg6;
    }

    AuthStorage.setItem("jwtToken", token, useSession);
    AuthStorage.setItem("userRole", userRole, useSession);
    AuthStorage.setItem("userId", userId, useSession);

    if (orgName !== undefined && orgName !== null) {
      AuthStorage.setItem("organizationName", orgName, useSession);
    } else {
      AuthStorage.removeItem("organizationName");
    }

    if (orgVerificationStatus !== undefined && orgVerificationStatus !== null) {
      AuthStorage.setItem("organizationVerificationStatus", orgVerificationStatus, useSession);
    } else {
      AuthStorage.removeItem("organizationVerificationStatus");
    }

    setIsLoggedIn(true);
    setRole(userRole);
    setUserId(userId);
    setOrganizationName(orgName);
    setOrganizationVerificationStatus(orgVerificationStatus);
  };

  const logout = () => {
    AuthStorage.clearAll();
    setIsLoggedIn(false);
    setRole(null);
    setUserId(null);
    setOrganizationName(null);
    setOrganizationVerificationStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        role,
        userId,
        organizationName,
        organizationVerificationStatus,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
