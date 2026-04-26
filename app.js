/* ============================================================
   AuraAI — app.js
   All JavaScript logic for the chat app
   ============================================================ */

/* ── 1. Markdown Renderer (marked.js + highlight.js) ── */

const renderer = new marked.Renderer();

// Custom code block renderer — adds header, line numbers, copy button
renderer.code = function(code, lang) {
  // Newer versions of marked pass an object instead of (code, lang)
  if (typeof code === 'object' && code !== null) {
    lang = code.lang || '';
    code = code.text || '';
  }
  lang = (lang || '').trim().toLowerCase();

  // Support filename syntax: ```python:main.py
  let filename = '';
  const colonIdx = lang.indexOf(':');
  if (colonIdx !== -1) {
    filename = lang.slice(colonIdx + 1);
    lang = lang.slice(0, colonIdx);
  }

  // Syntax highlight with highlight.js
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

  // Build line number HTML
  const lines   = code.split('\n');
  const lineNums = lines.map((_, i) => `<span>${i + 1}</span>`).join('');

  // Escape backticks and $ for safe inline onclick
  const escapedCode = code.replace(/`/g, '\`').replace(/\$/g, '\$');

  return `
    <div class="code-block">
      <div class="code-header">
        <div class="code-header-left">
          <div class="code-dots"><span></span><span></span><span></span></div>
          ${lang     ? `<span class="code-lang">${lang}</span>` : ''}
          ${filename ? `<span class="code-filename">📄 ${filename}</span>` : ''}
        </div>
        <button class="copy-btn" onclick="copyCode(this, \`${escapedCode}\`)">
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


/* ── 2. State ── */

let provider    = localStorage.getItem('aura_provider')     || 'openai';
let apiKey      = localStorage.getItem('aura_openai_key')   || '';
let ollamaHost  = localStorage.getItem('aura_ollama_host')  || 'http://localhost:11434';
let ollamaModel = localStorage.getItem('aura_ollama_model') || '';
let messages    = [];   // conversation history [{role, content}, ...]
let isLoading   = false;


/* ── 3. DOM References ── */

const $ = id => document.getElementById(id);

const apiKeyInput   = $('api-key-input');
const saveKeyBtn    = $('save-key-btn');
const openAIBanner  = $('openai-banner');
const ollamaBanner  = $('ollama-banner');
const ollamaInfo    = $('ollama-info');
const ollamaHostIn  = $('ollama-host-input');
const ollamaModelIn = $('ollama-model-input');
const saveOllamaBtn = $('save-ollama-btn');
const messagesEl    = $('messages');
const emptyState    = $('empty-state');
const userInput     = $('user-input');
const sendBtn       = $('send-btn');
const modelSelect   = $('model-select');
const statusDot     = $('status-dot');
const statusText    = $('status-text');
const clearBtn      = $('clear-btn');
const inputWrapper  = $('input-wrapper');
const changeKeyBtn  = $('change-key-btn');


/* ── 4. Model Options ── */

const OPENAI_MODELS = `
  <option value="gpt-4o">gpt-4o</option>
  <option value="gpt-4o-mini">gpt-4o-mini</option>
  <option value="gpt-4-turbo">gpt-4-turbo</option>
  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>`;

const OLLAMA_MODELS = `
  <option value="llama3">llama3</option>
  <option value="llama3.2">llama3.2</option>
  <option value="mistral">mistral</option>
  <option value="phi3">phi3</option>
  <option value="gemma2">gemma2</option>
  <option value="codellama">codellama</option>
  <option value="deepseek-r1">deepseek-r1</option>
  <option value="custom">custom…</option>`;


/* ── 5. Status Helper ── */

function setStatus(text, offline = false) {
  statusText.textContent = text;
  statusDot.className = 'status-dot' + (offline ? ' offline' : '');
}


/* ── 6. Provider Switching ── */

function switchProvider(p) {
  provider = p;
  localStorage.setItem('aura_provider', p);

  // Update tab buttons
  $('tab-openai').className = 'tab-btn' + (p === 'openai' ? ' active-openai' : '');
  $('tab-ollama').className  = 'tab-btn' + (p === 'ollama'  ? ' active-ollama'  : '');

  if (p === 'openai') {
    // Hide Ollama UI
    ollamaBanner.classList.add('hidden');
    ollamaInfo.classList.add('hidden');
    inputWrapper.className = 'input-wrapper focus-openai';
    sendBtn.classList.remove('ollama-mode');
    modelSelect.innerHTML = OPENAI_MODELS;

    if (apiKey) {
      openAIBanner.classList.add('hidden');
      sendBtn.disabled = false;
      changeKeyBtn.style.display = 'inline-flex';
      setStatus('openai · ready');
    } else {
      openAIBanner.classList.remove('hidden');
      sendBtn.disabled = true;
      changeKeyBtn.style.display = 'none';
      setStatus('no api key', true);
    }

  } else {
    // Hide OpenAI UI
    openAIBanner.classList.add('hidden');
    changeKeyBtn.style.display = 'none';
    ollamaInfo.classList.remove('hidden');
    inputWrapper.className = 'input-wrapper focus-ollama';
    sendBtn.classList.add('ollama-mode');
    modelSelect.innerHTML = OLLAMA_MODELS;
    ollamaHostIn.value  = ollamaHost;
    ollamaModelIn.value = ollamaModel;

    if (ollamaModel) {
      // Add saved model to dropdown if not present
      const opt = [...modelSelect.options].find(o => o.value === ollamaModel);
      if (!opt) {
        const o = document.createElement('option');
        o.value = ollamaModel; o.textContent = ollamaModel;
        modelSelect.insertBefore(o, modelSelect.firstChild);
      }
      modelSelect.value = ollamaModel;
      ollamaBanner.classList.add('hidden');
      sendBtn.disabled = false;
      setStatus(`ollama · ${ollamaModel}`);
    } else {
      ollamaBanner.classList.remove('hidden');
      sendBtn.disabled = true;
      setStatus('ollama · not set', true);
    }
  }
}


/* ── 7. API Key Management ── */

// Save OpenAI key
saveKeyBtn.addEventListener('click', () => {
  const val = apiKeyInput.value.trim();
  if (!val.startsWith('sk-')) {
    apiKeyInput.style.borderColor = 'var(--danger)';
    setTimeout(() => apiKeyInput.style.borderColor = '', 1500);
    return;
  }
  apiKey = val;
  localStorage.setItem('aura_openai_key', apiKey);
  openAIBanner.classList.add('hidden');
  sendBtn.disabled = false;
  changeKeyBtn.style.display = 'inline-flex';
  setStatus('connected');
  setTimeout(() => setStatus('openai · ready'), 2000);
});

apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKeyBtn.click(); });

