const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // For fast dashboard queries
  },
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo'
  },
  provider: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    default: '/api/chat/message'
  },
  question: {
    type: String,
    required: true
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  cached: {
    type: Boolean,
    default: false
  },
  estimatedCost: {
    type: Number,
    default: 0 // In USD
  },
  responseTimeMs: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    default: 'success'
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

// Auto-expire logs after 90 days to save space
usageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
