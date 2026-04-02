const fs = require('fs');
const path = require('path');
const Repo = require('../models/Repo');
const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const IntentDiscovery = require('./IntentDiscovery');
const Orchestrator = require('./Orchestrator');
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

// ── In-Memory Response Cache ──────────────────────────
const CACHE_MAX = 100;
const CACHE_TTL = 60 * 60 * 1000;
const responseCache = new Map();
function getCacheKey(repoId, question) { return `${repoId}:${question.trim().toLowerCase()}`; }
function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { responseCache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  if (responseCache.size >= CACHE_MAX) responseCache.delete(responseCache.keys().next().value);
  responseCache.set(key, { data, timestamp: Date.now() });
}
// ─────────────────────────────────────────────────────

// ── Token Safety ──────────────────────────────────────
const MAX_CONTEXT_CHARS = 12000;
const MAX_MAP_CHARS = 3000;
const MAX_README_CHARS = 1500;

function truncate(str, maxChars) {
  if (!str) return '';
  if (str.length <= maxChars) return str;
  return str.substring(0, maxChars) + '\n... [truncated to fit token limit]';
}
// ─────────────────────────────────────────────────────

// ── Intent Categories ─────────────────────────────────
const NON_CONTEXT_INTENTS = ['GREETING', 'SMALLTALK', 'THANKS', 'CHITCHAT', 'BYE'];
const BROAD_INTENTS = ['OVERVIEW', 'EXPLAIN', 'SEARCH'];
// ─────────────────────────────────────────────────────

class ChatService {

  getProvider(user) {
    if (!user.apiKey && user.provider !== 'ollama') throw new Error('API key missing. Please add your API key from Dashboard.');
    const apiKey = user.provider === 'ollama' ? 'ollama' : decrypt(user.apiKey);
    switch (user.provider) {
      case 'claude':      return new ClaudeProvider(apiKey);
      case 'openai':      return new OpenAIProvider(apiKey);
      case 'gemini':      return new GeminiProvider(apiKey);
      case 'deepseek':    return new DeepSeekProvider(apiKey);
      case 'perplexity':  return new PerplexityProvider(apiKey);
      case 'groq':        return new GroqProvider(apiKey);
      case 'openrouter':  return new OpenRouterProvider(apiKey);
      case 'together':    return new TogetherProvider(apiKey);
      case 'ollama':      return new OllamaProvider(apiKey);
      case 'custom':      return new OpenAIProvider(apiKey);
      default: throw new Error(`Unsupported provider: ${user.provider}`);
    }
  }

