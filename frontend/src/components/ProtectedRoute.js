// components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const sessioninfo = localStorage.getItem('session-info'); // retrieve the stored user
  const location = useLocation();

  try {
    const parsed = JSON.parse(sessioninfo);
    const userRole = parsed?.user?.role; 

    if (!parsed?.user?.email) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // User does not have the required role
      return <Navigate to={location.pathname} replace />;
    }

    // If all checks pass, render the component
    return children;


  } catch (e) {
    console.warn("Invalid JSON in localStorage:", e);
    // Treat as not logged in if JSON is corrupted
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;
