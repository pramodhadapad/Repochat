import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Star, Trash2, Copy, Check, Loader2, ChevronLeft, Search } from 'lucide-react';
import { repoService } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SnippetsView = ({ repoId }) => {
  const navigate = useNavigate();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const res = await repoService.getRepo(repoId);
        setRepo(res.data);
      } catch (err) {
        console.error('Failed to fetch snippets:', err);
        toast.error('Failed to load snippets');
      } finally {
        setLoading(false);
      }
    };
    fetchRepo();
  }, [repoId]);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (snippetId) => {
    if (!window.confirm('Delete this snippet?')) return;
    
    try {
      await repoService.deleteSnippet(repoId, snippetId);
      setRepo(prev => ({
        ...prev,
        snippets: prev.snippets.filter(s => s._id !== snippetId)
      }));
      toast.success('Snippet deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete snippet');
    }
  };

  const filteredSnippets = repo?.snippets?.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading Snippets...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300">
      <header className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/repo/${repoId}`)}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Saved Snippets
            </h2>
            <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{repo?.name}</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500/50 transition-all w-64"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {filteredSnippets.length === 0 ? (
          <div className="max-w-md mx-auto py-20 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <Star className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">No Snippets Found</h3>
              <p className="text-slate-500 leading-relaxed">
                {searchQuery ? "No snippets match your search criteria." : "You haven't saved any code snippets for this project yet. Use the Chat to discover and save useful logic!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto pb-10">
            {filteredSnippets.map((snippet) => (
              <div key={snippet._id} className="group glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary-500 uppercase tracking-widest bg-primary-600/10 px-2 py-0.5 rounded">
                      {snippet.language}
                    </span>
                    <h4 className="font-bold truncate max-w-md">{snippet.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(snippet.code, snippet._id)}
                      className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      title="Copy to Clipboard"
                    >
                      {copiedId === snippet._id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(snippet._id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                      title="Delete Snippet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="relative text-sm">
                  <SyntaxHighlighter 
                    language={snippet.language} 
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'transparent',
                    }}
                  >
                    {snippet.code}
                  </SyntaxHighlighter>
                </div>
                <div className="px-6 py-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                     Saved on {new Date(snippet.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SnippetsView;
