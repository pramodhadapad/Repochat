const UsageLog = require('../models/UsageLog');
const User = require('../models/User');

class UsageTracker {
  /**
   * Estimates cost in USD based on model and token count.
   * Prices approximate as of early 2024.
   */
  estimateCost(provider, model, tokensUsed) {
    if (!tokensUsed || tokensUsed === 0) return 0;

    // Prices are per 1,000 tokens
    const rates = {
      openai: {
        'gpt-4o': 0.005,
        'gpt-4-turbo': 0.01,
        'gpt-3.5-turbo': 0.0015
      },
      claude: {
        'claude-3-opus-20240229': 0.015,
        'claude-3-5-sonnet-20240620': 0.003,
        'claude-3-haiku-20240307': 0.00025
      },
      gemini: {
        // Free tier via AI Studio
        'gemini-2.0-flash': 0,
        'gemini-2.0-flash-lite': 0,
        'gemini-1.5-pro-latest': 0
      },
      deepseek: {
        'deepseek-chat': 0.00014,
        'deepseek-coder': 0.00014
      },
      groq: {
        'llama-3.3-70b-versatile': 0.00059,
        'llama-3.1-8b-instant': 0.00005,
        'mixtral-8x7b-32768': 0.00024,
        'gemma2-9b-it': 0.0002,
        default: 0
      },
      openrouter: {
        'anthropic/claude-3.5-sonnet': 0.003,
        'meta-llama/llama-3.1-70b-instruct': 0.00052,
        default: 0.001
      },
      together: {
        'meta-llama/Llama-3-70b-chat-hf': 0.0009,
        'mistralai/Mixtral-8x22B-Instruct-v0.1': 0.0012,
        default: 0.001
      },
      perplexity: {
        'sonar-small-chat': 0.0002,
        'sonar-medium-chat': 0.0006,
        'sonar-large-chat': 0.001
      },
      ollama: {
        // Local is always free
        default: 0
      }
    };

    const providerRates = rates[provider] || {};
    const ratePer1k = providerRates[model] || providerRates.default || 0;
    
    return (tokensUsed / 1000) * ratePer1k;
  }

  /**
   * Asynchronously logs an API request so it doesn't block the response.
   */
  async logRequest(data) {
    try {
      const {
        userId,
        repoId,
        provider,
        model,
        question,
        tokensUsed,
        cached = false,
        responseTimeMs,
        status = 'success',
        errorMessage
      } = data;

      // Truncate question for log sanity (max 500 chars)
      const truncatedQuestion = question && question.length > 500 
        ? question.substring(0, 500) + '...'
        : question;

      const estimatedCost = cached ? 0 : this.estimateCost(provider, model, tokensUsed);

      await UsageLog.create({
        userId,
        repoId,
        provider,
        model,
        question: truncatedQuestion,
        tokensUsed: cached ? 0 : tokensUsed,
        cached,
        estimatedCost,
        responseTimeMs,
        status,
        errorMessage
      });

    } catch (err) {
      console.error('[UsageTracker] Failed to log request:', err.message);
    }
  }

  /**
   * Retrieves summary statistics for a user's dashboard.
   */
  async getUsageSummary(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's usage
    const todayLogs = await UsageLog.find({
      userId,
      createdAt: { $gte: today },
      status: 'success'
    });

    // Get month's usage
    const monthLogs = await UsageLog.find({
      userId,
      createdAt: { $gte: firstDayOfMonth },
      status: 'success'
    });

    const calculateTotals = (logs) => {
      return logs.reduce((acc, log) => ({
        requests: acc.requests + 1,
        tokens: acc.tokens + (log.tokensUsed || 0),
        cost: acc.cost + (log.estimatedCost || 0)
      }), { requests: 0, tokens: 0, cost: 0 });
    };

    const todayStats = calculateTotals(todayLogs);
    const monthStats = calculateTotals(monthLogs);

    return {
      today: {
        ...todayStats,
        cost: Number(todayStats.cost.toFixed(4))
      },
      month: {
        ...monthStats,
        cost: Number(monthStats.cost.toFixed(4))
      }
    };
  }
}

module.exports = new UsageTracker();
