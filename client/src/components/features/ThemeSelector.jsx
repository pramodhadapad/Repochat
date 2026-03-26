import { useState } from 'react';
import { useTheme } from '../common/ThemeProvider';
import themes from '../../config/themes';
import { Palette, Check } from 'lucide-react';

const ThemeSelector = () => {
  const { theme, setNamedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-primary-500/30 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
      >
        <Palette className="w-4 h-4 text-primary-400" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700/50 rounded-2xl p-2 shadow-2xl shadow-black/50 min-w-[200px]">
            <p className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Color Theme</p>
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                onClick={() => {
                  setNamedTheme(key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  theme === key
                    ? 'bg-primary-600/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-slate-600"
                  style={{ backgroundColor: t.colors['--theme-primary'] || '#0db9f2' }}
                />
                <span className="flex-1 text-left">{t.name}</span>
                {theme === key && <Check className="w-3.5 h-3.5 text-primary-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
