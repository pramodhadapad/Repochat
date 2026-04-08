const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const ChatService = require('./ChatService');

/**
 * Service to generate comprehension quizzes based on repository content.
 */
class QuizService {
  /**
   * Generates 5 comprehension questions for a repository.
   * @param {string} repoId - Repository ID.
   * @param {object} user - User document.
   * @returns {Promise<string[]>} - Array of 5 questions.
   */
  async generateQuiz(repoId, user) {
    // 1. Get some diverse chunks from the repo to have context for questions
    // Since we don't have a specific query, we'll search for "overview" or "main architecture"
    // to get high-level chunks, or just some random top chunks.
    const queryVector = await EmbeddingService.generateEmbedding("Provide a general overview of the core logic and architecture of this repository.", user);
    const contextChunks = await VectorIndexer.search(repoId, queryVector, 8);

    if (contextChunks.length === 0) {
      throw new Error('NO_CONTEXT_FOR_QUIZ');
    }

    const contextString = contextChunks.map((chunk, i) => {
      return `[File: ${chunk.metadata.filePath}]\n${chunk.content}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a technical interviewer. Based on the following code segments from a repository, generate EXACTLY 5 challenging comprehension questions that a developer should be able to answer after studying this codebase.
    
    Format your response as a JSON array of strings. 
    Example: ["Question 1?", "Question 2?", ...]
    
    Code Context:
    ${contextString}
    
    Response (JSON Array Only):`;

    const provider = ChatService.getProvider(user);
    const result = await provider.generateResponse(prompt, user.model);

    try {
      // Extract array from AI response (handle potential markdown formatting)
      const cleanJson = result.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const questions = JSON.parse(cleanJson);
      if (Array.isArray(questions)) {
        return questions.slice(0, 5);
      }
      throw new Error('Invalid quiz format');
    } catch (error) {
      console.error('Quiz Parsing Error:', error, 'Raw Answer:', result.answer);
      // Fallback in case AI doesn't return clean JSON
      return [
        "What is the primary architectural pattern used in this repository?",
        "How does the system handle data persistence and models?",
        "Which external services or APIs are integrated into this codebase?",
        "Explain the main entry point and request flow of the application.",
        "How are security and authentication implemented in this project?"
      ];
    }
  }
}

module.exports = new QuizService();
