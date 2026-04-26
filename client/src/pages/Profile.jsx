import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import useStore from '../store/useStore';
import { keyService } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="relative flex min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 font-ferrari">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex flex-1 justify-center py-10 px-6 overflow-y-auto">
          <div className="flex flex-col max-w-2xl flex-1 gap-8">
            {/* Profile Header Section */}
            <section className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="size-32 rounded-full p-1 bg-gradient-to-tr from-[#DA291C]/40 to-[#DA291C] shadow-[0_0_30px_-10px_rgba(218,41,28,0.5)]">
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-slate-800">
                    <img
                      alt="User Profile Picture"
                      className="w-full h-full object-cover"
                      src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg'}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{user?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-[#DA291C]/10 text-[#DA291C] text-xs font-semibold rounded-full uppercase tracking-wider">Verified Account</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm italic">via Google / GitHub</span>
                </div>
              </div>
            </section>

            {/* AI Configuration Section */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold px-1">AI Provider Configuration</h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 flex flex-col">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-gradient-to-br from-[#DA291C]/40 to-[#DA291C] rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-white">bolt</span>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[#DA291C] font-semibold text-sm uppercase tracking-widest mb-1">Active Engine</p>
                        <h3 className="text-xl font-bold">{user?.apiKey ? 'Groq (LPU)' : 'Not Configured'}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                          High-speed language processing unit optimized for real-time chat interactions.
                        </p>
                      </div>
                      <button 
                        onClick={() => toast('API key management coming soon!', { icon: '🔑' })}
                        className="flex items-center gap-2 px-4 py-2 bg-[#DA291C] text-white font-bold rounded-lg hover:brightness-110 transition-all text-sm"
                      >
                        <span className="material-symbols-outlined text-lg">key</span>
                        <span>Change API Key</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile Details */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold px-1">Profile Details</h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name}
                      className="w-full h-14 bg-black/20 border border-white/[0.08] rounded-xl px-6 focus:outline-none focus:ring-2 focus:ring-[#DA291C]/50 text-slate-900 dark:text-white backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email}
                      disabled
                      className="w-full h-14 bg-black/20 border border-white/[0.08] rounded-xl px-6 text-slate-800 dark:text-slate-500 cursor-not-allowed backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Linked Accounts */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Linked Accounts</h4>
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/[0.08] rounded-xl">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold">G</div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-300">Google Account</div>
                        <div className="text-xs text-slate-500">{user?.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 uppercase">Connected</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Actions */}
            <section className="flex flex-col gap-4 mt-10 border-t border-white/5 pt-10 pb-12">
              <button 
                onClick={() => toast.success('Profile settings updated')}
                className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-white/5 backdrop-blur-lg border border-white/10 text-slate-900 dark:text-slate-300 font-bold rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[#DA291C]">manage_accounts</span>
                <span>Save Profile Settings</span>
              </button>
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                RepoChat v2.4.1 • <a className="underline hover:text-[#DA291C] transition-colors" href="#">Privacy Policy</a> • <a className="underline hover:text-[#DA291C] transition-colors" href="#">Terms of Service</a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
