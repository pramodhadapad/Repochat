const axios = require('axios');
const AIProvider = require('../interfaces/AIProvider');

class OpenRouterProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async generateResponse(prompt, modelName = 'anthropic/claude-3.5-sonnet') {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter rankings
          'X-Title': 'RepoChat',
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
      console.error('[OPENROUTER] Response generation failed:', err.response?.data || err.message);
      if (err.response?.status === 402) {
        throw new Error('OpenRouter API key has insufficient credits.');
      }
      if (err.response?.status === 429) {
        throw new Error('OpenRouter rate limit exceeded.');
      }
      throw new Error(`OpenRouter API error: ${err.message}`);
    }
  }

  async generateEmbedding(text, modelName = '') {
    // OpenRouter acts as an aggregator and does not standardise embeddings across models nicely yet.
    throw new Error('OpenRouter provider does not currently support embeddings natively in RepoChat. Using fallback mock vector.');
  }

  async validateKey() {
    try {
      await axios.get(`${this.baseUrl}/auth/key`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return true;
    } catch (err) {
      if (err.response?.status === 401) throw new Error('Invalid OpenRouter API key.');
      throw new Error(`OpenRouter validation failed: ${err.message}`);
    }
  }
}

module.exports = OpenRouterProvider;
