/**
 * Map of API key prefixes to providers.
 * Based on common conventions and PRD/Architecture specs.
 */
const KEY_PATTERNS = {
  'sk-ant': 'claude',      // Anthropic Claude
  'sk-':    'openai',      // OpenAI
  'AIzaSy': 'gemini',      // Google Gemini
  'pplx-':  'perplexity',  // Perplexity AI
  'dsk-':   'deepseek',    // DeepSeek
  'gsk_':   'groq',        // Groq
  'sk-or-v1-': 'openrouter', // OpenRouter
};

/**
 * Detects the AI provider from the given API key.
 * @param {string} apiKey - The raw API key.
 * @returns {string} - The detected provider name or 'custom'.
 */
function detectProvider(apiKey) {
  if (!apiKey) return 'custom';
  
  // Special keyword for Ollama (free local LLM)
  const lower = apiKey.trim().toLowerCase();
  if (lower === 'ollama' || lower === 'local') return 'ollama';
  
  for (const [prefix, provider] of Object.entries(KEY_PATTERNS)) {
    if (apiKey.startsWith(prefix)) {
      return provider;
    }
  }
  
  // Together AI keys are typically 64 character hex strings without a standard prefix
  if (/^[a-fA-F0-9]{64}$/.test(apiKey.trim())) {
    return 'together';
  }
  
  return 'custom';
}

/**
 * Returns available models for a given provider.
 * @param {string} provider - The provider name.
 * @returns {string[]} - Array of model identifiers.
 */
function getAvailableModels(provider) {
  const models = {
    claude: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    gemini: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro-latest'],
    perplexity: ['sonar-small-chat', 'sonar-medium-chat', 'sonar-large-chat'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    openrouter: ['anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-70b-instruct', 'google/gemini-pro-1.5', 'openai/gpt-4o'],
    together: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x22B-Instruct-v0.1', 'Qwen/Qwen1.5-72B-Chat'],
    ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
    custom: ['gpt-3.5-turbo']
  };
  
  return models[provider] || models.custom;
}

module.exports = { detectProvider, getAvailableModels };
