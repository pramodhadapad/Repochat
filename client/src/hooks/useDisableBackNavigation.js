import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useStore from '../store/useStore';

/**
 * useDisableBackNavigation provides a multi-layered lockdown:
 * 1. History Jail: Prevents back/forward navigation using popstate.
 * 2. Exit Confirmation: Warns user when trying to close the tab or navigate to another site.
 * 
 * IMPORTANT: This guard is only active when the user has a valid token.
 * When the token is cleared (logout/expiry), the guard disables itself
 * to allow the app to redirect to the login page.
 */
const useDisableBackNavigation = () => {
  const token = useStore((state) => state.token);

  useEffect(() => {
    // Only guard when user is authenticated
    if (!token) return;

    // 1. History Jail Setup — push current state to trap back/forward
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Double-check token is still valid before blocking
      const currentToken = useStore.getState().token;
      if (!currentToken) return; // Token gone — allow navigation

      window.history.pushState(null, '', window.location.href);
      toast('Please use the Logout button to leave the platform.', {
        icon: '🔒',
        duration: 3000,
        id: 'nav-guard-toast'
      });
    };

    // 2. BeforeUnload (Exit Confirmation)
    const handleBeforeUnload = (e) => {
      const currentToken = useStore.getState().token;
      if (!currentToken) return; // Token gone — allow tab close

      const message = 'Are you sure you want to leave? Please log out to exit securely.';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);
};

export default useDisableBackNavigation;
