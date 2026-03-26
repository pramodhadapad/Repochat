import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'Inter, sans-serif',
});

let renderCounter = 0;

const MermaidRenderer = ({ chart }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const idRef = useRef(`mermaid-${Date.now()}-${renderCounter++}`);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return;
      try {
        const { svg: renderedSvg } = await mermaid.render(idRef.current, chart.trim());
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.warn('[Mermaid] Render failed:', err.message);
        setError('Could not render diagram');
        setSvg('');
      }
    };
    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="my-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-500 font-mono">
        <p className="text-amber-400 mb-1">⚠ Diagram preview unavailable</p>
        <pre className="whitespace-pre-wrap text-slate-500">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-3 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidRenderer;
