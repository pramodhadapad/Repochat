const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const ChatService = require('./ChatService');

/**
 * Service to auto-generate README content for a repository.
 */
class ReadmeGenerator {
  /**
   * Generates a README for a repository based on its indexed content.
   * @param {string} repoId - Repository ID.
   * @param {object} user - User document.
   * @returns {Promise<string>} - The generated README content (Markdown).
   */
  async generateReadme(repoId, user) {
    // 1. Fetch high-level context chunks
    const queryVector = await EmbeddingService.generateEmbedding("Generate a comprehensive README overview including project purpose, features, and structure.", user);
    const contextChunks = await VectorIndexer.search(repoId, queryVector, 10);

    if (contextChunks.length === 0) {
      throw new Error('NO_CONTEXT_FOR_README');
    }

    const contextString = contextChunks.map((chunk, i) => {
      return `[File: ${chunk.metadata.filePath}]\n${chunk.content}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a technical writer. Based on the provided code segments from a repository, generate a professional, high-quality README.md in Markdown format.
    
    The README should include:
    1. Project Title and a brief, compelling summary.
    2. Key Features.
    3. Project Structure (briefly explaining main directories).
    4. Technology Stack.
    
    Code Context:
    ${contextString}
    
    Response (Markdown Only):`;

    const provider = ChatService.getProvider(user);
    const result = await provider.generateResponse(prompt, user.model);

    return result.answer;
  }
}

module.exports = new ReadmeGenerator();
