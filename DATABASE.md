# RepoChat — Database Schema
**Version:** 1.0 | **Date:** March 2026

---

## Overview

RepoChat uses two databases:
- **MongoDB** — user data, repo metadata, chat history, collaboration sessions
- **ChromaDB** — vector embeddings for semantic code search

---

## MongoDB Collections

### 1. users
Stores all registered users.

```javascript
{
  _id: ObjectId,
  googleId: String,           // Google OAuth unique ID
  name: String,               // Full name from Google
  email: String,              // Email from Google
  avatar: String,             // Profile picture URL
  apiKey: {                   // Encrypted API key
    iv: String,               // AES-256 initialization vector
    encrypted: String,        // Encrypted key ciphertext
    authTag: String           // GCM auth tag for integrity
  },
  provider: String,           // "claude" | "gemini" | "openai" | "perplexity" | "deepseek" | "custom"
  model: String,              // e.g. "claude-sonnet-4"
  theme: String,              // "dark" | "light" — default "dark"
  createdAt: Date,
  lastLoginAt: Date
}

// Indexes
{ googleId: 1 }   // unique
{ email: 1 }      // unique
```

---

### 2. repos
Stores metadata about each imported repository.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to users collection
  url: String,                // Full Git URL
  name: String,               // Repo name e.g. "react"
  owner: String,              // e.g. "facebook"
  description: String,        // Repo description
  languages: [String],        // e.g. ["javascript", "typescript"]
  fileCount: Number,          // Total files indexed
  lineCount: Number,          // Total lines of code
  status: String,             // "indexing" | "ready" | "failed"
  hasReadme: Boolean,         // Whether repo has a README
  generatedReadme: String,    // Auto-generated README content (if none existed)
  localPath: String,          // Temp local path where repo is cloned
  indexedAt: Date,
  lastAccessedAt: Date,
  createdAt: Date
}

// Indexes
{ userId: 1 }
{ userId: 1, url: 1 }   // unique per user
{ status: 1 }
```

---

### 3. messages
Stores all chat messages per repo per user.

```javascript
{
  _id: ObjectId,
  repoId: ObjectId,           // Reference to repos collection
  userId: ObjectId,           // Reference to users collection
  username: String,           // Display name (for collaboration)
  avatar: String,             // User avatar (for collaboration display)
  question: String,           // User's question
  answer: String,             // AI's answer
  fileRef: {                  // File reference in the answer
    path: String,             // e.g. "src/auth/login.js"
    startLine: Number,        // e.g. 42
    endLine: Number           // e.g. 56
  },
  provider: String,           // Which AI provider was used
  model: String,              // Which model was used
  tokensUsed: Number,         // Tokens consumed (for user's reference)
  isShared: Boolean,          // Whether this message is in a shared session
  shareSessionId: ObjectId,   // Reference to collaborations collection
  createdAt: Date
}

// Indexes
{ repoId: 1, createdAt: -1 }   // Fast history queries
{ userId: 1 }
{ shareSessionId: 1 }
```

---

### 4. collaborations
Tracks real-time collaboration sessions (max 5 users per repo).

```javascript
{
  _id: ObjectId,
  repoId: ObjectId,           // Which repo this session is for
  hostUserId: ObjectId,       // User who created the session
  participants: [ObjectId],   // Current active users (max 5)
  maxUsers: Number,           // Always 5
  shareLink: String,          // Unique shareable URL slug
  isActive: Boolean,          // Whether session is currently live
  createdAt: Date,
  lastActivityAt: Date
}

// Indexes
{ shareLink: 1 }    // unique — fast link resolution
{ repoId: 1 }
{ hostUserId: 1 }
```

---

### 5. shares
Stores shareable chat links.

```javascript
{
  _id: ObjectId,
  shareId: String,            // Unique slug e.g. "shr-abc123"
  repoId: ObjectId,
  userId: ObjectId,           // Who created the share
  messageIds: [ObjectId],     // Which messages are shared
  viewCount: Number,          // How many times the link was opened
  createdAt: Date,
  expiresAt: Date             // null = never expires
}

// Indexes
{ shareId: 1 }    // unique
```

---

## ChromaDB Collections

### code_chunks (one collection per repo)
Collection name format: `chunks_{repoId}`

```javascript
{
  id: "uuid-v4",
  embedding: [Number],        // 1536-dimensional vector
  document: String,           // Raw code chunk text
  metadata: {
    repoId: String,
    filePath: String,         // e.g. "src/auth/login.js"
    language: String,         // e.g. "javascript"
    startLine: Number,
    endLine: Number,
    chunkIndex: Number,       // Index of this chunk within the file
    type: String,             // "function" | "class" | "module" | "config" | "comment"
    name: String              // e.g. "login" (function/class name if detected)
  }
}
```

---

## Relationships

```
users (1) ──────────────────── (many) repos
users (1) ──────────────────── (many) messages
repos (1) ──────────────────── (many) messages
repos (1) ──────────────────── (1) collaborations
collaborations (1) ─────────── (many) users (as participants)
messages (many) ─────────────── (1) shares
repos (1) ──────────────────── ChromaDB collection: chunks_{repoId}
```

---

## Data Lifecycle

### On Account Delete
```
DELETE users WHERE _id = userId
DELETE repos WHERE userId = userId
DELETE messages WHERE userId = userId
DELETE collaborations WHERE hostUserId = userId
DELETE ChromaDB collections for all user's repos
```

### On Repo Delete
```
DELETE repos WHERE _id = repoId
DELETE messages WHERE repoId = repoId
DELETE collaborations WHERE repoId = repoId
DELETE ChromaDB collection: chunks_{repoId}
DELETE local cloned files at repos.localPath
```

### On Delete Chat History
```
DELETE messages WHERE repoId = repoId AND userId = userId
(repo and ChromaDB vectors remain intact)
```

---

*© 2026 RepoChat — Database Schema v1.0*
