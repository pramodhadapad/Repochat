# RepoChat — Deployment Guide
**Version:** 1.0 | **Date:** March 2026

> **Note:** Hosting platform is TBD — this guide covers the most common free/cheap options for a final year project.

---

## Option 1 — Recommended for Final Year Project Demo

| Service | What For | Cost |
|---|---|---|
| Vercel | Frontend (React) | Free |
| Railway | Backend (Node.js) | Free tier |
| MongoDB Atlas | Database | Free 512MB |
| ChromaDB Cloud | Vector DB | Free tier |

---

## Option 2 — Single VPS (Most Control)

| Service | What For | Cost |
|---|---|---|
| DigitalOcean Droplet | Everything | ~$6/month |
| Cloudflare | DNS + SSL | Free |

---

## Step-by-Step Deployment

### Step 1 — MongoDB Atlas Setup
```
1. Go to mongodb.com/atlas → Create free account
2. Create a free M0 cluster
3. Create a database user (username + password)
4. Whitelist IP: 0.0.0.0/0 (allow all — for simplicity)
5. Get connection string:
   mongodb+srv://username:password@cluster.mongodb.net/repochat
6. Add to your server's MONGO_URI env variable
```

### Step 2 — Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd server
railway init

# Add environment variables in Railway dashboard:
# MONGO_URI, JWT_SECRET, ENCRYPTION_KEY, GOOGLE_CLIENT_ID, etc.

# Deploy
railway up

# Get your backend URL (e.g. https://repochat-backend.railway.app)
```

### Step 3 — Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
cd client
vercel

# Add environment variables in Vercel dashboard:
# VITE_API_URL = https://repochat-backend.railway.app
# VITE_GOOGLE_CLIENT_ID = your-google-client-id

# Your app is live at: https://repochat.vercel.app
```

### Step 4 — Update Google OAuth Callback URL
```
1. Go to console.cloud.google.com
2. APIs & Services → Credentials → Your OAuth Client
3. Add authorized redirect URIs:
   https://repochat-backend.railway.app/auth/google/callback
4. Add authorized JavaScript origins:
   https://repochat.vercel.app
5. Save
```

### Step 5 — Deploy Chrome Extension
```
1. Go to chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer fee
3. Upload extension/ folder as a .zip
4. Fill in store listing details
5. Submit for review (takes 1-3 days)

OR for demo only — load unpacked extension:
  chrome://extensions → Developer mode → Load unpacked → select extension/ folder
```

---

## Docker Compose (Local + VPS)

```yaml
# docker-compose.yml
version: '3.8'
services:
  client:
    build: ./client
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://server:5000

  server:
    build: ./server
    ports: ["5000:5000"]
    environment:
      - MONGO_URI=mongodb://mongo:27017/repochat
      - CHROMA_URL=http://chromadb:8000
    depends_on: [mongo, chromadb]

  mongo:
    image: mongo:7
    volumes: ["mongo_data:/data/db"]
    ports: ["27017:27017"]

  chromadb:
    image: chromadb/chroma
    ports: ["8000:8000"]
    volumes: ["chroma_data:/chroma/chroma"]

volumes:
  mongo_data:
  chroma_data:
```

```bash
# Start everything
docker-compose up --build -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f server
```

---

## Environment Variables Checklist

Before deploying, make sure ALL these are set in your hosting platform:

```env
# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app

# Database
MONGO_URI=mongodb+srv://...
CHROMA_URL=https://your-chromadb-url

# Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=minimum-32-character-random-string
JWT_EXPIRES_IN=7d

# Encryption — CRITICAL — keep this secret forever
ENCRYPTION_KEY=64-character-hex-string
```

### Generate secure values:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Encryption Key (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Post-Deployment Checklist

- [ ] Frontend loads at production URL
- [ ] Google login works
- [ ] API key paste and auto-detection works
- [ ] Can clone a GitHub repo
- [ ] Chat returns answers with file + line references
- [ ] Chat history persists after refresh
- [ ] Dark/light mode toggle works
- [ ] Mobile responsive layout works
- [ ] Shareable link opens in new tab correctly
- [ ] Delete account removes all data

---

## Monitoring

### Check server health
```bash
# Railway logs
railway logs

# Docker logs
docker-compose logs -f server
```

### Basic uptime check
Add this to your README badge once deployed:
```
[![Deploy Status](https://img.shields.io/badge/status-live-green)](https://repochat.vercel.app)
```

---

*© 2026 RepoChat — Deployment Guide v1.0*
