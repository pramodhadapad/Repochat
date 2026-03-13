const fs = require('fs');
const path = require('path');
const Repo = require('../models/Repo');
const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const IntentDiscovery = require('./IntentDiscovery');
const Orchestrator = require('./Orchestrator');
const ToolRegistry = require('./ToolRegistry');
const { decrypt } = require('./KeyEncryptor');
const ClaudeProvider = require('../providers/ClaudeProvider');
const OpenAIProvider = require('../providers/OpenAIProvider');
const GeminiProvider = require('../providers/GeminiProvider');
const DeepSeekProvider = require('../providers/DeepSeekProvider');
const PerplexityProvider = require('../providers/PerplexityProvider');
const OllamaProvider = require('../providers/OllamaProvider');
const GroqProvider = require('../providers/GroqProvider');
const OpenRouterProvider = require('../providers/OpenRouterProvider');
const TogetherProvider = require('../providers/TogetherProvider');

// ── In-Memory Response Cache (LRU, 100 entries, 1hr TTL) ──
const CACHE_MAX = 100;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const responseCache = new Map();

function getCacheKey(repoId, question) {
  return `${repoId}:${question.trim().toLowerCase()}`;
}

function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Evict oldest if full
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Service to handle AI chat queries with repo context.
 */
class ChatService {
  /**
   * Gets the appropriate AI provider instance for a user.
   * @param {object} user - User document.
   * @returns {AIProvider} - The initialized AI provider.
   */
  getProvider(user) {
    if (!user.apiKey && user.provider !== 'ollama') throw new Error('API key missing');

    // Ollama doesn't need a real encrypted key
    const apiKey = user.provider === 'ollama' ? 'ollama' : decrypt(user.apiKey);

    switch (user.provider) {
      case 'claude': return new ClaudeProvider(apiKey);
      case 'openai': return new OpenAIProvider(apiKey);
      case 'gemini': return new GeminiProvider(apiKey);
      case 'deepseek': return new DeepSeekProvider(apiKey);
      case 'perplexity': return new PerplexityProvider(apiKey);
      case 'groq': return new GroqProvider(apiKey);
      case 'openrouter': return new OpenRouterProvider(apiKey);
      case 'together': return new TogetherProvider(apiKey);
      case 'ollama': return new OllamaProvider(apiKey);
      case 'custom':
        console.log('[CHAT] Using Custom (OpenAI-compatible) provider.');
        return new OpenAIProvider(apiKey);
      default:
        console.error(`[CHAT] Unsupported provider requested: ${user.provider}`);
        throw new Error(`Unsupported provider: ${user.provider}`);
    }
  }

  /**
   * Generates a structural map of the codebase for high-level reasoning.
   */
  async generateCodebaseMap(localPath) {
    try {
      const buildMap = (dir, depth = 0) => {
        if (depth > 3) return ''; // Limit depth to avoid token bloat
        let map = '';
        const list = fs.readdirSync(dir);

        list.forEach(file => {
          if (['node_modules', '.git', '.next', 'dist', 'vendor', '__pycache__'].includes(file)) return;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          const indent = '  '.repeat(depth);

          if (stat.isDirectory()) {
            map += `${indent}📁 ${file}/\n${buildMap(fullPath, depth + 1)}`;
          } else {
            map += `${indent}📄 ${file}\n`;
          }
        });
        return map;
      };

      return buildMap(localPath);
    } catch (err) {
      console.error('[CHAT] Map generation failed:', err.message);
      return 'Codebase map unavailable.';
    }
  }

