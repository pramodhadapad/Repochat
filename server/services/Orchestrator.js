const ToolRegistry = require('./ToolRegistry');

// Max tools per plan to prevent runaway LLM-generated tool chains
const MAX_PLAN_STEPS = 4;

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

    const planningPrompt = `You are an MCP Orchestrator for a codebase Q&A assistant.
Given the user intent, return a minimal JSON array of tool calls needed to gather relevant context.

User Intent: ${JSON.stringify(intent)}
Available Tools: ${JSON.stringify(tools)}

Rules:
- Return ONLY a raw JSON array — no markdown, no explanation
- Use at most ${MAX_PLAN_STEPS} tool calls
- Prefer "search_code" for SEARCH and EXPLAIN intents
- Use "get_codebase_map" only for OVERVIEW intents
- Use "read_code" only if a specific file is mentioned in entities.files

Example output:
[{"tool":"search_code","parameters":{"query":"authentication middleware"}}]

JSON Array:`;

    let plan = null;

    try {
      const planRes = await provider.generateResponse(planningPrompt, model, { maxTokens: 250 });
      let planContent = planRes.answer.trim();

      // Strip markdown fences
      if (planContent.includes('```json')) {
        planContent = planContent.split('```json')[1].split('```')[0];
      } else if (planContent.includes('```')) {
        planContent = planContent.split('```')[1].split('```')[0];
      }

      const parsed = JSON.parse(planContent.trim());

      if (!Array.isArray(parsed)) {
        throw new Error('Plan is not an array');
      }

      // Sanitize: only allow known tools, cap steps
      plan = parsed
        .filter(step => step && typeof step.tool === 'string' && ToolRegistry.hasTool(step.tool))
        .slice(0, MAX_PLAN_STEPS);

    } catch (err) {
      console.warn('[Orchestrator] Planning failed, using fallback:', err.message);
    }

    // Fallback plan if parsing failed or produced nothing
    if (!plan || plan.length === 0) {
      plan = this.buildFallbackPlan(intent);
    }

    // Execute plan
    let gatheredContext = '';
    for (const step of plan) {
      try {
        console.log(`[Orchestrator] Running tool: ${step.tool}`, step.parameters);
        const result = await ToolRegistry.runTool(step.tool, repoId, step.parameters || {}, userId);
        if (result && result.trim()) {
          gatheredContext += `\n--- [${step.tool}] ---\n${result}\n`;
        }
      } catch (err) {
        console.warn(`[Orchestrator] Tool "${step.tool}" failed:`, err.message);
      }
    }

    return gatheredContext.trim();
  }

  /**
   * Builds a safe fallback plan when LLM planning fails.
   */
  buildFallbackPlan(intent) {
    const query = intent.original_slang_fixed || '';

    switch (intent.intent) {
      case 'OVERVIEW':
        return [{ tool: 'get_codebase_map', parameters: { depth: 2 } }];
      case 'SEARCH':
      case 'EXPLAIN':
      case 'FIX':
      case 'REFACTOR':
        return [{ tool: 'search_code', parameters: { query } }];
      default:
        return query
          ? [{ tool: 'search_code', parameters: { query } }]
          : [];
    }
  }
}

module.exports = new Orchestrator();