# AuraAI — Intelligent Chat Assistant

> A sleek, dark-themed AI chat app powered by OpenAI GPT. Built with vanilla HTML, CSS & JavaScript — no frameworks, no build step. Created with [Claude AI](https://claude.ai).

![AuraAI](https://img.shields.io/badge/Built%20with-Claude%20AI-00c9a7?style=flat-square) ![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI%20GPT-412991?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Features

- **Multi-model support** — switch between `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, and `gpt-3.5-turbo`
- **Markdown rendering** — AI responses render with full markdown: code blocks, tables, lists, headings, and more
- **Conversation history** — full context sent with every message for coherent multi-turn chat
- **Persistent API key** — your OpenAI key is saved in `localStorage` so you don't re-enter it every time
- **Typing indicator** — animated dots while waiting for a response
- **Suggestion chips** — quick-start prompts on the empty state
- **Clear chat** — reset the conversation any time
- **Error handling** — friendly messages for invalid keys, rate limits, and API failures
- **Zero dependencies** — single HTML file, no npm, no build tools

---

## Preview

```
┌─────────────────────────────────────┐
│  ◈ AuraAI                   ● ready │
├─────────────────────────────────────┤
│                                     │
│   ✦ What can I help with?           │
│                                     │
│  [Explain quantum computing]        │
│  [Write a Python function]          │
│                                     │
├─────────────────────────────────────┤
│  Type a message...     gpt-4o  [▶]  │
│  Enter to send · Shift+Enter newline│
└─────────────────────────────────────┘
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/aura-ai-chat.git
cd aura-ai-chat
```

### 2. Run a local server

Opening the file directly (`file://`) will cause a CORS error. Use a local server instead:

**Python (recommended — no install needed):**
```bash
python -m http.server 8080
```

**Node.js:**
```bash
npx serve .
```

**VS Code:**
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension → right-click `aura-ai-chat.html` → **Open with Live Server**

### 3. Open in browser

```
http://localhost:8080/aura-ai-chat.html
```

### 4. Add your OpenAI API key

Paste your key (starts with `sk-`) in the banner and click **Connect**. Get a key at [platform.openai.com](https://platform.openai.com/api-keys).

---

## File Structure

```
aura-ai-chat/
├── aura-ai-chat.html   # The entire app — HTML, CSS, and JS in one file
└── README.md           # This file
```

---

## How It Works

1. User types a message and hits Enter
2. The message is added to a local conversation history array
3. The full history is sent to the OpenAI `/v1/chat/completions` endpoint
4. The response is rendered with [marked.js](https://marked.js.org/) for markdown support
5. Both the user message and AI reply are stored for the next turn

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | HTML5, CSS3, Vanilla JS |
| AI API | OpenAI Chat Completions |
| Markdown | marked.js (via CDN) |
| Fonts | DM Serif Display, Instrument Sans, DM Mono |
| Built with | [Claude AI](https://claude.ai) |

---

## Models

| Model | Best for |
|-------|---------|
| `gpt-4o` | Best quality, multimodal |
| `gpt-4o-mini` | Fast & cost-effective |
| `gpt-4-turbo` | Long context tasks |
| `gpt-3.5-turbo` | Fastest, lowest cost |

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using <a href="https://claude.ai">Claude AI</a></p>
