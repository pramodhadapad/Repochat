import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

/**
 * GuestRoute (PublicRoute) redirects authenticated users to the dashboard.
 * This prevents logged-in users from accessing /login or / routes.
 * If token EXISTS → redirect to /dashboard using <Navigate replace />
 * If no token → render children (show login/landing page)
 */
const GuestRoute = ({ children }) => {
  const { token } = useStore();
  const location = useLocation();

  // Prevent authenticated users from accessing guest routes
  useEffect(() => {
    if (token) {
      console.log('[AUTH] GuestRoute detected authenticated user. Rewriting history...');
      // Replace the history entry to ensure they can't "stick" to this page
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [token]);

  // If token exists, redirect to dashboard — always use replace to avoid history pollution
  if (token) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  // If no token exists, allow them to view the guest content (Landing/Login page)
  return children;
};

export default GuestRoute;
