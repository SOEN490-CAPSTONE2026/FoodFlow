import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const PrivateRoutes = ({ children }) => {
  const { isLoggedIn, role } = useContext(AuthContext);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (location.pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith("/dashboard/donor") && role !== "DONOR") {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith("/dashboard/receiver") && role !== "RECEIVER") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoutes;
