import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, AlertCircle, List, ChevronUp, ChevronDown } from 'lucide-react';

const BottomPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('terminal');
  const [terminalOutput, setTerminalOutput] = useState([
    'Welcome to RepoChat Terminal v2.0',
    'Type "help" for a list of available AI workspace commands.',
    'study@ai-workspace:~$ '
  ]);
  const [inputValue, setInputValue] = useState('');
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = inputValue.trim().toLowerCase();
      let response = '';

      switch (cmd) {
        case 'help':
          response = 'Available commands:\n- help: Show this message\n- clear: Clear terminal\n- index: Check indexing status\n- status: Workspace health\n- whoami: User info';
          break;
        case 'clear':
          setTerminalOutput(['study@ai-workspace:~$ ']);
          setInputValue('');
          return;
        case 'index':
          response = 'Repository indexing at 100%. All vectors active.';
          break;
        case 'status':
          response = 'Workspace: Healthy\nLLM Connectivity: Active\nSocket: Connected';
          break;
        case 'whoami':
          response = 'AI Study Assistant - Authorized User';
          break;
        case '':
          break;
        default:
          response = `Command not found: ${cmd}`;
      }

      setTerminalOutput(prev => [
        ...prev.slice(0, -1),
        `study@ai-workspace:~$ ${inputValue}`,
        response,
        'study@ai-workspace:~$ '
      ].filter(line => line !== ''));
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-64 bg-[#1e1e1e] border-t border-black flex flex-col z-40">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-4 h-9 bg-[#252526] select-none">
        <div className="flex items-center gap-6 h-full">
          <button 
            onClick={() => setActiveTab('problems')}
            className={`text-[11px] uppercase tracking-wider font-bold h-full border-b-2 transition-all ${activeTab === 'problems' ? 'text-white border-[#007acc]' : 'text-[#858585] border-transparent hover:text-white'}`}
          >
            Problems
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`text-[11px] uppercase tracking-wider font-bold h-full border-b-2 transition-all ${activeTab === 'output' ? 'text-white border-[#007acc]' : 'text-[#858585] border-transparent hover:text-white'}`}
          >
            Output
          </button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`text-[11px] uppercase tracking-wider font-bold h-full border-b-2 transition-all ${activeTab === 'terminal' ? 'text-white border-[#007acc]' : 'text-[#858585] border-transparent hover:text-white'}`}
          >
            Terminal
          </button>
        </div>
        <div className="flex items-center gap-3">
            <X 
              className="w-4 h-4 text-[#858585] hover:text-white cursor-pointer" 
              onClick={onClose}
            />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-2 font-mono text-[13px]">
        {activeTab === 'terminal' && (
          <div 
            ref={terminalRef}
            className="h-full overflow-y-auto bg-[#1e1e1e] text-[#cccccc] p-2 custom-scrollbar"
          >
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap mb-1">
                {line.startsWith('study@ai-workspace:~$') ? (
                    <span className="text-[#00c9ff]">{line}</span>
                ) : line}
              </div>
            ))}
            <div className="flex items-center">
                <span className="text-[#00c9ff] mr-2">study@ai-workspace:~$</span>
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent border-none outline-none text-[#cccccc]"
                    autoFocus
                />
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="flex flex-col items-center justify-center h-full text-[#858585]">
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            <p>No problems have been detected in the workspace.</p>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-y-auto text-[#cccccc] p-2">
            <p className="text-[#858585]">[INFO] Initializing workspace build...</p>
            <p className="text-[#858585]">[INFO] AI Model selection: Llama 3.3 70B</p>
            <p className="text-[#858585]">[INFO] Context window optimized for 8k tokens</p>
            <p className="text-green-500">[SUCCESS] Semantic indexing complete.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
