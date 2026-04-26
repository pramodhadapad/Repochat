import React, { createContext, useContext, useEffect } from 'react';
import useStore from '../../store/useStore';
import themes from '../../config/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { theme, setTheme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    const themeConfig = themes[theme] || themes.default;

    // Apply light/dark base class
    root.classList.remove('light', 'dark');
    root.classList.add(themeConfig.base);

    // Apply CSS custom properties
    // First clear previous theme vars
    Object.keys(themes).forEach(key => {
      const t = themes[key];
      if (t.colors) {
        Object.keys(t.colors).forEach(prop => {
          root.style.removeProperty(prop);
        });
      }
    });

    // Then apply current theme vars
    if (themeConfig.colors) {
      Object.entries(themeConfig.colors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'default' ? 'github' : 'default');
  };

  const setNamedTheme = (name) => {
    if (themes[name]) {
      setTheme(name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setNamedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
