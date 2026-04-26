const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('../interfaces/AIProvider');

class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super();
    const genAI = new GoogleGenerativeAI(apiKey);
    this.client = genAI;
    this.MAX_RETRIES = 3;
  }

  /**
   * Sleep helper for retry backoff
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract retry delay from Google's error response, or use exponential backoff.
   */
  _getRetryDelay(err, attempt) {
    // Try to parse Google's suggested retry delay
    const match = err.message?.match(/retry\s*(?:in|after)\s*(\d+)/i);
    if (match) return parseInt(match[1]) * 1000;
    // Exponential backoff: 2s, 4s, 8s
    return Math.pow(2, attempt + 1) * 1000;
  }

  async generateResponse(prompt, modelName = 'gemini-2.0-flash') {
    const model = this.client.getGenerativeModel({ 
      model: modelName,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    });
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return {
          answer: response.text(),
          tokensUsed: 0 
        };
      } catch (err) {
        // Safety filter — don't retry
        if (err.message?.includes('SAFETY')) {
          return { answer: "I'm sorry, but the AI's safety filters blocked the response for this code query.", tokensUsed: 0 };
        }
        // Rate limit — retry with backoff
        if ((err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) && attempt < this.MAX_RETRIES) {
          const delay = this._getRetryDelay(err, attempt);
          console.log(`[GEMINI] Rate limited. Retrying in ${delay/1000}s (attempt ${attempt + 1}/${this.MAX_RETRIES})...`);
          await this._sleep(delay);
          continue;
        }
        // All other errors or final retry exhausted
        console.error('[GEMINI] Response generation failed:', err.message);
        throw err;
      }
    }
  }

  async generateEmbedding(text, modelName = 'text-embedding-004') {
    const model = this.client.getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async validateKey() {
    try {
      // Fetch models list as a lightweight validation
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }]}] });
      return true;
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('api_key_invalid')) throw new Error('Invalid Google Gemini API key.');
      if (err.status === 429 || err.message?.includes('429')) throw new Error('Gemini quota exceeded or rate limited.');
      throw new Error(`Gemini validation failed: ${err.message}`);
    }
  }
}

module.exports = GeminiProvider;
