/* ============================================================
   AuraAI — claude.js
   Handles everything related to the Anthropic Claude API provider
   ============================================================ */

/* ── Model List ── */
const CLAUDE_MODELS = `
  <option value="claude-sonnet-4-20250514">claude-sonnet-4</option>
  <option value="claude-haiku-4-5-20251001">claude-haiku-4</option>
  <option value="claude-opus-4-5">claude-opus-4</option>`;


/* ── Key Management ── */

function initClaude() {
  saveClaudeBtn.addEventListener('click', saveClaudeKey);
  claudeKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveClaudeKey(); });
}

function saveClaudeKey() {
  const val = claudeKeyInput.value.trim();
  if (!val.startsWith('sk-ant-')) {
    claudeKeyInput.style.borderColor = 'var(--danger)';
    setTimeout(() => claudeKeyInput.style.borderColor = '', 1500);
    return;
  }
  claudeKey = val;
  localStorage.setItem('aura_claude_key', claudeKey);
  claudeBanner.classList.add('hidden');
  sendBtn.disabled = false;
  changeKeyBtn.style.display = 'inline-flex';
  setStatus('connected');
  setTimeout(() => setStatus('claude · ready'), 2000);
}

function resetClaudeKey() {
  claudeKey = '';
  localStorage.removeItem('aura_claude_key');
  claudeBanner.classList.remove('hidden');
  claudeKeyInput.value = '';
  changeKeyBtn.style.display = 'none';
  sendBtn.disabled = true;
  setStatus('no key', true);
  claudeKeyInput.focus();
}


/* ── Switch To Claude UI ── */

function switchToClaude() {
  // Hide other providers
  openAIBanner.classList.add('hidden');
  ollamaBanner.classList.add('hidden');
  ollamaInfo.classList.add('hidden');
  changeKeyBtn.style.display = 'none';

  // Style
  inputWrapper.className = 'input-wrapper focus-claude';
  sendBtn.className = 'send-btn-base claude-mode';
  modelSelect.innerHTML = CLAUDE_MODELS;

  if (claudeKey) {
    claudeBanner.classList.add('hidden');
    sendBtn.disabled = false;
    changeKeyBtn.style.display = 'inline-flex';
    setStatus('claude · ready');
  } else {
    claudeBanner.classList.remove('hidden');
    sendBtn.disabled = true;
    setStatus('no api key', true);
  }
}


/* ── API Call ── */

async function sendClaudeMessage(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: modelSelect.value,
      max_tokens: 1500,
      system: 'You are a helpful, knowledgeable AI assistant. Be concise and clear.',
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid Claude API key. Please reconnect.');
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
    throw new Error(data.error?.message || `Claude API error ${res.status}`);
  }

  return data.content[0].text;
}
