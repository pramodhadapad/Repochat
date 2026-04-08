class IntentDiscovery {
  /**
   * Classifies a user question into a structured intent.
   * @param {string} question - User's question.
   * @param {AIProvider} provider - The AI provider to use.
   * @param {string} model - The model to use.
   * @returns {Promise<object>} - Structured intent object.
   */
  async discoverIntent(question, provider, model) {
    const prompt = `You are a high-precision Intent Discovery engine for a technical codebase assistant.
Parse the user's natural language query into a structured JSON object representing their TRUE intent.

### INTENT CATEGORIES:
- GREETING: Casual openers, hellos, or conversation starters. e.g. "hi", "hey", "hello there"
- SMALLTALK: Non-technical chat or small talk. e.g. "how are you", "what's up"
- THANKS: Expressions of gratitude. e.g. "thanks", "thank you", "cheers"
- CHITCHAT: Casual, off-topic, or social messages not about code. e.g. "nice", "cool", "ok"
- BYE: Farewells. e.g. "bye", "goodbye", "see you"
- SEARCH: Finding specific code, functions, or patterns. e.g. "find the auth middleware"
- EXPLAIN: Understanding how a specific piece of code or concept works. e.g. "how does login work"
- OVERVIEW: High-level architectural summary of the project. e.g. "explain the project structure"
- REFACTOR: Suggestions for improving code quality. e.g. "how can I improve this service"
- FIX: Identifying or resolving a bug. e.g. "why is this crashing"
- CLARIFY: Used only if the query is too ambiguous to classify otherwise.

### CRITICAL RULE:
If the message is just a greeting, farewell, or non-technical filler — classify as GREETING, SMALLTALK, THANKS, CHITCHAT, or BYE. Do NOT classify simple social messages as EXPLAIN or OVERVIEW.

### OUTPUT FORMAT:
Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{
  "intent": "GREETING | SMALLTALK | THANKS | CHITCHAT | BYE | SEARCH | EXPLAIN | OVERVIEW | REFACTOR | FIX | CLARIFY",
  "entities": {
    "files": ["mentioned file paths"],
    "tech": ["mentioned frameworks or libraries"],
    "concepts": ["technical concepts mentioned"]
  },
  "original_slang_fixed": "The query with typos corrected (preserve technical slang)"
}

### EXAMPLES:
User: "hi"
Output: {"intent":"GREETING","entities":{"files":[],"tech":[],"concepts":[]},"original_slang_fixed":"hi"}

User: "thanks!"
Output: {"intent":"THANKS","entities":{"files":[],"tech":[],"concepts":[]},"original_slang_fixed":"thanks"}

User: "how does dashboaed work"
Output: {"intent":"EXPLAIN","entities":{"files":["Dashboard.jsx"],"tech":["React"],"concepts":["ui","state"]},"original_slang_fixed":"how does dashboard work"}

User: "find auth middleware"
Output: {"intent":"SEARCH","entities":{"files":["auth.middleware.js"],"tech":["Express"],"concepts":["authentication","middleware"]},"original_slang_fixed":"find auth middleware"}

User: "explain the whole project"
Output: {"intent":"OVERVIEW","entities":{"files":[],"tech":[],"concepts":["architecture"]},"original_slang_fixed":"explain the whole project"}

User Query: "${question}"
JSON Output:`;

    try {
      const result = await provider.generateResponse(prompt, model);
      let content = result.answer.trim();

      // Strip markdown code fences if the AI wrapped the JSON
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0];
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0];
      }

      const parsed = JSON.parse(content.trim());

      // Validate intent is a known value — prevent garbage from propagating
      const VALID_INTENTS = new Set([
        'GREETING', 'SMALLTALK', 'THANKS', 'CHITCHAT', 'BYE',
        'SEARCH', 'EXPLAIN', 'OVERVIEW', 'REFACTOR', 'FIX', 'CLARIFY'
      ]);

      if (!VALID_INTENTS.has(parsed.intent)) {
        console.warn(`[IntentDiscovery] Unknown intent "${parsed.intent}", defaulting to EXPLAIN`);
        parsed.intent = 'EXPLAIN';
      }

      return parsed;
    } catch (err) {
      console.error('[IntentDiscovery] Failed to parse intent:', err.message);
      // Safe fallback — never default to OVERVIEW (too expensive)
      return {
        intent: 'EXPLAIN',
        entities: { files: [], tech: [], concepts: [] },
        original_slang_fixed: question
      };
    }
  }
}

module.exports = new IntentDiscovery();