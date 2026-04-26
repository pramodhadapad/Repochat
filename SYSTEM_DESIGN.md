# RepoChat — System Design Document
**Version:** 1.0 | **Date:** March 2026

---

## 1. System Overview

RepoChat is designed as a **microservice-inspired monolith** — all services run in one Node.js process for simplicity (given the 1-month timeline and 2-person team), but each service is completely independent and can be extracted into a separate microservice in V2 without any code changes.

---

## 2. High-Level System Design

```
                        ┌─────────────────────────────┐
                        │         USERS               │
                        │  Web  │  Mobile  │  Chrome  │
                        └──────────────┬──────────────┘
                                       │
                              HTTPS + WebSocket
                                       │
                        ┌──────────────▼──────────────┐
                        │         LOAD BALANCER        │
                        │     (Nginx / TBD hosting)    │
                        └──────────────┬──────────────┘
                                       │
               ┌───────────────────────▼──────────────────────┐
               │              NODE.JS + EXPRESS SERVER         │
               │                                               │
               │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
               │  │  Auth   │  │  Repo   │  │    Chat     │  │
               │  │ Service │  │ Service │  │   Service   │  │
               │  └─────────┘  └─────────┘  └─────────────┘  │
               │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
               │  │  Key    │  │ Parser  │  │   Collab    │  │
               │  │ Service │  │ Service │  │   Service   │  │
               │  └─────────┘  └─────────┘  └─────────────┘  │
               └──────┬──────────────┬───────────────┬────────┘
                      │              │               │
           ┌──────────▼──┐  ┌────────▼──┐  ┌────────▼──────┐
           │   MongoDB   │  │ ChromaDB  │  │  External AI  │
           │  (user data │  │ (vectors) │  │    APIs       │
           │  + history) │  │           │  │               │
           └─────────────┘  └───────────┘  └───────────────┘
```

---

## 3. Core Workflows

### 3.1 First-Time User Flow
```
User lands on RepoChat.com
        │
        ▼
Click "Sign in with Google"
        │
        ▼
Google OAuth → JWT token issued → stored in memory
        │
        ▼
Redirect to API Key Setup screen
        │
        ▼
User pastes API key
        │
        ▼
KeyDetector reads prefix → identifies provider
        │
        ▼
Show available models for that provider
        │
        ▼
User picks model
        │
        ▼
KeyEncryptor: AES-256-GCM encrypt key
        │
        ▼
Store encrypted key in MongoDB against user ID
        │
        ▼
Redirect to Dashboard
```

### 3.2 Repo Import & Indexing Flow
```
User pastes Git URL
        │
        ▼
RepoCloner: isomorphic-git clones repo to /tmp/{repoId}/
        │
        ▼
FileWalker: recursively walks all files
        │
        ▼
For each file:
  └─► LanguageDetector: detects language from extension
  └─► LanguageParser (Tree-sitter): parse → extract functions, classes, modules
  └─► ChunkSplitter: split into 512-token chunks with overlap
        │
        ▼
EmbeddingService: convert each chunk to 1536-dim vector
        │
        ▼
VectorIndexer: store all vectors in ChromaDB with metadata
        │
        ▼
MongoDB: save repo metadata (name, URL, language stats, file count)
        │
        ▼
Notify frontend: "Indexing complete!" → enable chat
```

### 3.3 Chat Query Flow
```
User types or speaks a question
        │
        ▼ (if voice)
Web Speech API → convert speech to text
        │
        ▼
Send to backend: { question, repoId, userId }
        │
        ▼
KeyEncryptor: decrypt user's API key from MongoDB
        │
        ▼
ChromaDB: semantic search → retrieve top 5 most relevant CodeChunks
        │
        ▼
PromptBuilder: construct prompt:
  "You are a code assistant. Answer based ONLY on this code.
   Always cite the exact file path and line number.
   Code context: [chunks]
   Question: [user question]"
        │
        ▼
ChatService: send prompt to selected AI provider using user's API key
        │
        ▼
AI returns: { answer, fileRef, lineNumber }
        │
        ▼
HistoryManager: save Q&A to MongoDB
        │
        ▼
Send response to frontend with clickable file + line reference
```

### 3.4 Real-Time Collaboration Flow
```
User A loads repo → becomes session host
        │
        ▼
User A clicks "Share" → ShareService generates unique URL
        │
        ▼
User A sends URL to User B, C, D, E
        │
        ▼
Users B-E open link → Socket.io join-repo event
        │
        ▼
Server checks room count:
  < 5 → allow join, broadcast "user-joined" to room
  = 5 → reject with "room-full" event
        │
        ▼
All 5 users send/receive messages in real time
Each user's messages go through their own API key
        │
        ▼
All messages saved to MongoDB per repo
```

---

## 4. Database Design

### 4.1 MongoDB Collections

**users**
```json
{
  "_id": "ObjectId",
  "googleId": "string",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "apiKey": {
    "iv": "string",
    "encrypted": "string",
    "authTag": "string"
  },
  "provider": "claude | gemini | openai | perplexity | deepseek | custom",
  "model": "string",
  "createdAt": "Date",
  "lastLoginAt": "Date"
}
```

