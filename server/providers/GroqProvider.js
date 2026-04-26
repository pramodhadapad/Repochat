const axios = require('axios');
const AIProvider = require('../interfaces/AIProvider');

class GroqProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.groq.com/openai/v1'; // Groq provides OpenAI-compatible endpoints
  }

  async generateResponse(prompt, modelName = 'llama-3.3-70b-versatile', options = {}) {
    // Remap decommissioned models to their new equivalents
    let targetModel = modelName || 'llama-3.3-70b-versatile';
    if (targetModel.includes('llama3-70b')) targetModel = 'llama-3.3-70b-versatile';
    if (targetModel.includes('llama3-8b')) targetModel = 'llama-3.1-8b-instant';
    if (targetModel.includes('gemma-7b')) targetModel = 'gemma2-9b-it';

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: targetModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: options.maxTokens || 1024,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const message = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage ? response.data.usage.total_tokens : 0;

      return {
        answer: message,
        tokensUsed: tokensUsed
      };
    } catch (err) {
      console.error('[GROQ] Response generation failed:', err.response?.data || err.message);
      if (err.response?.status === 429) {
        throw new Error('Groq rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(`Groq API error: ${err.message}`);
    }
  }

  async generateEmbedding(text, modelName = '') {
    // Groq currently does not support specialized embedding models as of latest documentation.
    // Throw an error or return mock vector. We'll throw so EmbeddingService falls back gracefully.
    throw new Error('Groq does not natively support embeddings. Use fallback mock vector.');
  }

  async validateKey() {
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return true;
    } catch (err) {
      if (err.response?.status === 401) throw new Error('Invalid Groq API key.');
      if (err.response?.status === 429) throw new Error('Groq quota exceeded or rate limited.');
      throw new Error(`Groq validation failed: ${err.message}`);
    }
  }
}

module.exports = GroqProvider;