  // Only depth 2, max 3000 chars
  async generateCodebaseMap(localPath) {
    try {
      const buildMap = (dir, depth = 0) => {
        if (depth > 2) return '';
        let map = '';
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          if (['node_modules', '.git', '.next', 'dist', 'vendor', '__pycache__', 'build', 'coverage'].includes(file)) return;
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
      const fullMap = buildMap(localPath);
      return truncate(fullMap, MAX_MAP_CHARS);
    } catch (err) {
      return 'Codebase map unavailable.';
    }
  }

  // ── Build final LLM prompt based on intent ────────────
  buildPrompt(intent, question, finalContext, history) {
    const historySection = history
      ? `Recent conversation:\n${truncate(history, 1000)}\n\n`
      : '';

    // Conversational — no code context needed
    if (NON_CONTEXT_INTENTS.includes(intent)) {
      return `You are RepoChat, a friendly assistant for exploring codebases.
${historySection}The user said: "${question}"
Reply naturally and briefly. Do NOT analyze, summarize, or mention any code or files unless the user explicitly asks.
Answer:`;
    }

    // Code-aware — detailed technical response
    return `You are RepoChat, an expert senior software engineer helping developers deeply understand codebases.

${historySection}Codebase context:
${finalContext}

RULES:
- Give thorough, detailed answers like a senior developer doing a proper code review
- Explain the "why" behind the code, not just the "what"
- Use bullet points, numbered steps, or code snippets where helpful
- Reference specific file paths and details when relevant
- If explaining a concept, give examples from the actual codebase
- Never start with "Based on the context" or "Given the query"
- Never cut your answer short — always complete your explanation fully
- If the question is broad (like "explain the architecture"), break it into sections with clear headings

Question: ${question}
Answer:`;
  }
  // ─────────────────────────────────────────────────────

  async chat(question, repoId, user, history = "") {
    // 1. Check cache
    const cacheKey = getCacheKey(repoId, question);
    const cached = getCached(cacheKey);
    if (cached) return { ...cached, cached: true };

    const repo = await Repo.findById(repoId);
    if (!repo) throw new Error('Repository not found');

    const provider = this.getProvider(user);

    // 2. Discover Intent
    const intent = await IntentDiscovery.discoverIntent(question, provider, user.model);
    console.log(`[CHAT] Intent: ${intent.intent}`);

    // 3. Short-circuit for greetings / small talk — skip context pipeline entirely
    if (NON_CONTEXT_INTENTS.includes(intent.intent)) {
      const prompt = this.buildPrompt(intent.intent, question, '', history);
      const result = await provider.generateResponse(prompt, user.model);
      const response = {
        answer: result.answer,
        intent: intent.intent,
        fileRef: null,
        provider: user.provider,
        model: user.model,
        tokensUsed: result.tokensUsed
      };
      setCache(cacheKey, response);
      return response;
    }

    // 4. Gather context — strictly limited
    let gatheredContext = '';
    try {
      gatheredContext = await Orchestrator.orchestrate(repoId, intent, provider, user.model, user._id);
      gatheredContext = truncate(gatheredContext, MAX_CONTEXT_CHARS);
    } catch (err) {
      console.warn('[CHAT] Orchestrator failed:', err.message);
      gatheredContext = '';
    }

    // 5. Inject codebase map for broad intents or when context is empty
    if (BROAD_INTENTS.includes(intent.intent) || !gatheredContext.trim()) {
      const structuralMap = await this.generateCodebaseMap(repo.localPath);
      gatheredContext = `### CODEBASE STRUCTURE:\n${structuralMap}\n\n` + gatheredContext;

      // Only add README for overview or project-level questions
      if (intent.intent === 'OVERVIEW' || question.toLowerCase().includes('project')) {
        const readmePath = path.join(repo.localPath, 'README.md');
        if (fs.existsSync(readmePath)) {
          const readme = truncate(fs.readFileSync(readmePath, 'utf8'), MAX_README_CHARS);
          gatheredContext = `### README:\n${readme}\n\n` + gatheredContext;
        }
      }
    }

    // 6. Fallback vector search if still no context
    let finalContext = truncate(gatheredContext, MAX_CONTEXT_CHARS);
    if (!finalContext.trim()) {
      try {
        const queryVector = await EmbeddingService.generateEmbedding(intent.original_slang_fixed, user);
        const chunks = await VectorIndexer.search(repoId, queryVector, 3, intent.original_slang_fixed);
        const searchContext = chunks.map((c, i) => `[${i + 1}: ${c.metadata.filePath}]\n${c.content}`).join('\n\n');
        finalContext = truncate(searchContext, MAX_CONTEXT_CHARS);
      } catch (err) {
        console.warn('[CHAT] Vector search fallback failed:', err.message);
        finalContext = 'No relevant code context found.';
      }
    }

    if (!finalContext.trim()) {
      finalContext = 'No relevant code context found in the indexed files.';
    }

    // 7. Build prompt and generate response
    const prompt = this.buildPrompt(intent.intent, question, finalContext, history);
    console.log(`[CHAT] Prompt length: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`);

    const result = await provider.generateResponse(prompt, user.model);

    const response = {
      answer: result.answer,
      intent: intent.intent,
      fileRef: null,
      provider: user.provider,
      model: user.model,
      tokensUsed: result.tokensUsed
    };

    // Extract file reference if present in context
    if (finalContext.includes('[File:')) {
      const match = finalContext.match(/\[File: (.*?)\]/);
      if (match) response.fileRef = { path: match[1], startLine: 1, endLine: 20 };
    }

    setCache(cacheKey, response);
    return response;
  }
}

module.exports = new ChatService();