/* ============================================================
   AuraAI — ollama.js
   Handles everything related to the Ollama local AI provider
   ============================================================ */

/* ── Model List ── */
const OLLAMA_MODELS = `
  <option value="llama3">llama3</option>
  <option value="llama3.2">llama3.2</option>
  <option value="mistral">mistral</option>
  <option value="phi3">phi3</option>
  <option value="gemma2">gemma2</option>
  <option value="codellama">codellama</option>
  <option value="deepseek-r1">deepseek-r1</option>
  <option value="custom">custom…</option>`;


/* ── Config Management ── */

function initOllama() {
  saveOllamaBtn.addEventListener('click', saveOllamaConfig);
  ollamaModelIn.addEventListener('keydown', e => { if (e.key === 'Enter') saveOllamaConfig(); });

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
}

function saveOllamaConfig() {
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
}


/* ── Switch To Ollama UI ── */

function switchToOllama() {
  // Hide other providers
  openAIBanner.classList.add('hidden');
  claudeBanner.classList.add('hidden');
  changeKeyBtn.style.display = 'none';

  // Show Ollama tip bar
  ollamaInfo.classList.remove('hidden');

  // Style
  inputWrapper.className = 'input-wrapper focus-ollama';
  sendBtn.className = 'send-btn-base ollama-mode';
  modelSelect.innerHTML = OLLAMA_MODELS;
  ollamaHostIn.value  = ollamaHost;
  ollamaModelIn.value = ollamaModel;

  if (ollamaModel) {
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


/* ── API Call ── */

async function sendOllamaMessage(messages) {
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

  // Check for connection error
  if (!data.message?.content && !data.response) {
    throw new Error('Cannot reach Ollama. Is it running?\n\nFix CORS:\nsetx OLLAMA_ORIGINS "*"\nThen restart Ollama.');
  }

  return data.message?.content || data.response || '';
}
