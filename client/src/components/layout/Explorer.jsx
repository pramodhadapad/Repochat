import React from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Icon resolution (Material Icon Theme — exact VS Code icons) ──
function getFileIconSrc(filename) {
  const lower = filename.toLowerCase();
  const ext   = lower.split('.').pop();

  const EXT_MAP = {
    py:         'python',
    js:         'javascript',
    mjs:        'javascript',
    cjs:        'javascript',
    jsx:        'jsx',
    ts:         'typescript',
    tsx:        'tsx',
    html:       'html',
    htm:        'html',
    css:        'css',
    scss:       'sass',
    sass:       'sass',
    json:       'json',
    jsonc:      'json',
    yaml:       'yaml',
    yml:        'yaml',
    md:         'markdown',
    mdx:        'markdown',
    pdf:        'pdf',
    svg:        'svg',
    png:        'img',
    jpg:        'img',
    jpeg:       'img',
    gif:        'img',
    webp:       'img',
    ico:        'img',
    sql:        'sql',
    sh:         'shell',
    bash:       'shell',
    zsh:        'shell',
    txt:        'txt',
    log:        'txt',
    zip:        'zip',
    rar:        'zip',
    tar:        'zip',
    gz:         'zip',
    rs:         'rust',
    go:         'go',
    java:       'java',
    php:        'php',
    rb:         'ruby',
    cpp:        'cpp',
    cc:         'cpp',
    c:          'cpp',
    cs:         'csharp',
    kt:         'kotlin',
    swift:      'swift',
    dart:       'dart',
    scala:      'scala',
    svelte:     'svelte',
    vue:        'vue',
    ps1:        'powershell',
    dockerfile: 'docker',
  };

  // Special filenames
  if (lower === 'dockerfile')        return '/icons/docker.svg';
  if (lower === '.env' || lower.startsWith('.env')) return '/icons/default.svg';
  if (lower === 'requirements.txt')  return '/icons/python.svg';
  if (lower === 'makefile')          return '/icons/default.svg';
  if (lower === 'package.json' || lower === 'package-lock.json') return '/icons/json.svg';
  if (lower === '.gitignore' || lower === '.gitattributes') return '/icons/git.svg';
  if (lower === 'readme.md')         return '/icons/markdown.svg';
  if (lower === 'docker-compose.yml' || lower === 'docker-compose.yaml') return '/icons/docker.svg';

  const iconName = EXT_MAP[ext];
  return iconName ? `/icons/${iconName}.svg` : '/icons/default.svg';
}

function getFolderIconSrc(name, isOpen) {
  const lower = name.toLowerCase();
  const FOLDER_MAP = {
    src:        'folder-src',
    source:     'folder-src',
    public:     'folder-public',
    components: 'folder-components',
    css:        'folder-css',
    styles:     'folder-css',
    utils:      'folder-utils',
    util:       'folder-utils',
    helpers:    'folder-utils',
    templates:  'folder-template',
    template:   'folder-template',
  };

  const base = FOLDER_MAP[lower];
  if (base) {
    const openSuffix = isOpen ? '-open' : '';
    // Check if open variant exists, else fall back
    return `/icons/${base}${openSuffix}.svg`;
  }

  return isOpen ? '/icons/folder-open.svg' : '/icons/folder.svg';
}

// ── Tree Item ──────────────────────────────────────────────
const TreeItem = ({ item, depth = 0, expanded, toggleFolder, onFileSelect, activeFile, parentPath = '' }) => {
  const currentPath = `${parentPath}/${item.name}`;
  const isOpen = !!expanded[currentPath];
  const isFile = item.type === 'file';
  const isActive = activeFile === item.path;

  return (
    <div>
      <div
        className={cn(
          'flex items-center cursor-pointer relative group',
          isActive ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
        )}
        style={{ height: 22, paddingLeft: `${depth * 12 + 4}px`, paddingRight: 8 }}
        onClick={() => isFile ? onFileSelect(item.path) : toggleFolder(currentPath)}
      >
        {/* VS Code indent guides */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: `${i * 12 + 16}px`,
              borderLeft: '1px solid rgba(255,255,255,0.07)',
            }}
          />
        ))}

        {/* Chevron */}
        <span style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!isFile && (
            isOpen
              ? <ChevronDown  size={14} color="#c5c5c5" />
              : <ChevronRight size={14} color="#c5c5c5" />
          )}
        </span>

        {/* Icon */}
        <img
          src={isFile ? getFileIconSrc(item.name) : getFolderIconSrc(item.name, isOpen)}
          alt=""
          style={{ width: 16, height: 16, marginRight: 6, marginLeft: 2, flexShrink: 0, objectFit: 'contain' }}
        />

        {/* Label */}
        <span style={{
          fontSize: 13,
          color: isActive ? '#ffffff' : '#cccccc',
          fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
          fontWeight: 400,
          lineHeight: '22px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em',
        }}>
          {item.name}
        </span>
      </div>

      {/* Children */}
      {!isFile && isOpen && item.children?.map((child, i) => (
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
  );
};

// ── Main Explorer ──────────────────────────────────────────
const Explorer = ({ tree, onFileSelect, activeFile }) => {
  const [expanded, setExpanded] = React.useState({ root: true });

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#252526',
      borderRight: '1px solid #1e1e1e',
      width: 256,
      userSelect: 'none',
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#bbbcbe', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Explorer
        </span>
        <MoreHorizontal size={16} color="#858585" style={{ cursor: 'pointer' }} />
      </div>

      {/* Workspace section header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', cursor: 'pointer', background: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = '#2a2d2e'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => setExpanded(prev => ({ ...prev, root: !prev.root }))}
      >
        {expanded.root
          ? <ChevronDown  size={14} color="#cccccc" />
          : <ChevronRight size={14} color="#cccccc" />
        }
        <span style={{ fontSize: 11, fontWeight: 700, color: '#bbbbbb', letterSpacing: '0.1em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Project Workspace
        </span>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#424242 transparent' }}>
        {expanded.root && tree?.map((item, i) => (
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
          <p style={{ padding: '40px 16px', textAlign: 'center', color: '#858585', fontSize: 12 }}>
            No files found or indexing...
          </p>
        )}
      </div>
    </div>
  );
};

export default Explorer;
