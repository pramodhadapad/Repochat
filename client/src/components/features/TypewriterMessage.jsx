import useTypewriter from '../../hooks/useTypewriter';

/**
 * Renders a message with a typewriter animation effect.
 * Only animates once when the component first mounts.
 * @param {{ text: string, animate: boolean }} props
 */
const TypewriterMessage = ({ text, animate = true }) => {
  const { displayedText, isComplete } = useTypewriter(text, 4, animate);

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1.5 h-4 bg-primary-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
      )}
    </span>
  );
};

export default TypewriterMessage;
