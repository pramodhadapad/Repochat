import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { repoService } from '../../services/api';
import { Search, Bell, Settings, Sun, Moon, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoutModal from '../auth/LogoutModal';

const TopBar = () => {
  const navigate = useNavigate();
  const { user, theme, setTheme, currentRepo, logout, setCurrentRepo } = useStore();
  const [reindexLoading, setReindexLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleLogout = () => {
    logout();
    window.history.replaceState(null, '', '/login');
    navigate('/login', { replace: true });
    setShowLogoutModal(false);
  };

  const handleRetryIndexing = async () => {
    if (!currentRepo || currentRepo.status !== 'failed') return;
    setReindexLoading(true);
    try {
      await repoService.reindexRepo(currentRepo._id);
      toast.success('Re-indexing started.');
      setCurrentRepo({ ...currentRepo, status: 'indexing' });
      const res = await repoService.getRepo(currentRepo._id);
      setCurrentRepo(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to start re-indexing';
      toast.error(typeof msg === 'string' ? msg : 'Failed to start re-indexing');
    } finally {
      setReindexLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="text-lg font-bold truncate max-w-[300px]">
          {currentRepo ? currentRepo.name : 'RepoChat Dashboard'}
        </div>
        {currentRepo && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${currentRepo.status === 'ready' ? 'bg-primary-600/10 text-primary-400 border-primary-500/20' : currentRepo.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
            {currentRepo.status === 'ready' ? 'Ready' : currentRepo.status === 'failed' ? 'Failed' : 'Indexing...'}
          </span>
        )}
        {currentRepo?.status === 'failed' && (
          <button
            onClick={handleRetryIndexing}
            disabled={reindexLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30 transition-all"
          >
            {reindexLoading ? <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Retry indexing
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-px bg-slate-800 mx-2"></div>

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-200">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>

          {/* Avatar: shows photo if valid, else shows first letter of name */}
          {user?.avatar && !avatarError ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-10 h-10 rounded-xl bg-slate-800 ring-2 ring-primary-500/20 object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary-600 ring-2 ring-primary-500/20 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
};

export default TopBar;
