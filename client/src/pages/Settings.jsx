import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import useStore from '../store/useStore';
import { useTheme } from '../components/common/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.history.replaceState(null, '', '/login');
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#f5f8f8] dark:bg-gradient-to-br dark:from-[#0a1418] dark:via-[#0d1b20] dark:to-[#0a1418] text-slate-900 dark:text-slate-100 font-['Inter',sans-serif]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0db9f2] text-3xl">settings</span>
              Settings
            </h1>

            <div className="space-y-6">
              {/* Appearance */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <span className="material-symbols-outlined text-indigo-400">dark_mode</span>
                  <h3 className="text-lg font-bold">Appearance</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">Theme Mode</div>
                    <div className="text-sm text-slate-500">Switch between light and dark themes</div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-3 bg-black/20 border border-white/[0.08] rounded-xl hover:border-[#0db9f2]/50 transition-all flex items-center gap-2 backdrop-blur-sm"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
                    <span className="font-bold capitalize">{theme} Mode</span>
                  </button>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <span className="material-symbols-outlined text-green-400">shield</span>
                  <h3 className="text-lg font-bold">Security &amp; Session</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">Logout</div>
                    <div className="text-sm text-slate-500">Sign out and end your current session</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 hover:border-red-500/40 transition-all shadow-[0_4px_20px_-10px_rgba(239,68,68,0.5)]"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <span className="material-symbols-outlined text-yellow-500">notifications</span>
                  <h3 className="text-lg font-bold">Notifications</h3>
                </div>
                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">Email Notifications</div>
                    <div className="text-sm text-slate-500">Get updates about your repository indexing status</div>
                  </div>
                  <div className="w-12 h-6 bg-slate-800 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
