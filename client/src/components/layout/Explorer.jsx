import React from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── VS Code style SVG icons per file type ─────────────────
const FileTypeIcon = ({ filename, size = 16 }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const lower = filename.toLowerCase();

  // Python
  if (ext === 'py') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M15.885 2.1c-7.1 0-6.651 3.07-6.651 3.07v3.179h6.764v.951H6.545S2 8.85 2 16.005s4.013 6.912 4.013 6.912H8.33v-3.322s-.13-4.012 3.95-4.012h6.8s3.817.061 3.817-3.688V5.8s.574-3.7-6.012-3.7zm-3.773 2.13a1.214 1.214 0 1 1-1.214 1.214 1.213 1.213 0 0 1 1.214-1.213z" fill="#387EB8"/>
      <path d="M16.115 29.9c7.1 0 6.651-3.07 6.651-3.07v-3.179H15.99v-.95h9.451S30 23.15 30 15.995s-4.011-6.912-4.011-6.912H23.67v3.322s.13 4.012-3.948 4.012h-6.8s-3.817-.061-3.817 3.688v6.108S8.531 29.9 16.115 29.9zm3.773-2.13A1.214 1.214 0 1 1 21.1 26.56a1.214 1.214 0 0 1-1.214 1.214z" fill="#FFE873"/>
    </svg>
  );

  // JavaScript
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#F0DB4F"/>
      <path d="M20.809 23.875a2.866 2.866 0 0 0 2.6 1.6c1.09 0 1.787-.545 1.787-1.3 0-.9-.716-1.222-1.916-1.747l-.658-.282c-1.9-.809-3.16-1.822-3.16-3.964 0-1.973 1.5-3.476 3.853-3.476a3.889 3.889 0 0 1 3.742 2.107L25.5 18.1a1.79 1.79 0 0 0-1.688-1.118 1.148 1.148 0 0 0-1.261 1.119c0 .784.484 1.1 1.6 1.585l.658.282c2.236.956 3.5 1.932 3.5 4.124 0 2.363-1.857 3.664-4.353 3.664a5.015 5.015 0 0 1-4.761-2.679zm-9.295.228c.413.733.789 1.353 1.693 1.353.864 0 1.41-.338 1.41-1.653v-8.947h2.484v8.982c0 2.724-1.6 3.964-3.926 3.964a4.079 4.079 0 0 1-3.929-2.418z" fill="#323330"/>
    </svg>
  );

  // JSX
  if (ext === 'jsx') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#61DAFB"/>
      <circle cx="16" cy="16" r="3" fill="#20232A"/>
      <g stroke="#20232A" strokeWidth="1.3" fill="none">
        <ellipse rx="9" ry="3.5" cx="16" cy="16"/>
        <ellipse rx="9" ry="3.5" cx="16" cy="16" transform="rotate(60 16 16)"/>
        <ellipse rx="9" ry="3.5" cx="16" cy="16" transform="rotate(120 16 16)"/>
      </g>
    </svg>
  );

  // TypeScript
  if (ext === 'ts') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#3178C6"/>
      <path d="M18.245 23.759v2.007c.328.169.716.298 1.165.387s.91.133 1.385.133c.464 0 .904-.05 1.316-.15s.77-.256 1.072-.467.539-.475.712-.793.257-.706.257-1.164c0-.337-.051-.635-.153-.895s-.254-.494-.46-.704-.463-.4-.766-.575-.659-.349-1.068-.521c-.29-.112-.541-.219-.752-.323s-.389-.209-.531-.317-.247-.222-.315-.345a.836.836 0 0 1-.103-.415c0-.146.026-.27.079-.371s.129-.186.228-.256.217-.121.354-.154.293-.049.464-.049a3.48 3.48 0 0 1 .574.05c.194.033.381.086.56.159.184.073.357.16.518.261s.305.21.432.328V20.3a4.626 4.626 0 0 0-.988-.27 7.018 7.018 0 0 0-1.204-.094 4.81 4.81 0 0 0-1.305.171 3.22 3.22 0 0 0-1.066.504 2.41 2.41 0 0 0-.715.823 2.408 2.408 0 0 0-.261 1.145c0 .584.166 1.084.497 1.5a4.56 4.56 0 0 0 1.441 1.067c.311.136.597.27.856.397s.479.255.658.382.317.265.41.404a.933.933 0 0 1 .139.516c0 .145-.026.276-.079.393s-.134.219-.244.31-.253.162-.43.213-.399.076-.666.076a3.5 3.5 0 0 1-1.384-.287 3.884 3.884 0 0 1-1.197-.833z" fill="#fff"/>
      <path d="M10.4 20.518h3.056v-1.986H5.017v1.986h3.044V28h2.339z" fill="#fff"/>
    </svg>
  );

  // TSX
  if (ext === 'tsx') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#3178C6"/>
      <path d="M9 20.5h3v-8h-3v8zm6-8v8h3v-3h3v-5h-6zm3 3h-3v-1.5h3V15.5z" fill="#61DAFB" opacity="0.9"/>
    </svg>
  );

  // HTML
  if (ext === 'html' || ext === 'htm') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30z" fill="#E44D26"/>
      <path d="M16 27.858l8.17-2.265 1.922-21.532H16z" fill="#F16529"/>
      <path d="M16 13.407h-4.09l-.282-3.165H16V7.151H8.25l.074.83.759 8.517H16zm0 8.34l-.014.004-3.442-.929-.22-2.465H9.221l.433 4.852 6.332 1.758.014-.004z" fill="#EBEBEB"/>
      <path d="M15.989 13.407v3.091h3.806l-.358 4.003-3.448.93v3.216l6.337-1.757.046-.522.726-8.131.076-.83zm0-6.256v3.091h7.466l.062-.694.141-1.567.074-.83z" fill="#fff"/>
    </svg>
  );

  // CSS
  if (ext === 'css') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30z" fill="#1572B6"/>
      <path d="M16 27.858l8.17-2.265 1.922-21.532H16z" fill="#33A9DC"/>
      <path d="M16 13.191h-4.046l-.28-3.139H16V7.012H8.309l.074.83.766 8.518H16zm0 8.548l-.013.004-3.443-.93-.22-2.464H9.221l.432 4.851 6.332 1.758.015-.004z" fill="#EBEBEB"/>
      <path d="M15.989 13.191v3.139h3.772l-.355 3.967-3.417.922v3.219l6.318-1.754.046-.521.725-8.108.074-.864zm0-6.179v3.14h7.379l.061-.694.142-1.576.073-.87z" fill="#fff"/>
    </svg>
  );

  // SCSS
  if (ext === 'scss' || ext === 'sass') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <circle cx="16" cy="16" r="14" fill="#CD6799"/>
      <path d="M16 8c-4.4 0-6.5 2.1-6.5 4.7 0 3.7 4.5 4.4 4.5 6.5 0 1-.7 1.7-2 1.7-1.5 0-3-1-3-1L8.5 21s1.5 1.2 3.8 1.2c3 0 5.5-1.8 5.5-4.9 0-3.6-4.5-4.5-4.5-6.4 0-.8.5-1.5 1.8-1.5 1.3 0 2.5.7 2.5.7l.5-1.8S18.2 8 16 8z" fill="#fff"/>
    </svg>
  );

  // SQL
  if (ext === 'sql') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#e38c00"/>
      <ellipse cx="16" cy="10" rx="9" ry="4" fill="none" stroke="#fff" strokeWidth="1.5"/>
      <path d="M7 10v4c0 2.2 4 4 9 4s9-1.8 9-4v-4" fill="none" stroke="#fff" strokeWidth="1.5"/>
      <path d="M7 14v4c0 2.2 4 4 9 4s9-1.8 9-4v-4" fill="none" stroke="#fff" strokeWidth="1.5"/>
    </svg>
  );

  // JSON
  if (ext === 'json') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#cbcb41"/>
      <path d="M10 9c-1.5 0-2 .7-2 2v2c0 1.2-.9 2-2 2 1.1 0 2 .8 2 2v2c0 1.3.5 2 2 2" fill="none" stroke="#323330" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 9c1.5 0 2 .7 2 2v2c0 1.2.9 2 2 2-1.1 0-2 .8-2 2v2c0 1.3-.5 2-2 2" fill="none" stroke="#323330" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  // YAML
  if (ext === 'yaml' || ext === 'yml') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#cb171e"/>
      <path d="M7 10h4l3 4 3-4h4l-5 7v5h-4v-5z" fill="#fff"/>
    </svg>
  );

  // Markdown
  if (ext === 'md' || ext === 'mdx') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="6" width="28" height="20" rx="3" fill="#519aba"/>
      <path d="M5 22V10h3l3 4 3-4h3v12h-3v-7l-3 4-3-4v7zm17-6v-6h3l-4.5 6H25v2h-8v-2z" fill="#fff"/>
    </svg>
  );

  // PDF
  if (ext === 'pdf') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M20 2H8a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10z" fill="#b30b00"/>
      <path d="M20 2l6 8h-6z" fill="#ff6b6b"/>
      <text x="8" y="22" fontSize="8" fill="#fff" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );

  // ENV
  if (lower === '.env' || lower.startsWith('.env')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#ecd53f"/>
      <text x="6" y="22" fontSize="9" fill="#333" fontWeight="bold" fontFamily="monospace">ENV</text>
    </svg>
  );

  // Shell
  if (ext === 'sh' || ext === 'bash' || ext === 'zsh') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#4EAA25"/>
      <path d="M8 11l6 5-6 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <line x1="16" y1="21" x2="24" y2="21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  // SVG file
  if (ext === 'svg') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#FFB13B"/>
      <text x="5" y="22" fontSize="9" fill="#333" fontWeight="bold" fontFamily="monospace">SVG</text>
    </svg>
  );

  // Images
  if (['png','jpg','jpeg','gif','webp','ico'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="4" width="28" height="24" rx="3" fill="#a074c4"/>
      <circle cx="11" cy="12" r="3" fill="#fff" opacity="0.7"/>
      <path d="M2 22l8-8 5 5 4-4 9 9" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.9"/>
    </svg>
  );

  // Dockerfile
  if (lower === 'dockerfile' || lower.includes('dockerfile')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#2496ED"/>
      <path d="M5 15h4v4H5zm5 0h4v4h-4zm5 0h4v4h-4zm5-5h4v4h-4zm-10 0h4v4h-4zm5 0h4v4h-4z" fill="#fff" opacity="0.9"/>
      <path d="M26 13s1.5-1 3 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );

  // TXT / generic text
  if (ext === 'txt' || ext === 'log') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M20 2H8a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10z" fill="#6d8086"/>
      <path d="M20 2l6 8h-6z" fill="#9db0b8"/>
      <path d="M10 15h12M10 19h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  // ZIP
  if (ext === 'zip' || ext === 'rar' || ext === 'tar' || ext === 'gz') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M20 2H8a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10z" fill="#7f7f7f"/>
      <path d="M20 2l6 8h-6z" fill="#aaa"/>
      <path d="M14 4h4v2h-4zm0 4h4v2h-4zm0 4h4v2h-4zm-2 4h8v8h-8z" fill="#fff" opacity="0.8"/>
    </svg>
  );

  // Requirements.txt / special files
  if (lower === 'requirements.txt') return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="#3572A5"/>
      <path d="M8 10h16M8 15h12M8 20h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  // Default: generic file
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}}>
      <path d="M20 2H8a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10z" fill="#6d8086"/>
      <path d="M20 2l6 8h-6z" fill="#9db0b8"/>
    </svg>
  );
};

