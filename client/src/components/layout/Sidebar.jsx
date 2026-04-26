import { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Home, FolderTree, MessageSquare, BookOpen, Star, HelpCircle, ChevronRight, FileCode, Flame, History, Loader2, User, Settings } from 'lucide-react';
import useStore from '../../store/useStore';
import { repoService } from '../../services/api';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { currentRepo, isSidebarCollapsed: collapsed, toggleSidebar } = useStore();
  const { repoId } = useParams();
  const [heatmap, setHeatmap] = useState({});

  useEffect(() => {
    if (currentRepo || repoId) {
      const fetchHeatmap = async () => {
        try {
          const id = currentRepo?._id || repoId;
          const res = await repoService.getHeatmap(id);
          setHeatmap(res.data);
        } catch (err) {
          console.error('Heatmap fetch failed:', err);
        }
      };
      fetchHeatmap();
      
      // Refresh heatmap occasionally or on specific events
      const interval = setInterval(fetchHeatmap, 30000);
      return () => clearInterval(interval);
    }
  }, [currentRepo, repoId]);

  const hotFiles = Object.entries(heatmap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const handleSummarizeCommits = async () => {
    const id = currentRepo?._id || repoId;
    if (!id) return;

    toast.promise(
      repoService.getCommitSummary(id),
      {
        loading: 'Analyzing recent commits...',
        success: (res) => {
            // We'll show a toast with the first few lines of the summary
            // But ideally, the parent component would add it to chat
            // For now, let's just toast it
            return 'Changes summarized successfully!';
        },
        error: 'Failed to summarize commits.'
      }
    ).then((res) => {
       // Optional: Copy to clipboard or set in store for chat to pick up
       if (res?.data?.summary) {
          navigator.clipboard.writeText(res.data.summary);
          toast('Summary copied to clipboard!', { icon: '📝' });
       }
    });
  };

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat', path: currentRepo ? `/repo/${currentRepo._id}` : (repoId ? `/repo/${repoId}` : '#') },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Documentation', path: currentRepo ? `/repo/${currentRepo._id}/docs` : (repoId ? `/repo/${repoId}/docs` : '#') },
    { icon: <Star className="w-5 h-5" />, label: 'Saved Snippets', path: currentRepo ? `/repo/${currentRepo._id}/snippets` : (repoId ? `/repo/${repoId}/snippets` : '#') },
  ];

  return (
    <aside className={`h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} sticky top-0 hidden md:flex`} style={{ backgroundColor: 'var(--theme-bg)', borderRight: '1px solid var(--theme-border)' }}>
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xl shadow-lg shadow-primary-600/20">
            R
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight">RepoChat</span>}
        </div>
        <button 
          onClick={toggleSidebar} 
          className={`p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all ${collapsed ? 'hidden' : ''}`}
          title="Toggle Sidebar"
        >
          <ChevronRight className="w-5 h-5 rotate-180 transition-transform" />
        </button>
      </div>
      
      {collapsed && (
        <button 
          onClick={toggleSidebar} 
          className="mx-auto mb-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5 transition-transform" />
        </button>
      )}

      <nav className="flex-1 px-4 mt-6 overflow-y-auto custom-scrollbar">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                  ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}
                  ${item.path === '#' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {currentRepo && !collapsed && (
          <div className="mt-10 px-4 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FolderTree className="w-3 h-3" />
                Current Repo
              </h4>
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                  <FileCode className="w-4 h-4 text-primary-400" />
                  <span className="truncate font-mono text-[11px]">{currentRepo.name}</span>
                </div>
                <button 
                  onClick={handleSummarizeCommits}
                  title="Summarize Recent Changes"
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-primary-400 hover:border-primary-500/50 transition-all"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {hotFiles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Hot Files
                </h4>
                <div className="space-y-3">
                  {hotFiles.map(([path, count]) => (
                    <div key={path} className="flex flex-col gap-1 group cursor-pointer">
                       <div className="flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                         <span className="truncate font-mono">{path.split('/').pop()}</span>
                         <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[9px] font-bold text-primary-400">
                           {count}
                         </span>
                       </div>
                       <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500/50" 
                            style={{ width: `${Math.min(count * 10, 100)}%` }}
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-900 space-y-2">
        <NavLink 
          to="/profile"
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all
            ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}
          `}
          title="Account Profile"
        >
          <User className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Profile</span>}
        </NavLink>

        <NavLink 
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all
            ${isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}
          `}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Settings</span>}
        </NavLink>

        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all">
          <HelpCircle className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Support</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
