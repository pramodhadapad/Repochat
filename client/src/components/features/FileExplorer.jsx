import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode, Loader2 } from 'lucide-react';
import { repoService } from '../../services/api';

const FileNode = ({ node, level, onFileSelect, activeFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const isSelected = activeFile?.path === node.path;

  // Toggle folders, select files
  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      // Create a mock fileRef for the viewer
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

  useEffect(() => {
    if (repoId) {
      let isMounted = true;
      const fetchTree = async () => {
        try {
          const res = await repoService.getFileTree(repoId);
          if (isMounted) setTree(res.data.tree);
        } catch (err) {
          console.error('Failed to load file tree:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      
      // Add slight delay to allow cloning to finish if it just started
      const timer = setTimeout(fetchTree, 1000);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [repoId]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-slate-800 w-[260px] flex-shrink-0 z-20">
      <div className="h-10 border-b border-slate-800 flex items-center px-4 shrink-0 bg-[#161b22]">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
             <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 animate-pulse">Scanning Local Repo...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-500 leading-relaxed">
             No files indexed locally yet.
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
