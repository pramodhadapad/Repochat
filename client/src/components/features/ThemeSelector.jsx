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
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80"
        style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
      >
        <Palette className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-2 shadow-2xl shadow-black/50 min-w-[200px]" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--theme-muted)' }}>Color Theme</p>
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                onClick={() => {
                  setNamedTheme(key);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: theme === key ? 'var(--theme-primary)' : 'transparent',
                  color: theme === key ? '#FFFFFF' : 'var(--theme-text)',
                  opacity: theme === key ? 0.9 : 1,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-slate-600"
                  style={{ backgroundColor: t.colors['--theme-primary'] || '#DA291C' }}
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
