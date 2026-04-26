# RepoChat — API Reference
**Version:** 1.0 | **Base URL:** `http://localhost:5000/api`

---

## Authentication

All endpoints (except `/auth/google`) require a JWT token in the header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Endpoints

### POST /auth/google
Login with Google OAuth.

**Request:**
```json
{ "googleToken": "google-oauth-token-from-frontend" }
```
**Response:**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "abc123", "name": "Pramod", "email": "p@gmail.com", "avatar": "url" },
  "isNewUser": true
}
```

---

### POST /auth/logout
Logout and invalidate session.

**Response:** `{ "message": "Logged out successfully" }`

---

### DELETE /auth/account
Permanently delete user account — all repos, history, and API key.

**Response:** `{ "message": "Account permanently deleted" }`

---

## Repo Endpoints

### POST /repo/clone
Clone and index a Git repository.

**Request:**
```json
{ "url": "https://github.com/facebook/react" }
```
**Response:**
```json
{
  "repoId": "repo-456",
  "name": "react",
  "status": "indexing",
  "message": "Cloning started. Indexing in progress...",
  "estimatedTime": "30 seconds"
}
```

---

### GET /repo/:id
Get repo metadata and indexing status.

**Response:**
```json
{
  "id": "repo-456",
  "name": "react",
  "url": "https://github.com/facebook/react",
  "languages": ["javascript", "typescript"],
  "fileCount": 1432,
  "status": "ready | indexing | failed",
  "hasReadme": true,
  "indexedAt": "2026-03-07T10:00:00Z"
}
```

---

### GET /repo/:id/files
Get the full file tree of a repo.

**Response:**
```json
{
  "tree": [
    {
      "name": "src",
      "type": "directory",
      "children": [
        { "name": "index.js", "type": "file", "language": "javascript", "lines": 120 }
      ]
    }
  ]
}
```

---

### GET /repo/:id/file?path=src/index.js
Get the content of a specific file.

**Response:**
```json
{
  "path": "src/index.js",
  "content": "import React from 'react';\n...",
  "language": "javascript",
  "lines": 120
}
```

---

### DELETE /repo/:id
Delete a repo from dashboard — removes all data and vectors.

**Response:** `{ "message": "Repo deleted successfully" }`

---

## Chat Endpoints

### POST /chat/message
Send a question about a repo and get an AI answer.

**Request:**
```json
{
  "repoId": "repo-456",
  "question": "How does authentication work in this repo?"
}
```
**Response:**
```json
{
  "messageId": "msg-789",
  "question": "How does authentication work?",
  "answer": "Authentication uses JWT tokens. The login function at src/auth/login.js line 42 handles user validation and token generation.",
  "fileRef": {
    "path": "src/auth/login.js",
    "startLine": 42,
    "endLine": 56
  },
  "provider": "claude",
  "model": "claude-sonnet-4",
  "timestamp": "2026-03-07T10:05:00Z"
}
```

---

### GET /chat/:repoId/history
Get full chat history for a repo.

**Query params:** `?page=1&limit=50`

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-789",
      "question": "How does auth work?",
      "answer": "...",
      "fileRef": { "path": "src/auth/login.js", "startLine": 42 },
      "timestamp": "2026-03-07T10:05:00Z"
    }
  ],
  "total": 23,
  "page": 1
}
```

---

### DELETE /chat/:repoId
Delete all chat history for a specific repo.

**Response:** `{ "message": "Chat history deleted" }`

---

## Key Endpoints

### POST /key/save
Save and encrypt the user's API key.

**Request:**
```json
{ "apiKey": "sk-ant-api03-xxxxxxxxxxxx" }
```
**Response:**
```json
{
  "provider": "claude",
  "model": "claude-sonnet-4",
  "availableModels": ["claude-haiku", "claude-sonnet-4", "claude-opus-4-5"],
  "message": "API key saved and encrypted successfully"
}
```

---

### PUT /key/update
Update the user's API key.

**Request:** `{ "apiKey": "new-api-key" }`

**Response:** Same as POST /key/save

---

### DELETE /key
Delete the user's stored API key.

**Response:** `{ "message": "API key deleted" }`

---

## Share Endpoints

### POST /share/create
Create a shareable link for a chat conversation.

**Request:** `{ "repoId": "repo-456" }`

**Response:**
```json
{
  "shareId": "shr-abc123",
  "shareUrl": "https://repochat.app/share/shr-abc123",
  "expiresAt": null
}
```

---

### GET /share/:shareId
Resolve a shareable link — returns the conversation.

**Response:** Same as GET /chat/:repoId/history

---

## User Endpoints

### GET /user/profile
Get the user's profile and all their repos.

**Response:**
```json
{
  "id": "usr-123",
  "name": "Pramod",
  "email": "p@gmail.com",
  "avatar": "https://...",
  "provider": "claude",
  "model": "claude-sonnet-4",
  "hasApiKey": true,
  "repos": [
    { "id": "repo-456", "name": "react", "lastAccessed": "2026-03-07" }
  ],
  "joinedAt": "2026-03-01"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "REPO_CLONE_FAILED",
  "message": "Could not clone this Git URL. Check if it is public.",
  "status": 400
}
```

| Error Code | Status | Meaning |
|---|---|---|
| UNAUTHORIZED | 401 | Invalid or missing JWT token |
| KEY_INVALID | 401 | API key not recognized |
| REPO_NOT_FOUND | 404 | Repo not found |
| ROOM_FULL | 403 | Collaboration session full (5/5) |
| REPO_CLONE_FAILED | 400 | Could not clone the Git URL |
| INDEXING_IN_PROGRESS | 202 | Repo still indexing — try again |
| AI_RATE_LIMIT | 429 | AI API rate limit hit |
| SERVER_ERROR | 500 | Internal server error |

---

*© 2026 RepoChat — API Reference v1.0*
