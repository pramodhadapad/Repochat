import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { repoService } from '../../services/api';

const FileNode = ({ node, level, onFileSelect, activeFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = activeFile?.path === node.path;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect({ path: node.path, startLine: 1, endLine: 9999 });
    }
  };

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 mx-2 rounded hover:bg-slate-800 cursor-pointer text-slate-300 transition-colors"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={handleClick}
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs truncate select-none">{node.name}</span>
        </div>
        {isOpen && node.children.map((child, i) => (
          <FileNode key={i} node={child} level={level + 1} onFileSelect={onFileSelect} activeFile={activeFile} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 mx-2 rounded cursor-pointer transition-colors ${
        isSelected ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
      style={{ paddingLeft: `${level * 12 + 24}px` }}
      onClick={handleClick}
    >
      <FileCode className="w-3.5 h-3.5 opacity-70" />
      <span className="text-xs truncate select-none">{node.name}</span>
    </div>
  );
};

const FileExplorer = ({ repoId, onFileSelect, activeFile }) => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recloning, setRecloning] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchTree = useCallback(async () => {
    if (!repoId) return;
    try {
      setError(null);
      const res = await repoService.getFileTree(repoId);
      const data = res.data;

      // Server signals files are being re-cloned
      if (data.recloning) {
        setRecloning(true);
        setTree([]);
        // Auto-retry every 10 seconds
        setTimeout(() => setRetryCount(c => c + 1), 10000);
        return;
      }

      setRecloning(false);
      setTree(data.tree || []);
    } catch (err) {
      console.error('Failed to load file tree:', err);
      setError('Failed to load files. Click refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [repoId, retryCount]);

  useEffect(() => {
    if (repoId) {
      setLoading(retryCount === 0);
      const timer = setTimeout(fetchTree, retryCount === 0 ? 1000 : 0);
      return () => clearTimeout(timer);
    }
  }, [repoId, retryCount, fetchTree]);

  const handleManualRefresh = () => {
    setLoading(true);
    setRetryCount(c => c + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-slate-800 w-[260px] flex-shrink-0 z-20">
      <div className="h-10 border-b border-slate-800 flex items-center px-4 shrink-0 bg-[#161b22] justify-between">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Explorer</span>
        <button
          onClick={handleManualRefresh}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Refresh file tree"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 animate-pulse">
              Loading files...
            </span>
          </div>
        ) : recloning ? (
          <div className="flex flex-col items-center justify-center p-6 gap-3 text-center">
            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-500 animate-pulse">
              Restoring Files...
            </span>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Server restarted. Re-cloning your repo automatically. Please wait ~30 seconds.
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-1 flex items-center gap-1.5 text-[10px] text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              Check Now
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 gap-3 text-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-[10px] text-slate-500 leading-relaxed">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 text-[10px] text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 gap-3 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              No files found.
            </p>
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 text-[10px] text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        ) : (
          tree.map((node, i) => (
            <FileNode
              key={i}
              node={node}
              level={0}
              onFileSelect={onFileSelect}
              activeFile={activeFile}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
