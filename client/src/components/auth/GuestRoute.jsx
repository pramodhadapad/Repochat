import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

/**
 * GuestRoute redirects authenticated users to the dashboard.
 * This is used for the landing/login page to prevent a bad UX
 * where a logged-in user sees the "Sign In" screen.
 */
const GuestRoute = ({ children }) => {
  const { user, token } = useStore();
  const location = useLocation();

  // Prevent authenticated users from accessing guest routes
  useEffect(() => {
    if (token) {
      console.log('[AUTH] GuestRoute detected authenticated user. Rewriting history...');
      // Replace the history entry to prevent back navigation
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [token]);

  // If token exists, we consider the user authenticated (or at least having a session).
  // Redirect them to dashboard instead of showing the landing/login content.
  if (token) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  // If no token exists, allow them to view the guest content (Landing page).
  return children;
};

export default GuestRoute;