// Reset / change OpenAI key
function resetKey() {
  apiKey = '';
  localStorage.removeItem('aura_openai_key');
  openAIBanner.classList.remove('hidden');
  apiKeyInput.value = '';
  changeKeyBtn.style.display = 'none';
  sendBtn.disabled = true;
  setStatus('no key', true);
  apiKeyInput.focus();
}

// Save Ollama config
saveOllamaBtn.addEventListener('click', () => {
  const host  = ollamaHostIn.value.trim() || 'http://localhost:11434';
  const model = ollamaModelIn.value.trim() || modelSelect.value;

  if (!model || model === 'custom') {
    ollamaModelIn.style.borderColor = 'var(--danger)';
    setTimeout(() => ollamaModelIn.style.borderColor = '', 1500);
    return;
  }

  ollamaHost  = host;
  ollamaModel = model;
  localStorage.setItem('aura_ollama_host',  ollamaHost);
  localStorage.setItem('aura_ollama_model', ollamaModel);
  ollamaBanner.classList.add('hidden');
  sendBtn.disabled = false;

  // Add to dropdown if not already there
  const opt = [...modelSelect.options].find(o => o.value === model);
  if (!opt) {
    const o = document.createElement('option');
    o.value = model; o.textContent = model;
    modelSelect.insertBefore(o, modelSelect.firstChild);
  }
  modelSelect.value = model;
  setStatus(`ollama · ${ollamaModel}`);
});

ollamaModelIn.addEventListener('keydown', e => { if (e.key === 'Enter') saveOllamaBtn.click(); });

// Switch model from dropdown
modelSelect.addEventListener('change', () => {
  if (provider === 'ollama') {
    if (modelSelect.value === 'custom') {
      ollamaBanner.classList.remove('hidden');
      ollamaModelIn.focus();
    } else {
      ollamaModel = modelSelect.value;
      localStorage.setItem('aura_ollama_model', ollamaModel);
      setStatus(`ollama · ${ollamaModel}`);
    }
  }
});


