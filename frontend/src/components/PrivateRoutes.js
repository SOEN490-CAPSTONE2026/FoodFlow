import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoutes = ({ children }) => {
  const { isLoggedIn, role } = useContext(AuthContext);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (location.pathname.startsWith('/admin') && role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith('/donor') && role !== 'DONOR') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith('/receiver') && role !== 'RECEIVER') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoutes;
