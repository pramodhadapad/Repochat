const VectorIndexer = require('./VectorIndexer');
const EmbeddingService = require('./EmbeddingService');
const ChatService = require('./ChatService');

// Rotate these so each quiz call pulls different context
const QUIZ_SEED_QUERIES = [
  "core business logic and main features",
  "authentication and security implementation",
  "database models and data flow",
  "API routes and request handling",
  "error handling and edge cases",
  "configuration and environment setup",
  "external integrations and third-party services",
  "state management and data processing",
];

class QuizService {
  async generateQuiz(repoId, user) {
    // 1. Pick a RANDOM seed query so we get different chunks each time
    const randomQuery = QUIZ_SEED_QUERIES[Math.floor(Math.random() * QUIZ_SEED_QUERIES.length)];
    const queryVector = await EmbeddingService.generateEmbedding(randomQuery, user);

    // 2. Fetch chunks — shuffle them so order varies too
    const contextChunks = await VectorIndexer.search(repoId, queryVector, 10);
    if (contextChunks.length === 0) throw new Error('NO_CONTEXT_FOR_QUIZ');

    // Shuffle and take 6 random chunks
    const shuffled = contextChunks.sort(() => Math.random() - 0.5).slice(0, 6);

    const contextString = shuffled
      .map(chunk => `[File: ${chunk.metadata.filePath}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    // 3. Add randomness instruction + timestamp to prevent LLM caching
    const topicHints = ['error handling', 'data flow', 'configuration', 'security', 'architecture', 'API design', 'performance'];
    const randomTopic = topicHints[Math.floor(Math.random() * topicHints.length)];

    const prompt = `You are a technical interviewer. Based on the following code from a repository, generate EXACTLY 5 unique comprehension questions a developer should answer after studying this codebase.

IMPORTANT:
- Focus especially on: ${randomTopic}
- Make each question specific to the actual code shown, not generic
- Questions must be DIFFERENT from common generic questions
- Vary the difficulty: 2 easy, 2 medium, 1 hard
- Generated at: ${Date.now()} (use this to ensure uniqueness)

Format: JSON array of strings only.
Example: ["Question 1?", "Question 2?", ...]

Code Context:
${contextString}

Response (JSON Array Only):`;

    const provider = ChatService.getProvider(user);
    const result = await provider.generateResponse(prompt, user.model);

    try {
      const cleanJson = result.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const questions = JSON.parse(cleanJson);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.slice(0, 5);
      }
      throw new Error('Invalid quiz format');
    } catch (error) {
      console.error('Quiz Parsing Error:', error, 'Raw Answer:', result.answer);
      // Fallback: extract questions from plain text if JSON fails
      const lines = result.answer.split('\n').filter(l => l.match(/^\d+\.|^-|^\*/));
      if (lines.length >= 3) {
        return lines.slice(0, 5).map(l => l.replace(/^[\d\.\-\*\s]+/, '').trim());
      }
      throw new Error('Quiz generation failed — please try again');
    }
  }
}

module.exports = new QuizService();
