# RepoChat — Product Requirements Document
**Version:** 4.0 | **Status:** Approved | **Date:** March 2026

---

## 1. Executive Summary

RepoChat is a free AI-powered web and mobile application that lets any user clone any Git repository and instantly chat with that codebase in plain English. Users paste a Git URL, RepoChat indexes the entire codebase, and they start asking questions. Every answer is accurate, hallucination-free, and always points to the exact file and line number.

Users bring their own API key — paste it once, RepoChat auto-detects which LLM it belongs to, and they're ready to chat.

---

## 2. Problem Statement

### 2.1 Core Problem
When a student or developer encounters a new Git repository, they face thousands of files, zero documentation, and no guidance on where to start.

### 2.2 Pain Points
- Reading code file by file is slow and confusing
- Stack Overflow gives generic answers — not specific to your repo
- Existing AI tools lack full codebase context
- No tool supports all Git platforms and all languages equally
- Students give up on real-world projects because there is no easy entry point

### 2.3 Who Faces This Problem
- Final year CS students studying open source repos
- Junior developers onboarding to large codebases
- Self-learners exploring GitHub projects
- Non-technical people who need to understand what code does

---

## 3. Product Vision

> *"Make every Git repository as easy to understand as talking to the developer who built it."*

### Success Metrics
- User understands any repo in under 10 minutes
- Every answer cites exact file and line number — zero hallucination
- User sets up API key and starts chatting in under 2 minutes
- App loads in under 2 seconds
- AI response in under 5 seconds for 95% of queries

---

## 4. Target Users

| Persona | Background | Need |
|---|---|---|
| Pramod — Final Year CS Student | Building final year project | Understand open source repos quickly in plain English |
| Ananya — Junior Developer | Just joined a startup | Onboard to large codebase without disturbing senior devs |
| Rohit — Self-Learner | Learning from YouTube | Explore real projects without feeling lost |

---

## 5. Smart API Key System

### Auto-Detection Flow
```
User pastes API key
        ↓
RepoChat reads key prefix/format
        ↓
Auto-detects LLM provider
        ↓
Shows available models
        ↓
User picks model → Start chatting!
```

### Key Detection Table

| Key Format | Provider | Models Available |
|---|---|---|
| sk-ant-xxxx | Claude (Anthropic) | Haiku, Sonnet, Opus 4.5 |
| sk-xxxx | OpenAI | GPT-4o, GPT-4-turbo, GPT-3.5 |
| AIzaSyxxxx | Gemini (Google) | Flash, Pro, Ultra |
| pplx-xxxx | Perplexity AI | sonar-small, sonar-large |
| dsk-xxxx | DeepSeek | DeepSeek-V2, DeepSeek-Coder |
| Any other | Unknown — OpenAI-compatible attempt | User specifies manually |

### Key Storage
- Encrypted with AES-256 before storing in MongoDB
- Never sent to frontend — only used server-side
- User can update or delete anytime from Settings

---

## 6. Feature Requirements

### P0 — Core Features (Must Have)

| Feature | Description |
|---|---|
| Any Git URL Import | GitHub, GitLab, Bitbucket, or any public Git URL |
| Full Codebase Indexing | Tree-sitter parses all files across all languages |
| AI Chat Interface | Natural language Q&A — no hallucination |
| File + Line Redirect | Every answer links to exact file and line |
| Smart API Key Detection | Auto-detects provider from key format |
| Model Selector | User picks specific model after detection |
| Encrypted Key Storage | AES-256, stored per user, never exposed |
| Multi-language Support | 30+ languages supported |
| Google Login | One-click OAuth — no email/password |
| Full Chat History | Saved per repo, persists forever |
| File Tree Explorer | VS Code + Antigravity style sidebar |
| Syntax Highlighted Preview | Click any file to preview |
| Dark / Light Mode | User toggles anytime |
| Personal Dashboard | All previously loaded repos |

### P1 — Productivity Features (High Priority)

| Feature | Description |
|---|---|
| Voice Input | Speak questions via Web Speech API |
| Shareable Chat Links | Unique URL per conversation |
| Real-time Collaboration | Up to 5 users per repo simultaneously |
| README Auto-Generator | Only if repo has no README |
| Commit Summarizer | Explains changes between commits |
| Repo Comparator | Compare two repos side by side |
| Quiz Me Mode | AI tests your understanding |
| Progress Tracker | Visual explored/unexplored file map |
| Chrome Extension | One-click open from GitHub page |

---

## 7. UI/UX Requirements

### Layout — VS Code + Google Antigravity Style
- Left sidebar — file tree explorer
- Center panel — syntax highlighted file preview
- Right panel — AI chat interface
- Top bar — repo name, model badge, theme toggle, avatar
- Bottom bar — indexing progress, file count, language

### UX Principles
- First-time user chatting within 60 seconds
- Every answer cites exact file + line — no vague responses
- Accepts broken English, typos, short forms naturally
- Progress indicators for all async operations
- Mobile responsive — full functionality on phones and tablets

---

## 8. Collaboration & Account Management

### Collaboration Rules

| Rule | Details |
|---|---|
| Max users per repo | 5 simultaneously |
| How to invite | Share the unique repo link |
| Each user's AI key | Each uses their own — no shared API costs |
| Session host | User who loaded the repo — can remove others |
| 6th user | Sees "Session full (5/5)" message |

### Account Management Options

| Option | What It Does |
|---|---|
| Logout | Ends session |
| Change Google Account | Switch to different Google account |
| Delete Chat History | Delete messages for a specific repo |
| Delete a Specific Repo | Remove repo + all its data from dashboard |
| Delete Account | Permanently delete everything — cannot be undone |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Indexing < 60s, AI response < 5s, App load < 2s |
| Accuracy | Every answer grounded in indexed code, cites file + line |
| Security | AES-256 key encryption, JWT sessions, public repos only in V1 |
| Scalability | 1,000 concurrent users, repos up to 100,000 lines |
| Reliability | If AI unsure, it says so — never guesses |

---

## 10. Sprint Plan

| Sprint | Week | Goal |
|---|---|---|
| Sprint 1 | Week 1 | Repo import pipeline — Google auth, Git cloning, Tree-sitter, file tree UI |
| Sprint 2 | Week 2 | Smart API key system + core chat with file + line references |
| Sprint 3 | Week 3 | All P0 features — history, voice, sharing, collaboration, dark mode |
| Sprint 4 | Week 4 | All P1 features + Chrome extension + account management + deployment |

---

## 11. Success Criteria

- [ ] Demo works with 3+ repos in Python, React, Java
- [ ] API key auto-detected within 1 second
- [ ] Every answer cites exact file + line number
- [ ] Voice input works on web and mobile
- [ ] 5 users can collaborate simultaneously
- [ ] Shareable link opens conversation in new tab
- [ ] All 5 account management options work
- [ ] App deployed live at public URL
- [ ] Dark/light mode works on all screens

---

## 12. V2 Future Scope

- VS Code + Antigravity extension
- React Native dedicated mobile app
- Private repo support with OAuth
- Code Generation Mode
- Auto Bug Fixer
- PR Review Mode
- Increase collaboration limit to 20 users
- GitLab and Bitbucket native integration

---

*© 2026 RepoChat — Final Year CS Project*
