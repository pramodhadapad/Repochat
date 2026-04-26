import { useEffect } from 'react';

/**
 * Custom hook to register global keyboard shortcuts
 * @param {Array} shortcuts - Array of shortcut objects { key, ctrl, shift, alt, action }
 */
const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea (unless the shortcut specifically allows it)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      
      shortcuts.forEach(({ key, ctrl, shift, alt, action, preventDefault = true, allowInInput = false }) => {
        if (isInput && !allowInInput) return;

        if (
          e.key.toLowerCase() === key.toLowerCase() &&
          !!e.ctrlKey === !!ctrl &&
          !!e.shiftKey === !!shift &&
          !!e.altKey === !!alt
        ) {
          if (preventDefault) e.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
