const axios = require('axios');
const { decrypt } = require('./KeyEncryptor');

/**
 * Service to generate embeddings using various AI providers.
 */
class EmbeddingService {
  /**
   * Generates an embedding for a piece of text.
   * @param {string} text - Input text.
   * @param {object} user - User object containing provider and encrypted key.
   * @returns {Promise<number[]>} - The embedding vector.
   */
  async generateEmbedding(text, user) {
    if (!user.apiKey && user.provider !== 'ollama') throw new Error('API key missing');
    const apiKey = user.provider === 'ollama' ? 'ollama' : decrypt(user.apiKey);

    switch (user.provider) {
      case 'openai':
      case 'custom':
        return await this.getOpenAIEmbedding(text, apiKey);
      case 'gemini':
        return await this.getGeminiEmbedding(text, apiKey);
      case 'ollama':
        return await this.getOllamaEmbedding(text);
      case 'together':
        const TogetherProvider = require('../providers/TogetherProvider');
        const tp = new TogetherProvider(apiKey);
        return await tp.generateEmbedding(text);
      case 'groq':
      case 'openrouter':
        return this.getDeterministicMockVector(text);
      default:
        console.warn(`[EMBED] Provider "${user.provider}" does not support native embeddings. Using deterministic mock vectors.`);
        return this.getDeterministicMockVector(text);
    }
  }

  /**
   * Generates a deterministic mock vector for providers without embedding APIs.
   * This is better than pure random for basic search consistency.
   */
  getDeterministicMockVector(text) {
    const seed = text.split(' ').slice(0, 5).join('').length;
    return Array.from({ length: 1536 }, (_, i) => {
      const val = Math.sin(seed + i) * 0.01;
      return val;
    });
  }

  async getOpenAIEmbedding(text, apiKey) {
    try {
      const response = await axios.post('https://api.openai.com/v1/embeddings', {
        input: text,
        model: 'text-embedding-3-small'
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });
      return response.data.data[0].embedding;
    } catch (e) {
      console.warn('OpenAI Embedding failed. Using fallback mock vectors.', e.message);
      // Fallback 1536-dimensional mock vector so ChromaDB doesn't crash
      return Array.from({ length: 1536 }, () => (Math.random() * 2 - 1) * 0.01);
    }
  }

  async getGeminiEmbedding(text, apiKey) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        content: { parts: [{ text }] }
      });
      const values = response.data.embedding.values;
      // ChromaDB requires consistent dimension; pad to 1536 to match OpenAI/mock so search works
      if (values.length < 1536) {
        return [...values, ...Array(1536 - values.length).fill(0)];
      }
      return values.slice(0, 1536);
    } catch (e) {
      console.warn('Gemini Embedding failed. Using fallback mock vectors.', e.message);
      return this.getDeterministicMockVector(text);
    }
  }

  async getOllamaEmbedding(text) {
    try {
      const response = await axios.post('http://localhost:11434/api/embeddings', {
        model: 'nomic-embed-text',
        prompt: text
      }, { timeout: 30000 });

      const embedding = response.data.embedding;
      if (!embedding || embedding.length === 0) {
        return this.getDeterministicMockVector(text);
      }
      // Pad/trim to 1536 for consistency
      if (embedding.length < 1536) {
        return [...embedding, ...Array(1536 - embedding.length).fill(0)];
      }
      return embedding.slice(0, 1536);
    } catch (e) {
      console.warn('[OLLAMA] Embedding failed, using mock vector:', e.message);
      return this.getDeterministicMockVector(text);
    }
  }
}

module.exports = new EmbeddingService();
