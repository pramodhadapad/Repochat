const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('../interfaces/AIProvider');

class ClaudeProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(prompt, model = 'claude-3-5-sonnet-20240620') {
    const response = await this.client.messages.create({
      model: model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    
    return {
      answer: response.content[0].text,
      tokensUsed: response.usage.total_tokens
    };
  }

  async generateEmbedding(text) {
    throw new Error('Claude does not provide a native embedding API yet.');
  }

  async validateKey() {
    try {
      // Anthropic does not have a pure /models list endpoint that works easily without beta headers.
      // So we send a 1-token request to validate the key and quota.
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hello' }],
      });
      return true;
    } catch (err) {
      if (err.status === 401 || err.status === 403) throw new Error('Invalid Claude API key.');
      if (err.status === 429) throw new Error('Claude quota exceeded or rate limited.');
      throw new Error(`Claude validation failed: ${err.message}`);
    }
  }
}

module.exports = ClaudeProvider;