  /**
   * Fuzzy matches user query terms against actual file names to handle typos.
   */
  async findPotentialFiles(localPath, query) {
    try {
      const allFiles = [];
      const scan = (dir) => {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          if (['node_modules', '.git', '.next', 'dist', 'vendor', '__pycache__'].includes(file)) return;
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) scan(fullPath);
          else allFiles.push({ name: file, path: fullPath, relPath: path.relative(localPath, fullPath) });
        });
      };
      scan(localPath);

      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const matches = [];

      for (const file of allFiles) {
        const fileNameLower = file.name.toLowerCase();
        for (const term of queryTerms) {
          if (fileNameLower.startsWith(term.slice(0, 4)) || term.startsWith(fileNameLower.slice(0, 4))) {
            matches.push(file);
            break;
          }
        }
      }
      return matches.slice(0, 3);
    } catch (err) {
      return [];
    }
  }

  /**
   * Handles a chat message.
   * @param {string} question - User's question.
   * @param {string} repoId - Repository ID.
   * @param {object} user - User document.
   * @param {string} history - Recent conversation history.
   * @returns {Promise<object>} - AI response with answer and file reference.
   */
  async chat(question, repoId, user, history = "") {
    // 0. Check cache first
    const cacheKey = getCacheKey(repoId, question);
    const cached = getCached(cacheKey);
    if (cached) return { ...cached, cached: true };

    const repo = await Repo.findById(repoId);
    if (!repo) throw new Error('Repository not found');

    const provider = this.getProvider(user);

    // 1. Discover Intent & Normalize Language
    const intent = await IntentDiscovery.discoverIntent(question, provider, user.model);
    console.log(`[CHAT] Discovered Intent: ${intent.intent}`);

    // 2. Orchestrate context gathering (Tool calls)
    let gatheredContext = await Orchestrator.orchestrate(repoId, intent, provider, user.model, user._id);

    // 2.1 PROACTIVE CONTEXT INJECTION (Safety Net)
    const broadIntents = ['OVERVIEW', 'EXPLAIN', 'SEARCH'];
    if (broadIntents.includes(intent.intent) || !gatheredContext.trim()) {
      const structuralMap = await this.generateCodebaseMap(repo.localPath);
      gatheredContext = `### PROACTIVE CODEBASE MAP:\n${structuralMap}\n\n` + gatheredContext;

      if (intent.intent === 'OVERVIEW' || question.toLowerCase().includes('project')) {
        const readmePath = path.join(repo.localPath, 'README.md');
        if (fs.existsSync(readmePath)) {
          gatheredContext = `### PROJECT README:\n${fs.readFileSync(readmePath, 'utf8')}\n\n` + gatheredContext;
        }
      }
    }

    // 3. Fallback to basic search if tool context is STILL empty
    let finalContext = gatheredContext;
    if (!finalContext.trim()) {
      const queryVector = await EmbeddingService.generateEmbedding(intent.original_slang_fixed, user);
      const chunks = await VectorIndexer.search(repoId, queryVector, 5, intent.original_slang_fixed);
      finalContext = chunks.map((c, i) => `[Search ${i + 1}: ${c.metadata.filePath}]\n${c.content}`).join('\n\n---\n\n');
    }

    if (!finalContext.trim()) {
      finalContext = "WARNING: No relevant code context found in the user's repository. Do not invent details.";
    }

    // 4. Final Reasoning Response — FIXED PROMPT
    const prompt = `You are RepoChat, a helpful senior developer assistant. You help users understand their codebase.

STRICT RULES — follow these exactly:
- Answer directly and naturally, like a senior developer talking to a teammate
- NEVER start with phrases like "Given the user's query", "Based on the context", "The user's intent is", "It seems they are looking for"
- NEVER mention words like "intent", "entities", "normalized query", or "codebase map" in your response
- Do NOT repeat or restate the question back to the user
- Just answer clearly, helpfully, and concisely
- When referencing code, mention the file path naturally (e.g. "In app.js, the login route...")
- If the Codebase context below says no context was found, gracefully tell the user you don't have enough info in the indexed files. DO NOT invent a project like "my-app" or assume any file structures.

${history ? `Recent conversation:\n${history}\n\n` : ''}Codebase context:\n${finalContext}

User's question: ${question}

Answer:`;

    const result = await provider.generateResponse(prompt, user.model);

    const response = {
      answer: result.answer,
      intent: intent.intent,
      fileRef: null,
      provider: user.provider,
      model: user.model,
      tokensUsed: result.tokensUsed
    };

    // Try to attach a fileRef if the AI cited something specifically
    if (finalContext.includes('[File:')) {
      const match = finalContext.match(/\[File: (.*?)\]/);
      if (match) {
        response.fileRef = { path: match[1], startLine: 1, endLine: 20 };
      }
    }

    // 5. Cache the response
    setCache(cacheKey, response);

    return response;
  }
}

module.exports = new ChatService();