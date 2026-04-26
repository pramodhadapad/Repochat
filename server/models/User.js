const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: String,
  password: {
    type: String,
    select: false // Don't return password by default
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  avatar: String,
  apiKey: {
    iv: String,
    encrypted: String,
    authTag: String
  },
  provider: {
    type: String,
    enum: ['claude', 'gemini', 'openai', 'perplexity', 'deepseek', 'ollama', 'groq', 'openrouter', 'together', 'custom'],
    default: 'custom'
  },
  model: String,
  theme: { type: String, default: 'dark' },
  lastLoginAt: Date,
  refreshToken: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
