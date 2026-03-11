import React from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, MoreHorizontal, Plus, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Explorer = ({ tree, onFileSelect, activeFile }) => {
  const [expanded, setExpanded] = React.useState({ root: true });

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const TreeItem = ({ item, depth = 0, parentPath = '' }) => {
    const currentPath = `${parentPath}/${item.name}`;
    const isOpen = expanded[currentPath];
    const isFile = item.type === 'file';
    const isActive = activeFile === item.path;

    const Icon = isFile ? FileCode : (isOpen ? FolderOpen : Folder);
    const Arrow = isOpen ? ChevronDown : ChevronRight;

    return (
      <div className="w-full">
        <div 
          className={cn(
            "flex items-center py-1 transition-colors cursor-pointer group",
            isActive ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-[#cccccc]",
            depth === 0 ? "pl-4" : ""
          )}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
          onClick={() => isFile ? onFileSelect(item.path) : toggleFolder(currentPath)}
        >
          {!isFile && <Arrow className="w-4 h-4 mr-1 text-[#858585]" />}
          <Icon className={cn("w-4 h-4 mr-2", isFile ? "text-[#519aba]" : "text-[#dcb67a]")} />
          <span className="text-[13px] truncate">{item.name}</span>
        </div>
        
        {!isFile && isOpen && item.children && (
          <div>
            {item.children.map((child, i) => (
              <TreeItem key={i} item={child} depth={depth + 1} parentPath={currentPath} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#2b2b2b] w-64 select-none">
      <div className="px-5 py-3 flex items-center justify-between text-[11px] font-bold text-[#bbbbbb] tracking-wider">
        <span>EXPLORER</span>
        <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Repo Title section */}
        <div className="flex items-center px-4 py-1 gap-1 text-[13px] font-bold text-white bg-[#37373d]/30 mb-1">
            <ChevronDown className="w-4 h-4" />
            <span className="truncate uppercase tracking-tight">Project Workspace</span>
        </div>

        {tree && tree.map((item, i) => (
          <TreeItem key={i} item={item} />
        ))}
        
        {!tree || tree.length === 0 && (
            <div className="px-6 py-10 text-center text-[#858585] text-xs">
                No files found or indexing...
            </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
