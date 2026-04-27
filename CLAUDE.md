# CLAUDE.md — AuraAI Project Guide

This file provides context and instructions for Claude AI when working on this codebase.

---

## Project Overview

**AuraAI** is an AI chat application built with vanilla HTML, CSS, and JavaScript. It supports **OpenAI GPT**, **Anthropic Claude**, and **Ollama** (local) as AI providers, with markdown rendering, syntax highlighting, and a typewriter effect.

- **Stack:** HTML5, CSS3, Vanilla JS, OpenAI API, Anthropic API, Ollama API, marked.js, highlight.js
- **No build tools, no frameworks, no npm**
- **Built entirely with [Claude AI](https://claude.ai) by Anthropic**

---

## File Structure

```
aura-ai-chat/
├── index.html    — HTML structure only (no inline styles or scripts)
├── style.css     — All visual styles and CSS custom properties
├── app.js        — Main orchestrator (UI, state, rendering, routing)
├── openai.js     — OpenAI provider (key management, API call, UI switch)
├── ollama.js     — Ollama provider (config, API call, UI switch)
├── claude.js     — Claude provider (key management, API call, UI switch)
├── README.md     — Project documentation for humans
├── CLAUDE.md     — This file — guide for Claude AI
└── LICENSE       — MIT License
```

---

## Architecture

### index.html
Pure HTML structure — no inline styles or scripts.
```
<head>   — meta, Google Fonts, marked.js, highlight.js CDN links
<body>
  ├── header          — logo, provider tabs (OpenAI / Ollama / Claude), status dot
  ├── #openai-banner  — OpenAI API key input (hidden after key saved)
  ├── #ollama-banner  — Ollama host + model input
  ├── #ollama-info    — Quick-start tip bar for Ollama
  ├── #claude-banner  — Claude API key input (hidden after key saved)
  ├── #messages       — chat message list + empty state + suggestion chips
  └── #input-area     — textarea, model selector, send button, footer

<!-- Script load order (important) -->
<script src="openai.js"></script>
<script src="ollama.js"></script>
<script src="claude.js"></script>
<script src="app.js"></script>   ← must load last
```

### style.css
All CSS organized into 19 labeled sections:
```
1.  CSS Variables       — design tokens (:root)
2.  Reset & Base        — box-sizing, html/body
3.  App Layout          — #app flex container
4.  Header              — logo, tabs, status
5.  Provider Tabs       — OpenAI / Ollama / Claude switcher
6.  Status Indicator    — dot + pulse animation
7.  Banners             — API key / Ollama setup panels
8.  Ollama Info Bar     — quick-start hint
9.  Messages Area       — scroll container
10. Empty State         — centered welcome screen
11. Message Rows        — flex layout, animation
12. Provider Badge      — ⚡ OpenAI / 🦙 Ollama / 🤖 Claude label
13. Message Bubbles     — user & assistant styles
14. Typing Indicator    — bouncing dots
15. Input Area          — textarea wrapper, send button
16. Markdown Styles     — p, ul, ol, h1-h3, table, blockquote
17. Code Blocks         — header, dots, lang label, line numbers
18. Message Actions     — hover copy button
19. Typewriter Cursor   — blinking ▋ cursor
```

### app.js — Main Orchestrator
Handles UI, state, rendering and routes API calls to provider files.
```
1.  Markdown Renderer   — custom marked.js + highlight.js renderer
2.  Global State        — provider, apiKey, claudeKey, ollamaHost, messages, isLoading
3.  DOM References      — all getElementById calls (shared + per provider)
4.  Status Helper       — setStatus(text, offline)
5.  Provider Switching  — switchProvider() → delegates to openai/ollama/claude.js
6.  Reset Key           — resetKey() → delegates to openai/claude.js
7.  Input Helpers       — autoResize, useSuggestion, keydown handlers
8.  Message Rendering   — appendMessage(role, content, isError, prov)
9.  Typewriter Effect   — typewrite(el, text, speed)
10. Typing Indicator    — appendTyping(), removeTyping()
11. Copy Code Block     — copyCode(btn, code)
12. Send Message        — routes to sendOpenAIMessage / sendClaudeMessage / sendOllamaMessage
13. Init                — initOpenAI(), initOllama(), initClaude(), switchProvider()
```

### openai.js
```
- OPENAI_MODELS       — model dropdown HTML
- initOpenAI()        — sets up key save/load listeners
- saveOpenAIKey()     — validates sk- key, saves to localStorage
- resetOpenAIKey()    — clears key, shows banner
- switchToOpenAI()    — updates UI for OpenAI tab
- sendOpenAIMessage() — calls api.openai.com/v1/chat/completions
```

### ollama.js
```
- OLLAMA_MODELS       — model dropdown HTML
- initOllama()        — sets up host/model save listeners + dropdown change
- saveOllamaConfig()  — saves host + model to localStorage
- switchToOllama()    — updates UI for Ollama tab
- sendOllamaMessage() — calls localhost:11434/api/chat
```

### claude.js
```
- CLAUDE_MODELS       — model dropdown HTML
- initClaude()        — sets up key save/load listeners
- saveClaudeKey()     — validates sk-ant- key, saves to localStorage
- resetClaudeKey()    — clears key, shows banner
- switchToClaude()    — updates UI for Claude tab
- sendClaudeMessage() — calls api.anthropic.com/v1/messages
```

---

## State Variables (app.js)

```js
let provider    // 'openai' | 'ollama' | 'claude' — stored in localStorage
let apiKey      // OpenAI key   — localStorage: 'aura_openai_key'
let claudeKey   // Claude key   — localStorage: 'aura_claude_key'
let ollamaHost  // Ollama URL   — localStorage: 'aura_ollama_host'
let ollamaModel // Ollama model — localStorage: 'aura_ollama_model'
let messages    // conversation history [{ role, content }, ...]
let isLoading   // prevents double-sends
```

---

## CSS Design System

All colors use CSS custom properties defined in `:root`. **Never hardcode hex values** outside of `:root`.

| Variable | Value | Usage |
|----------|-------|-------|
| `--accent` | `#00c9a7` | Teal — OpenAI buttons, links, borders |
| `--ollama` | `#e8873a` | Orange — Ollama buttons, borders |
| `--claude` | `#d97757` | Warm orange — Claude buttons, borders |
| `--bg` | `#0a0a0f` | Page background |
| `--surface` | `#111118` | Card/panel background |
| `--text` | `#e8e6f0` | Primary text |
| `--text-dim` | `rgba(232,230,240,0.5)` | Secondary text |
| `--text-faint` | `rgba(232,230,240,0.28)` | Placeholder / hint text |
| `--danger` | `#f06b6b` | Error states |
| `--success` | `#5ecfa0` | Status dot online |

**Fonts:**
- Display: `DM Serif Display` — logo
- Body: `Instrument Sans` — UI text
- Mono: `DM Mono` — code, status, labels, timestamps

---

## API Integration

### OpenAI (openai.js)
**Endpoint:** `https://api.openai.com/v1/chat/completions`
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are a helpful, knowledgeable AI assistant." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 1500,
  "temperature": 0.7
}
```
**Models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
**Key format:** `sk-...`

### Claude (claude.js)
**Endpoint:** `https://api.anthropic.com/v1/messages`
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1500,
  "system": "You are a helpful, knowledgeable AI assistant.",
  "messages": [{ "role": "user", "content": "..." }]
}
```
**Models:** `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001`, `claude-opus-4-5`
**Key format:** `sk-ant-...`

### Ollama (ollama.js)
**Endpoint:** `http://localhost:11434/api/chat`
```json
{
  "model": "llama3",
  "messages": [
    { "role": "system", "content": "You are a helpful, knowledgeable AI assistant." },
    { "role": "user", "content": "..." }
  ],
  "stream": false
}
```
**Models:** `llama3`, `llama3.2`, `mistral`, `phi3`, `gemma2`, `codellama`, `deepseek-r1`, or any custom model

