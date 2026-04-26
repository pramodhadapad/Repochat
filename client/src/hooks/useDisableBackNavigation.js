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

    const handlePopState = (e) => {
      // Double-check token is still valid before blocking
      const currentToken = useStore.getState().token;
      if (!currentToken) return;

      // Force stay on current page
      window.history.pushState(null, '', window.location.href);
      
      toast('Please use the Logout button to leave the platform.', {
        icon: '🔒',
        duration: 3000,
        id: 'nav-guard-toast',
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '10px',
        }
      });
    };

    // 2. Block Keyboard Shortcuts (Alt + Arrow Keys, Backspace, Cmd+[ / Cmd+])
    const handleKeyDown = (e) => {
      const currentToken = useStore.getState().token;
      if (!currentToken) return;

      // Alt + Left Arrow (Back) or Alt + Right Arrow (Forward)
      const isAltNav = e.altKey && (e.keyCode === 37 || e.keyCode === 39);
      
      // Cmd + [ (Back) or Cmd + ] (Forward) for Mac users
      const isMetaNav = e.metaKey && (e.keyCode === 219 || e.keyCode === 221);

      if (isAltNav || isMetaNav) {
        e.preventDefault();
        toast.error('Navigation keys are disabled. Please use the app UI.', { id: 'nav-key-toast' });
        return false;
      }

      // Backspace (can act as "Back" button in some browsers if not in an input)
      if (e.keyCode === 8) {
        const tag = e.target.tagName.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          return false;
        }
      }
    };

    // 3. BeforeUnload (Exit Confirmation)
    const handleBeforeUnload = (e) => {
      const currentToken = useStore.getState().token;
      if (!currentToken) return;

      const message = 'Are you sure you want to leave? Please log out to exit securely.';
      e.returnValue = message;
      return message;
    };

    // Initialize the jail
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);
};

export default useDisableBackNavigation;
