const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    unique: true,
    required: true
  },
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxUsers: {
    type: Number,
    default: 5
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivityAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Collaboration', collaborationSchema);
