# RepoChat — Architecture Document
**Version:** 1.0 | **Date:** March 2026

---

## 1. Architecture Overview

RepoChat follows a **3-tier architecture** with a clear separation between the frontend, backend, and data layers. The system is built around the **SOLID principles** and uses **dependency injection** throughout to keep every module loosely coupled and independently testable.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│          React Web App          React Native Mobile         │
│          Chrome Extension       Web Speech API (Voice)      │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                       BACKEND LAYER                         │
│   Node.js + Express API Server                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│   │ AuthSvc  │ │ RepoSvc  │ │ ChatSvc  │ │ CollabSvc    │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│   │ KeySvc   │ │ ParseSvc │ │ IndexSvc │ │ ShareSvc     │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└──────────┬───────────────────┬──────────────────────────────┘
           │                   │
┌──────────▼──────┐   ┌────────▼────────────────────────────┐
│   DATA LAYER    │   │        EXTERNAL SERVICES             │
│                 │   │  Claude API  │  Gemini API           │
│  MongoDB        │   │  OpenAI API  │  Perplexity API       │
│  ChromaDB       │   │  DeepSeek    │  Any OpenAI-compat    │
│  Local FS       │   │  GitHub API  │  isomorphic-git       │
└─────────────────┘   └─────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 React Web App Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx          # File tree explorer
│   │   ├── ChatPanel.jsx        # AI chat interface
│   │   ├── FilePreview.jsx      # Syntax highlighted code view
│   │   └── TopBar.jsx           # Repo name, model badge, theme
│   ├── features/
│   │   ├── ApiKeySetup.jsx      # One-time key paste + auto-detect
│   │   ├── RepoImport.jsx       # Git URL input
│   │   ├── Collaboration.jsx    # Real-time 5-user chat
│   │   ├── QuizMode.jsx         # Quiz me feature
│   │   ├── ProgressMap.jsx      # Explored file tracker
│   │   └── RepoComparator.jsx   # Side-by-side repo compare
│   └── shared/
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Modal.jsx
├── pages/
│   ├── Landing.jsx
│   ├── Dashboard.jsx
│   ├── RepoChat.jsx             # Main IDE workspace
│   └── Profile.jsx
├── hooks/
│   ├── useChat.js               # Chat state management
│   ├── useRepo.js               # Repo loading state
│   ├── useVoice.js              # Web Speech API
│   └── useCollaboration.js      # Socket.io real-time
├── services/
│   ├── api.js                   # Axios HTTP client
│   └── socket.js                # Socket.io client
└── store/
    └── index.js                 # Redux / Zustand global state
```

### 2.2 State Management
- **Local state** — React `useState` for UI interactions
- **Global state** — Zustand for user, repo, chat, and theme
- **Server state** — React Query for API calls and caching
- **Real-time state** — Socket.io for collaboration events

---

## 3. Backend Architecture

### 3.1 Service Layer — SOLID Applied

Each service has **one responsibility** (Single Responsibility Principle):

```
services/
├── AuthService.js         # Google OAuth + JWT token management
├── RepoCloner.js          # Clones any Git URL using isomorphic-git
├── CodeParser.js          # Parses files using Tree-sitter
├── VectorIndexer.js       # Embeds chunks into ChromaDB
├── ChatService.js         # Sends query + context to AI engine
├── KeyDetector.js         # Detects LLM from API key format
├── KeyEncryptor.js        # AES-256 encrypt/decrypt API keys
├── HistoryManager.js      # Read/write chat history in MongoDB
├── VoiceService.js        # Speech-to-text conversion
├── ShareService.js        # Generate/resolve shareable links
├── CollaborationService.js# Socket.io room management (max 5 users)
└── ReadmeGenerator.js     # Auto-generate README from codebase
```

### 3.2 API Routes Structure
```
routes/
├── auth.routes.js         # POST /auth/google, POST /auth/logout
├── repo.routes.js         # POST /repo/clone, GET /repo/:id
├── chat.routes.js         # POST /chat/message, GET /chat/history
├── key.routes.js          # POST /key/save, DELETE /key
├── share.routes.js        # POST /share/create, GET /share/:id
├── user.routes.js         # GET /user/profile, DELETE /user/account
└── collab.routes.js       # POST /collab/join, DELETE /collab/leave
```

### 3.3 Dependency Injection Container
```javascript
// container.js — one file, one place to swap anything
const aiProvider    = new ClaudeProvider(decryptedKey);
const storage       = new ChromaDBAdapter(process.env.CHROMA_URL);
const chatService   = new ChatService(aiProvider);       // injected
const vectorIndexer = new VectorIndexer(storage);        // injected
const historyMgr    = new HistoryManager(mongoClient);   // injected
```

---

## 4. AI Engine Architecture

### 4.1 Universal AI Adapter (Open/Closed Principle)
```
interfaces/
└── AIProvider.js          # Abstract base — generateResponse(prompt, context)

