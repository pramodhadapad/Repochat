/**
 * Abstract base class for AI providers.
 */
class AIProvider {
  /**
   * Generates a response from the AI model.
   * @param {string} prompt - The full prompt including context.
   * @param {string} model - The specific model to use.
   * @returns {Promise<object>} - AIResponse object.
   */
  async generateResponse(prompt, model) {
    throw new Error('generateResponse(prompt, model) must be implemented');
  }

  /**
   * Generates a vector embedding for the given text.
   * @param {string} text - The input text.
   * @returns {Promise<number[]>} - The embedding vector.
   */
  async generateEmbedding(text) {
    throw new Error('generateEmbedding(text) must be implemented');
  }

  /**
   * Validates the configured API key with the provider.
   * @returns {Promise<boolean>} - True if valid, throws error if invalid/quota exceeded.
   */
  async validateKey() {
    throw new Error('validateKey() must be implemented');
  }
}

module.exports = AIProvider;