**CORS fix required for Ollama:**
```bash
setx OLLAMA_ORIGINS "*"
# Then restart Ollama
```

---

## Markdown & Code Rendering

AI responses parsed with **marked.js** + **highlight.js**.

```js
renderer.code = function(code, lang) { ... } // custom renderer in app.js
marked.setOptions({ breaks: true, gfm: true });
marked.use({ renderer });
bubble.innerHTML = marked.parse(content); // assistant messages only
```

User messages use `textContent` — no markdown, prevents XSS.

**Filename syntax in code fences:**
````
```python:main.py
def hello():
    print("Hello")
```
````

---

## Local Development

```bash
# Requires a local server — file:// causes CORS errors
npx serve .
# Then open: http://localhost:3000
```

---

## Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable production code |
| `ai-providers` | Backup of split provider JS files |
| `test` | General testing and experiments |

---

## Conventions

- **Separate files** — HTML, CSS, JS must stay in separate files
- **Provider files** — each AI provider has its own JS file
- **CSS variables** — all colors via `--variable`, never hardcoded
- **No external state** — no cookies, no backend, no database
- **API key security** — stored in `localStorage` only, never logged
- **Error messages** — always user-friendly, never raw API errors
- **Animations** — CSS-only where possible; subtle and purposeful
- **Comments** — every section in CSS and JS must have a labeled comment
- **Script order** — provider files must load before app.js in index.html

---

## Do Not

- Do not merge HTML, CSS, JS back into one file
- Do not merge provider files (openai.js, ollama.js, claude.js) back into app.js
- Do not add a backend or server-side component
- Do not add npm / package.json / build steps
- Do not change accent colors without updating all related `rgba()` values in `:root`
- Do not use `innerHTML` for user messages (XSS risk)
- Do not store API keys anywhere other than `localStorage`

---

## Built With

This project was built entirely using [Claude AI](https://claude.ai) by Anthropic.
