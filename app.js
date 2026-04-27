/* ============================================================
   AuraAI — app.js
   Main orchestrator — UI, state, rendering, and routing
   Provider logic is in: openai.js | ollama.js | claude.js
   ============================================================ */


/* ── 1. Markdown Renderer (marked.js + highlight.js) ── */

const renderer = new marked.Renderer();

renderer.code = function(code, lang) {
  if (typeof code === 'object' && code !== null) {
    lang = code.lang || '';
    code = code.text || '';
  }
  lang = (lang || '').trim().toLowerCase();

  // Support filename: ```python:main.py
  let filename = '';
  const colonIdx = lang.indexOf(':');
  if (colonIdx !== -1) {
    filename = lang.slice(colonIdx + 1);
    lang = lang.slice(0, colonIdx);
  }

  // Syntax highlight
  let highlighted = '';
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
      if (!lang) lang = 'code';
    }
  } catch (e) {
    highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const lines    = code.split('\n');
  const lineNums = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
  const escaped  = code.replace(/`/g, '\`').replace(/\$/g, '\$');

  return `
    <div class="code-block">
      <div class="code-header">
        <div class="code-header-left">
          <div class="code-dots"><span></span><span></span><span></span></div>
          ${lang     ? `<span class="code-lang">${lang}</span>` : ''}
          ${filename ? `<span class="code-filename">📄 ${filename}</span>` : ''}
        </div>
        <button class="copy-btn" onclick="copyCode(this, \`${escaped}\`)">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
            <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
          </svg>
          Copy
        </button>
      </div>
      <div class="code-with-lines">
        <div class="line-numbers">${lineNums}</div>
        <div class="code-body">
          <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
        </div>
      </div>
    </div>`;
};

marked.setOptions({ breaks: true, gfm: true });
marked.use({ renderer });


/* ── 2. Global State ── */

let provider    = localStorage.getItem('aura_provider')     || 'openai';
let apiKey      = localStorage.getItem('aura_openai_key')   || '';   // used by openai.js
let claudeKey   = localStorage.getItem('aura_claude_key')   || '';   // used by claude.js
let ollamaHost  = localStorage.getItem('aura_ollama_host')  || 'http://localhost:11434'; // used by ollama.js
let ollamaModel = localStorage.getItem('aura_ollama_model') || '';   // used by ollama.js
let messages    = [];     // shared conversation history [{role, content}, ...]
let isLoading   = false;  // prevents double-sends


/* ── 3. DOM References ── */

const $ = id => document.getElementById(id);

// Shared
const messagesEl   = $('messages');
const emptyState   = $('empty-state');
const userInput    = $('user-input');
const sendBtn      = $('send-btn');
const modelSelect  = $('model-select');
const statusDot    = $('status-dot');
const statusText   = $('status-text');
const clearBtn     = $('clear-btn');
const inputWrapper = $('input-wrapper');
const changeKeyBtn = $('change-key-btn');

// OpenAI
const openAIBanner = $('openai-banner');
const apiKeyInput  = $('api-key-input');
const saveKeyBtn   = $('save-key-btn');

// Ollama
const ollamaBanner  = $('ollama-banner');
const ollamaInfo    = $('ollama-info');
const ollamaHostIn  = $('ollama-host-input');
const ollamaModelIn = $('ollama-model-input');
const saveOllamaBtn = $('save-ollama-btn');

// Claude
const claudeBanner   = $('claude-banner');
const claudeKeyInput = $('claude-key-input');
const saveClaudeBtn  = $('save-claude-btn');


/* ── 4. Status Helper ── */

function setStatus(text, offline = false) {
  statusText.textContent = text;
  statusDot.className = 'status-dot' + (offline ? ' offline' : '');
}


/* ── 5. Provider Switching ── */

function switchProvider(p) {
  provider = p;
  localStorage.setItem('aura_provider', p);

  // Update tab highlights
  $('tab-openai').className = 'tab-btn' + (p === 'openai' ? ' active-openai' : '');
  $('tab-ollama').className = 'tab-btn' + (p === 'ollama'  ? ' active-ollama'  : '');
  $('tab-claude').className = 'tab-btn' + (p === 'claude'  ? ' active-claude'  : '');

  // Delegate to each provider's switch function
  if      (p === 'openai') switchToOpenAI();  // → openai.js
  else if (p === 'ollama') switchToOllama();  // → ollama.js
  else                     switchToClaude();  // → claude.js
}


/* ── 6. Reset Key (change key button) ── */

function resetKey() {
  if      (provider === 'openai') resetOpenAIKey(); // → openai.js
  else if (provider === 'claude') resetClaudeKey(); // → claude.js
}


/* ── 7. Input Helpers ── */

function autoResize() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

function useSuggestion(el) {
  userInput.value = el.textContent;
  autoResize();
  userInput.focus();
}

userInput.addEventListener('input', autoResize);

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

clearBtn.addEventListener('click', () => {
  messages = [];
  messagesEl.querySelectorAll('.msg-row').forEach(r => r.remove());
  emptyState.classList.remove('hidden');
});


/* ── 8. Message Rendering ── */

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, content, isError = false, prov = provider) {
  emptyState.classList.add('hidden');

  const row = document.createElement('div');
  row.className = `msg-row ${role}${prov === 'ollama' && role === 'assistant' ? ' ollama-msg' : ''}`;

  const av = document.createElement('div');
  av.className = 'avatar';
  av.textContent = role === 'user' ? 'U' : '✦';

  const mc = document.createElement('div');
  mc.className = 'msg-content';

  // Provider badge on AI messages
  if (role === 'assistant' && !isError) {
    const badge = document.createElement('div');
    badge.className = `provider-badge ${prov}`;
    const icon = prov === 'openai' ? '⚡' : prov === 'claude' ? '🤖' : '🦙';
    badge.textContent = `${icon} ${modelSelect.value}`;
    mc.appendChild(badge);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (isError ? ' error' : '');

  // Hover copy button on AI messages
  if (role === 'assistant' && !isError) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-action-btn';
    copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
      <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
    </svg> Copy`;

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
        </svg> Copied!`;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
            <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
          </svg> Copy`;
        }, 2000);
      });
    };

    actions.appendChild(copyBtn);
    mc.appendChild(actions);
  }

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = formatTime();

  mc.appendChild(bubble);
  mc.appendChild(meta);
  row.appendChild(av);
  row.appendChild(mc);
  messagesEl.appendChild(row);

  if (role === 'assistant' && !isError) {
    typewrite(bubble, content);
  } else {
    bubble.textContent = content;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}