// ── Folder icon ────────────────────────────────────────────
const FolderIcon = ({ isOpen, name }) => {
  const specialFolders = {
    'node_modules': '#c8a96e',
    '.git': '#e37933',
    'src': '#dcb67a',
    'components': '#dcb67a',
    'pages': '#dcb67a',
    'static': '#dcb67a',
    'templates': '#dcb67a',
    'utils': '#dcb67a',
    'public': '#dcb67a',
    'assets': '#dcb67a',
    '__pycache__': '#888',
    '.vscode': '#23a9f2',
  };
  const color = specialFolders[name?.toLowerCase()] || '#dcb67a';
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" style={{flexShrink:0, marginRight:6}} fill={isOpen ? color : '#c09553'}>
      {isOpen
        ? <path d="M3 7a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l1.828 1.828A2 2 0 0 0 16.828 8H27a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        : <path d="M3 7a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l1.828 1.828A2 2 0 0 0 16.828 8H27a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      }
    </svg>
  );
};

// ── Tree item ──────────────────────────────────────────────
const TreeItem = ({ item, depth = 0, expanded, toggleFolder, onFileSelect, activeFile, parentPath = '' }) => {
  const currentPath = `${parentPath}/${item.name}`;
  const isOpen = expanded[currentPath];
  const isFile = item.type === 'file';
  const isActive = activeFile === item.path;

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center py-[2px] cursor-pointer relative transition-colors',
          isActive ? 'bg-[#094771] text-white' : 'hover:bg-[#2a2d2e] text-[#cccccc]'
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px`, paddingRight: '8px' }}
        onClick={() => isFile ? onFileSelect(item.path) : toggleFolder(currentPath)}
      >
        {/* Indent guides */}
        {depth > 0 && Array.from({ length: depth }).map((_, i) => (
          <span key={i} className="absolute top-0 bottom-0 border-l border-[#3c3c3c]" style={{ left: `${i * 12 + 10}px` }} />
        ))}

        {/* Chevron */}
        {!isFile ? (
          <span style={{flexShrink:0, marginRight:2, display:'flex', alignItems:'center'}}>
            {isOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
              : <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />
            }
          </span>
        ) : (
          <span style={{width:16, flexShrink:0, marginRight:2}} />
        )}

        {/* Icon */}
        {isFile
          ? <FileTypeIcon filename={item.name} size={16} />
          : <FolderIcon isOpen={isOpen} name={item.name} />
        }

        {/* Name */}
        <span style={{ fontSize:13, fontFamily:"'Segoe UI', system-ui, sans-serif", whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:'20px' }}>
          {item.name}
        </span>
      </div>

      {/* Children */}
      {!isFile && isOpen && item.children && (
        <div>
          {item.children.map((child, i) => (
            <TreeItem
              key={i}
              item={child}
              depth={depth + 1}
              parentPath={currentPath}
              expanded={expanded}
              toggleFolder={toggleFolder}
              onFileSelect={onFileSelect}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Explorer ──────────────────────────────────────────
const Explorer = ({ tree, onFileSelect, activeFile }) => {
  const [expanded, setExpanded] = React.useState({ root: true });

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#1e1e1e] w-64 select-none">

      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span style={{fontSize:11, fontWeight:700, color:'#bbbcbe', letterSpacing:'0.12em', textTransform:'uppercase'}}>Explorer</span>
        <MoreHorizontal className="w-4 h-4 text-[#858585] cursor-pointer hover:text-white" />
      </div>

      {/* Workspace section */}
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e]"
        onClick={() => setExpanded(prev => ({ ...prev, root: !prev.root }))}
      >
        {expanded.root
          ? <ChevronDown className="w-3.5 h-3.5 text-[#cccccc]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[#cccccc]" />
        }
        <span style={{fontSize:11, fontWeight:700, color:'#bbbbbb', letterSpacing:'0.1em', textTransform:'uppercase', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          Project Workspace
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{scrollbarWidth:'thin', scrollbarColor:'#424242 transparent'}}>
        {expanded.root && tree && tree.map((item, i) => (
          <TreeItem
            key={i}
            item={item}
            expanded={expanded}
            toggleFolder={toggleFolder}
            onFileSelect={onFileSelect}
            activeFile={activeFile}
          />
        ))}
        {(!tree || tree.length === 0) && (
          <div style={{padding:'40px 24px', textAlign:'center', color:'#858585', fontSize:12}}>
            No files found or indexing...
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
