import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, Copy, Maximize2, Loader2, AlertCircle } from 'lucide-react';
import { repoService } from '../../services/api';
import useStore from '../../store/useStore';

const CodePreview = ({ activeFile }) => {
  const { currentRepo } = useStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeFile && currentRepo) {
      const fetchFile = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await repoService.getFileContent(currentRepo._id, activeFile.path);
          setContent(res.data.content);
        } catch (err) {
          console.error('Failed to load file:', err);
          setError('Failed to load file content.');
        } finally {
          setLoading(false);
        }
      };
      fetchFile();
    }
  }, [activeFile, currentRepo]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#0d1117]">
        <div className="h-10 border-b border-slate-800 bg-[#161b22] flex items-center px-4">
           {/* Empty tabs area */}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center pt-24">
          <div className="w-24 h-24 mb-6 opacity-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-500 mb-8 tracking-tight">RepoChat IDE</h2>
          
          <div className="space-y-3 text-sm text-slate-500 w-full max-w-[320px] mx-auto text-left">
             <div className="flex justify-between items-center px-4 py-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
               <span className="font-medium">Search Repository</span>
               <kbd className="px-2 py-1 bg-slate-800 rounded shadow text-[10px] font-mono tracking-widest text-slate-400">⌘ + K</kbd>
             </div>
             <div className="flex justify-between items-center px-4 py-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
               <span className="font-medium">Toggle AI Chat</span>
               <kbd className="px-2 py-1 bg-slate-800 rounded shadow text-[10px] font-mono tracking-widest text-slate-400">⌘ + J</kbd>
             </div>
             <div className="flex justify-between items-center px-4 py-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
               <span className="font-medium">Explore Hot Files</span>
               <kbd className="px-2 py-1 bg-slate-800 rounded shadow text-[10px] font-mono tracking-widest text-slate-400">Ctrl + H</kbd>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-sm font-medium uppercase tracking-widest text-slate-500 animate-pulse">Fetching source...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-8 text-center">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">Error Loading File</h3>
            <p className="text-sm">{error}</p>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117]">
      <div className="flex items-center justify-between bg-[#161b22] border-b border-slate-800 overflow-visible pr-4">
        <div className="flex items-center h-10 overflow-x-auto custom-scrollbar">
          <div className="h-full px-4 bg-[#0d1117] border-r border-slate-800 border-t border-t-primary-500 flex items-center gap-2 min-w-[120px] max-w-[200px]">
            <FileCode className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-medium font-mono text-slate-300 truncate">
              {activeFile.path.split('/').pop()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
           <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors" title="Copy Code">
              <Copy className="w-3.5 h-3.5" />
           </button>
           <button className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors" title="Toggle Fullscreen">
              <Maximize2 className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      <div className="h-7 border-b border-slate-800/50 bg-[#0d1117] flex items-center px-4 gap-2 text-[10px] text-slate-500 font-mono tracking-tight overflow-x-auto whitespace-nowrap custom-scrollbar">
         {currentRepo?.name} <span className="text-slate-700">›</span>
         {activeFile.path.split('/').map((part, i, arr) => (
           <span key={i} className="flex items-center gap-2">
             <span className="hover:text-slate-300 cursor-pointer transition-colors">{part}</span>
             {i < arr.length - 1 && <span className="text-slate-700">›</span>}
           </span>
         ))}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <SyntaxHighlighter
          language={activeFile.path.split('.').pop() === 'js' ? 'javascript' : 'typescript'}
          style={vscDarkPlus}
          showLineNumbers={true}
          startingLineNumber={1}
          wrapLines={true}
          lineProps={lineNumber => {
            let style = { display: 'block' };
            if (lineNumber >= activeFile.startLine && lineNumber <= activeFile.endLine) {
              style.backgroundColor = 'rgba(14, 165, 233, 0.15)';
              style.borderLeft = '4px solid #0ea5e9';
            }
            return { style };
          }}
          customStyle={{
            margin: 0,
            padding: '2rem 1rem',
            fontSize: '0.82rem',
            backgroundColor: 'transparent',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace'
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodePreview;
