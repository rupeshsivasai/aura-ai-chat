# CLAUDE.md — AuraAI Project Guide

This file provides context and instructions for Claude AI when working on this codebase.

---

## Project Overview

**AuraAI** is an AI chat application built with vanilla HTML, CSS, and JavaScript. It supports both **OpenAI GPT** (cloud) and **Ollama** (local) as AI providers, with markdown rendering, syntax highlighting, and a typewriter effect.

- **Stack:** HTML5, CSS3, Vanilla JS, OpenAI API, Ollama API, marked.js, highlight.js
- **No build tools, no frameworks, no npm**
- **Built entirely with [Claude AI](https://claude.ai) by Anthropic**

---

## File Structure

```
aura-ai-chat/
├── index.html    — HTML structure only (no inline styles or scripts)
├── style.css     — All visual styles and CSS custom properties
├── app.js        — All JavaScript logic and API calls
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
  ├── header          — logo, provider tabs (OpenAI / Ollama), status dot
  ├── #openai-banner  — OpenAI API key input (hidden after key saved)
  ├── #ollama-banner  — Ollama host + model input
  ├── #ollama-info    — Quick-start tip bar for Ollama
  ├── #messages       — chat message list + empty state + suggestion chips
  └── #input-area     — textarea, model selector, send button, footer
```

### style.css
All CSS organized into 19 labeled sections:
```
1.  CSS Variables       — design tokens (:root)
2.  Reset & Base        — box-sizing, html/body
3.  App Layout          — #app flex container
4.  Header              — logo, tabs, status
5.  Provider Tabs       — OpenAI / Ollama switcher
6.  Status Indicator    — dot + pulse animation
7.  Banners             — API key / Ollama setup panels
8.  Ollama Info Bar     — quick-start hint
9.  Messages Area       — scroll container
10. Empty State         — centered welcome screen
11. Message Rows        — flex layout, animation
12. Provider Badge      — ⚡ OpenAI / 🦙 Ollama label
13. Message Bubbles     — user & assistant styles
14. Typing Indicator    — bouncing dots
15. Input Area          — textarea wrapper, send button
16. Markdown Styles     — p, ul, ol, h1-h3, table, blockquote
17. Code Blocks         — header, dots, lang label, line numbers
18. Message Actions     — hover copy button
19. Typewriter Cursor   — blinking ▋ cursor
```

### app.js
All JavaScript organized into 14 labeled sections:
```
1.  Markdown Renderer   — custom marked.js renderer for code blocks
2.  State               — provider, apiKey, ollamaHost, messages, isLoading
3.  DOM References      — all getElementById calls
4.  Model Options       — OpenAI and Ollama model lists
5.  Status Helper       — setStatus(text, offline)
6.  Provider Switching  — switchProvider('openai' | 'ollama')
7.  API Key Management  — save, reset OpenAI key; save Ollama config
8.  Input Helpers       — autoResize, useSuggestion, keydown handlers
9.  Message Rendering   — appendMessage(role, content, isError, prov)
10. Typewriter Effect   — typewrite(el, text, speed)
11. Typing Indicator    — appendTyping(), removeTyping()
12. Copy Code Block     — copyCode(btn, code)
13. Send Message        — sendMessage() — OpenAI + Ollama API calls
14. Init                — switchProvider(provider) on load
```

---

## State Variables

```js
let provider    // 'openai' | 'ollama' — stored in localStorage
let apiKey      // OpenAI API key — stored in localStorage as 'aura_openai_key'
let ollamaHost  // Ollama server URL — stored in localStorage as 'aura_ollama_host'
let ollamaModel // Ollama model name — stored in localStorage as 'aura_ollama_model'
let messages    // conversation history array [{ role, content }, ...]
let isLoading   // prevents double-sends while awaiting response
```

---

## CSS Design System

All colors use CSS custom properties defined in `:root`. **Never hardcode hex values** outside of `:root`.

| Variable | Value | Usage |
|----------|-------|-------|
| `--accent` | `#00c9a7` | Primary teal — OpenAI buttons, links, borders |
| `--ollama` | `#e8873a` | Orange — Ollama buttons, borders |
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

## Core Functions

| Function | Purpose |
|----------|---------|
| `switchProvider(p)` | Switch between `openai` and `ollama`, update UI accordingly |
| `setStatus(text, offline)` | Update header status dot and label |
| `resetKey()` | Clear saved OpenAI key and show banner again |
| `sendMessage()` | Validate → push to history → call API → render reply |
| `appendMessage(role, content, isError, prov)` | Create and insert a message bubble into the DOM |
| `typewrite(el, text, speed)` | Animate text letter-by-letter with markdown rendering |
| `appendTyping()` | Show animated bouncing dots while awaiting response |
| `removeTyping()` | Remove typing indicator before rendering reply |
| `copyCode(btn, code)` | Copy code block content to clipboard |
| `autoResize()` | Auto-grow textarea height as user types |
| `useSuggestion(el)` | Populate input from suggestion chip click |

---

## API Integration

### OpenAI
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
**Supported models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`

### Ollama
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
**Supported models:** `llama3`, `llama3.2`, `mistral`, `phi3`, `gemma2`, `codellama`, `deepseek-r1`, or any custom model

**CORS fix required for Ollama:**
```bash
setx OLLAMA_ORIGINS "*"
# Then restart Ollama
```

---

## Markdown & Code Rendering

AI responses are parsed with **marked.js** + **highlight.js**.

```js
// Custom renderer adds: header bar, macOS dots, language label,
// filename support, copy button, line numbers
renderer.code = function(code, lang) { ... }

marked.setOptions({ breaks: true, gfm: true });
marked.use({ renderer });

// Usage
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

## Deployment

Hosted on **Cloudflare Pages** (free static hosting).
- Connect GitHub repo → Cloudflare Pages
- Build command: *(empty)*
- Build output directory: `/`
- Auto-deploys on every `git push origin main`

---

## Conventions

- **Separate files** — HTML, CSS, JS must stay in separate files
- **CSS variables** — all colors via `--variable`, never hardcoded
- **No external state** — no cookies, no backend, no database
- **API key security** — stored in `localStorage` only, never logged or sent anywhere except to the respective AI provider
- **Error messages** — always user-friendly, never raw API errors shown to user
- **Animations** — CSS-only where possible; keep subtle and purposeful
- **Comments** — every section in CSS and JS must have a labeled comment

---

## Do Not

- Do not merge HTML, CSS, JS back into one file
- Do not add a backend or server-side component
- Do not add npm / package.json / build steps
- Do not change `--accent` (`#00c9a7`) or `--ollama` (`#e8873a`) without updating all related `rgba()` values in `:root`
- Do not use `innerHTML` for user-generated content (XSS risk) — only use it for AI responses after markdown parsing
- Do not store API keys anywhere other than `localStorage`

---

## Built With

This project was built entirely using [Claude AI](https://claude.ai) by Anthropic.
