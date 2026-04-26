const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  avatar: String,
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  fileRef: {
    path: String,
    startLine: Number,
    endLine: Number
  },
  provider: String,
  model: String,
  tokensUsed: Number,
  isShared: {
    type: Boolean,
    default: false
  },
  shareSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration'
  }
}, { timestamps: true });

messageSchema.index({ repoId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
