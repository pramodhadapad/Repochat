import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import useStore from '../store/useStore';
import { LogOut, Settings as SettingsIcon, Bell, Shield, Moon, Sun, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import useNavigationGuard from '../hooks/useNavigationGuard';

const Settings = () => {
  const navigate = useNavigate();
  useNavigationGuard();
  const { theme, setTheme, logout } = useStore();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary-500" />
              Settings
            </h1>

            <div className="space-y-6">
              {/* Appearance */}
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold">Appearance</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-200">Theme Mode</div>
                    <div className="text-sm text-slate-500">Switch between light and dark themes</div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-primary-500/50 transition-all flex items-center gap-2"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="font-bold capitalize">{theme} Mode</span>
                  </button>
                </div>
              </div>

              {/* Security */}
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold">Security & Session</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-200">Logout</div>
                    <div className="text-sm text-slate-500">Sign out and end your current session</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold">Notifications</h3>
                </div>
                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div>
                    <div className="font-medium text-slate-200">Email Notifications</div>
                    <div className="text-sm text-slate-500">Get updates about your repository indexing status</div>
                  </div>
                  <div className="w-12 h-6 bg-slate-800 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full"></div>
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
