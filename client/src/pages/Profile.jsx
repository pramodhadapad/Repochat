import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import useStore from '../store/useStore';
import { keyService } from '../services/api';
import { User, Mail, Shield, Save, Key, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');


  return (
    <div className="flex bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Side: Avatar & Basic Info */}
              <div className="space-y-6">
                <div className="glass p-8 rounded-3xl flex flex-col items-center text-center">
                   <img 
                    src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg'} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-[40px] bg-slate-800 ring-4 ring-primary-500/20 mb-6"
                  />
                  <h3 className="text-xl font-bold mb-1">{user?.name}</h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>

                <div className="glass p-6 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Account Status</h4>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-400">Membership</span>
                    <span className="font-bold text-primary-400">Pro Developer</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-400">Vector Storage</span>
                    <span className="font-bold">Unlimited</span>
                  </div>
                </div>
              </div>


              {/* Right Side: Configuration Form */}
              <div className="md:col-span-2 space-y-8">
                <div className="glass p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-primary-400" />
                    <h3 className="text-xl font-bold">Profile Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500 ml-1">Display Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.name}
                        className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-500 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email}
                        disabled
                        className="w-full h-14 bg-slate-800 border border-slate-800 rounded-2xl px-6 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-slate-500 ml-1">Account Password (Optional)</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                      <p className="text-[10px] text-slate-500 px-2 italic">Add a local password for non-OAuth login attempts.</p>
                    </div>
                  </div>
                </div>

                <div className="glass p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-xl font-bold">Linked Accounts</h3>
                    </div>
                    <button className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest">
                      + Add Another Account
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                      <div className="flex gap-3 items-center">
                         <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold">G</div>
                         <div>
                            <div className="text-sm font-bold text-slate-300">Google Account</div>
                            <div className="text-xs text-slate-500">{user?.email}</div>
                         </div>
                      </div>
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 uppercase">Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-dashed border-slate-800 rounded-2xl opacity-50">
                      <div className="flex gap-3 items-center">
                         <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-xs font-bold">GH</div>
                         <div>
                            <div className="text-sm font-bold text-slate-400">GitHub Account</div>
                            <div className="text-xs text-slate-500 italic">Not Linked</div>
                         </div>
                      </div>
                      <button className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase underline">Link ID</button>
                    </div>
                  </div>
                </div>



                <div className="flex justify-end pt-4">
                   <button 
                    onClick={() => toast.success('Profile settings updated')}
                    className="px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary-600/30 flex items-center gap-2"
                   >
                      <Save className="w-5 h-5" />
                      Save Changes
                   </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


export default Profile;
