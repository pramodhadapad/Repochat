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
  // Evict oldest entry if at capacity
  if (responseCache.size >= CACHE_MAX) {
    responseCache.delete(responseCache.keys().next().value);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}
// ─────────────────────────────────────────────────────

// ── Token Safety ──────────────────────────────────────
const MAX_CONTEXT_CHARS = 12000;
const MAX_MAP_CHARS = 3000;
const MAX_README_CHARS = 1500;
const MAX_HISTORY_CHARS = 1000;

function truncate(str, maxChars) {
  if (!str) return '';
  if (str.length <= maxChars) return str;
  return str.substring(0, maxChars) + '\n... [truncated to fit token limit]';
}
// ─────────────────────────────────────────────────────

// ── Intent Categories ─────────────────────────────────
const NON_CONTEXT_INTENTS = new Set(['GREETING', 'SMALLTALK', 'THANKS', 'CHITCHAT', 'BYE']);
const BROAD_INTENTS = new Set(['OVERVIEW', 'EXPLAIN', 'SEARCH']);

// Fast pre-check — bypass IntentDiscovery entirely for obvious short phrases
// Saves one LLM call + latency for simple greetings
const GREETING_REGEX = /^(hi+|hey+|hello|howdy|yo|sup|thanks?|thank you|bye|goodbye|good\s?(morning|afternoon|evening)|cheers|ok|okay|cool|great|nice|👋|🙏)\W*$/i;

function isObviousGreeting(text) {
  return GREETING_REGEX.test(text.trim());
}
// ─────────────────────────────────────────────────────

// ── Provider Registry ─────────────────────────────────
const PROVIDER_MAP = {
  claude: ClaudeProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  deepseek: DeepSeekProvider,
  perplexity: PerplexityProvider,
  groq: GroqProvider,
  openrouter: OpenRouterProvider,
  together: TogetherProvider,
  ollama: OllamaProvider,
  custom: OpenAIProvider, // Custom endpoints use OpenAI-compatible API
};
// ─────────────────────────────────────────────────────

class ChatService {

