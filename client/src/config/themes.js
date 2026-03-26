/**
 * Named color themes for RepoChat.
 * Each theme defines CSS custom properties that are applied to :root.
 * The "base" property determines whether light or dark mode class is applied.
 */
const themes = {
  default: {
    name: 'Default Dark',
    base: 'dark',
    colors: {} // uses tailwind defaults
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
    }
  },
  github: {
    name: 'GitHub Light',
    base: 'light',
    colors: {
      '--theme-bg': '#ffffff',
      '--theme-surface': '#f6f8fa',
      '--theme-primary': '#0969da',
      '--theme-accent': '#cf222e',
      '--theme-text': '#1f2328',
      '--theme-muted': '#656d76',
    }
  }
};

export default themes;