/* ── 9. Typewriter Effect ── */

function typewrite(el, text, speed = 14) {
  let i = 0;
  el.innerHTML = '';
  el.classList.add('typing-cursor');

  function tick() {
    if (i < text.length) {
      i++;
      el.innerHTML = marked.parse(text.slice(0, i));
      messagesEl.scrollTop = messagesEl.scrollHeight;
      const ch = text[i - 1];
      const delay = (ch === '.' || ch === '!' || ch === '?') ? speed * 5
                  : ch === ','  ? speed * 3
                  : ch === '\n' ? speed * 4
                  : speed;
      setTimeout(tick, delay);
    } else {
      el.classList.remove('typing-cursor');
    }
  }
  tick();
}


/* ── 10. Typing Indicator ── */

function appendTyping() {
  emptyState.classList.add('hidden');
  const row = document.createElement('div');
  row.className = 'msg-row assistant';
  row.id = 'typing-row';

  const av = document.createElement('div');
  av.className = 'avatar';
  av.textContent = '✦';

  const bub = document.createElement('div');
  bub.className = 'typing-bubble';
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('div');
    d.className = 'typing-dot';
    bub.appendChild(d);
  }

  row.appendChild(av);
  row.appendChild(bub);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const r = $('typing-row');
  if (r) r.remove();
}


/* ── 11. Copy Code Block ── */

function copyCode(btn, code) {
  navigator.clipboard.writeText(code).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
    </svg> Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
        <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
      </svg> Copy`;
    }, 2000);
  });
}


/* ── 12. Send Message — Routes to correct provider ── */

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  userInput.value = '';
  autoResize();
  isLoading = true;
  sendBtn.disabled = true;
  setStatus('thinking…');

  messages.push({ role: 'user', content: text });
  appendMessage('user', text);
  appendTyping();

  try {
    let reply = '';
    const currentProvider = provider;

    // ── Route to correct provider ──
    if      (currentProvider === 'openai') reply = await sendOpenAIMessage(messages); // → openai.js
    else if (currentProvider === 'claude') reply = await sendClaudeMessage(messages); // → claude.js
    else                                   reply = await sendOllamaMessage(messages); // → ollama.js

    messages.push({ role: 'assistant', content: reply });
    removeTyping();
    appendMessage('assistant', reply, false, currentProvider);

    const readyLabel = { openai: 'openai · ready', claude: 'claude · ready', ollama: 'ollama · ready' };
    setStatus(readyLabel[currentProvider] || 'ready');

  } catch (err) {
    removeTyping();
    appendMessage('assistant', err.message, true);
    setStatus('error', true);

    const readyLabel = { openai: 'openai · ready', claude: 'claude · ready', ollama: 'ollama · ready' };
    setTimeout(() => setStatus(readyLabel[provider] || 'ready'), 4000);

  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}


/* ── 13. Init ── */

initOpenAI();  // → openai.js  sets up key listeners
initOllama();  // → ollama.js  sets up host/model listeners
initClaude();  // → claude.js  sets up key listeners

switchProvider(provider); // restore last used provider
