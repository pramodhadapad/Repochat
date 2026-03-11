const ToolRegistry = require('./ToolRegistry');

class Orchestrator {
  /**
   * Orchestrates tool execution based on intent and AI planning.
   * @param {string} repoId - Repository ID.
   * @param {object} intent - Intent object from IntentDiscovery.
   * @param {AIProvider} provider - AI provider.
   * @param {string} model - Model name.
   * @param {string} userId - User ID.
   * @returns {Promise<string>} - Context gathered from tools.
   */
  async orchestrate(repoId, intent, provider, model, userId) {
    const tools = ToolRegistry.getToolDefinitions();
    
    // Initial Plan
    const planningPrompt = `You are an MCP Orchestrator. Given the user intent, decide which tools to call to gather information.
User Intent: ${JSON.stringify(intent)}
Available Tools: ${JSON.stringify(tools)}

### PLAN:
Return a JSON array of tool calls:
[{"tool": "tool_name", "parameters": {...}}, ...]

Only include essential tools. If you can answer with just 'SEARCH', start there.`;

    try {
      const planRes = await provider.generateResponse(planningPrompt, model);
      let planContent = planRes.answer;

      if (planContent.includes('```json')) {
        planContent = planContent.split('```json')[1].split('```')[0];
      }

      const plan = JSON.parse(planContent.trim());
      let gatheredContext = '';

      for (const step of plan) {
        console.log(`[Orchestrator] Executing tool: ${step.tool}`);
        const result = await ToolRegistry.runTool(step.tool, repoId, step.parameters, userId);
        gatheredContext += `\n--- [Tool Result: ${step.tool}] ---\n${result}\n`;
      }

      return gatheredContext;
    } catch (err) {
      console.warn('[Orchestrator] Planning failed, falling back to basic search:', err.message);
      // Fallback: If planning fails, at least run a search if intent suggests it
      if (intent.intent === 'SEARCH' || intent.intent === 'EXPLAIN') {
         return await ToolRegistry.runTool('search_code', repoId, { query: intent.original_slang_fixed }, userId);
      }
      return '';
    }
  }
}

module.exports = new Orchestrator();
