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

// FIX #1: Include userId AND model in cache key so responses are isolated per user/model
function getCacheKey(repoId, question, userId, model) {
  return `${repoId}:${userId}:${model}:${question.trim().toLowerCase()}`;
}
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

// FIX #5: Removed SEARCH from BROAD_INTENTS — it's targeted, not broad
const BROAD_INTENTS = ['OVERVIEW', 'EXPLAIN'];
// ─────────────────────────────────────────────────────

// FIX #4: Parse history into structured turns instead of raw string
function formatHistory(history) {
  if (!history || typeof history !== 'string') return '';
  // Take only the last 3 turns to avoid context pollution
  const lines = history.split('\n').filter(Boolean);
  const recentLines = lines.slice(-6); // ~3 Q&A pairs
  return `Recent conversation:\n${recentLines.join('\n')}\n\n`;
}

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
    // FIX: validate localPath before attempting filesystem access
    if (!localPath) return 'Codebase map unavailable.';
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
    // FIX #4: Use structured history formatting instead of raw string
    const historySection = formatHistory(history);

    // Conversational — no code context needed
    if (NON_CONTEXT_INTENTS.includes(intent)) {
      return `You are RepoChat, a friendly assistant for exploring codebases.
${historySection}The user said: "${question}"
Reply naturally and briefly. Do NOT analyze, summarize, or mention any code or files unless the user explicitly asks.
Answer:`;
    }

    // FIX #3: Explicitly stop hallucination when context is missing
    const contextEmpty =
      !finalContext.trim() ||
      finalContext.includes('No relevant code context found');

    if (contextEmpty) {
      return `You are RepoChat, a codebase assistant.
${historySection}The user asked: "${question}"

You were unable to find relevant code for this question in the indexed repository.
Tell the user clearly that you could not find relevant context, and suggest they:
1. Try rephrasing with more specific terms (file name, function name, etc.)
2. Make sure the repository has been indexed
Do NOT invent or guess any code, files, or architecture. Be honest and brief.
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
- If the provided context does not contain enough detail to answer fully, say so honestly

Question: ${question}
Answer:`;
  }
  // ─────────────────────────────────────────────────────

  async chat(question, repoId, user, history = "") {
    // FIX #1: Cache key now includes userId and model
    const cacheKey = getCacheKey(repoId, question, user._id, user.model);
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
      // Don't cache greetings — they should feel natural and varied
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

    // 5. FIX #5: Only inject codebase map for truly BROAD intents (not SEARCH)
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
        finalContext = '';
      }
    }

    // FIX #3: Don't set a misleading "found" message — leave empty so buildPrompt handles it
    if (!finalContext.trim()) {
      finalContext = 'No relevant code context found.';
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

    // FIX #6: Extract file reference with best-effort line range from context
    if (finalContext.includes('[File:')) {
      const match = finalContext.match(/\[File: (.*?)\]/);
      if (match) {
        // Try to extract a meaningful line range from the chunk content
        const chunkLines = finalContext.split('\n').length;
        response.fileRef = {
          path: match[1],
          startLine: 1,
          endLine: Math.min(chunkLines, 50) // Use actual content length, capped at 50
        };
      }
    }

    setCache(cacheKey, response);
    return response;
  }
}

module.exports = new ChatService();
