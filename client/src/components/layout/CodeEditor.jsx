import React from 'react';
import Editor from '@monaco-editor/react';
import { X, FileCode } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CodeEditor = ({ fileContent, filePath, isEditable, onTabClose, highlightLine }) => {
  const getLanguage = (path) => {
    if (!path) return 'javascript';
    const ext = path.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return map[ext] || 'javascript';
  };

  if (!filePath) {
    return (
      <div className="flex-1 bg-[#1e1e1e] flex flex-center items-center justify-center">
        <div className="text-center opacity-20">
            <svg width="128" height="128" viewBox="0 0 16 16" fill="white" className="mx-auto mb-4">
               <path d="M14.5 1H1.5C1.22386 1 1 1.22386 1 1.5V14.5C1 14.7761 1.22386 15 1.5 15H14.5C14.7761 15 15 14.7761 15 14.5V1.5C15 1.22386 14.7761 1 14.5 1ZM14 14H2V2H14V14Z" opacity="0.5"/>
               <path d="M12 4H4V12H12V4ZM11 11H5V5H11V11Z" opacity="0.5"/>
            </svg>
            <p className="text-xl font-medium">RepoChat</p>
            <p className="text-sm mt-2">Select a file to start studying</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Tab Bar */}
      <div className="h-9 bg-[#252526] flex items-center overflow-x-auto select-none border-b border-black">
        <div className="bg-[#1e1e1e] px-3 h-full flex items-center gap-2 border-r border-black relative group min-w-[120px]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-[#007acc]" />
          <FileCode className="w-4 h-4 text-[#519aba]" />
          <span className="text-[13px] text-white truncate max-w-[150px]">{filePath.split('/').pop()}</span>
          {isEditable && <span className="ml-1 text-[8px] text-[#007acc] animate-pulse">●</span>}
          <X 
            className="w-3.5 h-3.5 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors ml-2" 
            onClick={onTabClose}
          />
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          theme="vs-dark"
          path={filePath}
          defaultLanguage={getLanguage(filePath)}
          value={fileContent || '// Loading content...'}
          onMount={(editor) => {
              if (highlightLine) {
                  editor.revealLineInCenter(highlightLine);
                  editor.setSelection({
                      startLineNumber: highlightLine,
                      startColumn: 1,
                      endLineNumber: highlightLine,
                      endColumn: 1000
                  });
              }
          }}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10 },
            readOnly: !isEditable,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            renderLineHighlight: 'all'
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
