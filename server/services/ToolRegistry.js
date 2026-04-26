const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');

// Dirs that should never be listed or read
const IGNORED = new Set(['node_modules', '.git', '.next', 'dist', 'vendor', '__pycache__', 'tmp', 'build', 'coverage']);

class ToolRegistry {
  constructor() {
    this.tools = {

      list_files: {
        description: 'Lists files in a specific directory or the project root.',
        parameters: {
          type: 'object',
          properties: {
            directory: { type: 'string', description: "Relative path to list. Use '.' for root." }
          }
        },
        execute: async (repoId, { directory = '.' }) => {
          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          if (!repo) return 'Error: Repository not found.';

          const targetDir = path.join(repo.localPath, directory);
          if (!(await fse.exists(targetDir))) return `Error: Directory "${directory}" not found.`;

          const files = await fse.readdir(targetDir);
          const filtered = files.filter(f => !IGNORED.has(f));
          return `Files in ${directory}:\n` + filtered.map(f => `- ${f}`).join('\n');
        }
      },

      read_code: {
        description: 'Reads the content of a specific file by its relative path.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Relative path of the file to read.' }
          }
        },
        execute: async (repoId, { filePath }) => {
          if (!filePath) return 'Error: filePath parameter is required.';

          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          if (!repo) return 'Error: Repository not found.';

          // Prevent path traversal
          const fullPath = path.resolve(repo.localPath, filePath);
          if (!fullPath.startsWith(path.resolve(repo.localPath))) {
            return 'Error: Access denied — path traversal detected.';
          }

          if (!(await fse.exists(fullPath))) return `Error: File "${filePath}" not found.`;

          const content = await fse.readFile(fullPath, 'utf8');
          // Cap file read size to prevent flooding context
          const capped = content.length > 8000
            ? content.substring(0, 8000) + '\n... [file truncated at 8000 chars]'
            : content;
          return `[File: ${filePath}]\n\`\`\`\n${capped}\n\`\`\``;
        }
      },

      search_code: {
        description: 'Semantic search for code snippets based on a natural language query.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The technical concept or logic to search for.' }
          }
        },
        execute: async (repoId, { query }, userId) => {
          if (!query) return 'Error: query parameter is required.';

          const user = await require('../models/User').findById(userId);
          if (!user) return 'Error: User not found.';

          const queryVector = await EmbeddingService.generateEmbedding(query, user);
          const chunks = await VectorIndexer.search(repoId, queryVector, 5, query);

          // Filter out tiny noisy chunks
          const validChunks = chunks.filter(c => c.content.trim().length > 20);

          if (validChunks.length === 0) return 'No relevant code found for this query.';

          return validChunks
            .map((c) => `[File: ${c.metadata.filePath}]\n${c.content}`)
            .join('\n\n---\n\n');
        }
      },

      get_codebase_map: {
        description: 'Provides a high-level structural file tree of the repository.',
        parameters: {
          type: 'object',
          properties: {
            depth: { type: 'number', description: 'Maximum depth to scan. Default 2, max 3.' }
          }
        },
        execute: async (repoId, { depth = 2 }) => {
          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          if (!repo) return 'Error: Repository not found.';

          const maxDepth = Math.min(depth, 3); // Hard cap at 3

          const buildMap = (dir, currentDepth = 0) => {
            if (currentDepth > maxDepth) return '';
            let map = '';
            try {
              const entries = fs.readdirSync(dir);
              for (const file of entries) {
                if (IGNORED.has(file)) continue;
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                const indent = '  '.repeat(currentDepth);
                if (stat.isDirectory()) {
                  map += `${indent}📁 ${file}/\n${buildMap(fullPath, currentDepth + 1)}`;
                } else {
                  map += `${indent}📄 ${file}\n`;
                }
              }
            } catch {
              // Skip unreadable dirs silently
            }
            return map;
          };

          return `Codebase Map (depth ${maxDepth}):\n${buildMap(repo.localPath)}`;
        }
      }

    };
  }

  /** Check if a tool exists (used by Orchestrator to sanitize plans) */
  hasTool(name) {
    return Object.prototype.hasOwnProperty.call(this.tools, name);
  }

  getToolDefinitions() {
    return Object.entries(this.tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  async runTool(name, repoId, parameters, userId) {
    if (!this.hasTool(name)) throw new Error(`Unknown tool: "${name}"`);
    return await this.tools[name].execute(repoId, parameters, userId);
  }
}

module.exports = new ToolRegistry();