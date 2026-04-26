/**
 * Named color themes for RepoChat.
 * Each theme defines CSS custom properties that are applied to :root.
 * The "base" property determines whether light or dark mode class is applied.
 */
const themes = {
  default: {
    name: 'Ferrari Dark',
    base: 'dark',
    colors: {
      '--theme-bg': '#000000',
      '--theme-surface': '#303030',
      '--theme-primary': '#DA291C',
      '--theme-accent': '#DA291C',
      '--theme-text': '#FFFFFF',
      '--theme-muted': '#8F8F8F',
      '--theme-border': '#303030',
    }
  },
  github: {
    name: 'Ferrari Light',
    base: 'light',
    colors: {
      '--theme-bg': '#FFFFFF',
      '--theme-surface': '#F5F5F5',
      '--theme-primary': '#DA291C',
      '--theme-accent': '#B01E0A',
      '--theme-text': '#181818',
      '--theme-muted': '#666666',
      '--theme-border': '#E5E5E5',
    }
  },
  dracula: {
    name: 'Dracula',
    base: 'dark',
    colors: {
      '--theme-bg': '#282a36',
      '--theme-surface': '#44475a',
      '--theme-primary': '#bd93f9',
      '--theme-accent': '#ff79c6',
      '--theme-text': '#f8f8f2',
      '--theme-muted': '#6272a4',
      '--theme-border': '#44475a',
    }
  },
  nord: {
    name: 'Nord',
    base: 'dark',
    colors: {
      '--theme-bg': '#2e3440',
      '--theme-surface': '#3b4252',
      '--theme-primary': '#88c0d0',
      '--theme-accent': '#81a1c1',
      '--theme-text': '#eceff4',
      '--theme-muted': '#4c566a',
      '--theme-border': '#3b4252',
    }
  },
  monokai: {
    name: 'Monokai',
    base: 'dark',
    colors: {
      '--theme-bg': '#272822',
      '--theme-surface': '#3e3d32',
      '--theme-primary': '#a6e22e',
      '--theme-accent': '#f92672',
      '--theme-text': '#f8f8f2',
      '--theme-muted': '#75715e',
      '--theme-border': '#3e3d32',
    }
  },
  solarized: {
    name: 'Solarized Dark',
    base: 'dark',
    colors: {
      '--theme-bg': '#002b36',
      '--theme-surface': '#073642',
      '--theme-primary': '#2aa198',
      '--theme-accent': '#cb4b16',
      '--theme-text': '#839496',
      '--theme-muted': '#586e75',
      '--theme-border': '#073642',
    }
  }
};

export default themes;
