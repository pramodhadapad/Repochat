import { useState, useRef, useEffect } from 'react';
import { Settings2, Key, Check, ChevronDown, Loader2, Cpu } from 'lucide-react';
import { keyService } from '../../services/api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const LLMSelector = () => {
  const { user, setUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveKey = async (keyOverride) => {
    const keyToSave = keyOverride || apiKey;
    if (!keyToSave.trim()) return;
    setLoading(true);
    try {
      const res = await keyService.saveKey(keyToSave);
      setUser({ 
        ...user, 
        apiKey: true, 
        provider: res.data.provider, 
        model: res.data.model 
      });
      setApiKey('');
      setIsOpen(false);
      toast.success(`Connected to ${res.data.provider.toUpperCase()}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update API Key. Please verify the key and try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = () => {
    if (!user?.apiKey) return 'No LLM Connected';
    if (user?.provider === 'openai') return 'OpenAI (GPT-4)';
    if (user?.provider === 'claude') return 'Anthropic (Claude)';
    if (user?.provider === 'gemini') return 'Google (Gemini)';
    if (user?.provider === 'deepseek') return 'DeepSeek';
    if (user?.provider === 'perplexity') return 'Perplexity';
    if (user?.provider === 'groq') return 'Groq (LPU)';
    if (user?.provider === 'ollama') return 'Ollama (Free)';
    return user?.provider?.toUpperCase() || 'Custom LLM';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
      >
        <Settings2 className="w-3 h-3 text-primary-400" />
        <span className="truncate max-w-[120px]">{getProviderName()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <h4 className="text-sm font-bold text-slate-200 mb-1">AI Provider Configuration</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest">
              Switch between Claude, OpenAI, Gemini, Groq, DeepSeek, or use Ollama for free.
            </p>
          </div>
          
          {/* Ollama Quick Connect */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => handleSaveKey('ollama')}
              disabled={loading}
              className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 hover:border-emerald-500/50"
            >
              <Cpu className="w-4 h-4" />
              Use Ollama (Free — No API Key Needed)
            </button>
            <p className="text-[9px] text-slate-500 mt-1.5 text-center">
              Requires <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">Ollama</a> installed locally. Run: <code className="text-slate-400">ollama pull llama3.2</code>
            </p>
          </div>

          <div className="px-4 pb-1 pt-2">
            <div className="border-t border-slate-800 pt-3 mb-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Or paste an API key</span>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... / AIzaSy... / pplx-... / gsk_..."
                className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm focus:outline-none focus:border-primary-500/50 transition-colors font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveKey();
                }}
              />
            </div>

            <button
              onClick={() => handleSaveKey()}
              disabled={loading || !apiKey.trim()}
              className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                apiKey.trim() && !loading
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Verifying & Encrypting...' : 'Switch Active LLM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMSelector;
