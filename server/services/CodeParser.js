const Parser = require('tree-sitter');
const fs = require('fs');
const path = require('path');

/**
 * Language mappings for tree-sitter.
 */
const LANGUAGES = {
  javascript: 'tree-sitter-javascript',
  typescript: 'tree-sitter-typescript',
  python: 'tree-sitter-python',
  java: 'tree-sitter-java',
  cpp: 'tree-sitter-cpp',
  go: 'tree-sitter-go',
  rust: 'tree-sitter-rust',
  ruby: 'tree-sitter-ruby',
  php: 'tree-sitter-php',
  csharp: 'tree-sitter-c-sharp'
};

const EXTENSION_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cc': 'cpp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.html': 'html',
  '.css': 'css',
  '.json': 'json',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sql': 'sql',
  '.sh': 'bash',
  '.txt': 'text'
};

/**
 * Detects language from file extension.
 * @param {string} filePath - Path to the file.
 * @returns {string|null} - Detected language or null.
 */
function detectLanguage(filePath) {
  const ext = path.extname(filePath);
  return EXTENSION_MAP[ext] || null;
}

/**
 * Parses a file and returns structural chunks.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} relativePath - Path relative to repo root.
 * @returns {object[]} - Array of CodeChunk objects.
 */
function parseFile(filePath, relativePath) {
  const languageName = detectLanguage(filePath);
  if (!languageName) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  if (!content) return [];

  try {
    const parser = new Parser();
    const langPackage = LANGUAGES[languageName];
    if (!langPackage) {
      return fallbackChunker(content, relativePath, languageName);
    }
    const Language = require(langPackage);
    parser.setLanguage(Language);

    const tree = parser.parse(content);
    const chunks = [];

    // Simple strategy: extract top-level functions and classes
    // In a real production app, this would be much more sophisticated
    const nodes = tree.rootNode.children;

    for (const node of nodes) {
      if (['function_declaration', 'class_declaration', 'function_definition', 'class_definition', 'method_declaration'].includes(node.type)) {
        chunks.push({
          filePath: relativePath,
          language: languageName,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          content: content.substring(node.startIndex, node.endIndex),
          type: node.type.split('_')[0], // 'function' or 'class'
          name: node.firstNamedChild?.text || 'anonymous'
        });
      }
    }

    // Fallback if no structural chunks found or if parsing failed
    if (chunks.length === 0 && content.length > 0) {
      return fallbackChunker(content, relativePath, languageName);
    }

    return chunks;
  } catch (error) {
    console.error(`Error parsing file ${filePath} with tree-sitter. Using fallback chunker.`, error.message);
    return fallbackChunker(content, relativePath, languageName);
  }
}

/**
 * Simple line-based chunking fallback for when tree-sitter isn't available
 * or fails to parse structural elements.
 */
function fallbackChunker(content, relativePath, languageName) {
  const lines = content.split('\n');
  const chunks = [];
  const chunkSize = 150; // lines per chunk
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunkLines = lines.slice(i, i + chunkSize);
    chunks.push({
      filePath: relativePath,
      language: languageName,
      startLine: i + 1,
      endLine: Math.min(i + chunkSize, lines.length),
      content: chunkLines.join('\n'),
      type: 'chunk',
      name: `${path.basename(relativePath)} chunk ${Math.floor(i/chunkSize) + 1}`
    });
  }
  return chunks;
}

module.exports = { parseFile, detectLanguage };
