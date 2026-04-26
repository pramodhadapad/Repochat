# Graph Report - client  (2026-04-26)

## Corpus Check
- Corpus is ~24,460 words - fits in a single context window. You may not need a graph.

## Summary
- 114 nodes · 76 edges · 6 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `SocketService` - 8 edges
2. `useTheme()` - 6 edges
3. `TreeItem()` - 4 edges
4. `ProtectedRoute()` - 2 edges
5. `ParticlesBackground()` - 2 edges
6. `ThemeSelector()` - 2 edges
7. `TypewriterMessage()` - 2 edges
8. `cn()` - 2 edges
9. `getFileIconSrc()` - 2 edges
10. `getFolderIconSrc()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `ParticlesBackground()` --calls--> `useTheme()`  [INFERRED]
  C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ParticlesBackground.jsx → C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ThemeProvider.jsx
- `ThemeSelector()` --calls--> `useTheme()`  [INFERRED]
  C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\features\ThemeSelector.jsx → C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ThemeProvider.jsx
- `TopBar()` --calls--> `useTheme()`  [INFERRED]
  C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\layout\TopBar.jsx → C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ThemeProvider.jsx
- `Landing()` --calls--> `useTheme()`  [INFERRED]
  C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\pages\Landing.jsx → C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ThemeProvider.jsx
- `Settings()` --calls--> `useTheme()`  [INFERRED]
  C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\pages\Settings.jsx → C:\Users\hp\Downloads\Repochat-main\Repochat-main\client\src\components\common\ThemeProvider.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (6): Landing(), ParticlesBackground(), Settings(), useTheme(), ThemeSelector(), TopBar()

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (1): SocketService

### Community 2 - "Community 2"
Cohesion: 0.53
Nodes (4): cn(), getFileIconSrc(), getFolderIconSrc(), TreeItem()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (2): RepoChat(), useKeyboardShortcuts()

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (2): ProtectedRoute(), useDisableBackNavigation()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (2): TypewriterMessage(), useTypewriter()

## Knowledge Gaps
- **Thin community `Community 1`** (9 nodes): `SocketService`, `.connect()`, `.constructor()`, `.disconnect()`, `.joinRepo()`, `.leaveRepo()`, `.off()`, `.on()`, `socket.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (6 nodes): `RepoChat()`, `SearchPanel()`, `SourceControlPanel()`, `useKeyboardShortcuts.js`, `RepoChat.jsx`, `useKeyboardShortcuts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (4 nodes): `ProtectedRoute()`, `ProtectedRoute.jsx`, `useDisableBackNavigation.js`, `useDisableBackNavigation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (4 nodes): `TypewriterMessage.jsx`, `useTypewriter.js`, `TypewriterMessage()`, `useTypewriter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `ParticlesBackground()` and `ThemeSelector()`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._