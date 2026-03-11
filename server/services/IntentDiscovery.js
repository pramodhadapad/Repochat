const fs = require('fs');
const path = require('path');

class IntentDiscovery {
  /**
   * Classifies a user question into a structured intent.
   * @param {string} question - User's question.
   * @param {AIProvider} provider - The AI provider to use.
   * @param {string} model - The model to use.
   * @returns {Promise<object>} - Structured intent.
   */
  async discoverIntent(question, provider, model) {
    const prompt = `You are a high-precision Intent Discovery engine for a technical codebase assistant.
Your task is to parse the user's natural language query into a structured JSON object representing their TRUE intent.

### INTENT CATEGORIES:
- SEARCH: Finding specific code, functions, or patterns.
- EXPLAIN: Understanding how a specific piece of code or a concept works.
- OVERVIEW: High-level architectural summary of the project.
- REFACTOR: Suggestions for improving code quality or structure.
- FIX: Identifying or resolving a bug.
- CLARIFY: Asking for missing information (used if the query is extremely ambiguous).

### OUTPUT FORMAT:
Return ONLY a raw JSON object with this schema:
{
  "intent": "SEARCH | EXPLAIN | OVERVIEW | REFACTOR | FIX | CLARIFY",
  "entities": {
    "files": ["list of mentioned file paths"],
    "tech": ["mentioned frameworks/libs"],
    "concepts": ["e.g., auth, databases, loops"]
  },
  "original_slang_fixed": "The query with typos and grammar corrected (slang preserved if technical)"
}

### EXAMPLES:
User: "how does dashboaed work"
Output: {"intent": "EXPLAIN", "entities": {"files": ["Dashboard.jsx"], "tech": ["React"], "concepts": ["ui", "state"]}, "original_slang_fixed": "how does dashboard work"}

User: "find auth middleware"
Output: {"intent": "SEARCH", "entities": {"files": ["auth.middleware.js"], "tech": ["Node.js", "Express"], "concepts": ["authentication", "middleware"]}, "original_slang_fixed": "find auth middleware"}

User Query: "${question}"
JSON Output:`;

    try {
      const result = await provider.generateResponse(prompt, model);
      let content = result.answer;
      
      // Basic JSON extraction if AI wraps it in code blocks
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0];
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0];
      }

      return JSON.parse(content.trim());
    } catch (err) {
      console.error('[IntentDiscovery] Failed to parse intent:', err.message);
      return { 
        intent: 'EXPLAIN', 
        entities: { files: [], tech: [], concepts: [] }, 
        original_slang_fixed: question 
      };
    }
  }
}

module.exports = new IntentDiscovery();
