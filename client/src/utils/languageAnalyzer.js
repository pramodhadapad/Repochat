/**
 * Analyzes file extensions from a repo's file tree to produce language statistics.
 * This runs entirely on the client from the existing tree data.
 */

const LANGUAGE_MAP = {
  js: { name: 'JavaScript', color: '#f7df1e' },
  jsx: { name: 'React JSX', color: '#61dafb' },
  ts: { name: 'TypeScript', color: '#3178c6' },
  tsx: { name: 'React TSX', color: '#3178c6' },
  py: { name: 'Python', color: '#3776ab' },
  java: { name: 'Java', color: '#ed8b00' },
  rb: { name: 'Ruby', color: '#cc342d' },
  go: { name: 'Go', color: '#00add8' },
  rs: { name: 'Rust', color: '#dea584' },
  cpp: { name: 'C++', color: '#00599c' },
  c: { name: 'C', color: '#a8b9cc' },
  cs: { name: 'C#', color: '#239120' },
  php: { name: 'PHP', color: '#777bb4' },
  swift: { name: 'Swift', color: '#fa7343' },
  kt: { name: 'Kotlin', color: '#7f52ff' },
  html: { name: 'HTML', color: '#e34c26' },
  css: { name: 'CSS', color: '#1572b6' },
  scss: { name: 'SCSS', color: '#cc6699' },
  json: { name: 'JSON', color: '#292929' },
  md: { name: 'Markdown', color: '#083fa1' },
  yml: { name: 'YAML', color: '#cb171e' },
  yaml: { name: 'YAML', color: '#cb171e' },
  sql: { name: 'SQL', color: '#e38c00' },
  sh: { name: 'Shell', color: '#89e051' },
  vue: { name: 'Vue', color: '#4fc08d' },
  svelte: { name: 'Svelte', color: '#ff3e00' },
};

/**
 * Recursively counts file extensions from a tree structure.
 * @param {Array} tree - File tree array from the API
 * @returns {Array} Sorted language stats [{ name, ext, count, color, percentage }]
 */
export function analyzeLanguages(tree) {
  const counts = {};

  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach(node => {
      if (node.type === 'file' || !node.children) {
        const name = node.name || node.path || '';
        const ext = name.split('.').pop()?.toLowerCase();
        if (ext && LANGUAGE_MAP[ext]) {
          counts[ext] = (counts[ext] || 0) + 1;
        }
      }
      if (node.children) walk(node.children);
    });
  }

  walk(tree);

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;

  return Object.entries(counts)
    .map(([ext, count]) => ({
      name: LANGUAGE_MAP[ext]?.name || ext,
      ext,
      count,
      color: LANGUAGE_MAP[ext]?.color || '#666',
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6); // top 6 languages
}