/* ── 8. Input Helpers ── */

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


/* ── 9. Message Rendering ── */

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, content, isError = false, prov = provider) {
  emptyState.classList.add('hidden');

  // Row
  const row = document.createElement('div');
  row.className = `msg-row ${role}${prov === 'ollama' && role === 'assistant' ? ' ollama-msg' : ''}`;

  // Avatar
  const av = document.createElement('div');
  av.className = 'avatar';
  av.textContent = role === 'user' ? 'U' : '✦';

  // Content wrapper
  const mc = document.createElement('div');
  mc.className = 'msg-content';

  // Provider badge (AI messages only)
  if (role === 'assistant' && !isError) {
    const badge = document.createElement('div');
    badge.className = `provider-badge ${prov}`;
    const model = prov === 'openai' ? modelSelect.value : (ollamaModel || modelSelect.value);
    badge.textContent = prov === 'openai' ? `⚡ ${model}` : `🦙 ${model}`;
    mc.appendChild(badge);
  }

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble' + (isError ? ' error' : '');

  // Timestamp
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = formatTime();

  mc.appendChild(bubble);

  // Hover copy button (AI messages only)
  if (role === 'assistant' && !isError) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-action-btn';
    copyBtn.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
        <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
      </svg> Copy`;

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
          </svg> Copied!`;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
              <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
            </svg> Copy`;
        }, 2000);
      });
    };

    actions.appendChild(copyBtn);
    mc.appendChild(actions);
  }

  mc.appendChild(meta);
  row.appendChild(av);
  row.appendChild(mc);
  messagesEl.appendChild(row);

  // Render content
  if (role === 'assistant' && !isError) {
    typewrite(bubble, content);
  } else {
    bubble.textContent = content;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}


/* ── 10. Typewriter Effect ── */

function typewrite(el, text, speed = 14) {
  let i = 0;
  el.innerHTML = '';
  el.classList.add('typing-cursor');

  function tick() {
    if (i < text.length) {
      i++;
      // Render partial markdown as text accumulates
      el.innerHTML = marked.parse(text.slice(0, i));
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Natural pause at punctuation
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


/* ── 11. Typing Indicator ── */

function appendTyping() {
  emptyState.classList.add('hidden');
  const row = document.createElement('div');
  row.className = 'msg-row assistant';
  row.id = 'typing-row';

  const av  = document.createElement('div');
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


/* ── 12. Copy Code Block ── */

function copyCode(btn, code) {
  navigator.clipboard.writeText(code).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
      </svg> Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z"/>
          <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2H9v1H3V7h1V5H2z"/>
        </svg> Copy`;
    }, 2000);
  });
}


/* ── 13. Send Message (API Call) ── */

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

    if (currentProvider === 'openai') {
      /* --- OpenAI API --- */
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelSelect.value,
          messages: [
            { role: 'system', content: 'You are a helpful, knowledgeable AI assistant. Be concise and clear.' },
            ...messages
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`);
      reply = data.choices[0].message.content;

    } else {
      /* --- Ollama API --- */
      const model = ollamaModel || modelSelect.value;
      const res = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful, knowledgeable AI assistant. Be concise and clear.' },
            ...messages
          ],
          stream: false
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Ollama error ${res.status}`);
      reply = data.message?.content || data.response || '';
    }

    messages.push({ role: 'assistant', content: reply });
    removeTyping();
    appendMessage('assistant', reply, false, currentProvider);
    setStatus(currentProvider === 'openai' ? 'openai · ready' : 'ollama · ready');

  } catch (err) {
    removeTyping();
    let msg = `Error: ${err.message}`;

    if (provider === 'openai') {
      if (err.message.includes('401'))  msg = 'Invalid API key. Please reconnect.';
      else if (err.message.includes('429')) msg = 'Rate limit reached. Please wait a moment.';
    } else {
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        msg = 'Cannot reach Ollama. Is it running?\n\nFix CORS: setx OLLAMA_ORIGINS "*"\nThen restart Ollama.';
      }
    }

    appendMessage('assistant', msg, true);
    setStatus('error', true);
    setTimeout(() => setStatus(provider === 'openai' ? 'openai · ready' : 'ollama · ready'), 4000);

  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}


/* ── 14. Init ── */
switchProvider(provider);
