import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import useDisableBackNavigation from '../../hooks/useDisableBackNavigation';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useStore();
  const location = useLocation();

  // Apply back-navigation guard on ALL protected routes
  useDisableBackNavigation();

  // Token check happens on every render — no token means redirect to /login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle the "in-between" state: we have a token but are still fetching the user
  if (token && !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
