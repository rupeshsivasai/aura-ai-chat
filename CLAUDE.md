# CLAUDE.md — AuraAI Project Guide

This file provides context and instructions for Claude AI when working on this codebase.

---

## Project Overview

**AuraAI** is a single-file AI chat application built with vanilla HTML, CSS, and JavaScript. It connects to the OpenAI Chat Completions API and renders responses with markdown support.

- **File:** `aura-ai-chat.html`
- **Stack:** HTML5, CSS3, Vanilla JS, OpenAI API, marked.js
- **No build tools, no frameworks, no npm**

---

## Architecture

Everything lives in one file: `aura-ai-chat.html`

```
aura-ai-chat.html
├── <head>        — meta, Google Fonts, marked.js CDN
├── <style>       — all CSS with CSS custom properties (variables)
├── <body>        — HTML structure
│   ├── header    — logo + status indicator
│   ├── #api-banner  — OpenAI key input (hidden after key saved)
│   ├── #messages    — chat message list + empty state
│   └── #input-area  — textarea, model selector, send button, footer
└── <script>      — all JavaScript logic
```

---

## Key JavaScript State

```js
let apiKey   // OpenAI API key, stored in localStorage as 'aura_openai_key'
let messages // conversation history array [{ role, content }, ...]
let isLoading // prevents double-sends while awaiting response
```

---

## CSS Design System

All colors use CSS custom properties defined in `:root`. **Never hardcode hex values** outside of `:root`.

| Variable | Value | Usage |
|----------|-------|-------|
| `--accent` | `#00c9a7` | Primary teal — buttons, links, borders |
| `--bg` | `#0a0a0f` | Page background |
| `--surface` | `#111118` | Card/panel background |
| `--text` | `#e8e6f0` | Primary text |
| `--text-dim` | `rgba(232,230,240,0.5)` | Secondary text |
| `--danger` | `#f06b6b` | Error states |
| `--success` | `#5ecfa0` | Status dot online |

**Fonts:**
- Display: `DM Serif Display` — logo and headings
- Body: `Instrument Sans` — UI text
- Mono: `DM Mono` — code, status, labels

---

## Core Functions

| Function | Purpose |
|----------|---------|
| `init()` | Check localStorage for saved API key on load |
| `setStatus(text, offline)` | Update header status dot and label |
| `sendMessage()` | Validate input → push to history → call OpenAI API → render reply |
| `appendMessage(role, content, isError)` | Create and insert a message bubble into the DOM |
| `appendTyping()` | Show animated typing indicator while awaiting response |
| `removeTyping()` | Remove typing indicator before rendering reply |
| `autoResize()` | Auto-grow textarea height as user types |
| `useSuggestion(el)` | Populate input from suggestion chip click |

---

## API Integration

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Request shape:**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are a helpful, knowledgeable AI assistant. Be concise and clear." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "max_tokens": 1500,
  "temperature": 0.7
}
```

**Supported models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`

---

## Markdown Rendering

AI responses are parsed with **marked.js** (loaded from cdnjs CDN).

```js
marked.setOptions({ breaks: true, gfm: true });
bubble.innerHTML = marked.parse(content); // assistant only
```

User messages use `textContent` (no markdown, prevents XSS).

Styled markdown elements: `p`, `ul`, `ol`, `li`, `h1–h3`, `code`, `pre`, `blockquote`, `table`, `a`, `hr`, `strong`

---

## Local Development

```bash
# Must run via local server — file:// causes CORS errors with OpenAI API
python -m http.server 8080
# Then open: http://localhost:8080/aura-ai-chat.html
```

---

## Conventions

- **Single file** — keep all HTML, CSS, JS in `aura-ai-chat.html`
- **CSS variables** — all colors via `--variable`, never hardcoded
- **No external state** — no cookies, no backend, no database
- **API key security** — stored in `localStorage` only, never logged or sent anywhere except OpenAI
- **Error messages** — always user-friendly, never raw API errors shown to user
- **Animations** — CSS-only where possible; keep subtle and purposeful

---

## Do Not

- Do not add a backend or server-side component
- Do not add npm / package.json / build steps
- Do not change the teal accent color `#00c9a7` without updating all related rgba values in `:root`
- Do not use `innerHTML` for user-generated content (XSS risk) — only use it for AI responses after markdown parsing
- Do not store the API key anywhere other than `localStorage`

---

## Built With

This project was built entirely using [Claude AI](https://claude.ai) by Anthropic.
