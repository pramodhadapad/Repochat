const fs = require('fs-extra');
const path = require('path');
const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');

class ToolRegistry {
  constructor() {
    this.tools = {
      list_files: {
        description: "Lists files in a specific directory or the whole project root.",
        parameters: {
          type: "object",
          properties: {
            directory: { type: "string", description: "Relative path to list. Use '.' for root." }
          }
        },
        execute: async (repoId, { directory = '.' }, userId) => {
          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          const targetDir = path.join(repo.localPath, directory);
          
          if (!(await fs.exists(targetDir))) return `Error: Directory ${directory} not found.`;
          
          const files = await fs.readdir(targetDir);
          return `Files in ${directory}:\n` + files.map(f => `- ${f}`).join('\n');
        }
      },
      read_code: {
        description: "Reads the content of a specific file.",
        parameters: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Relative path of the file to read." }
          }
        },
        execute: async (repoId, { filePath }, userId) => {
          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          const fullPath = path.join(repo.localPath, filePath);
          
          if (!(await fs.exists(fullPath))) return `Error: File ${filePath} not found.`;
          
          const content = await fs.readFile(fullPath, 'utf8');
          return `Content of ${filePath}:\n\`\`\`\n${content}\n\`\`\``;
        }
      },
      search_code: {
        description: "Semantic search for code snippets based on a natural language query.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The technical concept or logic to search for." }
          }
        },
        execute: async (repoId, { query }, userId) => {
          const user = await require('../models/User').findById(userId);
          const queryVector = await EmbeddingService.generateEmbedding(query, user);
          const chunks = await VectorIndexer.search(repoId, queryVector, 5, query);
          
          if (chunks.length === 0) return "No relevant code found.";
          
          return chunks.map((c, i) => `[Match ${i+1}: ${c.metadata.filePath}]\n${c.content}`).join('\n\n---\n\n');
        }
      },
      get_codebase_map: {
        description: "Provides a high-level structural map (file tree) of the repository.",
        parameters: {
          type: "object",
          properties: {
            depth: { type: "number", description: "Maximum depth to scan. Default is 2." }
          }
        },
        execute: async (repoId, { depth = 2 }, userId) => {
          const Repo = require('../models/Repo');
          const repo = await Repo.findById(repoId);
          
          const buildMap = (dir, currentDepth = 0) => {
            if (currentDepth > depth) return '';
            let map = '';
            const list = fs.readdirSync(dir);
            list.forEach(file => {
              if (['node_modules', '.git', '.next', 'dist', 'vendor', '__pycache__', 'tmp'].includes(file)) return;
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);
              const indent = '  '.repeat(currentDepth);
              if (stat.isDirectory()) {
                map += `${indent}📁 ${file}/\n${buildMap(fullPath, currentDepth + 1)}`;
              } else {
                map += `${indent}📄 ${file}\n`;
              }
            });
            return map;
          };

          return `Codebase Map (Depth ${depth}):\n${buildMap(repo.localPath)}`;
        }
      }
    };
  }

  getToolDefinitions() {
    return Object.keys(this.tools).map(key => ({
      name: key,
      description: this.tools[key].description,
      parameters: this.tools[key].parameters
    }));
  }

  async runTool(name, repoId, parameters, userId) {
    if (!this.tools[name]) throw new Error(`Tool ${name} not found`);
    return await this.tools[name].execute(repoId, parameters, userId);
  }
}

module.exports = new ToolRegistry();
