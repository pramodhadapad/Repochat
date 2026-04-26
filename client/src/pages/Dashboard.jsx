import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import ApiKeySetup from '../components/features/ApiKeySetup';
import RepoImport from '../components/features/RepoImport';
import useStore from '../store/useStore';
import { repoService } from '../services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import OnboardingTour from '../components/features/OnboardingTour';
import LanguageChart from '../components/features/LanguageChart';
import RateLimitWidget from '../components/features/RateLimitWidget';
import { analyzeLanguages } from '../utils/languageAnalyzer';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setCurrentRepo } = useStore();
  const [showImport, setShowImport] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('repochat-onboarding-done')
  );
  const [languageStats, setLanguageStats] = useState([]);

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await repoService.getRepos();
        setRepos(response.data.repos);

        // Fetch language stats for the most recent ready repo
        const readyRepo = response.data.repos.find(r => r.status === 'ready');
        if (readyRepo) {
          try {
            const treeRes = await repoService.getFileTree(readyRepo._id);
            setLanguageStats(analyzeLanguages(treeRes.data.tree));
          } catch (e) { /* silently ignore */ }
        }
      } catch (error) {
        console.error('Failed to fetch repos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const handleDeleteRepo = async (id) => {
    try {
      await repoService.deleteRepo(id);
      setRepos(repos.filter(r => r._id !== id));
      toast.success('Repository deleted successfully');
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete repository');
      setConfirmDeleteId(null);
    }
  };

  const handleGenerateReadme = async (id) => {
    toast.promise(
      repoService.generateReadme(id),
      {
        loading: 'Writing a brilliant README...',
        success: 'README generated and saved!',
        error: 'Failed to generate README.'
      }
    ).then(() => {
      setRepos(repos.map(r => r._id === id ? { ...r, hasReadme: true } : r));
    });
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!files[0].webkitRelativePath) {
      toast.error('Your browser doesn\'t support folder uploads. Please use Chrome, Firefox, or Edge.', {
        duration: 5000, icon: '🌐'
      });
      return;
    }

    if (!user?.apiKey) {
      toast.error('Please add your LLM API key in Dashboard (Backend Security Setup) before uploading files.', {
        duration: 5000, icon: '🔑'
      });
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 100 * 1024 * 1024;
    if (totalSize > maxSize) {
      toast.error(`Folder size ${(totalSize / 1024 / 1024).toFixed(1)}MB exceeds 100MB limit.`, {
        duration: 5000, icon: '📁'
      });
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 100MB limit. Largest file: ${(Math.max(...oversizedFiles.map(f => f.size)) / 1024 / 1024).toFixed(1)}MB`, {
        duration: 5000, icon: '⚠️'
      });
      return;
    }

    const formData = new FormData();
    const rootFolderName = files[0].webkitRelativePath?.split('/')[0] || 'uploaded-project';
    formData.append('projectName', rootFolderName);

    files.forEach((file) => {
      formData.append('project', file, file.webkitRelativePath);
    });

    console.log(`[Upload] Starting folder upload: ${files.length} files, total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

    setUploadLoading(true);
    toast.promise(
      repoService.uploadFolder(formData),
      {
        loading: `Uploading ${files.length} files (${(totalSize / 1024 / 1024).toFixed(1)}MB)...`,
        success: (res) => {
           console.log('[Upload] Success:', res.data);
           setRepos([res.data.repo || { _id: res.data.repoId, name: res.data.name, status: 'indexing', owner: 'Local Upload', createdAt: new Date() }, ...repos]);
           return `✅ "${rootFolderName}" uploaded successfully! Indexing started...`;
        },
        error: (err) => {
          console.error('[Upload] Failed:', err);
          const errorMessage = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
          return `❌ ${errorMessage}`;
        }
      }
    ).finally(() => {
        setUploadLoading(false);
        if (folderInputRef.current) folderInputRef.current.value = '';
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user?.apiKey) {
      toast.error('Please add your LLM API key in Dashboard (Backend Security Setup) before uploading files.', {
        duration: 5000, icon: '🔑'
      });
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 100MB limit.`, {
        duration: 5000, icon: '📄'
      });
      return;
    }

    const allowedExtensions = /\.(js|jsx|ts|tsx|py|java|cpp|c|h|cs|php|rb|go|rs|swift|kt|scala|html|css|scss|less|json|xml|yaml|yml|md|txt|sql|sh|bat|ps1|vue|svelte|astro|toml|ini|cfg|conf|log|gitignore|eslintrc|prettierrc|babelrc|dockerfile|makefile|cmake|gradle|pom|xml|properties|env|example|lock|sum|mod|go|rs|toml|yaml|yml|md|txt|sql|sh|bat|ps1)$/i;
    
    if (!allowedExtensions.test(file.name)) {
      toast.error(`File type "${file.name.split('.').pop()}" not supported. Please upload code files, documents, or configuration files.`, {
        duration: 5000, icon: '⚠️'
      });
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    console.log(`[Upload] Starting file upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    setUploadLoading(true);
    toast.promise(
      repoService.uploadFile(formData),
      {
        loading: `Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`,
        success: (res) => {
          console.log('[Upload] Success:', res.data);
          setRepos([res.data.repo || { _id: res.data.repoId, name: res.data.name, status: 'indexing', owner: 'Document Upload', createdAt: new Date() }, ...repos]);
          return `✅ "${file.name}" uploaded successfully! Indexing started...`;
        },
        error: (err) => {
          console.error('[Upload] Failed:', err);
          const errorMessage = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
          return `❌ ${errorMessage}`;
        }
      }
    ).finally(() => setUploadLoading(false));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Ready
          </span>
        );
      case 'indexing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DA291C]/10 text-[#DA291C] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Indexing
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 flex items-center gap-1">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 flex items-center gap-1">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const readyRepos = repos.filter(r => r.status === 'ready').length;
  const indexingRepos = repos.filter(r => r.status === 'indexing').length;

  return (
    <div className="relative flex min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 font-ferrari">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-y-auto">
          {/* API Key Setup Card */}
          {user && !user.apiKey && (
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/5 dark:bg-slate-900/40 backdrop-blur-md p-6 sm:p-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2),0_10px_10px_-5px_rgba(0,0,0,0.1)]">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#DA291C]/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative">
                <ApiKeySetup />
              </div>
            </section>
          )}

          {/* Repositories Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Your Repositories</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and chat with your synchronized codebases</p>
            </div>

            {/* Hidden file inputs */}
            <input 
              type="file" 
              ref={folderInputRef} 
              onChange={handleFolderUpload} 
              webkitdirectory="" 
              directory="" 
              multiple
              className="hidden" 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />

            <div className="flex items-center gap-3">
              <button 
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 rounded-lg border border-white/[0.08] bg-white/5 backdrop-blur-md text-slate-300 font-semibold flex items-center gap-2 hover:bg-white/10 hover:border-[#DA291C]/40 transition-all text-sm"
                disabled={uploadLoading}
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Upload File
              </button>

              <button 
                onClick={() => folderInputRef.current.click()}
                className="px-4 py-2 rounded-lg border border-white/[0.08] bg-white/5 backdrop-blur-md text-slate-300 font-semibold flex items-center gap-2 hover:bg-white/10 hover:border-[#DA291C]/40 transition-all text-sm"
                disabled={uploadLoading}
              >
                <span className="material-symbols-outlined text-sm">drive_folder_upload</span>
                Upload Folder
              </button>

              <button 
                onClick={() => setShowImport(true)}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                disabled={uploadLoading}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Import Repo
              </button>
            </div>
          </div>

          {/* Repository Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-[#DA291C] animate-spin" />
              <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">Waking up indexer...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {repos.map((repo) => (
                  <motion.div 
                    key={repo._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group border border-white/[0.08] bg-white/5 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl p-6 hover:border-[#DA291C]/40 hover:bg-white/10 transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2),0_10px_10px_-5px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-[#DA291C]/10 text-[#DA291C]">
                        <span className="material-symbols-outlined">folder_special</span>
                      </div>
                      {getStatusBadge(repo.status)}
                    </div>

                    <h4 className="text-lg font-bold mb-1 truncate">{repo.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate">{repo.owner}</p>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">history</span>
                        {new Date(repo.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Generate README if needed */}
                    {!repo.hasReadme && repo.status === 'ready' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReadme(repo._id);
                        }}
                        className="mb-4 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/[0.08] rounded-xl text-xs text-slate-400 hover:text-white hover:border-[#DA291C]/50 transition-all w-fit"
                      >
                        <span className="material-symbols-outlined text-sm text-[#DA291C]">auto_stories</span>
                        Generate README
                      </button>
                    )}

                    <div className="mt-auto flex gap-2">
                      {confirmDeleteId === repo._id ? (
                        <div className="flex gap-2 w-full animate-in zoom-in duration-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-sm transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteRepo(repo._id); }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 shadow-lg shadow-red-500/20"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            Confirm
                          </button>
                        </div>
                      ) : repo.status === 'ready' ? (
                        <>
                          <button 
                            onClick={() => {
                              setCurrentRepo(repo);
                              navigate(`/repo/${repo._id}`);
                            }}
                            className="flex-1 bg-[#DA291C]/10 hover:bg-[#DA291C]/20 text-[#DA291C] font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            Open
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(repo._id); }}
                            className="px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 py-2 rounded-lg text-sm transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      ) : repo.status === 'indexing' ? (
                        <div className="flex gap-2 w-full">
                          <button 
                            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                            disabled
                          >
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            Processing...
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(repo._id); }}
                            className="px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 py-2 rounded-lg text-sm transition-colors"
                            title="Delete repository"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => handleDeleteRepo(repo._id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Retry
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(repo._id); }}
                            className="px-3 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 py-2 rounded-lg text-sm transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 dark:bg-slate-900/30 border border-white/[0.08] backdrop-blur-md p-5 rounded-xl transition-transform hover:scale-[1.02]">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Total Repos</div>
              <div className="text-2xl font-bold">{repos.length}</div>
              <div className="h-0.5 w-full bg-slate-500/20 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 w-1/2" />
              </div>
            </div>
            <div className="bg-white/5 dark:bg-slate-900/30 border border-white/[0.08] backdrop-blur-md p-5 rounded-xl transition-transform hover:scale-[1.02]">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Ready</div>
              <div className="text-2xl font-bold text-green-500">{readyRepos}</div>
              <div className="h-0.5 w-full bg-green-500/20 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: repos.length ? `${(readyRepos / repos.length) * 100}%` : '0%' }} />
              </div>
            </div>
            <div className="bg-white/5 dark:bg-slate-900/30 border border-white/[0.08] backdrop-blur-md p-5 rounded-xl transition-transform hover:scale-[1.02]">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Indexing</div>
              <div className="text-2xl font-bold text-[#DA291C]">{indexingRepos}</div>
              <div className="h-0.5 w-full bg-[#DA291C]/20 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-[#DA291C]" style={{ width: repos.length ? `${(indexingRepos / repos.length) * 100}%` : '0%' }} />
              </div>
            </div>
            <RateLimitWidget />
          </div>

          {/* Language Breakdown */}
          {languageStats.length > 0 && (
            <div className="bg-white/5 dark:bg-slate-900/30 border border-white/[0.08] backdrop-blur-md p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Language Breakdown</h4>
              <LanguageChart languages={languageStats} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-auto bg-black/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; 2026 RepoChat Dashboard. Build with precision.</p>
            <div className="flex gap-6">
              <a className="hover:text-[#DA291C] transition-colors" href="#">Documentation</a>
              <a className="hover:text-[#DA291C] transition-colors" href="#">Support</a>
              <a className="hover:text-[#DA291C] transition-colors" href="#">API Status</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)}></div>
          <div className="relative w-full max-w-lg">
            <RepoImport onClose={() => {
              setShowImport(false);
              window.location.reload(); 
            }} />
          </div>
        </div>
      )}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default Dashboard;
