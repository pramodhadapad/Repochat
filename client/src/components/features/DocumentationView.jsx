import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Loader2, Wand2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { repoService } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DocumentationView = ({ repoId }) => {
  const navigate = useNavigate();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchRepo = async () => {
      try {
        const res = await repoService.getRepo(repoId);
        setRepo(res.data);
      } catch (err) {
        console.error('Failed to fetch repo docs:', err);
        toast.error('Failed to load documentation');
      } finally {
        setLoading(false);
      }
    };
    fetchRepo();
  }, [repoId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await repoService.generateReadme(repoId);
      setRepo(prev => ({ ...prev, hasReadme: true, generatedReadme: res.data.content }));
      toast.success('Documentation generated successfully!');
    } catch (err) {
      console.error('Generation failed:', err);
      toast.error('Failed to generate documentation');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading Documentation...</p>
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
              <BookOpen className="w-5 h-5 text-primary-500" />
              Documentation
            </h2>
            <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{repo?.name}</p>
          </div>
        </div>
        
        {repo?.hasReadme && (
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary-500/50 text-slate-300 text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-primary-500" />}
            Regenerate
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {!repo?.hasReadme ? (
          <div className="max-w-2xl mx-auto py-20 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary-600/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">No Documentation Found</h3>
              <p className="text-slate-500 leading-relaxed">
                We haven't generated a README for this repository yet. Our AI can analyze your codebase and write a comprehensive guide for you.
              </p>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-primary-600/20 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              Generate Documentation
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto prose dark:prose-invert prose-slate prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-headings:font-bold prose-a:text-primary-500">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  return (
                    <code className={`${className} bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-sm`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {repo.generatedReadme}
            </ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentationView;