**repos**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "url": "string",
  "name": "string",
  "description": "string",
  "languages": ["javascript", "python"],
  "fileCount": 142,
  "indexedAt": "Date",
  "lastAccessedAt": "Date",
  "hasReadme": false
}
```

**messages**
```json
{
  "_id": "ObjectId",
  "repoId": "ObjectId",
  "userId": "ObjectId",
  "username": "string",
  "question": "string",
  "answer": "string",
  "fileRef": {
    "path": "src/auth/login.js",
    "startLine": 42,
    "endLine": 56
  },
  "provider": "claude",
  "model": "claude-sonnet-4",
  "createdAt": "Date",
  "isShared": false,
  "shareId": "string | null"
}
```

**collaborations**
```json
{
  "_id": "ObjectId",
  "repoId": "ObjectId",
  "hostUserId": "ObjectId",
  "participants": ["ObjectId"],
  "maxUsers": 5,
  "isActive": true,
  "shareLink": "string",
  "createdAt": "Date"
}
```

### 4.2 ChromaDB Collections

**code_chunks_{repoId}**
```json
{
  "id": "uuid",
  "embedding": [0.123, 0.456, ...],
  "document": "function login(user) { return authenticate(user); }",
  "metadata": {
    "repoId": "string",
    "filePath": "src/auth/login.js",
    "language": "javascript",
    "startLine": 10,
    "endLine": 25,
    "type": "function",
    "name": "login"
  }
}
```

---

## 5. API Design

### 5.1 RESTful Endpoints

```
AUTH
POST   /api/auth/google          → Google OAuth login
POST   /api/auth/logout          → Logout + invalidate JWT
DELETE /api/auth/account         → Delete account permanently

REPO
POST   /api/repo/clone           → Clone + index a Git URL
GET    /api/repo/:id             → Get repo metadata
GET    /api/repo/:id/files       → Get file tree
GET    /api/repo/:id/file        → Get file content
DELETE /api/repo/:id             → Delete repo from dashboard

CHAT
POST   /api/chat/message         → Send question, get AI answer
GET    /api/chat/:repoId/history → Get full chat history
DELETE /api/chat/:repoId         → Delete chat history for repo

KEY
POST   /api/key/save             → Save + encrypt API key
PUT    /api/key/update           → Update API key
DELETE /api/key                  → Delete API key

SHARE
POST   /api/share/create         → Create shareable link
GET    /api/share/:shareId       → Resolve shareable link

USER
GET    /api/user/profile         → Get user profile + repos
PUT    /api/user/profile         → Update preferences
```

### 5.2 Socket.io Events

```
Client → Server:
  join-repo      { repoId, userId, username }
  chat-message   { repoId, message }
  leave-repo     { repoId, userId }
  kick-user      { repoId, targetUserId }  // host only

Server → Client:
  user-joined    { username, count }
  new-message    { sender, content, fileRef, timestamp }
  user-left      { username, count }
  room-full      { count: 5, max: 5 }
  user-kicked    { username }
```

---

## 6. Scalability Considerations

### 6.1 Bottlenecks & Solutions

| Bottleneck | Solution |
|---|---|
| Large repo indexing blocks server | Run indexing in background worker (Bull queue) |
| ChromaDB slow for large repos | Partition vectors by repoId, use HNSW index |
| Many concurrent Socket.io rooms | Redis adapter for Socket.io (horizontal scaling) |
| AI API rate limits | Request queue per user, exponential backoff retry |
| MongoDB slow on chat history queries | Index on repoId + createdAt for fast queries |

### 6.2 V1 Capacity Estimates

| Metric | Estimate |
|---|---|
| Concurrent users | 1,000 |
| Repos indexed simultaneously | 50 |
| Max repo size | 100,000 lines |
| Messages per day | 50,000 |
| Collaboration rooms | 200 active simultaneously |

---

## 7. Error Handling Strategy

```javascript
// Global error handler — server/middleware/errorHandler.js
const errors = {
  REPO_CLONE_FAILED:    { status: 400, message: "Could not clone this Git URL. Check if it's public." },
  KEY_INVALID:          { status: 401, message: "API key not recognized. Please check your key." },
  ROOM_FULL:            { status: 403, message: "This session is full (5/5 users)." },
  REPO_NOT_FOUND:       { status: 404, message: "Repo not found. Please re-import it." },
  AI_RATE_LIMIT:        { status: 429, message: "AI rate limit hit. Please wait a moment." },
  INDEXING_IN_PROGRESS: { status: 202, message: "Repo is still indexing. Try again in a few seconds." },
};
```

---

## 8. Monitoring & Logging

```javascript
// Winston logger levels
logger.error()   // Errors that need immediate attention
logger.warn()    // Things that might cause issues
logger.info()    // Normal operations (repo cloned, chat sent)
logger.debug()   // Detailed debug info (only in development)

// Key metrics to log
- Repo indexing time
- AI response time per provider
- Active collaboration rooms
- Failed key detection attempts
- User signups per day
```

---

*© 2026 RepoChat — System Design Document v1.0*
