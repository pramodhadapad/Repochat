import MermaidRenderer from './MermaidRenderer';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

/**
 * Parses a message string and renders:
 * - ```mermaid blocks as interactive diagrams
 * - ```<lang> blocks as syntax-highlighted code with a copy button
 * - Regular text as-is
 */
const SmartMessage = ({ content }) => {
  if (!content) return null;

  // Split content by code fences: ```language\n...\n```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        // Check if this is a code block
        const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
        if (codeMatch) {
          const lang = codeMatch[1].toLowerCase();
          const code = codeMatch[2].trim();

          // Mermaid diagram
          if (lang === 'mermaid') {
            return <MermaidRenderer key={idx} chart={code} />;
          }

          // Regular code block with copy button
          return <CodeBlock key={idx} language={lang} code={code} />;
        }

        // Regular text — preserve line breaks
        if (!part.trim()) return null;
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </div>
  );
};

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-700/30 bg-slate-950">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/50 border-b border-slate-700/30">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-slate-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default SmartMessage;
