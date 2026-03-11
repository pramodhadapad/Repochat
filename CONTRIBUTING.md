# Contributing to RepoChat

Thank you for your interest in contributing to RepoChat! This document explains how to set up the project locally and contribute effectively.

---

## Getting Started

### Prerequisites
- Node.js 20.x LTS
- MongoDB 7.x
- ChromaDB (latest)
- Git

### Fork and Clone
```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/repochat.git
cd repochat
```

### Setup
```bash
# Backend
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev

# Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

---

## Branch Naming

```
feature/your-feature-name    → new features
fix/bug-description          → bug fixes
docs/what-you-updated        → documentation
refactor/what-you-changed    → code refactoring
```

Example: `feature/voice-input`, `fix/chrome-extension-redirect`

---

## Commit Message Format

Follow this format for all commits:

```
type: short description (max 72 chars)

Optional longer explanation if needed.
```

**Types:**
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — build process or tooling changes

**Examples:**
```
feat: add voice input using Web Speech API
fix: chrome extension redirect not working on Firefox
docs: update API.md with new share endpoints
refactor: extract KeyDetector into separate service class
```

---

## SOLID Principles — Must Follow

All new code must follow the SOLID principles already established in this project:

- **S** — Every new service/class must do ONE thing only
- **O** — New AI providers must extend `AIProvider` — never modify existing providers
- **L** — All AI providers must return the same `AIResponse` structure
- **I** — Create small focused interfaces — never add unrelated methods
- **D** — Inject dependencies via constructor — never import concrete classes in services

### Adding a New AI Provider
```javascript
// ✅ Correct way — extend the base class
class MistralProvider extends AIProvider {
  async generateResponse(prompt, context) {
    // your implementation
    return { answer, fileRef, confidence, tokensUsed };
  }
}

// ❌ Wrong way — never modify ChatService directly
// ChatService.js — DO NOT TOUCH when adding new providers
```

### Adding a New Language Parser
```javascript
// ✅ Correct way — extend the base class
class SwiftParser extends LanguageParser {
  parse(fileContent) {
    // return CodeChunk[] — same structure as all other parsers
  }
}

// Register in parsers/index.js:
const PARSERS = {
  ...existingParsers,
  swift: new SwiftParser(),
};
```

---

## Pull Request Process

1. Create a branch from `main`
2. Make your changes following the SOLID principles
3. Write/update tests if applicable
4. Run `npm test` — all tests must pass
5. Run `npm run lint` — no lint errors
6. Create a Pull Request with:
   - Clear title describing what you did
   - Description of changes made
   - Screenshots if UI changes are involved
   - Reference to any related issue

---

## Code Style

- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and React components
- Use **SCREAMING_SNAKE_CASE** for constants
- Use **2 spaces** for indentation
- Always use `const` or `let` — never `var`
- Add JSDoc comments for all public methods

```javascript
/**
 * Detects the AI provider from an API key prefix
 * @param {string} apiKey - The raw API key
 * @returns {string} provider name e.g. "claude", "openai", "custom"
 */
function detectProvider(apiKey) { ... }
```

---

## Questions?

Open an issue on GitHub with the label `question` and we'll help you out.

---

*© 2026 RepoChat — Contributing Guide*
