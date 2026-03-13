import { useState } from 'react';
import { Shield, Key, Check, ChevronRight, Info, Loader2, AlertCircle } from 'lucide-react';
import { keyService, authService } from '../../services/api';
import useStore from '../../store/useStore';

const ApiKeySetup = () => {
  const { setUser } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [isDetected, setIsDetected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectProvider = (val) => {
    if (!val || val.length < 8) return null;
    if (val.startsWith('sk-ant')) return 'claude';
    if (val.startsWith('AIzaSy')) return 'gemini';
    if (val.startsWith('pplx-')) return 'perplexity';
    if (val.startsWith('dsk-')) return 'deepseek';
    if (val.startsWith('gsk_')) return 'groq';
    if (val.startsWith('sk-or-')) return 'openrouter';
    if (val.startsWith('together_')) return 'together';
    if (val.startsWith('sk-')) return 'openai';
    // Accept ANY key that is long enough as custom/openai-compatible
    if (val.length >= 8) return 'custom';
    return null;
  };

  const getProviderLabel = (p) => {
    const labels = {
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity',
      deepseek: 'DeepSeek',
      groq: 'Groq',
      openrouter: 'OpenRouter',
      together: 'Together AI',
      openai: 'OpenAI',
      custom: 'Custom LLM',
    };
    return labels[p] || p;
  };

  const handleChange = (e) => {
    const val = e.target.value.trim();
    setApiKey(val);
    const p = detectProvider(val);
    if (p) {
      setProvider(p);
      setIsDetected(true);
      setError(null);
    } else {
      setIsDetected(false);
      setProvider(null);
    }
  };

  const handleSave = async () => {
    if (!apiKey || !isDetected) return;
    setLoading(true);
    setError(null);
    try {
      const response = await keyService.saveKey(apiKey);
      const res = await authService.getProfile();
      setUser(res.data.user);
      setApiKey('');
      setIsDetected(false);
      setProvider(null);
    } catch (err) {
      console.error('Failed to save key:', err);
      setError(err.response?.data?.message || 'Failed to save API key. Please check your key and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-[32px] bg-gradient-to-br from-primary-600/20 to-indigo-600/20 border border-primary-500/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <Shield className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold italic tracking-tight">Backend Security Setup</h2>
          </div>
          <p className="text-slate-400 mb-2 max-w-md text-sm leading-relaxed">
            Paste your AI API key below. Supports <span className="text-white font-medium">Groq, OpenAI, Claude, Gemini, DeepSeek, Perplexity, OpenRouter, Together AI</span> and any OpenAI-compatible API.
          </p>
          <p className="text-slate-500 mb-6 max-w-md text-xs">
            Your key is encrypted with AES-256-GCM and never stored in plain text.
          </p>

          <div className="relative max-w-md">
            <input
              type="password"
              value={apiKey}
              onChange={handleChange}
              placeholder="gsk_xxx / sk-ant-xxx / sk-xxx / AIza..."
              className={`w-full h-14 bg-slate-900 border rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono text-sm ${
                error ? 'border-red-500/50' : 'border-slate-800'
              }`}
            />
            {isDetected && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-lg border border-green-500/20 uppercase tracking-widest">
                <Check className="w-3 h-3" />
                {getProviderLabel(provider)}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-xs px-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>

        <div className="w-full md:w-64 flex flex-col gap-4">
          <button
            onClick={handleSave}
            disabled={!isDetected || loading}
            className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
              isDetected && !loading
                ? 'bg-white text-black hover:bg-slate-200 shadow-white/10'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
            {!loading && <ChevronRight className="w-5 h-5" />}
          </button>

          <a href="#" className="flex items-center gap-2 text-[11px] text-slate-500 px-2 hover:text-slate-300 transition-colors uppercase tracking-widest font-bold">
            <Info className="w-3.5 h-3.5" />
            Find API Key
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
