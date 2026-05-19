const fs = require('fs');
const path = require('path');
const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const ChatService = require('./ChatService');
const { walkFiles } = require('./RepoCloner');
const { parseFile } = require('./CodeParser');

/**
 * Service to auto-generate README content for a repository.
 * Resilient: falls back to direct file scan if vector search returns nothing.
 */
class ReadmeGenerator {
  /**
   * Generates a README for a repository based on its indexed content.
   * @param {string} repoId - Repository ID.
   * @param {object} user - User document.
   * @param {string} localPath - Local path to the repo files (for fallback scanning).
   * @returns {Promise<string>} - The generated README content (Markdown).
   */
  async generateReadme(repoId, user, localPath) {
    let contextChunks = [];

    // ── 1. Try vector search first ──
    try {
      const queryVector = await EmbeddingService.generateEmbedding(
        "Generate a comprehensive README overview including project purpose, features, and structure.",
        user
      );
      contextChunks = await VectorIndexer.search(repoId, queryVector, 5);
    } catch (err) {
      console.warn('[README] Vector search failed:', err.message);
    }

    // ── 2. Fallback: scan files directly from disk ──
    if (contextChunks.length === 0 && localPath && fs.existsSync(localPath)) {
      console.info('[README] Vector search returned 0 chunks. Scanning files from disk as fallback...');
      try {
        const files = walkFiles(localPath);
        const allChunks = [];

        for (const filePath of files) {
          const relativePath = path.relative(localPath, filePath);
          const chunks = parseFile(filePath, relativePath);
          if (chunks.length > 0) {
            allChunks.push(...chunks);
          }
        }

        // Pick the most relevant files: entry points, configs, main files
        const priorityPatterns = [
          /readme/i, /package\.json/i, /index\.(js|ts|py|html)/i,
          /main\.(js|ts|py)/i, /app\.(js|ts|py|jsx|tsx)/i,
          /server\.(js|ts)/i, /config/i, /routes/i
        ];

        const prioritized = allChunks
          .map(chunk => {
            let priority = 0;
            const fp = chunk.filePath || '';
            priorityPatterns.forEach((pat, i) => {
              if (pat.test(fp)) priority += (priorityPatterns.length - i);
            });
            return { ...chunk, priority };
          })
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 5);

        contextChunks = prioritized.map(c => ({
          content: c.content,
          metadata: {
            filePath: c.filePath,
            startLine: c.startLine,
            endLine: c.endLine,
            name: c.name
          }
        }));
      } catch (scanErr) {
        console.error('[README] Disk scan fallback failed:', scanErr.message);
      }
    }

    if (contextChunks.length === 0) {
      throw new Error('NO_CONTEXT_FOR_README: No code context could be retrieved. Please re-index the repository.');
    }

    // ── 3. Build context string (truncated to prevent token overflow) ──
    const MAX_CHUNK_CHARS = 1500;
    const contextString = contextChunks.map((chunk) => {
      const content = chunk.content.length > MAX_CHUNK_CHARS
        ? chunk.content.substring(0, MAX_CHUNK_CHARS) + '\n... [truncated]'
        : chunk.content;
      return `[File: ${chunk.metadata.filePath}]\n${content}`;
    }).join('\n\n---\n\n');

    // ── 4. Build file tree summary for structural context ──
    let treeString = '';
    if (localPath && fs.existsSync(localPath)) {
      try {
        const IGNORED = new Set(['node_modules', '.git', '.next', 'dist', '__pycache__', 'build', 'coverage']);
        const buildTree = (dir, depth = 0) => {
          if (depth > 2) return '';
          let tree = '';
          const entries = fs.readdirSync(dir);
          for (const file of entries) {
            if (IGNORED.has(file)) continue;
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            const indent = '  '.repeat(depth);
            if (stat.isDirectory()) {
              tree += `${indent}📁 ${file}/\n${buildTree(fullPath, depth + 1)}`;
            } else {
              tree += `${indent}📄 ${file}\n`;
            }
          }
          return tree;
        };
        treeString = buildTree(localPath);
        if (treeString.length > 2000) {
          treeString = treeString.substring(0, 2000) + '\n... [truncated]';
        }
      } catch (e) { /* ignore */ }
    }

    // ── 5. Generate README via LLM ──
    const prompt = `You are a technical writer. Based on the provided code segments and project structure, generate a professional README.md in Markdown format.

The README should include:
1. Project Title and a brief, compelling summary.
2. Key Features (bullet points).
3. Technology Stack.
4. Project Structure (brief overview of main directories).
5. Getting Started / Installation steps.

${treeString ? `Project File Structure:\n${treeString}\n\n` : ''}Code Context:
${contextString}

Response (Markdown Only):`;

    const provider = ChatService.getProvider(user);
    const result = await provider.generateResponse(prompt, user.model, { maxTokens: 8192 });

    return result.answer;
  }
}

module.exports = new ReadmeGenerator();
