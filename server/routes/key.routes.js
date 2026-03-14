const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { encrypt } = require('../services/KeyEncryptor');
const { detectProvider, getAvailableModels } = require('../services/KeyDetector');
const User = require('../models/User');

/**
 * @route POST /api/key/save
 * @desc Save and encrypt user's API key — NO validation, just save
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

    console.log(`[KEY] Saved key for user ${user._id} — provider: ${provider}`);

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
    res.status(500).json({
      error: 'KEY_ERROR',
      message: error.message || 'Failed to save API key'
    });
  }
});

/**
 * @route PUT /api/key/update
 * @desc Update user's API key — NO validation, just save
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

    console.log(`[KEY] Updated key for user ${user._id} — provider: ${provider}`);

    res.status(200).json({
      provider: provider,
      model: user.model,
      availableModels: availableModels,
      message: 'API key updated successfully!'
    });
  } catch (error) {
    console.error('Key Update Error:', error);
    res.status(500).json({
      error: 'KEY_ERROR',
      message: error.message || 'Failed to update API key'
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