import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminProtectedRoute - Route protection for admin-only pages
 * Redirects non-admin users to home page
 */
const AdminProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('session-info');
  
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parsed = JSON.parse(userInfo);
    if (!parsed.user || parsed.user.role !== 'admin') {
      return <Navigate to="/home" replace />;
    }
  } catch (e) {
    console.warn("Invalid JSON in localStorage:", e);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
