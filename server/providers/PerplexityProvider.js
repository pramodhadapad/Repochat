const OpenAI = require('openai');
const AIProvider = require('../interfaces/AIProvider');

class PerplexityProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.perplexity.ai'
    });
  }

  async generateResponse(prompt, model = 'sonar-medium-chat') {
    const response = await this.client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      answer: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens
    };
  }

  async generateEmbedding(text) {
    throw new Error('Perplexity does not provide a native embedding API.');
  }

  async validateKey() {
    try {
      // Perplexity does not have a /models list endpoint. Use a 1-token dummy chat.
      await this.client.chat.completions.create({
        model: 'sonar-small-chat',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }]
      });
      return true;
    } catch (err) {
      if (err.status === 401) throw new Error('Invalid Perplexity API key.');
      if (err.status === 429) throw new Error('Perplexity quota exceeded or rate limited.');
      throw new Error(`Perplexity validation failed: ${err.message}`);
    }
  }
}

module.exports = PerplexityProvider;
