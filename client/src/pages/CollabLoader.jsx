import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CollabLoader = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveShare = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('repochat-storage') || '{}')?.state?.token;
        if (!token) {
          toast.error('Please login to join the collaboration.');
          navigate('/login');
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/share/${shareId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.repoId) {
          const repoId = typeof res.data.repoId === 'object' ? res.data.repoId._id : res.data.repoId;
          navigate(`/repo/${repoId}`);
        } else {
          setError('Invalid collaboration link.');
        }
      } catch (err) {
        console.error('Resolve Share Error:', err);
        setError('Collaboration link expired or not found.');
      }
    };

    resolveShare();
  }, [shareId, navigate]);

  if (error) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050b0d] font-['Inter',sans-serif] text-slate-100 antialiased">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(218,41,28,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(218,41,28,0.05),transparent_40%)] pointer-events-none" />
        
        <header className="relative z-20 flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="text-[#DA291C]">
              <span className="material-symbols-outlined text-3xl">account_tree</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">RepoChat</h2>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full max-w-xl p-12 rounded-3xl text-center relative z-10">
            <div className="relative mb-10 flex justify-center">
              <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-5xl">error_outline</span>
              </div>
            </div>
            <div className="space-y-4 mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-white">Oops!</h1>
              <p className="text-slate-400 max-w-sm mx-auto">{error}</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-[#DA291C]/10 border border-[#DA291C]/20 text-[#DA291C] rounded-xl hover:bg-[#DA291C]/20 transition-all font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050b0d] font-['Inter',sans-serif] text-slate-100 antialiased">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(218,41,28,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(218,41,28,0.05),transparent_40%)] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="text-[#DA291C]">
            <span className="material-symbols-outlined text-3xl">account_tree</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">RepoChat</h2>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#DA291C]/10 hover:bg-[#DA291C]/20 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-400">close</span>
        </button>
      </header>

      {/* Main Loading Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="bg-white/[0.03] backdrop-blur-[12px] border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full max-w-xl p-12 rounded-3xl text-center relative z-10">
          
          {/* Sophisticated Spinner */}
          <div className="relative mb-16 flex justify-center">
            {/* Outer Glow Ring */}
            <div className="absolute h-40 w-40 rounded-full border border-[#DA291C]/20 blur-md" />
            {/* Outer Spinning Ring */}
            <div className="h-40 w-40 rounded-full border-[1px] border-[#DA291C]/20 border-t-[#DA291C]/80 animate-spin shadow-[0_0_15px_rgba(13,185,242,0.3)]" style={{ animationDuration: '8s', animationTimingFunction: 'linear' }} />
            {/* Middle Reverse Ring */}
            <div className="absolute top-4 left-1/2 -ml-16 h-32 w-32 rounded-full border-[1px] border-dashed border-[#DA291C]/30 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse', animationTimingFunction: 'linear' }} />
            {/* Inner Pulsing Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-[#DA291C]/10 animate-pulse blur-xl" />
            </div>
            {/* Central Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[#050b0d]/80 p-4 rounded-full border border-[#DA291C]/20">
                <span className="material-symbols-outlined text-[#DA291C] text-4xl leading-none animate-spin" style={{ animationDuration: '3s' }}>sync</span>
              </div>
            </div>
          </div>

          {/* Textual Information */}
          <div className="space-y-4 mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-white">Loading session<span className="animate-pulse">...</span></h1>
            <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-[#DA291C] to-slate-400 bg-[length:200%_auto] animate-text-shimmer">
              Connecting to high-performance shared repo
            </p>
          </div>

          {/* Progress Bar Section */}
          <div className="max-w-xs mx-auto space-y-6">
            <div className="relative">
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden backdrop-blur-sm">
                <div className="bg-gradient-to-r from-[#DA291C]/50 to-[#DA291C] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_#DA291C] animate-pulse" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="flex flex-col gap-2 opacity-80">
              <p className="text-slate-300 text-sm font-medium">Initializing collaborative environment</p>
              <p className="text-slate-500 text-xs italic">Synchronizing workspace components...</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DA291C]/5 border border-[#DA291C]/10">
          <span className="flex h-2 w-2 rounded-full bg-[#DA291C] animate-ping" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#DA291C]/80">Securing Connection</span>
        </div>
      </footer>
    </div>
  );
};

export default CollabLoader;
