import React from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── File type icon config (VS Code style) ─────────────────
const FILE_ICONS = {
  py:    { label: 'PY',  bg: '#3572A5', color: '#fff' },
  js:    { label: 'JS',  bg: '#F0DB4F', color: '#222' },
  jsx:   { label: 'JSX', bg: '#61DAFB', color: '#222' },
  mjs:   { label: 'JS',  bg: '#F0DB4F', color: '#222' },
  ts:    { label: 'TS',  bg: '#3178C6', color: '#fff' },
  tsx:   { label: 'TSX', bg: '#3178C6', color: '#fff' },
  html:  { label: 'HTM', bg: '#E34C26', color: '#fff' },
  css:   { label: 'CSS', bg: '#264de4', color: '#fff' },
  scss:  { label: 'CSS', bg: '#CC6699', color: '#fff' },
  sass:  { label: 'CSS', bg: '#CC6699', color: '#fff' },
  sql:   { label: 'SQL', bg: '#e38c00', color: '#fff' },
  json:  { label: '{ }', bg: '#cbcb41', color: '#222' },
  yaml:  { label: 'YML', bg: '#cb171e', color: '#fff' },
  yml:   { label: 'YML', bg: '#cb171e', color: '#fff' },
  xml:   { label: 'XML', bg: '#e37933', color: '#fff' },
  csv:   { label: 'CSV', bg: '#89e051', color: '#222' },
  md:    { label: 'MD',  bg: '#519aba', color: '#fff' },
  txt:   { label: 'TXT', bg: '#6d8086', color: '#fff' },
  pdf:   { label: 'PDF', bg: '#b30b00', color: '#fff' },
  env:   { label: 'ENV', bg: '#ecd53f', color: '#222' },
  toml:  { label: 'CFG', bg: '#9c4221', color: '#fff' },
  ini:   { label: 'INI', bg: '#6d8086', color: '#fff' },
  sh:    { label: 'SH',  bg: '#4EAA25', color: '#fff' },
  bash:  { label: 'SH',  bg: '#4EAA25', color: '#fff' },
  png:   { label: 'IMG', bg: '#a074c4', color: '#fff' },
  jpg:   { label: 'IMG', bg: '#a074c4', color: '#fff' },
  jpeg:  { label: 'IMG', bg: '#a074c4', color: '#fff' },
  svg:   { label: 'SVG', bg: '#FFB13B', color: '#222' },
  gif:   { label: 'GIF', bg: '#a074c4', color: '#fff' },
  dockerfile: { label: 'DOC', bg: '#2496ED', color: '#fff' },
  default:    { label: '···', bg: '#6d8086', color: '#fff' },
};

function getFileIcon(filename) {
  const lower = filename.toLowerCase();
  if (lower === 'dockerfile') return FILE_ICONS.dockerfile;
  if (lower === '.env' || lower.startsWith('.env')) return FILE_ICONS.env;
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

const FileIconBadge = ({ filename }) => {
  const icon = getFileIcon(filename);
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm mr-2 flex-shrink-0"
      style={{
        backgroundColor: icon.bg,
        color: icon.color,
        minWidth: '22px',
        height: '16px',
        padding: '0 2px',
        fontSize: '8px',
        fontWeight: 'bold',
        letterSpacing: '0.02em',
        fontFamily: 'monospace',
      }}
    >
      {icon.label}
    </span>
  );
};

const FolderIcon = ({ isOpen }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="mr-2 flex-shrink-0" fill={isOpen ? '#dcb67a' : '#c09553'}>
    {isOpen
      ? <path d="M1.5 3h4.586l1.707 1.707A1 1 0 008.5 5H14.5a1 1 0 011 1v6a1 1 0 01-1 1h-13a1 1 0 01-1-1V4a1 1 0 011-1z"/>
      : <path d="M1.5 3h4.586l1.707 1.707A1 1 0 008.5 5H14.5a1 1 0 011 1v5a1 1 0 01-1 1h-13a1 1 0 01-1-1V4a1 1 0 011-1z"/>
    }
  </svg>
);

const TreeItem = ({ item, depth = 0, expanded, toggleFolder, onFileSelect, activeFile, parentPath = '' }) => {
  const currentPath = `${parentPath}/${item.name}`;
  const isOpen = expanded[currentPath];
  const isFile = item.type === 'file';
  const isActive = activeFile === item.path;

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center py-[3px] cursor-pointer relative transition-colors',
          isActive ? 'bg-[#094771] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px' }}
        onClick={() => isFile ? onFileSelect(item.path) : toggleFolder(currentPath)}
      >
        {depth > 0 && Array.from({ length: depth }).map((_, i) => (
          <span key={i} className="absolute top-0 bottom-0 border-l border-[#3c3c3c]" style={{ left: `${i * 12 + 14}px` }} />
        ))}

        {!isFile ? (
          <span className="flex-shrink-0 mr-1">
            {isOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />
            }
          </span>
        ) : (
          <span className="w-[18px] flex-shrink-0" />
        )}

        {isFile ? <FileIconBadge filename={item.name} /> : <FolderIcon isOpen={isOpen} />}

        <span className="text-[13px] truncate leading-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          {item.name}
        </span>
      </div>

      {!isFile && isOpen && item.children && (
        <div>
          {item.children.map((child, i) => (
            <TreeItem key={i} item={child} depth={depth + 1} parentPath={currentPath} expanded={expanded} toggleFolder={toggleFolder} onFileSelect={onFileSelect} activeFile={activeFile} />
          ))}
        </div>
      )}
    </div>
  );
};

const Explorer = ({ tree, onFileSelect, activeFile }) => {
  const [expanded, setExpanded] = React.useState({ root: true });

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#1e1e1e] w-64 select-none">
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#bbbcbe] tracking-[0.12em] uppercase">Explorer</span>
        <MoreHorizontal className="w-4 h-4 text-[#858585] cursor-pointer hover:text-white" />
      </div>

      <div className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e]" onClick={() => setExpanded(prev => ({ ...prev, root: !prev.root }))}>
        {expanded.root ? <ChevronDown className="w-3.5 h-3.5 text-[#cccccc]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#cccccc]" />}
        <span className="text-[11px] font-bold text-[#bbbbbb] tracking-[0.1em] uppercase truncate">Project Workspace</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {expanded.root && tree && tree.map((item, i) => (
          <TreeItem key={i} item={item} expanded={expanded} toggleFolder={toggleFolder} onFileSelect={onFileSelect} activeFile={activeFile} />
        ))}
        {(!tree || tree.length === 0) && (
          <div className="px-6 py-10 text-center text-[#858585] text-xs">No files found or indexing...</div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
