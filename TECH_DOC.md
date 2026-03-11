# RepoChat — Technical Documentation
**Version:** 1.0 | **Date:** March 2026

---

## 1. Tech Stack Overview

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 18.x | Component-based UI |
| Styling | Tailwind CSS | 3.x | Utility-first styling |
| Mobile | React Native | 0.73.x | Android + iOS app |
| Backend | Node.js | 20.x LTS | Server runtime |
| Framework | Express.js | 4.x | REST API framework |
| Database | MongoDB | 7.x | User data + chat history |
| Vector DB | ChromaDB | Latest | Semantic code search |
| Code Parser | Tree-sitter | Latest | Universal language parsing |
| Auth | Google OAuth 2.0 | — | Single sign-on |
| Sessions | JWT | — | Stateless auth tokens |
| Real-time | Socket.io | 4.x | Live collaboration |
| Encryption | AES-256-GCM | — | API key encryption |
| Git | isomorphic-git | Latest | Clone any Git URL |
| Extension | Chrome MV3 | — | Browser extension |

---

## 2. Frontend — React + Tailwind

### 2.1 Key Libraries

| Library | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `zustand` | Lightweight global state |
| `@tanstack/react-query` | Server state + caching |
| `socket.io-client` | Real-time collaboration |
| `monaco-editor` | VS Code-like code editor/preview |
| `prism-react-renderer` | Syntax highlighting |
| `axios` | HTTP client |
| `react-hot-toast` | Toast notifications |
| `framer-motion` | Smooth animations |
| `lucide-react` | Icon library |

### 2.2 Environment Variables (Client)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2.3 Running the Frontend
```bash
cd client
npm install
npm run dev          # Development server at localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 3. Backend — Node.js + Express

### 3.1 Key Libraries

| Library | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `mongoose` | MongoDB ODM |
| `chromadb` | Vector database client |
| `socket.io` | Real-time WebSocket server |
| `passport` + `passport-google-oauth20` | Google OAuth strategy |
| `jsonwebtoken` | JWT creation and validation |
| `crypto` (built-in) | AES-256-GCM encryption |
| `isomorphic-git` | Clone any Git URL server-side |
| `tree-sitter` | Universal code parser |
| `@anthropic-ai/sdk` | Claude API client |
| `openai` | OpenAI + DeepSeek + Perplexity client |
| `@google/generative-ai` | Gemini API client |
| `express-rate-limit` | Rate limiting middleware |
| `helmet` | Security HTTP headers |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable management |
| `uuid` | Unique ID generation |
| `winston` | Logging |

### 3.2 Environment Variables (Server)
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/repochat

# ChromaDB
CHROMA_URL=http://localhost:8000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-for-aes256

# App
CLIENT_URL=http://localhost:3000
```

### 3.3 Running the Backend
```bash
cd server
npm install
npm run dev          # Development with nodemon at localhost:5000
npm start            # Production
npm test             # Run tests
```

---

## 4. Database Setup

### 4.1 MongoDB
```bash
# Install MongoDB locally
brew install mongodb-community   # macOS
sudo apt install mongodb         # Ubuntu

# Start MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas (cloud) — recommended for production
# Add MONGO_URI to .env
```

### 4.2 ChromaDB
```bash
# Install ChromaDB
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000

# Or use Docker
docker run -p 8000:8000 chromadb/chroma
```

---

## 5. Tree-sitter Language Parser Setup

```bash
npm install tree-sitter
npm install tree-sitter-javascript
npm install tree-sitter-typescript
npm install tree-sitter-python
npm install tree-sitter-java
npm install tree-sitter-cpp
npm install tree-sitter-go
npm install tree-sitter-rust
npm install tree-sitter-php
npm install tree-sitter-ruby
```

### Usage Example
```javascript
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(JavaScript);

const tree = parser.parse(`
  function login(user) {
    return authenticate(user);
  }
`);

// Extract all function names
const functions = tree.rootNode.children
  .filter(node => node.type === 'function_declaration')
  .map(node => node.firstNamedChild.text);
```

---

## 6. Google OAuth Setup

### 6.1 Create Google OAuth Credentials
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

### 6.2 Auth Flow
```
User clicks "Sign in with Google"
        ↓
Redirect to Google OAuth consent screen
        ↓
User approves → Google sends authorization code
        ↓
Backend exchanges code for access token
        ↓
Backend gets user profile (name, email, avatar)
        ↓
Create/update user in MongoDB
        ↓
Generate JWT token
        ↓
Send JWT to frontend → store in memory
        ↓
All subsequent requests include JWT in Authorization header
```

---

## 7. AES-256 Encryption for API Keys

```javascript
// KeyEncryptor.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt({ iv, encrypted, authTag }) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
```

---

## 8. Socket.io Collaboration Setup

```javascript
// server/index.js
const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

// Room management — max 5 users per repo
const roomUsers = new Map(); // repoId → Set of userIds

io.on('connection', (socket) => {
  socket.on('join-repo', ({ repoId, userId, username }) => {
    const users = roomUsers.get(repoId) || new Set();
    if (users.size >= 5) {
      socket.emit('room-full', { count: users.size, max: 5 });
      return;
    }
    users.add(userId);
    roomUsers.set(repoId, users);
    socket.join(repoId);
    io.to(repoId).emit('user-joined', { username, count: users.size });
  });

  socket.on('chat-message', ({ repoId, message }) => {
    io.to(repoId).emit('new-message', message);
  });

  socket.on('leave-repo', ({ repoId, userId }) => {
    const users = roomUsers.get(repoId);
    if (users) users.delete(userId);
    socket.leave(repoId);
  });
});
```

---

## 9. Chrome Extension Setup

### 9.1 File Structure
```
extension/
├── manifest.json          # MV3 manifest
├── background.js          # Service worker
├── content.js             # Injected into GitHub pages
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 9.2 manifest.json
```json
{
  "manifest_version": 3,
  "name": "RepoChat",
  "version": "1.0",
  "description": "Chat with any GitHub repo instantly",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["https://github.com/*"],
  "action": { "default_popup": "popup/popup.html" },
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["https://github.com/*"],
    "js": ["content.js"]
  }]
}
```

### 9.3 How It Works
- User visits any GitHub repo page
- Extension detects the repo URL automatically
- Clicking the RepoChat icon opens a popup with the repo URL pre-filled
- User clicks "Open in RepoChat" → redirects to RepoChat with the URL

---

## 10. Running the Full Project

```bash
# Clone the repo
git clone https://github.com/yourusername/repochat.git
cd repochat

# Start MongoDB
mongod

# Start ChromaDB
chroma run --host localhost --port 8000

# Start backend
cd server && npm install && npm run dev

# Start frontend (new terminal)
cd client && npm install && npm run dev

# App runs at http://localhost:3000
```

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
# All services start automatically
```

---

*© 2026 RepoChat — Technical Documentation v1.0*
