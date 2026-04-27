# AuraAI — Intelligent Chat Assistant

> A sleek, dark-themed AI chat app powered by OpenAI GPT, Anthropic Claude, and Ollama. Built with vanilla HTML, CSS & JavaScript — no frameworks, no build step. Created with [Claude AI](https://claude.ai).

<p align="center">
  ![AuraAI](https://img.shields.io/badge/Built%20with-Claude%20AI-00c9a7?style=flat-square)
  ![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI%20GPT-412991?style=flat-square)
  ![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-e8873a?style=flat-square)
  ![Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-d97757?style=flat-square)
  ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
</p>

---

## Features

- **Multi-provider support** — switch between OpenAI, Ollama, and Claude
- **Provider-specific models**:
  - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
  - Ollama: `llama3`, `llama3.2`, `mistral`, `phi3`, `gemma2`, `codellama`, `deepseek-r1`, and custom models
  - Claude: `claude-sonnet-4`, `claude-haiku-4`, `claude-opus-4`
- **Markdown rendering** — AI responses render with full markdown: code blocks, tables, lists, headings, and more
- **Syntax highlighting** — powered by `highlight.js`
- **Conversation history** — full context sent with every message for coherent multi-turn chat
- **Persistent storage** — API keys and configurations saved in `localStorage`
- **Typing indicator** — animated dots while waiting for a response
- **Suggestion chips** — quick-start prompts on the empty state
- **Clear chat** — reset the conversation any time
- **Error handling** — friendly messages for invalid keys, rate limits, and API failures
- **Zero dependencies** — no npm, no build tools

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
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension → right-click `index.html` → **Open with Live Server**

### 3. Open in browser

```
http://localhost:8080/index.html
```

### 4. Add your API key

Paste your OpenAI, Claude, or Ollama key in the respective banner and click **Connect**. Get an OpenAI key at [platform.openai.com](https://platform.openai.com/api-keys).

---

## File Structure

```
aura-ai-chat/
├── index.html    # HTML structure
├── style.css     # Visual styles
├── app.js        # Main orchestrator (UI, state, rendering, routing)
├── openai.js     # OpenAI provider logic
├── ollama.js     # Ollama provider logic
├── claude.js     # Claude provider logic
├── README.md     # Project documentation
├── LICENSE       # MIT License
```

---

## How It Works

1. User types a message and hits Enter
2. The message is added to a local conversation history array
3. The full history is sent to the selected provider's API endpoint
4. The response is rendered with `marked.js` for markdown support and `highlight.js` for syntax highlighting
5. Both the user message and AI reply are stored for the next turn

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | HTML5, CSS3, Vanilla JS |
| AI API | OpenAI, Anthropic Claude, Ollama |
| Markdown | marked.js (via CDN) |
| Syntax Highlighting | highlight.js (via CDN) |
| Fonts | DM Serif Display, Instrument Sans, DM Mono |
| Built with | [Claude AI](https://claude.ai) |

---

## Models

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| Ollama | `llama3`, `llama3.2`, `mistral`, `phi3`, `gemma2`, `codellama`, `deepseek-r1`, custom |
| Claude | `claude-sonnet-4`, `claude-haiku-4`, `claude-opus-4` |

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using <a href="https://claude.ai">Claude AI</a></p>
