const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: false
  },
  name: String,
  owner: String,
  description: String,
  languages: [String],
  fileCount: {
    type: Number,
    default: 0
  },
  lineCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['indexing', 'ready', 'failed'],
    default: 'indexing'
  },
  hasReadme: {
    type: Boolean,
    default: false
  },
  generatedReadme: String,
  localPath: String,
  snippets: [{
    title: String,
    code: String,
    language: String,
    createdAt: { type: Date, default: Date.now }
  }],
  indexedAt: Date,
  lastAccessedAt: Date
}, { timestamps: true });

// Ensure a user can't import the same repo URL multiple times
// Unique index: for Git, enforce per USER + URL. For local, we skip this by only indexing if URL exists.
repoSchema.index({ userId: 1, url: 1 }, { 
  unique: true, 
  partialFilterExpression: { url: { $exists: true, $ne: null } } 
});

module.exports = mongoose.model('Repo', repoSchema);