providers/
├── ClaudeProvider.js      # Extends AIProvider
├── GeminiProvider.js      # Extends AIProvider
├── OpenAIProvider.js      # Extends AIProvider
├── PerplexityProvider.js  # Extends AIProvider
├── DeepSeekProvider.js    # Extends AIProvider
└── CustomProvider.js      # Extends AIProvider — for any OpenAI-compatible key
```

All providers return the same `AIResponse` object:
```javascript
{
  answer: "string",
  fileRef: { path: "src/auth/login.js", line: 42 },
  confidence: "high" | "medium" | "low",
  tokens_used: number
}
```

### 4.2 Key Auto-Detection Flow
```javascript
// KeyDetector.js
const KEY_PATTERNS = {
  'sk-ant': 'claude',
  'sk-':    'openai',
  'AIzaSy': 'gemini',
  'pplx-':  'perplexity',
  'dsk-':   'deepseek',
};

function detectProvider(apiKey) {
  for (const [prefix, provider] of Object.entries(KEY_PATTERNS)) {
    if (apiKey.startsWith(prefix)) return provider;
  }
  return 'custom'; // attempt OpenAI-compatible connection
}
```

---

## 5. Code Parsing Architecture

### 5.1 Tree-sitter Universal Parser
```
parsers/
├── LanguageParser.js      # Abstract base class
├── JavaScriptParser.js    # Extends LanguageParser
├── TypeScriptParser.js    # Extends LanguageParser
├── PythonParser.js        # Extends LanguageParser
├── JavaParser.js          # Extends LanguageParser
├── CppParser.js           # Extends LanguageParser
├── GoParser.js            # Extends LanguageParser
├── RustParser.js          # Extends LanguageParser
└── ...                    # One file per language
```

### 5.2 CodeChunk Structure
Every parser returns the same structure (Liskov Substitution):
```javascript
{
  id: "uuid",
  repoId: "repo-123",
  filePath: "src/auth/login.js",
  language: "javascript",
  startLine: 10,
  endLine: 45,
  content: "function login(user) { ... }",
  type: "function" | "class" | "module" | "config",
  embedding: [0.123, 0.456, ...] // 1536-dim vector
}
```

---

## 6. Real-Time Collaboration Architecture

```
Client A ──┐
Client B ──┤──► Socket.io Server ──► Room: repo-{repoId}
Client C ──┤         │
Client D ──┤         ▼
Client E ──┘    Max 5 users per room
                MongoDB: saves all messages
                6th client: rejected with "room full" event
```

### Room Events
```javascript
// Server events
socket.on('join-repo', ({ repoId, userId }) => { ... })
socket.on('chat-message', ({ repoId, message }) => { ... })
socket.on('leave-repo', ({ repoId, userId }) => { ... })
socket.on('kick-user', ({ repoId, targetUserId }) => { ... }) // host only

// Client events
socket.emit('user-joined', { username, avatar })
socket.emit('new-message', { sender, content, fileRef, timestamp })
socket.emit('user-left', { username })
socket.emit('room-full', { currentCount: 5, maxCount: 5 })
```

---

## 7. Security Architecture

```
User Request
     │
     ▼
HTTPS (TLS 1.3)
     │
     ▼
JWT Middleware ──► Validate token ──► Reject if invalid
     │
     ▼
Rate Limiter ──► 100 req/min per user
     │
     ▼
Route Handler
     │
     ▼
KeyEncryptor ──► AES-256-GCM decrypt ──► Use key server-side only
     │
     ▼
AI Provider ──► External API call
     │
     ▼
Response ──► Never include raw API key
```

---

## 8. Folder Structure (Complete)

```
repochat/
├── client/                    # React web app
├── mobile/                    # React Native app
├── extension/                 # Chrome extension
├── server/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── chromadb.js        # ChromaDB connection
│   │   └── container.js       # Dependency injection
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT validation
│   │   └── ratelimit.js       # Rate limiting
│   ├── routes/
│   ├── services/
│   ├── providers/             # AI engine adapters
│   ├── parsers/               # Tree-sitter language parsers
│   ├── interfaces/            # Abstract base classes
│   └── index.js               # Entry point
├── .env.example
├── docker-compose.yml
└── README.md
```

---

*© 2026 RepoChat — Architecture Document v1.0*
