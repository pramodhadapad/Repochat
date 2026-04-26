import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that creates a typewriter effect for text.
 * @param {string} text - The full text to animate
 * @param {number} speed - Characters per batch (higher = faster)
 * @param {boolean} enabled - Whether to animate or just show full text immediately
 * @returns {{ displayedText: string, isComplete: boolean }}
 */
const useTypewriter = (text, speed = 3, enabled = true) => {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [isComplete, setIsComplete] = useState(!enabled);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text || '');
      setIsComplete(true);
      return;
    }

    // Reset on new text
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      indexRef.current += speed;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
};

export default useTypewriter;
