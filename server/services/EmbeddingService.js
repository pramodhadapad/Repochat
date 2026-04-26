const axios = require('axios');
const { decrypt } = require('./KeyEncryptor');

const EMBEDDING_DIM = 1536; // Standard dimension — all providers normalize to this

/**
 * Service to generate text embeddings using various AI providers.
 */
class EmbeddingService {
  /**
   * Generates an embedding vector for a piece of text.
   * @param {string} text - Input text.
   * @param {object} user - User object with provider and encrypted apiKey.
   * @returns {Promise<number[]>} - 1536-dimensional embedding vector.
   */
  async generateEmbedding(text, user) {
    if (!text || !text.trim()) {
      return this.getMockVector(text || '');
    }

    if (!user.apiKey && user.provider !== 'ollama') {
      throw new Error('API key missing for embedding generation.');
    }

    const apiKey = user.provider === 'ollama' ? 'ollama' : decrypt(user.apiKey);

    switch (user.provider) {
      case 'openai':
      case 'custom':
        return await this.getOpenAIEmbedding(text, apiKey);

      case 'gemini':
        return await this.getGeminiEmbedding(text, apiKey);

      case 'ollama':
        return await this.getOllamaEmbedding(text);

      case 'together': {
        const TogetherProvider = require('../providers/TogetherProvider');
        const tp = new TogetherProvider(apiKey);
        return await tp.generateEmbedding(text);
      }

      // Providers without native embedding APIs — use deterministic mock
      case 'groq':
      case 'openrouter':
      case 'perplexity':
      case 'deepseek':
      case 'claude':
      default:
        console.warn(`[EMBED] Provider "${user.provider}" has no embedding API. Using mock vectors — search quality will be reduced.`);
        return this.getMockVector(text);
    }
  }

  /**
   * Generates a deterministic mock vector seeded from the text content.
   * Much better than random — identical queries return identical vectors,
   * so at least exact repeated queries will match.
   */
  getMockVector(text) {
    // Simple but deterministic: hash the text into a seed
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
    }
    return Array.from({ length: EMBEDDING_DIM }, (_, i) => {
      // Small magnitude values that vary by position + seed
      return Math.sin(seed * 0.0001 + i * 0.01) * 0.1;
    });
  }

  /** Pads or trims a vector to EMBEDDING_DIM for ChromaDB consistency. */
  normalizeVector(vec) {
    if (vec.length === EMBEDDING_DIM) return vec;
    if (vec.length > EMBEDDING_DIM) return vec.slice(0, EMBEDDING_DIM);
    return [...vec, ...Array(EMBEDDING_DIM - vec.length).fill(0)];
  }

  async getOpenAIEmbedding(text, apiKey) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        { input: text.substring(0, 8000), model: 'text-embedding-3-small' },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );
      return this.normalizeVector(response.data.data[0].embedding);
    } catch (err) {
      console.warn('[EMBED] OpenAI embedding failed, using mock:', err.message);
      return this.getMockVector(text);
    }
  }

  async getGeminiEmbedding(text, apiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        { content: { parts: [{ text: text.substring(0, 8000) }] } }
      );
      return this.normalizeVector(response.data.embedding.values);
    } catch (err) {
      console.warn('[EMBED] Gemini embedding failed, using mock:', err.message);
      return this.getMockVector(text);
    }
  }

  async getOllamaEmbedding(text) {
    try {
      const response = await axios.post(
        'http://localhost:11434/api/embeddings',
        { model: 'nomic-embed-text', prompt: text.substring(0, 8000) },
        { timeout: 30000 }
      );
      const embedding = response.data.embedding;
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned');
      }
      return this.normalizeVector(embedding);
    } catch (err) {
      console.warn('[EMBED] Ollama embedding failed, using mock:', err.message);
      return this.getMockVector(text);
    }
  }

  // Keep getDeterministicMockVector as alias for backward compat (IndexService calls it)
  getDeterministicMockVector(text) {
    return this.getMockVector(text);
  }
}

module.exports = new EmbeddingService();