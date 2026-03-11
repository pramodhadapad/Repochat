import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import ApiKeySetup from '../components/features/ApiKeySetup';
import RepoImport from '../components/features/RepoImport';
import useStore from '../store/useStore';
import { repoService } from '../services/api';
import { Plus, Github, Clock, ExternalLink, Trash2, Loader2, BookPlus, FolderUp, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticlesBackground from '../components/common/ParticlesBackground';
import useNavigationGuard from '../hooks/useNavigationGuard';

const Dashboard = () => {
  const navigate = useNavigate();
  useNavigationGuard();
  const { user, setCurrentRepo } = useStore();
  const [showImport, setShowImport] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 1. Fetch repositories
    const fetchRepos = async () => {
      try {
        const response = await repoService.getRepos();
        setRepos(response.data.repos);
      } catch (error) {
        console.error('Failed to fetch repos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const handleDeleteRepo = async (id) => {
    if (window.confirm('Are you sure you want to delete this repository?')) {
      try {
        await repoService.deleteRepo(id);
        setRepos(repos.filter(r => r._id !== id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
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
      // Refresh current list state
      setRepos(repos.map(r => r._id === id ? { ...r, hasReadme: true } : r));
    });
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check browser support for webkitdirectory
    if (!files[0].webkitRelativePath) {
      toast.error('Your browser doesn\'t support folder uploads. Please use Chrome, Firefox, or Edge.', {
        duration: 5000,
        icon: '🌐'
      });
      return;
    }

    // Check if user has API key set
    if (!user?.apiKey) {
      toast.error('Please add your LLM API key in Dashboard (Backend Security Setup) before uploading files.', {
        duration: 5000,
        icon: '🔑'
      });
      return;
    }

    // Validate total file size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (totalSize > maxSize) {
      toast.error(`Folder size ${(totalSize / 1024 / 1024).toFixed(1)}MB exceeds 100MB limit.`, {
        duration: 5000,
        icon: '📁'
      });
      return;
    }

    // Check individual file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 100MB limit. Largest file: ${(Math.max(...oversizedFiles.map(f => f.size)) / 1024 / 1024).toFixed(1)}MB`, {
        duration: 5000,
        icon: '⚠️'
      });
      return;
    }

    const formData = new FormData();
    // Get the root folder name from the first file's webkitRelativePath
    const rootFolderName = files[0].webkitRelativePath?.split('/')[0] || 'uploaded-project';
    formData.append('projectName', rootFolderName);

    files.forEach((file) => {
      // Use webkitRelativePath to preserve folder structure
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
        // Clear input so same folder can be re-uploaded if needed
        if (folderInputRef.current) folderInputRef.current.value = '';
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if user has API key set
    if (!user?.apiKey) {
      toast.error('Please add your LLM API key in Dashboard (Backend Security Setup) before uploading files.', {
        duration: 5000,
        icon: '🔑'
      });
      return;
    }

    // Validate file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 100MB limit.`, {
        duration: 5000,
        icon: '📄'
      });
      return;
    }

    // Check file type
    const allowedExtensions = /\.(js|jsx|ts|tsx|py|java|cpp|c|h|cs|php|rb|go|rs|swift|kt|scala|html|css|scss|less|json|xml|yaml|yml|md|txt|sql|sh|bat|ps1|vue|svelte|astro|toml|ini|cfg|conf|log|gitignore|eslintrc|prettierrc|babelrc|dockerfile|makefile|cmake|gradle|pom|xml|properties|env|example|lock|sum|mod|go|rs|toml|yaml|yml|md|txt|sql|sh|bat|ps1)$/i;
    
    if (!allowedExtensions.test(file.name)) {
      toast.error(`File type "${file.name.split('.').pop()}" not supported. Please upload code files, documents, or configuration files.`, {
        duration: 5000,
        icon: '⚠️'
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

  return (
    <div className="relative flex bg-white dark:bg-slate-950 min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
      <ParticlesBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          {user && !user.apiKey && (
            <div className="mb-8">
              <ApiKeySetup />
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Repositories</h1>
              <p className="text-slate-400">Manage and chat with your indexed codebases.</p>
            </div>
            <div className="flex items-center gap-3">
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

              <button 
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-3 bg-slate-900 border border-slate-800 hover:border-primary-500/50 text-slate-300 font-bold rounded-2xl transition-all flex items-center gap-2"
                disabled={uploadLoading}
              >
                <FileUp className="w-5 h-5" />
                Upload File
              </button>

              <button 
                onClick={() => folderInputRef.current.click()}
                className="px-4 py-3 bg-slate-900 border border-slate-800 hover:border-primary-500/50 text-slate-300 font-bold rounded-2xl transition-all flex items-center gap-2"
                disabled={uploadLoading}
              >
                <FolderUp className="w-5 h-5" />
                Upload Folder
              </button>

              <button 
                onClick={() => setShowImport(true)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
                disabled={uploadLoading}
              >
                <Plus className="w-5 h-5" />
                Import Repository
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
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
                    className="glass p-6 rounded-3xl hover:border-primary-500/50 transition-all group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-primary-600/20 transition-colors">
                        <Github className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
                      </div>
                      <div className="flex gap-2">
                         <a 
                           href={repo.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                         >
                           <ExternalLink className="w-4 h-4" />
                         </a>
                         <button 
                           onClick={() => handleDeleteRepo(repo._id)}
                           className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1 truncate">{repo.name}</h3>
                    <p className="text-sm text-slate-500 mb-6 truncate">{repo.owner}</p>
                    
                    {!repo.hasReadme && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReadme(repo._id);
                        }}
                        className="mb-6 flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:border-primary-500/50 transition-all w-fit"
                      >
                        <BookPlus className="w-4 h-4 text-primary-400" />
                        Generate README
                      </button>
                    )}
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(repo.createdAt).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => {
                          setCurrentRepo(repo);
                          navigate(`/repo/${repo._id}`);
                        }}
                        className="text-primary-400 font-bold text-sm hover:text-primary-300 transition-colors"
                      >
                        Open Chat →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)}></div>
          <div className="relative w-full max-w-lg">
            <RepoImport onClose={() => {
              setShowImport(false);
              // Refresh repos after import
              window.location.reload(); 
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
