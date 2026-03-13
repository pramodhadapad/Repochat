const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { encrypt } = require('../services/KeyEncryptor');
const { detectProvider, getAvailableModels } = require('../services/KeyDetector');
const User = require('../models/User');

/**
 * @route POST /api/key/save
 * @desc Save and encrypt user's API key
 * @access Private
 */
router.post('/save', protect, async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'API key is required'
    });
  }

  try {
    const provider = detectProvider(apiKey);
    const availableModels = getAvailableModels(provider);

    // Soft validation — try to validate but NEVER block saving
    let aiAdapter;
    try {
      const ClaudeProvider = require('../providers/ClaudeProvider');
      const OpenAIProvider = require('../providers/OpenAIProvider');
      const GeminiProvider = require('../providers/GeminiProvider');
      const DeepSeekProvider = require('../providers/DeepSeekProvider');
      const PerplexityProvider = require('../providers/PerplexityProvider');
      const GroqProvider = require('../providers/GroqProvider');
      const OpenRouterProvider = require('../providers/OpenRouterProvider');
      const TogetherProvider = require('../providers/TogetherProvider');
      const OllamaProvider = require('../providers/OllamaProvider');

      switch (provider) {
        case 'claude': aiAdapter = new ClaudeProvider(apiKey); break;
        case 'openai': aiAdapter = new OpenAIProvider(apiKey); break;
        case 'gemini': aiAdapter = new GeminiProvider(apiKey); break;
        case 'deepseek': aiAdapter = new DeepSeekProvider(apiKey); break;
        case 'perplexity': aiAdapter = new PerplexityProvider(apiKey); break;
        case 'groq': aiAdapter = new GroqProvider(apiKey); break;
        case 'openrouter': aiAdapter = new OpenRouterProvider(apiKey); break;
        case 'together': aiAdapter = new TogetherProvider(apiKey); break;
        case 'ollama': aiAdapter = new OllamaProvider(apiKey); break;
        default: aiAdapter = new OpenAIProvider(apiKey); break;
      }

      // Try validation but ignore errors — we save the key regardless
      await aiAdapter.validateKey();
    } catch (validationErr) {
      console.warn('[KEY] Validation warning (key will still be saved):', validationErr.message);
    }

    const user = await User.findById(req.user._id);

    if (provider === 'ollama') {
      user.apiKey = { iv: 'ollama', encrypted: 'ollama', authTag: 'ollama' };
    } else {
      const { iv, encrypted, authTag } = encrypt(apiKey);
      user.apiKey = { iv, encrypted, authTag };
    }

    user.provider = provider;
    user.model = availableModels[0];
    await user.save();

    res.status(200).json({
      provider: provider,
      model: user.model,
      availableModels: availableModels,
      message: provider === 'ollama'
        ? 'Connected to Ollama (local). Make sure Ollama is running!'
        : 'API key saved successfully!'
    });
  } catch (error) {
    console.error('Key Save Error:', error);
    const msg = error.message || 'Failed to save API key';
    res.status(500).json({
      error: 'KEY_ERROR',
      message: msg
    });
  }
});

/**
 * @route PUT /api/key/update
 * @desc Update user's API key
 * @access Private
 */
router.put('/update', protect, async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'API key is required'
    });
  }

  try {
    const provider = detectProvider(apiKey);
    const availableModels = getAvailableModels(provider);

    // Soft validation — try but never block
    try {
      const ClaudeProvider = require('../providers/ClaudeProvider');
      const OpenAIProvider = require('../providers/OpenAIProvider');
      const GeminiProvider = require('../providers/GeminiProvider');
      const DeepSeekProvider = require('../providers/DeepSeekProvider');
      const PerplexityProvider = require('../providers/PerplexityProvider');
      const GroqProvider = require('../providers/GroqProvider');
      const OpenRouterProvider = require('../providers/OpenRouterProvider');
      const TogetherProvider = require('../providers/TogetherProvider');
      const OllamaProvider = require('../providers/OllamaProvider');

      let aiAdapter;
      switch (provider) {
        case 'claude': aiAdapter = new ClaudeProvider(apiKey); break;
        case 'openai': aiAdapter = new OpenAIProvider(apiKey); break;
        case 'gemini': aiAdapter = new GeminiProvider(apiKey); break;
        case 'deepseek': aiAdapter = new DeepSeekProvider(apiKey); break;
        case 'perplexity': aiAdapter = new PerplexityProvider(apiKey); break;
        case 'groq': aiAdapter = new GroqProvider(apiKey); break;
        case 'openrouter': aiAdapter = new OpenRouterProvider(apiKey); break;
        case 'together': aiAdapter = new TogetherProvider(apiKey); break;
        case 'ollama': aiAdapter = new OllamaProvider(apiKey); break;
        default: aiAdapter = new OpenAIProvider(apiKey); break;
      }

      await aiAdapter.validateKey();
    } catch (validationErr) {
      console.warn('[KEY] Validation warning (key will still be saved):', validationErr.message);
    }

    const user = await User.findById(req.user._id);

    if (provider === 'ollama') {
      user.apiKey = { iv: 'ollama', encrypted: 'ollama', authTag: 'ollama' };
    } else {
      const { iv, encrypted, authTag } = encrypt(apiKey);
      user.apiKey = { iv, encrypted, authTag };
    }

    user.provider = provider;
    user.model = availableModels[0];
    await user.save();

    res.status(200).json({
      provider: provider,
      model: user.model,
      availableModels: availableModels,
      message: 'API key updated successfully!'
    });
  } catch (error) {
    console.error('Key Update Error:', error);
    const msg = error.message || 'Failed to update API key';
    res.status(500).json({
      error: 'KEY_ERROR',
      message: msg
    });
  }
});

/**
 * @route DELETE /api/key
 * @desc Delete user's stored API key
 * @access Private
 */
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.apiKey = undefined;
    user.provider = 'custom';
    user.model = undefined;
    await user.save();

    res.status(200).json({ message: 'API key deleted' });
  } catch (error) {
    console.error('Key Delete Error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to delete API key'
    });
  }
});

module.exports = router;