  // ── Resolve AI Provider ───────────────────────────
  getProvider(user) {
    if (!user.apiKey && user.provider !== 'ollama') {
      throw new Error('API key missing. Please add your API key from the Dashboard.');
    }

    const ProviderClass = PROVIDER_MAP[user.provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: "${user.provider}". Please check your settings.`);
    }

    const apiKey = user.provider === 'ollama' ? 'ollama' : decrypt(user.apiKey);
    return new ProviderClass(apiKey);
  }

  // ── Build Codebase File Tree (max depth 2) ────────
  async generateCodebaseMap(localPath) {
    const IGNORED_DIRS = new Set([
      'node_modules', '.git', '.next', 'dist', 'vendor',
      '__pycache__', 'build', 'coverage', '.cache', 'tmp',
    ]);

    try {
      const buildMap = (dir, depth = 0) => {
        if (depth > 2) return '';
        let map = '';
        const entries = fs.readdirSync(dir);
        for (const file of entries) {
          if (IGNORED_DIRS.has(file)) continue;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          const indent = '  '.repeat(depth);
          if (stat.isDirectory()) {
            map += `${indent}📁 ${file}/\n${buildMap(fullPath, depth + 1)}`;
          } else {
            map += `${indent}📄 ${file}\n`;
          }
        }
        return map;
      };

      return truncate(buildMap(localPath), MAX_MAP_CHARS);
    } catch {
      return 'Codebase map unavailable.';
    }
  }

  // ── Prompt Builder ────────────────────────────────
  buildPrompt(intent, question, context, history) {
    const historyBlock = history
      ? `Recent conversation:\n${truncate(history, MAX_HISTORY_CHARS)}\n\n`
      : '';

    // Short conversational reply — no code context, strict token cap enforced via maxTokens
    if (NON_CONTEXT_INTENTS.has(intent)) {
      return `You are RepoChat, a friendly assistant for exploring codebases.
${historyBlock}User: "${question}"
Reply in 1-2 sentences only. Be warm and natural. Do NOT mention code, files, or the codebase unless the user explicitly asks about them.
Answer:`;
    }

    // Full technical answer with codebase context
    return `You are RepoChat, an expert senior software engineer helping developers deeply understand codebases.

${historyBlock}Codebase context:
${context}

INSTRUCTIONS:
- Give thorough, detailed answers like a senior developer doing a code review
- Explain the "why" behind the code, not just the "what"
- Use bullet points, numbered steps, or code snippets where helpful
- Reference specific file paths and line details when relevant
- If explaining a concept, use examples from the actual codebase above
- If the question is broad (e.g. "explain the architecture"), break it into clear sections with headings
- Never start with "Based on the context" or "Given the query"
- Always complete your explanation fully — never cut it short

Question: ${question}
Answer:`;
  }

  // ── Main Chat Handler ─────────────────────────────
  async chat(question, repoId, user, history = '') {
    const trimmedQuestion = question.trim();

    // ── 1. Cache check ──
    const cacheKey = getCacheKey(repoId, trimmedQuestion);
    const cached = getCached(cacheKey);
    if (cached) return { ...cached, cached: true };

    // ── 2. Load repo ──
    const repo = await Repo.findById(repoId);
    if (!repo) throw new Error('Repository not found.');

    const provider = this.getProvider(user);

    // ── 3. Fast-path: bypass IntentDiscovery for obvious greetings ──
    // Avoids one full LLM round-trip for trivial inputs
    let intentLabel;
    if (isObviousGreeting(trimmedQuestion)) {
      intentLabel = 'GREETING';
      console.log(`[CHAT] Fast-path intent: GREETING (regex match)`);
    } else {
      const intentResult = await IntentDiscovery.discoverIntent(trimmedQuestion, provider, user.model);
      intentLabel = intentResult.intent;
      console.log(`[CHAT] Intent: ${intentLabel}`);
    }

    // ── 4. Conversational short-circuit ──
    // Strict 80-token cap — prevents verbose replies to "hi", "thanks", etc.
    if (NON_CONTEXT_INTENTS.has(intentLabel)) {
      const prompt = this.buildPrompt(intentLabel, trimmedQuestion, '', history);
      const result = await provider.generateResponse(prompt, user.model, { maxTokens: 80 });

      const response = {
        answer: result.answer,
        intent: intentLabel,
        fileRef: null,
        provider: user.provider,
        model: user.model,
        tokensUsed: result.tokensUsed,
      };

      setCache(cacheKey, response);
      return response;
    }

    // ── 5. Gather code context via Orchestrator ──
    let gatheredContext = '';
    try {
      gatheredContext = await Orchestrator.orchestrate(repoId, { intent: intentLabel }, provider, user.model, user._id);
      gatheredContext = truncate(gatheredContext, MAX_CONTEXT_CHARS);
    } catch (err) {
      console.warn('[CHAT] Orchestrator failed:', err.message);
    }

    // ── 6. Augment with structural context for broad/empty results ──
    if (BROAD_INTENTS.has(intentLabel) || !gatheredContext.trim()) {
      const structuralMap = await this.generateCodebaseMap(repo.localPath);
      gatheredContext = `### CODEBASE STRUCTURE:\n${structuralMap}\n\n${gatheredContext}`;

      // Inject README only for project-level questions
      if (intentLabel === 'OVERVIEW' || trimmedQuestion.toLowerCase().includes('project')) {
        const readmePath = path.join(repo.localPath, 'README.md');
        if (fs.existsSync(readmePath)) {
          const readme = truncate(fs.readFileSync(readmePath, 'utf8'), MAX_README_CHARS);
          gatheredContext = `### README:\n${readme}\n\n${gatheredContext}`;
        }
      }
    }

    // ── 7. Vector search fallback ──
    let finalContext = truncate(gatheredContext, MAX_CONTEXT_CHARS);
    if (!finalContext.trim()) {
      try {
        const queryVector = await EmbeddingService.generateEmbedding(trimmedQuestion, user);
        const chunks = await VectorIndexer.search(repoId, queryVector, 3, trimmedQuestion);
        const searchContext = chunks
          .map((c, i) => `[${i + 1}: ${c.metadata.filePath}]\n${c.content}`)
          .join('\n\n');
        finalContext = truncate(searchContext, MAX_CONTEXT_CHARS);
      } catch (err) {
        console.warn('[CHAT] Vector search fallback failed:', err.message);
      }
    }

    if (!finalContext.trim()) {
      finalContext = 'No relevant code context found in the indexed files.';
    }

    // ── 8. Generate response ──
    const prompt = this.buildPrompt(intentLabel, trimmedQuestion, finalContext, history);
    console.log(`[CHAT] Prompt: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`);

    const result = await provider.generateResponse(prompt, user.model);

    // ── 9. Extract optional file reference from context ──
    let fileRef = null;
    if (finalContext.includes('[File:')) {
      const match = finalContext.match(/\[File:\s*(.*?)\]/);
      if (match) fileRef = { path: match[1].trim(), startLine: 1, endLine: 20 };
    }

    const response = {
      answer: result.answer,
      intent: intentLabel,
      fileRef,
      provider: user.provider,
      model: user.model,
      tokensUsed: result.tokensUsed,
    };

    setCache(cacheKey, response);
    return response;
  }
}

module.exports = new ChatService();