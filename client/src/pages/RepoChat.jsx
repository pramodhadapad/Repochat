import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import socketService from '../services/socket';
import { repoService } from '../services/api';
import { toast } from 'react-hot-toast';

// VS Code Components
import TopMenuBar from '../components/layout/TopMenuBar';
import ActivityBar from '../components/layout/ActivityBar';
import Explorer from '../components/layout/Explorer';
import CodeEditor from '../components/layout/CodeEditor';
import ChatWindow from '../components/features/ChatWindow';
import BottomPanel from '../components/layout/BottomPanel';

// Placeholder panels for Search and Source Control (implemented later)
const SearchPanel = () => (
    <div className="w-64 bg-[#252526] h-full p-4 border-r border-[#2b2b2b]">
        <h2 className="text-[11px] font-bold text-[#bbbbbb] mb-4 uppercase tracking-wider">Search</h2>
        <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1 text-sm rounded-sm"
        />
        <p className="text-[11px] text-[#858585] mt-4">Search functionality integration pending index search API...</p>
    </div>
);

const SourceControlPanel = () => (
    <div className="w-64 bg-[#252526] h-full p-4 border-r border-[#2b2b2b]">
        <h2 className="text-[11px] font-bold text-[#bbbbbb] mb-4 uppercase tracking-wider">Source Control</h2>
        <div className="flex flex-col gap-2">
            <div className="bg-[#37373d] p-2 text-xs rounded border border-[#454545]">
                <p className="text-white font-medium">Changes</p>
                <p className="text-[#858585] mt-1">No changes detected in local study workspace.</p>
            </div>
        </div>
    </div>
);

import useNavigationGuard from '../hooks/useNavigationGuard';

const RepoChat = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  useNavigationGuard();
  const { currentRepo, setCurrentRepo, user } = useStore();
  
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [highlightLine, setHighlightLine] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(!currentRepo);
  const [activeTab, setActiveTab] = useState('explorer'); // Activity bar selection
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isNewFile, setIsNewFile] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await repoService.getRepo(repoId);
        setCurrentRepo(res.data);
        const treeRes = await repoService.getFileTree(repoId);
        setFileTree(treeRes.data.tree);
      } catch (err) {
        console.error('Failed to initialize workspace:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    if (user && repoId) {
      socketService.connect();
      socketService.joinRepo(repoId, user.id || user._id, user.name);
    }

    return () => {
      if (user && repoId) {
        socketService.leaveRepo(repoId, user.id || user._id);
        socketService.disconnect();
      }
    };
  }, [repoId, user, setCurrentRepo]);

  // Global Command Dispatcher
  const executeCommand = useCallback((command) => {
    switch(command) {
      case 'FILE_OPEN_FOLDER':
        navigate('/dashboard');
        break;
      case 'FILE_NEW_FILE':
        setActiveFile('new-file.js');
        setFileContent('// New File Content\n');
        setIsNewFile(true);
        break;
      case 'VIEW_TOGGLE_SIDEBAR':
        setIsSidebarOpen(!isSidebarOpen);
        break;
      case 'NAV_TERMINAL':
      case 'VIEW_TOGGLE_PANEL':
        setIsBottomPanelOpen(!isBottomPanelOpen);
        break;
      case 'HELP_ABOUT':
        toast.success(`RepoChat v2.0 - ${currentRepo?.name || 'Workspace'}`);
        break;
      case 'FILE_SAVE':
        toast.success('Workspace state auto-saved!');
        break;
      case 'NAV_HOME':
      case 'EXIT':
        navigate('/dashboard');
        break;
      default:
        if (command.startsWith('NAV_')) {
            const tab = command.replace('NAV_', '').toLowerCase();
            setActiveTab(tab);
            setIsSidebarOpen(true);
        } else {
            toast('Feature coming soon', { icon: '⚙️' });
        }
    }
  }, [navigate, isSidebarOpen, isBottomPanelOpen, currentRepo]);

  const handleFileSelect = async (fileInfo) => {
    const path = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
    const line = typeof fileInfo === 'object' ? fileInfo.startLine : null;
    
    setIsNewFile(false);
    setActiveFile(path);
    setHighlightLine(line);

    try {
      const res = await repoService.getFileContent(repoId, path);
      setFileContent(res.data.content);
    } catch (err) {
      console.error('Failed to read file:', err);
      setFileContent('// Error loading file content');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#1e1e1e] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#007acc]/20 border-t-[#007acc] rounded-full animate-spin mb-4" />
        <p className="text-[#858585] text-xs uppercase tracking-widest font-medium">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc] font-sans">
      <TopMenuBar onCommand={executeCommand} />

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar 
            activeTab={activeTab} 
            onTabChange={(tab) => {
                const tabsWithPanels = ['explorer', 'search', 'git', 'debug', 'extensions'];
                if (tabsWithPanels.includes(tab)) {
                    if (tab === activeTab) setIsSidebarOpen(!isSidebarOpen);
                    else {
                        setActiveTab(tab);
                        setIsSidebarOpen(true);
                    }
                } else {
                    executeCommand(`NAV_${tab.toUpperCase()}`);
                }
            }} 
        />

        {/* 3. Dynamic Sidebar Panel */}
        {isSidebarOpen && (
            <div className="flex-none">
                {activeTab === 'explorer' && (
                    <Explorer tree={fileTree} activeFile={activeFile} onFileSelect={handleFileSelect} />
                )}
                {activeTab === 'search' && <SearchPanel />}
                {activeTab === 'git' && <SourceControlPanel />}
                {['debug', 'extensions'].includes(activeTab) && (
                    <div className="w-64 bg-[#252526] h-full p-4 border-r border-[#2b2b2b]">
                         <h2 className="text-[11px] font-bold text-[#bbbbbb] mb-4 uppercase tracking-wider">{activeTab}</h2>
                         <p className="text-[11px] text-[#858585]">This feature is coming soon to the AI platform.</p>
                    </div>
                )}
            </div>
        )}

        <div className="flex-1 flex min-w-0">
            <CodeEditor 
                filePath={activeFile} 
                fileContent={fileContent} 
                isEditable={isNewFile}
                highlightLine={highlightLine}
                onTabClose={() => { setActiveFile(null); setFileContent(''); setHighlightLine(null); }}
            />

            <div className="w-[350px] xl:w-[450px] flex-none border-l border-black overflow-hidden bg-[#1e1e1e]">
                <ChatWindow onFileSelect={handleFileSelect} />
            </div>
        </div>
      </div>
      
      {/* Bottom Panel */}
      <BottomPanel 
        isOpen={isBottomPanelOpen} 
        onClose={() => setIsBottomPanelOpen(false)} 
      />

      <div className="h-6 bg-[#007acc] text-white flex items-center px-3 justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-11C5.2 1 3 3.2 3 6s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zM8 9.5c-1.9 0-3.5-1.6-3.5-3.5S6.1 2.5 8 2.5 11.5 4.1 11.5 6 9.9 9.5 8 9.5z"/></svg>
                <span>main*</span>
            </div>
            <div className="flex items-center gap-1.5 hover:bg-white/10 px-1 cursor-pointer">
                <span>0 △ 0 ⊗</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span>Spaces: 4</span>
            <span>UTF-8</span>
            <span>{activeFile ? activeFile.split('.').pop().toUpperCase() : 'Plain Text'}</span>
            <div className="hover:bg-white/10 px-1 cursor-pointer">
                <span>🔔</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RepoChat;

