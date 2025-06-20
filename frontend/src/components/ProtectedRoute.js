// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const sessioninfo = localStorage.getItem('session-info'); // retrieve the stored user

  try {
    const parsed = JSON.parse(sessioninfo);
    if (parsed && parsed.user.email) {
      return children; // Allow access
    }
  } catch (e) {
    console.warn("Invalid JSON in localStorage:", e);
  }

  return <Navigate to="/login" replace />; // Not logged in → redirect
};

export default ProtectedRoute;
