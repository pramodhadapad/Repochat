const axios = require('axios');
const AIProvider = require('../interfaces/AIProvider');

/**
 * Ollama Provider — completely free local LLM.
 * Connects to a local Ollama server (default: http://localhost:11434).
 * User just needs to install Ollama and pull a model.
 * 
 * Setup:
 *   1. Install Ollama: https://ollama.com
 *   2. Pull a model: `ollama pull llama3.2`
 *   3. In RepoChat, type "ollama" as your API key
 */
class OllamaProvider extends AIProvider {
  constructor(apiKey) {
    super();
    // apiKey can optionally be a custom Ollama URL
    this.baseUrl = (apiKey && apiKey !== 'ollama' && apiKey.startsWith('http'))
      ? apiKey.replace(/\/$/, '')
      : 'http://localhost:11434';
  }

  async generateResponse(prompt, modelName = 'llama3.2') {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 2048,
        }
      }, {
        timeout: 120000, // 2 min timeout for slower machines
      });

      return {
        answer: response.data.response || 'No response generated.',
        tokensUsed: (response.data.eval_count || 0) + (response.data.prompt_eval_count || 0)
      };
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        throw new Error(
          'Ollama is not running. Please start it:\n' +
          '1. Install Ollama from https://ollama.com\n' +
          '2. Run: ollama pull llama3.2\n' +
          '3. Ollama starts automatically after install'
        );
      }
      if (err.response?.status === 404) {
        throw new Error(
          `Model "${modelName}" not found. Run: ollama pull ${modelName}`
        );
      }
      console.error('[OLLAMA] Response generation failed:', err.message);
      throw err;
    }
  }

  async generateEmbedding(text, modelName = 'nomic-embed-text') {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: modelName,
        prompt: text,
      }, {
        timeout: 30000,
      });

      const embedding = response.data.embedding;
      if (!embedding || embedding.length === 0) {
        console.warn('[OLLAMA] Empty embedding returned, using mock vector');
        return this._mockVector(text);
      }

      // Pad or trim to 1536 dims for consistency with other providers
      if (embedding.length < 1536) {
        return [...embedding, ...Array(1536 - embedding.length).fill(0)];
      }
      return embedding.slice(0, 1536);
    } catch (err) {
      console.warn('[OLLAMA] Embedding failed, using mock vector:', err.message);
      return this._mockVector(text);
    }
  }

  _mockVector(text) {
    const seed = text.split(' ').slice(0, 5).join('').length;
    return Array.from({ length: 1536 }, (_, i) => {
      return Math.sin(seed + i) * 0.01;
    });
  }

  async validateKey() {
    try {
      await axios.get(`${this.baseUrl}/api/version`, { timeout: 3000 });
      return true;
    } catch (err) {
      throw new Error(`Ollama is not responding at ${this.baseUrl}. Is it running?`);
    }
  }
}

module.exports = OllamaProvider;
