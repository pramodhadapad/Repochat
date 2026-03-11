const axios = require('axios');
const AIProvider = require('../interfaces/AIProvider');

class TogetherProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.together.xyz/v1';
  }

  async generateResponse(prompt, modelName = 'meta-llama/Llama-3-70b-chat-hf') {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
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
      console.error('[TOGETHER] Response generation failed:', err.response?.data || err.message);
      if (err.response?.status === 429) {
        throw new Error('Together AI rate limit exceeded or quota exhausted.');
      }
      throw new Error(`Together AI error: ${err.message}`);
    }
  }

  async generateEmbedding(text, modelName = 'togethercomputer/m2-bert-80M-8k-retrieval') {
    try {
      const response = await axios.post(`${this.baseUrl}/embeddings`, {
        model: modelName,
        input: text,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const embedding = response.data.data[0].embedding;
      // Together uses 768 dims for m2-bert, pad to 1536
      if (embedding.length < 1536) {
        return [...embedding, ...Array(1536 - embedding.length).fill(0)];
      }
      return embedding.slice(0, 1536);
    } catch (err) {
      console.warn('[TOGETHER] Embedding failed, using fallback mock vector:', err.message);
      throw new Error('Together AI embedding failed. Using fallback.');
    }
  }

  async validateKey() {
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return true;
    } catch (err) {
      if (err.response?.status === 401) throw new Error('Invalid Together AI API key.');
      throw new Error(`Together AI validation failed: ${err.message}`);
    }
  }
}

module.exports = TogetherProvider;
