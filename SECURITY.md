# RepoChat — Security Document
**Version:** 1.0 | **Date:** March 2026

---

## 1. Security Principles

RepoChat is built with a **security-first mindset**. Since we handle users' AI API keys — which are tied to real money — protecting this data is our highest priority.

---

## 2. API Key Security

### The Problem
Users paste their AI API keys into RepoChat. These keys are sensitive — a leaked key means someone else can rack up charges on the user's account.

### Our Solution — AES-256-GCM Encryption

```
User pastes API key
        │
        ▼
Frontend sends key over HTTPS (TLS 1.3)
        │
        ▼
Backend receives key — never logs it
        │
        ▼
KeyEncryptor.encrypt(apiKey):
  1. Generate random 16-byte IV
  2. AES-256-GCM cipher with server's ENCRYPTION_KEY
  3. Produce: { iv, encrypted, authTag }
        │
        ▼
Store only { iv, encrypted, authTag } in MongoDB
Raw key is NEVER stored anywhere
        │
        ▼
When user sends a chat message:
  KeyEncryptor.decrypt({ iv, encrypted, authTag })
  → raw key available only in memory for that request
  → key is never sent to frontend
  → key is never logged
```

### Key Security Rules
- The `ENCRYPTION_KEY` environment variable is 32 bytes (256 bits) of random hex
- It lives only on the server — never in the codebase or git history
- If `ENCRYPTION_KEY` is rotated, all stored keys need re-encryption (V2 feature)
- Users can delete their key anytime — immediately removed from MongoDB

---

## 3. Authentication Security

### Google OAuth 2.0 + JWT

```
User → Google OAuth → Authorization Code
                            │
                            ▼
Server exchanges code for Google access token
                            │
                            ▼
Server fetches user profile from Google
                            │
                            ▼
Server generates JWT:
  payload: { userId, email, iat, exp: 7 days }
  signed with: HS256 + JWT_SECRET (32+ char random string)
                            │
                            ▼
JWT sent to frontend — stored in memory only
(NOT in localStorage — prevents XSS attacks)
                            │
                            ▼
Every request includes: Authorization: Bearer <jwt>
Server validates JWT signature on every request
```

### JWT Security Rules
- JWTs expire after 7 days — user must re-login
- JWT_SECRET is a long random string stored only in `.env`
- Tokens are stored in memory (React state) — not localStorage or cookies
- On logout, token is discarded from memory

---

## 4. Transport Security

- All communication over **HTTPS (TLS 1.3)**
- **HSTS** headers enforced — browser never falls back to HTTP
- **CORS** configured to allow only the frontend origin
- WebSocket (Socket.io) connections over **WSS** (secure WebSocket)

---

## 5. Input Validation & Injection Prevention

### Git URL Validation
```javascript
// Only allow valid Git URLs — no shell injection
function validateGitUrl(url) {
  const pattern = /^https?:\/\/(github|gitlab|bitbucket)\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
  if (!pattern.test(url)) throw new Error('Invalid Git URL');
  // Never pass URL directly to shell — use isomorphic-git (pure JS)
}
```

### MongoDB Injection Prevention
```javascript
// Use mongoose — always parameterized queries
// NEVER do: db.collection.find({ name: req.body.name })
// ALWAYS do:
const user = await User.findOne({ googleId: req.params.id });
```

### XSS Prevention
- All AI responses are sanitized before rendering with **DOMPurify**
- React's JSX escapes all values by default
- `Content-Security-Policy` header set to prevent script injection

---

## 6. Rate Limiting

```javascript
// Prevents abuse and protects AI API budgets
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 30,                // 30 requests per minute per user
  message: { error: 'Too many requests. Please slow down.' }
});

// Chat endpoint — stricter limit
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,                // 10 AI queries per minute
});
```

---

## 7. Collaboration Security

- Session host can **kick any participant** at any time
- Share links are **random UUIDs** — not guessable
- Max 5 users per room — prevents resource exhaustion
- Room IDs are server-side only — not derived from repo URL

---

## 8. Data Privacy

- Only **public Git repos** are supported in V1 — no private repo credentials ever stored
- We **do not read or store** the content of cloned repos beyond what's needed for indexing
- Cloned repos are stored in `/tmp/` and **deleted after indexing** — only vectors in ChromaDB remain
- Users can **delete their account** at any time — all data permanently wiped
- We **never sell or share** user data with third parties

---

## 9. Security Headers (Helmet.js)

```javascript
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
}));
```

---

## 10. Environment Variables Security Checklist

```bash
# ✅ DO
ENCRYPTION_KEY=64-char-random-hex   # Generated with: openssl rand -hex 32
JWT_SECRET=48-char-random-string    # Generated with: openssl rand -base64 48
MONGO_URI=mongodb+srv://...         # Use Atlas with IP whitelist

# ❌ NEVER DO
# Commit .env to git
# Share .env in messages or screenshots
# Use weak secrets like "mysecret123"
# Log environment variables in production
```

### .gitignore must include:
```
.env
.env.local
.env.production
*.key
*.pem
```

---

*© 2026 RepoChat — Security Document v1.0*
