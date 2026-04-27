/* ============================================================
   AuraAI — openai.js
   Handles everything related to the OpenAI API provider
   ============================================================ */

/* ── Model List ── */
const OPENAI_MODELS = `
  <option value="gpt-4o">gpt-4o</option>
  <option value="gpt-4o-mini">gpt-4o-mini</option>
  <option value="gpt-4-turbo">gpt-4-turbo</option>
  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>`;


/* ── Key Management ── */

function initOpenAI() {
  saveKeyBtn.addEventListener('click', saveOpenAIKey);
  apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveOpenAIKey(); });
}

function saveOpenAIKey() {
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
}

function resetOpenAIKey() {
  apiKey = '';
  localStorage.removeItem('aura_openai_key');
  openAIBanner.classList.remove('hidden');
  apiKeyInput.value = '';
  changeKeyBtn.style.display = 'none';
  sendBtn.disabled = true;
  setStatus('no key', true);
  apiKeyInput.focus();
}


/* ── Switch To OpenAI UI ── */

function switchToOpenAI() {
  // Hide other providers
  ollamaBanner.classList.add('hidden');
  ollamaInfo.classList.add('hidden');
  claudeBanner.classList.add('hidden');

  // Style
  inputWrapper.className = 'input-wrapper focus-openai';
  sendBtn.className = 'send-btn-base';
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
}


/* ── API Call ── */

async function sendOpenAIMessage(messages) {
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
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key. Please reconnect.');
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
    throw new Error(data.error?.message || `OpenAI API error ${res.status}`);
  }

  return data.choices[0].message.content;
}
