const OpenAI = require('openai');
const AIProvider = require('../interfaces/AIProvider');

class DeepSeekProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });
  }

  async generateResponse(prompt, model = 'deepseek-chat') {
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
     throw new Error('DeepSeek does not provide a native embedding API.');
  }

  async validateKey() {
    try {
      await this.client.models.list();
      return true;
    } catch (err) {
      if (err.status === 401) throw new Error('Invalid DeepSeek API key.');
      if (err.status === 402) throw new Error('DeepSeek quota exhausted / insufficient balance.');
      throw new Error(`DeepSeek validation failed: ${err.message}`);
    }
  }
}

module.exports = DeepSeekProvider;
