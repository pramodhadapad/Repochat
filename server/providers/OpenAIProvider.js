const OpenAI = require('openai');
const AIProvider = require('../interfaces/AIProvider');

class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(prompt, model = 'gpt-4o') {
    const response = await this.client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      answer: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens
    };
  }

  async generateEmbedding(text, model = 'text-embedding-3-small') {
    const response = await this.client.embeddings.create({
      model: model,
      input: text,
    });
    return response.data[0].embedding;
  }

  async validateKey() {
    try {
      await this.client.models.list();
      return true;
    } catch (err) {
      if (err.status === 401) throw new Error('Invalid OpenAI API key.');
      if (err.status === 429) throw new Error('OpenAI quota exceeded.');
      throw new Error(`OpenAI validation failed: ${err.message}`);
    }
  }
}

module.exports = OpenAIProvider;
