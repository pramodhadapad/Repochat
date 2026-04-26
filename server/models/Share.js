const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  messageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: null // null = never expires
  }
}, { timestamps: true });

module.exports = mongoose.model('Share', shareSchema);
