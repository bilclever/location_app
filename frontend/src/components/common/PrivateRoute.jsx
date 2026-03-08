import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search || ''}${location.hash || ''}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return children;
};

export default PrivateRoute;