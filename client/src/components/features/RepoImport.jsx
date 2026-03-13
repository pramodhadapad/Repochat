import { useState, useEffect } from 'react';
import { Github, Link, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { repoService } from '../../services/api';

const RepoImport = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    if (!url) return;
    setStatus('cloning');
    setError(null);
    
    try {
      const response = await repoService.cloneRepo(url);
      const repoId = response.data.repoId;
      
      // Start polling for indexing status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await repoService.getRepo(repoId);
          const currentStatus = statusRes.data.status;
          
          if (currentStatus === 'ready') {
            clearInterval(pollInterval);
            setProgress(100);
            setStatus('success');
            setTimeout(() => onClose(), 1500);
          } else if (currentStatus === 'failed') {
            clearInterval(pollInterval);
            setStatus('error');
            setError('Indexing failed. Please check the repository URL and try again.');
          } else {
            // Simulate progress for UI
            setProgress(prev => Math.min(prev + 5, 95));
            setStatus('indexing');
          }
        } catch (err) {
          clearInterval(pollInterval);
          console.error('Polling error:', err);
        }
      }, 6000); // 6 seconds (was 3s) to respect rate limits

    } catch (err) {
      console.error('Import failed:', err);
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to clone repository.');
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Import Repository</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {status === 'idle' || status === 'error' ? (
        <div className="space-y-6">
          {status === 'error' && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
               <AlertCircle className="w-5 h-5" />
               {error}
            </div>
          )}

          <div className="p-6 rounded-3xl bg-primary-600/5 border border-primary-500/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-400" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Our AI engine will parse every file, understand function relationships, and index everything for instant chat.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">Git Repository URL</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <Github className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full h-16 bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm"
              />
            </div>
          </div>

          <button 
            onClick={handleImport}
            disabled={!url}
            className={`w-full h-16 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              url ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-xl shadow-primary-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Start Indexing
            <Link className="w-5 h-5" />
          </button>
        </div>
      ) : status === 'success' ? (
        <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Ready to Chat!</h3>
          <p className="text-slate-400">The repository has been successfully indexed.</p>
        </div>
      ) : (
        <div className="py-12 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-1 uppercase tracking-widest text-primary-400">
                {status === 'cloning' ? 'Cloning Repository' : 'AI Indexing'}
              </h3>
              <p className="text-slate-500">This usually takes 30-60 seconds...</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-slate-400">Processing files...</span>
              <span className="text-primary-400 font-mono">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary-600 shadow-[0_0_20px_rgba(14,165,233,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoImport;
