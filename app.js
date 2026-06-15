// --- DYNAMIC SCRIPT LOADERS (Performance Optimization) ---
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

function ensureJsPDFLoaded() {
  if (window.jspdf) return Promise.resolve();
  return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
}

function ensurePuterLoaded() {
  if (window.puter) return Promise.resolve();
  return loadScript("https://js.puter.com/v2/");
}

// --- SONIC CHATBOT ENGINE ---
let chatSessionHistory = [];
let hasChatHistory = false;

window.addEventListener('beforeunload', (e) => {
  if (hasChatHistory) {
    e.preventDefault();
    e.returnValue = 'Refreshing the page will clear your conversation history. Are you sure you want to refresh?';
    return e.returnValue;
  }
});

function cleanLaTeX(text) {
  if (!text) return '';
  let cleaned = text;

  // Replace block math wrappers
  cleaned = cleaned.replace(/\\\[\s*/g, '\n').replace(/\s*\\\]/g, '\n');
  // Replace inline math wrappers
  cleaned = cleaned.replace(/\\\(\s*/g, ' ').replace(/\s*\\\)/g, ' ');
  // Replace LaTeX subscripts like _{\text{net}} -> _net
  cleaned = cleaned.replace(/_\{?\\text\{\s*(.*?)\s*\}\}?/g, '_$1');
  cleaned = cleaned.replace(/_\{\s*(.*?)\s*\}/g, '_$1');
  
  // Clean common LaTeX commands
  cleaned = cleaned.replace(/\\Sigma/g, 'Î£')
                   .replace(/\\theta/g, 'Î¸')
                   .replace(/\\pi/g, 'Ï€')
                   .replace(/\\alpha/g, 'Î±')
                   .replace(/\\beta/g, 'Î²')
                   .replace(/\\gamma/g, 'Î³')
                   .replace(/\\delta/g, 'Î´')
                   .replace(/\\lambda/g, 'Î»')
                   .replace(/\\mu/g, 'Î¼')
                   .replace(/\\infty/g, 'âˆž')
                   .replace(/\\times/g, 'Ã—')
                   .replace(/\\div/g, 'Ã·')
                   .replace(/\\pm/g, 'Â±')
                   .replace(/\\neq/g, 'â‰ ')
                   .replace(/\\leq/g, 'â‰¤')
                   .replace(/\\geq/g, 'â‰¥')
                   .replace(/\\approx/g, 'â‰ˆ')
                   .replace(/\\rightarrow/g, 'â†’')
                   .replace(/\\Rightarrow/g, 'â‡’')
                   .replace(/\\leftarrow/g, 'â†')
                   .replace(/\\Leftarrow/g, 'â‡')
                   .replace(/\\leftrightarrow/g, 'â†”')
                   .replace(/\\Leftrightarrow/g, 'â‡”')
                   .replace(/\\cdot/g, 'Â·')
                   .replace(/\\to/g, 'â†’')
                   .replace(/\\text\{\s*(.*?)\s*\}/g, '$1')
                   .replace(/\\frac\{\s*(.*?)\s*\}\{\s*(.*?)\s*\}/g, '($1 / $2)')
                   .replace(/\\sqrt\{\s*(.*?)\s*\}/g, 'âˆš($1)')
                   .replace(/\\Delta/g, 'Î”');
  return cleaned;
}

function formatChatText(text) {
  text = cleanLaTeX(text);
  const lines = text.split('\n');
  let result = [];
  let inUl = false;
  let inOl = false;
  let inCodeBlock = false;

  for (let line of lines) {
    // Escape HTML tags for security
    let escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Handle Code Block Toggle
    if (escaped.trim().startsWith('```')) {
      if (inCodeBlock) {
        result.push('</pre>');
        inCodeBlock = false;
      } else {
        const lang = escaped.trim().slice(3).trim();
        result.push(`<pre style="background: rgba(0,0,0,0.04); padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto; margin: 8px 0; border: 1px solid rgba(0,0,0,0.08); line-height: 1.4; font-size: 12.5px;" data-lang="${lang}">`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(escaped + '\n');
      continue;
    }

    // Process Inline Formats (Bold, Italic, Inline Code)
    function formatInline(str) {
      str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
      str = str.replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 90%; color: #e11d48;">$1</code>');
      return str;
    }

    // Check for List Items
    const ulMatch = escaped.match(/^[\-\*]\s+(.*)$/);
    const olMatch = escaped.match(/^\d+\.\s+(.*)$/);

    if (ulMatch) {
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul style="margin: 6px 0; padding-left: 20px; list-style-type: disc;">');
        inUl = true;
      }
      result.push(`<li style="margin-bottom: 4px; line-height: 1.5;">${formatInline(ulMatch[1])}</li>`);
    } else if (olMatch) {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        result.push('<ol style="margin: 6px 0; padding-left: 20px; list-style-type: decimal;">');
        inOl = true;
      }
      result.push(`<li style="margin-bottom: 4px; line-height: 1.5;">${formatInline(olMatch[1])}</li>`);
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }

      // Check for Headers
      const h3Match = escaped.match(/^###\s+(.*)$/);
      const h2Match = escaped.match(/^##\s+(.*)$/);
      const h1Match = escaped.match(/^#\s+(.*)$/);

      if (h3Match) {
        result.push(`<h4 style="margin: 12px 0 6px 0; font-size: 13.5px; font-weight: 700; color: var(--text-main);">${formatInline(h3Match[1])}</h4>`);
      } else if (h2Match) {
        result.push(`<h3 style="margin: 16px 0 8px 0; font-size: 14.5px; font-weight: 700; color: var(--text-main);">${formatInline(h2Match[1])}</h3>`);
      } else if (h1Match) {
        result.push(`<h2 style="margin: 20px 0 10px 0; font-size: 15.5px; font-weight: 700; color: var(--text-main);">${formatInline(h1Match[1])}</h2>`);
      } else {
        const trimmed = escaped.trim();
        if (trimmed === '') {
          result.push('<div style="height: 8px;"></div>');
        } else {
          result.push(`<p style="margin: 0 0 6px 0; line-height: 1.5;">${formatInline(escaped)}</p>`);
        }
      }
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');
  if (inCodeBlock) result.push('</pre>');

  return result.join('');
}

function typeHtml(element, html, speed = 15, onComplete) {
  const tokens = html.match(/<[^>]+>|&[a-zA-Z0-9#]+;|[^<&]+/g) || [];
  let tokenIndex = 0;
  let charIndex = 0;
  let currentHTML = "";

  function typeNext() {
    if (tokenIndex >= tokens.length) {
      if (onComplete) onComplete();
      return;
    }

    const token = tokens[tokenIndex];

    if ((token.startsWith('<') && token.endsWith('>')) || (token.startsWith('&') && token.endsWith(';'))) {
      currentHTML += token;
      element.innerHTML = currentHTML;
      tokenIndex++;
      typeNext();
    } else {
      if (charIndex < token.length) {
        currentHTML += token[charIndex];
        element.innerHTML = currentHTML;
        charIndex++;
        const chatContainer = document.getElementById('sonic-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        setTimeout(typeNext, speed);
      } else {
        charIndex = 0;
        tokenIndex++;
        typeNext();
      }
    }
  }

  typeNext();
}

function appendSonicMessage(role, text) {
  return new Promise((resolve) => {
    const container = document.getElementById('sonic-messages');
    if (!container) {
      resolve();
      return;
    }

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;
    
    if (role === 'user') {
      bubble.style.cssText = `
        align-self: flex-end;
        max-width: 80%;
        background: var(--primary);
        color: white;
        border-radius: 16px 16px 0 16px;
        padding: 10px 16px;
        box-shadow: var(--shadow-sm);
        word-break: break-word;
        line-height: 1.5;
        font-size: 13px;
      `;
      bubble.innerHTML = formatChatText(text);
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
      resolve();
    } else {
      bubble.style.cssText = `
        align-self: flex-start;
        max-width: 85%;
        background: var(--white);
        border: 1px solid var(--border-color);
        border-radius: 0 16px 16px 16px;
        padding: 12px 16px;
        box-shadow: var(--shadow-sm);
        display: flex;
        gap: 10px;
        word-break: break-word;
        line-height: 1.5;
        font-size: 13px;
      `;
      bubble.innerHTML = `
        <div style="font-size: 18px; margin-top: 2px;">âš¡</div>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">SONIC</div>
          <div class="chat-text"></div>
        </div>
      `;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;

      const chatTextElement = bubble.querySelector('.chat-text');
      const formattedHtml = formatChatText(text);

      const input = document.getElementById('sonic-input');
      const form = document.getElementById('form-sonic-chat');
      let submitBtn = null;
      if (form) {
        submitBtn = form.querySelector('button[type="submit"]');
      }

      if (input) input.disabled = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
      }

      typeHtml(chatTextElement, formattedHtml, 15, () => {
        if (input) {
          input.disabled = false;
          input.focus();
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }
        resolve();
      });
    }
  });
}

async function askSonicDirect(userMsg) {
  const HF_TOKEN = window.HF_TOKEN || '';
  if (!HF_TOKEN) {
    throw new Error('Browser Hugging Face token is not configured');
  }
  const COMPLETIONS_URL = 'https://api-inference.huggingface.co/v1/chat/completions';

  const systemPrompt = `You are SONIC, a helpful AI study assistant.
STRICT RULES:
1. ONLY answer questions related to studies, academics, homework, exams, courses, and educational topics. If the user asks a question that is NOT related to studies (such as casual chit-chat, hobbies, entertainment, sports, movies, games, jokes, personal questions, how to cook, etc.), you MUST politely decline and ask them to ask something related to studies.
2. STRICTLY FORBIDDEN: Do NOT use LaTeX math equations or symbol wrappers like \\[ ... \\], $$ ... $$, \\( ... \\), or $ ... $.
3. DO NOT write raw LaTeX math notation (e.g. \\frac, \\Sigma, \\Rightarrow, \\text, etc.).
4. Use clean, plain-text math/science equations and unicode symbols (e.g., use 'F_net = m * a', 'a = F_net / m', 'E = m * c^2', 'Î£F = 0 â‡’ v = constant').
5. DO NOT include unnecessary introductory phrases (such as "Sure! I can teach you..." or "Here is what you need...") or polite concluding chit-chat. Directly output the relevant educational notes, formulas, or step-by-step explanations.
6. Keep formatting clean and readable using standard bold text, list bullets, or simple markdown headers.`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const turn of chatSessionHistory) {
    messages.push({
      role: turn.role === 'user' ? 'user' : 'assistant',
      content: turn.content
    });
  }
  messages.push({ role: 'user', content: userMsg });

  const models = [
    'openchat/openchat-3.5-0106',
    'Qwen/Qwen2.5-7B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'HuggingFaceH4/zephyr-7b-beta'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Direct fetch trying model: ${model}`);
      const response = await fetch(COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error && errData.error.message ? errData.error.message : (errData.error || `HTTP ${response.status}`);
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content.trim();
      }
      throw new Error('Invalid response format');
    } catch (err) {
      console.warn(`Direct fetch failed for model ${model}:`, err.message);
      lastError = err;
      // If the error indicates a network block (like Failed to fetch), escalate immediately to trigger backend proxy
      if (err.message && err.message.includes('Failed to fetch')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All models failed to respond');
}

async function askSonicProxy(userMsg) {
  const data = await request('/sonic/chat', {
    method: 'POST',
    body: { prompt: userMsg, history: chatSessionHistory }
  });

  if (data && data.response) {
    return data.response.trim();
  }
  throw new Error('Invalid response from proxy');
}

async function askSonicPuter(userMsg) {
  await ensurePuterLoaded();
  if (typeof puter === 'undefined') {
    throw new Error('Puter SDK not loaded');
  }

  console.log('Querying Puter AI (Stage 3 fallback)...');
  const systemPrompt = `You are SONIC, a helpful AI study assistant.
STRICT RULES:
1. ONLY answer questions related to studies, academics, homework, exams, courses, and educational topics. If the user asks a question that is NOT related to studies (such as casual chit-chat, hobbies, entertainment, sports, movies, games, jokes, personal questions, how to cook, etc.), you MUST politely decline and ask them to ask something related to studies.
2. STRICTLY FORBIDDEN: Do NOT use LaTeX math equations or symbol wrappers like \\[ ... \\], $$ ... $$, \\( ... \\), or $ ... $.
3. DO NOT write raw LaTeX math notation (e.g. \\frac, \\Sigma, \\Rightarrow, \\text, etc.).
4. Use clean, plain-text math/science equations and unicode symbols (e.g., use 'F_net = m * a', 'a = F_net / m', 'E = m * c^2', 'Î£F = 0 â‡’ v = constant').
5. DO NOT include unnecessary introductory phrases (such as "Sure! I can teach you..." or "Here is what you need...") or polite concluding chit-chat. Directly output the relevant educational notes, formulas, or step-by-step explanations.
6. Keep formatting clean and readable using standard bold text, list bullets, or simple markdown headers.`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const turn of chatSessionHistory) {
    messages.push({
      role: turn.role === 'user' ? 'user' : 'assistant',
      content: turn.content
    });
  }
  messages.push({ role: 'user', content: userMsg });

  const response = await puter.ai.chat(messages);
  
  if (response && response.message && response.message.content) {
    const content = response.message.content;
    if (typeof content === 'string') {
      return content.trim();
    }
    if (Array.isArray(content) && content[0] && content[0].text) {
      return content[0].text.trim();
    }
  }

  if (typeof response === 'string') {
    return response.trim();
  }

  throw new Error('Invalid response from Puter AI');
}

async function askSonicPollinations(userMsg) {
  console.log('Querying Pollinations GET (Stage 4 fallback)...');
  const systemPrompt = `You are SONIC, a helpful AI study assistant.
STRICT RULES:
1. ONLY answer questions related to studies, academics, homework, exams, courses, and educational topics. If the user asks a question that is NOT related to studies (such as casual chit-chat, hobbies, entertainment, sports, movies, games, jokes, personal questions, how to cook, etc.), you MUST politely decline and ask them to ask something related to studies.
2. STRICTLY FORBIDDEN: Do NOT use LaTeX math equations or symbol wrappers like \\[ ... \\], $$ ... $$, \\( ... \\), or $ ... $.
3. DO NOT write raw LaTeX math notation (e.g. \\frac, \\Sigma, \\Rightarrow, \\text, etc.).
4. Use clean, plain-text math/science equations and unicode symbols (e.g., use 'F_net = m * a', 'a = F_net / m', 'E = m * c^2', 'Î£F = 0 â‡’ v = constant').
5. DO NOT include unnecessary introductory phrases (such as "Sure! I can teach you..." or "Here is what you need...") or polite concluding chit-chat. Directly output the relevant educational notes, formulas, or step-by-step explanations.
6. Keep formatting clean and readable using standard bold text, list bullets, or simple markdown headers.`;

  let fullPrompt = `System: ${systemPrompt}\n\n`;
  for (const turn of chatSessionHistory) {
    fullPrompt += `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}\n`;
  }
  fullPrompt += `User: ${userMsg}`;

  const models = ['openai', 'mistral', 'llama'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Pollinations GET trying model: ${model}`);
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&jsonMode=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      if (text && text.trim()) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) {
            throw new Error(parsed.error.message || parsed.error);
          }
        } catch (e) {
          // Success: Raw text response
        }
        return text.trim();
      }
      throw new Error('Empty response');
    } catch (err) {
      console.warn(`Pollinations GET model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Pollinations models failed');
}

async function askSonic(userMsg) {
  // 1. Try browser-side direct Hugging Face query
  try {
    return await askSonicDirect(userMsg);
  } catch (directErr) {
    console.warn('Direct Hugging Face query failed:', directErr.message);

    // 2. Try backend proxy Hugging Face query
    try {
      return await askSonicProxy(userMsg);
    } catch (proxyErr) {
      console.warn('Backend proxy Hugging Face query failed:', proxyErr.message);

      // 3. Try Puter AI directly (unblocked, keyless, very stable)
      try {
        return await askSonicPuter(userMsg);
      } catch (puterErr) {
        console.warn('Puter AI query failed:', puterErr.message);

        // 4. Try Pollinations GET keyless query directly in browser
        try {
          return await askSonicPollinations(userMsg);
        } catch (pollinationsErr) {
          console.error('All routes failed for SONIC:', pollinationsErr);
          throw new Error(`Failed to connect to SONIC chatbot. (HuggingFace Direct: ${directErr.message} | HuggingFace Proxy: ${proxyErr.message} | Puter AI: ${puterErr.message} | Pollinations GET: ${pollinationsErr.message})`);
        }
      }
    }
  }
}

function initSonicEventHandlers() {
  const form = document.getElementById('form-sonic-chat');
  const input = document.getElementById('sonic-input');
  const typingIndicator = document.getElementById('sonic-typing');
  const btnPrint = document.getElementById('btn-print-chat');

  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userMsg = input.value.trim();
      if (!userMsg) return;

      input.value = '';
      await appendSonicMessage('user', userMsg);
      hasChatHistory = true;

      // Add to session history
      chatSessionHistory.push({ role: 'user', content: userMsg });

      // Show typing indicator
      if (typingIndicator) typingIndicator.style.display = 'flex';

      try {
        const botResponse = await askSonic(userMsg);
        
        // Hide typing indicator
        if (typingIndicator) typingIndicator.style.display = 'none';

        await appendSonicMessage('bot', botResponse);
        chatSessionHistory.push({ role: 'bot', content: botResponse });
      } catch (err) {
        if (typingIndicator) typingIndicator.style.display = 'none';
        await appendSonicMessage('bot', `Sorry, I encountered an error: ${err.message}. Please check your connection and try again!`);
      }
    });
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

// --- API SERVICE ---
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');
const API_BASE = isLocalhost
  ? `http://${window.location.hostname}:5000/api`
  : 'https://syudyhubbackend.onrender.com/api'; // CHANGE THIS TO YOUR DEPLOYED BACKEND URL ON RENDER

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine if sending FormData (multipart file upload) vs JSON body
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  // Auth API
  async login(phone, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { phone, password }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async signup(name, phone, password, role) {
    const res = await request('/auth/signup', {
      method: 'POST',
      body: { name, phone, password, role }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof stopNotificationPolling === 'function') {
      stopNotificationPolling();
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getMe() {
    return await request('/auth/me');
  },

  async getPendingUsers() {
    return await request('/auth/pending');
  },

  async getAllUsers() {
    return await request('/auth/users');
  },

  async approveUser(userId) {
    return await request(`/auth/approve/${userId}`, { method: 'POST' });
  },

  async rejectUser(userId) {
    return await request(`/auth/reject/${userId}`, { method: 'POST' });
  },

  async deleteUser(userId) {
    return await request(`/auth/users/${userId}`, { method: 'DELETE' });
  },

  async promoteUser(userId) {
    return await request(`/auth/promote/${userId}`, { method: 'POST' });
  },

  async resetPassword(oldPassword, newPassword, confirmPassword) {
    return await request('/auth/reset-password', {
      method: 'POST',
      body: { oldPassword, newPassword, confirmPassword }
    });
  },

  async adminResetPassword(userId) {
    return await request(`/auth/users/${userId}/reset-password`, { method: 'POST' });
  },

  // Folders API
  async getFolders(type, parentId = null) {
    let url = `/folders?type=${type}`;
    if (parentId !== null) {
      url += `&parentId=${parentId}`;
    } else {
      url += `&parentId=null`;
    }
    return await request(url);
  },

  async createFolder(name, type, parentId = null) {
    return await request('/folders', {
      method: 'POST',
      body: { name, type, parentId }
    });
  },

  async renameFolder(folderId, name) {
    return await request(`/folders/${folderId}`, {
      method: 'PUT',
      body: { name }
    });
  },

  async deleteFolder(folderId) {
    return await request(`/folders/${folderId}`, {
      method: 'DELETE'
    });
  },

  // Documents API
  async getDocuments(type, folderId = null) {
    let url = `/documents?type=${type}`;
    if (folderId !== null) {
      url += `&folderId=${folderId}`;
    }
    return await request(url);
  },

  async uploadDocument(formData) {
    return await request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  async contributeDocument(formData) {
    return await request('/documents/contribute', {
      method: 'POST',
      body: formData
    });
  },

  async getPendingDocuments() {
    return await request('/documents/pending');
  },

  async approveDocument(docId) {
    return await request(`/documents/approve/${docId}`, {
      method: 'POST'
    });
  },

  async rejectDocument(docId) {
    return await request(`/documents/reject/${docId}`, {
      method: 'POST'
    });
  },

  async deleteDocument(docId) {
    return await request(`/documents/${docId}`, {
      method: 'DELETE'
    });
  },

  async moveDocument(docId, targetType, targetFolderId) {
    return await request(`/documents/${docId}/move`, {
      method: 'PUT',
      body: { targetType, targetFolderId }
    });
  },

  async getMyUploads() {
    return await request('/documents/my-uploads');
  },

  async updateDocument(docId, title, subject, year) {
    return await request(`/documents/${docId}`, {
      method: 'PUT',
      body: { title, subject, year }
    });
  },

  // Announcements API
  async getAnnouncements() {
    return await request('/announcements');
  },

  async createAnnouncement(title, content, docUrl) {
    return await request('/announcements', {
      method: 'POST',
      body: { title, content, docUrl }
    });
  },

  async deleteAnnouncement(annId) {
    return await request(`/announcements/${annId}`, {
      method: 'DELETE'
    });
  },

  // Help & Support API
  async submitHelpRequest(subject, message, name = null, phone = null, role = null) {
    return await request('/help', {
      method: 'POST',
      body: { subject, message, name, phone, role }
    });
  },

  async getHelpRequests() {
    return await request('/help');
  },

  async resolveHelpRequest(requestId) {
    return await request(`/help/resolve/${requestId}`, {
      method: 'POST'
    });
  },

  async deleteHelpRequest(requestId) {
    return await request(`/help/${requestId}`, {
      method: 'DELETE'
    });
  },

  // Notifications API
  async sendNotification(recipientId, message) {
    return await request('/notifications', {
      method: 'POST',
      body: { recipientId, message }
    });
  },

  async getUnreadNotifications() {
    return await request('/notifications/unread');
  },

  async markNotificationRead(id) {
    return await request(`/notifications/read/${id}`, {
      method: 'POST'
    });
  },

  async getMessageTemplates() {
    return await request('/notifications/templates');
  },

  async saveMessageTemplate(name, content) {
    return await request('/notifications/templates', {
      method: 'POST',
      body: { name, content }
    });
  },

  async deleteMessageTemplate(id) {
    return await request(`/notifications/templates/${id}`, {
      method: 'DELETE'
    });
  },

  async getAllNotifications() {
    return await request('/notifications/all');
  },

  async deleteNotification(id) {
    return await request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  async updateNotification(id, message) {
    return await request(`/notifications/${id}`, {
      method: 'PUT',
      body: { message }
    });
  },

  async toggleLikeDocument(docId) {
    return await request(`/documents/${docId}/like`, { method: 'POST' });
  },

  async getTeacherRanking() {
    return await request('/auth/teachers/ranking');
  },

  async getTeacherStats() {
    return await request('/auth/teachers/stats');
  }
};

// --- GLOBAL APPLICATION STATE ---
let currentUser = null;
let uploadSourceMode = 'file'; // 'file' | 'link' | 'scan'
let scanImages = []; // Array of compressed scanned images { dataUrl, width, height }
let cameraStream = null; // Holds the MediaStream object for camera capture
let editingIndex = null; // The index of the scanned page currently being edited
let editorRotation = 0; // Rotate state (0, 90, 180, 270)
let editorFilter = 'original'; // Current filter name ('original', 'bw', 'gray')
let editorImg = new Image(); // The original image object loaded into editor memory
let currentNotesFolder = null;
let currentPapersFolder = null;
let currentResourcesFolder = null;
let currentResourcesSection = 'root'; // 'root' | 'syllabus' | 'lab_manuals' | 'lab_manuals_folder' | 'books' | 'books_folder' | 'calculator'
let roadmapFolderStack = [];
let notesFoldersList = []; // Kept in memory to populate syllabus uploads
let activeDirectoryTab = 'admin'; // 'admin' | 'teacher' | 'student'
let directoryVisibleCount = 5;
let helpRequestsVisibleCount = 5;
let notificationsVisibleCount = 5;

// GPA Calculator State
const GRADE_POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
let sgpaRows = [
  { id: 1, courseName: '', credits: 4, grade: 'A+' },
  { id: 2, courseName: '', credits: 3, grade: 'A' },
  { id: 3, courseName: '', credits: 3, grade: 'B+' },
  { id: 4, courseName: '', credits: 2, grade: 'A+' }
];
let cgpaRows = [
  { id: 1, semesterName: 'Semester 1', sgpa: '', credits: 20 },
  { id: 2, semesterName: 'Semester 2', sgpa: '', credits: 20 }
];

// Helper to calculate dynamic academic years
function getAcademicYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const years = [];
  const endLimit = Math.max(currentYear + 1, 2026);
  for (let y = startYear; y < endLimit; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years.reverse(); // Newest first
}

// Generate the Folder Icon HTML
function getFolderIconSvg(color1 = '#4a90e2', color2 = '#1e56a0') {
  return `
    <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 4px rgba(14, 56, 122, 0.15))">
      <defs>
        <linearGradient id="folder-grad-${color1.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <path d="M10 24C10 20.6863 12.6863 18 16 18H40C43.3137 18 46 20.6863 46 24V27H90C93.3137 27 96 29.6863 96 33V76C96 79.3137 93.3137 82 90 82H10C6.68629 82 4 79.3137 4 76V24C4 20.6863 6.68629 18 10 18Z" fill="url(#folder-grad-${color1.replace('#', '')})" opacity="0.85" />
      <rect x="20" y="22" width="60" height="35" rx="3" fill="#ffffff" opacity="0.95" />
      <line x1="28" y1="28" x2="72" y2="28" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="36" x2="60" y2="36" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="44" x2="68" y2="44" stroke="#d9e2ec" stroke-width="2" />
      <path d="M4 33C4 29.6863 6.68629 27 10 27H90C93.3137 27 96 29.6863 96 33V77C96 80.3137 93.3137 83 90 83H10C6.68629 83 4 80.3137 4 77V33Z" fill="url(#folder-grad-${color1.replace('#', '')})" />
      <path d="M10 27.5H90" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />
    </svg>
  `;
}

let myUploadsDocsList = [];

function canManageDocument(doc) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
  if (currentUser.role === 'educator') {
    return doc.uploadedByUserId === currentUser.id;
  }
  return false;
}

// --- DOM NAVIGATION & AUTH HELPERS ---
function updateNavbar() {
  const container = document.getElementById('nav-auth-container');
  const adminTab = document.getElementById('nav-admin');
  const mobMenu = document.getElementById('mobile-nav-menu');
  const floatingContributeBtn = document.getElementById('btn-floating-contribute');
  const floatingSonicBtn = document.getElementById('btn-floating-sonic');

  if (currentUser && currentUser.role === 'student') {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'flex';
  } else {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'none';
  }

  if (currentUser) {
    if (floatingSonicBtn) floatingSonicBtn.style.display = 'flex';
  } else {
    if (floatingSonicBtn) floatingSonicBtn.style.display = 'none';
  }

  if (currentUser) {
    // Show admin dashboard tab for admin & superadmin
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      adminTab.style.display = 'flex';
    } else {
      adminTab.style.display = 'none';
    }

    // Show My Uploads tab for staff (educators, admins, superadmins)
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) {
      if (currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        myUploadsTab.style.display = 'flex';
      } else {
        myUploadsTab.style.display = 'none';
      }
    }

    // Show My Contributions tab for students only
    const myContributionsTab = document.getElementById('nav-my-contributions');
    if (myContributionsTab) {
      if (currentUser.role === 'student') {
        myContributionsTab.style.display = 'flex';
      } else {
        myContributionsTab.style.display = 'none';
      }
    }

    // Show Teacher Dashboard tab for educators only
    const teacherDashboardTab = document.getElementById('nav-teacher-dashboard');
    if (teacherDashboardTab) {
      if (currentUser.role === 'educator') {
        teacherDashboardTab.style.display = 'flex';
      } else {
        teacherDashboardTab.style.display = 'none';
      }
    }

    // Populate Desktop Auth State
    container.innerHTML = `
      <div class="profile-dropdown-wrapper">
        <button id="profile-trigger-btn" class="profile-dropdown-btn" type="button">
          <i data-lucide="user" style="width: 16px; height: 16px;"></i>
          <span>${escapeHTML(capitalizeName(currentUser.name))}</span>
          <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 2px; opacity: 0.7;"></i>
        </button>
        <div class="profile-dropdown-menu" id="profile-dropdown-menu">
          <div class="profile-info-header">
            <div class="profile-name">${escapeHTML(capitalizeName(currentUser.name))}</div>
            <div class="profile-phone">
              <i data-lucide="phone" style="width: 12px; height: 12px;"></i>
              ${escapeHTML(currentUser.phone)}
            </div>
          </div>
          <div class="profile-role-container">
            <span class="profile-role-label">Role:</span>
            <span class="profile-role-badge">
              ${currentUser.role === 'superadmin' ? 'Super Admin' : (currentUser.role === 'educator' ? 'Educator' : currentUser.role)}
            </span>
          </div>
          <a href="#/reset-password" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 8px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="key-round" style="width: 14px; height: 14px; color: var(--primary);"></i> Reset Password
          </a>
          <a href="https://github.com/ankitgl200/studyhubStudents" target="_blank" rel="noopener noreferrer" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 8px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--primary);"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Contribute
          </a>
          <a href="#/terms" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 8px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--primary);"></i> Terms of Service
          </a>
          <a href="#/privacy" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 8px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="shield" style="width: 14px; height: 14px; color: var(--primary);"></i> Privacy Policy
          </a>

          <button id="btn-logout" class="btn btn-danger btn-sm profile-logout-btn" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; width: 100%;">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Logout
          </button>
        </div>
      </div>
    `;

    // Click handler to toggle showing on click (for mobile-tablet or explicit click behavior)
    const trigger = document.getElementById('profile-trigger-btn');
    const menu = document.getElementById('profile-dropdown-menu');
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;
      chatSessionHistory = [];
      hasChatHistory = false;
      const container = document.getElementById('sonic-messages');
      if (container) {
        container.innerHTML = `
          <!-- System / Welcome Message -->
          <div class="message-bubble system" style="align-self: flex-start; max-width: 85%; background: var(--white); border: 1px solid var(--border-color); border-radius: 0 16px 16px 16px; padding: 12px 16px; box-shadow: var(--shadow-sm); display: flex; gap: 10px;">
            <div style="font-size: 18px; margin-top: 2px;">âš¡</div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">SONIC</div>
              <div style="font-size: 13px; color: var(--text-main); line-height: 1.5;" class="chat-text">
                Hello! I am **SONIC**, your personal AI study assistant. I'm here to help you solve academic problems, understand concepts, and prepare for exams.
                <br/><br/>
                <em>Please note: I am restricted to study-related questions only. How can I help you today?</em>
              </div>
            </div>
          </div>
        `;
      }
      updateNavbar();
      navigate('#/');
    });

    // Populate Mobile Menu
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; font-size: 16px; color: var(--text-main); line-height: 1.2;">${escapeHTML(capitalizeName(currentUser.name))}</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-top: 2px;">Role: ${currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}</span>
        </div>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; margin-left: 4px;">
        <i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(currentUser.phone)}
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
        <a href="#/generators" class="mobile-nav-link" id="mob-nav-generators"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> File Tools</a>
        <a href="#/reset-password" class="mobile-nav-link" id="mob-nav-reset-password"><i data-lucide="key-round" style="width: 18px; height: 18px;"></i> Reset Password</a>
        <a href="https://github.com/ankitgl200/studyhubStudents" target="_blank" rel="noopener noreferrer" class="mobile-nav-link" id="mob-nav-contribute"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: var(--primary);"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Contribute</a>

        ${currentUser.role === 'student' ? `
          <a href="#/my-contributions" class="mobile-nav-link" id="mob-nav-my-contributions"><i data-lucide="award" style="width: 18px; height: 18px;"></i> My Contributions</a>
        ` : ''}
        ${(currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/my-uploads" class="mobile-nav-link" id="mob-nav-my-uploads"><i data-lucide="folder-heart" style="width: 18px; height: 18px;"></i> My Uploads</a>
        ` : ''}
        ${currentUser.role === 'educator' ? `
          <a href="#/teacher-dashboard" class="mobile-nav-link" id="mob-nav-teacher-dashboard"><i data-lucide="presentation" style="width: 18px; height: 18px;"></i> Teacher Dashboard</a>
        ` : ''}
        ${(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/admin" class="mobile-nav-link" id="mob-nav-admin"><i data-lucide="shield-alert" style="width: 18px; height: 18px;"></i> Admin</a>
        ` : ''}
      </div>
      <button class="btn btn-primary btn-download-app-trigger" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; margin-top: auto; margin-bottom: 12px;">
        <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i> Download App
      </button>
      <button id="btn-mobile-logout" class="btn btn-danger" style="width: 100%;">
        <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> Logout
      </button>
    `;

    // Click handler for Close Button inside Mobile Drawer
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }

    document.getElementById('btn-mobile-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;
      document.body.style.overflow = '';
      updateNavbar();
      navigate('#/');
    });

  } else {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'none';
    adminTab.style.display = 'none';
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) myUploadsTab.style.display = 'none';
    const myContributionsTab = document.getElementById('nav-my-contributions');
    if (myContributionsTab) myContributionsTab.style.display = 'none';
    
    // Populate Desktop Auth State (Logged out)
    container.innerHTML = `
      <div style="display: flex; gap: 8px; margin-left: 12px;">
        <a href="#/login" class="nav-link">Login</a>
        <a href="#/signup" class="btn btn-primary btn-sm">Sign Up</a>
      </div>
    `;

    // Populate Mobile Menu (Logged out)
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;">
        <span style="font-weight: 800; font-size: 18px; color: var(--primary-dark);">Studyhub</span>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
        <a href="#/generators" class="mobile-nav-link" id="mob-nav-generators"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> File Tools</a>
      </div>
      <button class="btn btn-primary btn-download-app-trigger" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; margin-top: auto; margin-bottom: 12px;">
        <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i> Download App
      </button>
      <div style="display: flex; gap: 8px; width: 100%;">
        <a href="#/login" class="nav-link btn btn-secondary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Login</a>
        <a href="#/signup" class="btn btn-primary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Sign Up</a>
      </div>
    `;

    // Click handler for Close Button inside Mobile Drawer (Logged out)
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }
  }
  refreshIcons();
}

function handleAuthProtection(hash) {
  const publicRoutes = ['#/login', '#/signup', '#/generators', '#/support', '#/terms', '#/privacy'];
  if (!publicRoutes.includes(hash) && !currentUser) {
    navigate('#/login');
    return false;
  }
  if (hash === '#/admin' && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('#/');
    return false;
  }
  if (hash === '#/my-uploads' && currentUser && currentUser.role !== 'educator' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('#/');
    return false;
  }
  if (hash === '#/my-contributions' && currentUser && currentUser.role !== 'student') {
    navigate('#/');
    return false;
  }
  if (hash === '#/teacher-dashboard' && currentUser && currentUser.role !== 'educator') {
    navigate('#/');
    return false;
  }
  return true;
}

function navigate(hash) {
  window.location.hash = hash;
}

function getHashQueryParams() {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  
  const qStr = hash.slice(qIndex + 1);
  const params = {};
  const pairs = qStr.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  return params;
}

// --- ROUTER ENGINE ---
async function router() {
  const fullHash = window.location.hash || '#/';
  const hash = fullHash.split('?')[0];
  const adSpace = document.getElementById('site-ad-space');

  if (adSpace) adSpace.style.display = 'none';
  
  // Update navbar active state
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile navbar active state
  document.querySelectorAll('.mobile-nav-menu .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Close mobile nav menu when navigating
  const mobMenu = document.getElementById('mobile-nav-menu');
  if (mobMenu) {
    mobMenu.classList.remove('open');
  }
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (mobOverlay) {
    mobOverlay.classList.remove('open');
  }
  document.body.style.overflow = ''; // RESTORE PAGE SCROLL

  // Run protection check
  if (!handleAuthProtection(hash)) return;

  // Toggle page visibility
  document.querySelectorAll('.page-view').forEach(view => {
    view.style.display = 'none';
    view.classList.remove('route-enter');
  });

  // Close any open modals when navigating
  closeAllModals();

  if (hash === '#/' || hash === '#') {
    document.getElementById('view-home').style.display = 'block';
    await renderHomeView();
  } else if (hash === '#/login') {
    if (currentUser) return navigate('#/');
    document.getElementById('view-login').style.display = 'block';
    document.getElementById('login-error-alert').style.display = 'none';
  } else if (hash === '#/signup') {
    if (currentUser) return navigate('#/');
    document.getElementById('view-signup').style.display = 'block';
    document.getElementById('signup-error-alert').style.display = 'none';
    document.getElementById('signup-success-alert').style.display = 'none';
    document.getElementById('form-signup').style.display = 'block';
  } else if (hash === '#/notes') {
    document.getElementById('view-notes').style.display = 'block';
    await renderNotesView();
  } else if (hash === '#/papers') {
    document.getElementById('view-papers').style.display = 'block';
    await renderPapersView();
  } else if (hash === '#/resources') {
    document.getElementById('view-resources').style.display = 'block';
    await renderResourcesView();
  } else if (hash === '#/admin') {
    directoryVisibleCount = 5;
    helpRequestsVisibleCount = 5;
    notificationsVisibleCount = 5;
    document.getElementById('view-admin').style.display = 'block';
    await renderAdminDashboardView();
  } else if (hash === '#/my-uploads') {
    document.getElementById('view-my-uploads').style.display = 'block';
    await renderMyUploadsView();
  } else if (hash === '#/my-contributions') {
    document.getElementById('view-my-contributions').style.display = 'block';
    await renderMyContributionsView();
  } else if (hash === '#/support') {
    document.getElementById('view-support').style.display = 'block';
    await renderSupportView();
  } else if (hash === '#/generators') {
    document.getElementById('view-generators').style.display = 'block';
    await renderGeneratorsView();
  } else if (hash === '#/teacher-dashboard') {
    document.getElementById('view-teacher-dashboard').style.display = 'block';
    await renderTeacherDashboardView();
  } else if (hash === '#/reset-password') {
    document.getElementById('view-reset-password').style.display = 'block';
    document.getElementById('reset-password-error-alert').style.display = 'none';
    document.getElementById('reset-password-success-alert').style.display = 'none';
    document.getElementById('reset-old-password').value = '';
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-confirm-password').value = '';
  } else if (hash === '#/terms') {
    document.getElementById('view-terms').style.display = 'block';
  } else if (hash === '#/privacy') {
    document.getElementById('view-privacy').style.display = 'block';
  } else if (hash === '#/sonic') {
    document.getElementById('view-sonic').style.display = 'block';
    const container = document.getElementById('sonic-messages');
    if (container) container.scrollTop = container.scrollHeight;
  } else {
    window.location.hash = '#/';
    return;
  }

  const activeView = Array.from(document.querySelectorAll('.page-view'))
    .find(view => view.style.display !== 'none');

  if (activeView) {
    requestAnimationFrame(() => activeView.classList.add('route-enter'));
  }

  if (adSpace) adSpace.style.display = 'flex';

  if (hash !== '#/sonic') {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  refreshIcons();
}

// --- VIEW RENDERERS ---

// 1. HOME VIEW (Announcements)
async function renderHomeView() {
  const container = document.getElementById('announcements-list-container');
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');

  // Toggle announcement button for admin and teachers
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator')) {
    addAnnBtn.style.display = 'flex';
  } else {
    addAnnBtn.style.display = 'none';
    annForm.style.display = 'none';
  }

  // Load and render teacher rankings on the leaderboard card
  const leaderboardList = document.getElementById('teacher-ranking-list');
  if (leaderboardList) {
    leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">Loading leaderboard...</div>';
    api.getTeacherRanking()
      .then(ranking => {
        const topRanking = ranking.slice(0, 10);
        if (topRanking.length === 0) {
          leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0;">No educators ranked yet</div>';
        } else {
          leaderboardList.innerHTML = topRanking.map((t, index) => {
            const rankNum = index + 1;
            let trophy = '';
            if (rankNum === 1) trophy = '🏆';
            else if (rankNum === 2) trophy = '🥈';
            else if (rankNum === 3) trophy = '🥉';

            const isSelf = currentUser && currentUser.id === t.id;
            const bgStyle = isSelf ? 'background-color: rgba(34, 197, 94, 0.05);' : '';

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); ${bgStyle} font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 800; min-width: 24px;">#${rankNum}${trophy ? ' ' + trophy : ''}</span>
                  <span style="font-weight: 500; color: var(--primary-dark); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHTML(capitalizeName(t.name))}
                  </span>
                </div>
              </div>
            `;
          }).join('');
        }
      })
      .catch(err => {
        console.error('Failed to load home leaderboard:', err);
        leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--danger);">Failed to load rankings</div>';
      });
  }

  container.innerHTML = `<div class="empty-state">Loading announcements...</div>`;

  try {
    const list = await api.getAnnouncements();
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state">No announcements posted yet. Check back later!</div>`;
      return;
    }

    container.innerHTML = `
      <div class="announcements-container">
        ${list.map(ann => {
          const cardStyle = ann.docUrl ? 'style="cursor: pointer; border-left: 4px solid var(--primary);"' : '';
          const cardClick = ann.docUrl ? `onclick="window.open('${ann.docUrl}', '_blank')"` : '';
          return `
            <div class="announcement-card" ${cardStyle} ${cardClick}>
              <h4 style="display: flex; align-items: center; gap: 8px;">
                ${escapeHTML(ann.title)}
                ${ann.docUrl ? `<span style="font-size: 10px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 2px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase;">Doc Link</span>` : ''}
              </h4>
              <span class="announcement-date">
                <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px; vertical-align: middle;"></i>
                ${new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <p class="announcement-content">${escapeHTML(ann.content).replace(/\n/g, '<br>')}</p>
              ${ann.docUrl ? `
                <div style="margin-top: 10px; font-size: 13px; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> Open Associated Link
                </div>
              ` : ''}
              ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator') ? `
                <button class="announcement-delete btn-delete-ann" data-id="${ann.id}" title="Delete Announcement" onclick="event.stopPropagation();">
                  <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach deletion handlers
    document.querySelectorAll('.btn-delete-ann').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this announcement?')) return;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
        refreshIcons();
        try {
          await api.deleteAnnouncement(id);
          await renderHomeView();
        } catch (err) {
          alert(err.message || 'Failed to delete announcement');
          btn.disabled = false;
          btn.innerHTML = originalHTML;
          refreshIcons();
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2)">Error loading announcements.</div>`;
  }
  refreshIcons();
}

// 2. NOTES VIEW
async function renderNotesView() {
  localStorage.setItem('currentNotesFolder', JSON.stringify(currentNotesFolder));
  const breadcrumbs = document.getElementById('notes-breadcrumbs');
  const actions = document.getElementById('notes-header-actions');
  const content = document.getElementById('notes-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // 1. Render Header / Breadcrumbs & Action buttons
  if (!currentNotesFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Subject Notes</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-notes-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-notes-folder').addEventListener('click', () => {
        openFolderModal('notes');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="notes-back-crumb">Subject Notes</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentNotesFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-notes-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-notes-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload Note (PDF)
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-notes-back').addEventListener('click', backToNotesFolders);
    document.getElementById('notes-back-crumb').addEventListener('click', backToNotesFolders);
    if (isStaff) {
      document.getElementById('btn-notes-upload').addEventListener('click', () => {
        openUploadModal('notes', currentNotesFolder.id, currentNotesFolder.name);
      });
    }
  }

  // 2. Render content body
  if (!currentNotesFolder) {
    // Folders Grid View
    content.innerHTML = `<div class="empty-state">Loading subject folders...</div>`;
    try {
      const folders = await api.getFolders('notes');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No subjects folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item notes-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#4a82c3', '#1e56a0')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Attach Folder Navigation and CRUD Click Listeners
      document.querySelectorAll('.notes-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // If clicking rename or delete overlays, ignore navigation
          if (e.target.closest('.folder-actions-overlay')) return;
          currentNotesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          renderNotesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('notes', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all notes inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderNotesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list view inside folder
    content.innerHTML = `<div class="empty-state">Loading notes...</div>`;
    try {
      const docs = await api.getDocuments('notes', currentNotesFolder.id);
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No notes uploaded in this subject folder yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload Note" to post the first PDF.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Notes for ${escapeHTML(currentNotesFolder.name)}</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Academic Year: ${escapeHTML(doc.year)}</span>
                    <span>â€¢</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                    <span>â€¢</span>
                    <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                </a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                </a>
                ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                  <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document">
                    <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                  </button>
                ` : ''}
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-doc" data-id="${doc.id}" style="padding: 8px 12px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this note document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderNotesView();
          } catch (err) {
            alert(err.message || 'Failed to delete note');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderNotesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load documents.</div>`;
    }
  }
  refreshIcons();
}

function backToNotesFolders() {
  currentNotesFolder = null;
  renderNotesView();
}

// 3. PAPERS VIEW
let paperSearchQuery = '';

async function renderPapersView() {
  localStorage.setItem('currentPapersFolder', JSON.stringify(currentPapersFolder));
  const breadcrumbs = document.getElementById('papers-breadcrumbs');
  const actions = document.getElementById('papers-header-actions');
  const content = document.getElementById('papers-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  if (!currentPapersFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Papers (PYQs)</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-papers-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-papers-folder').addEventListener('click', () => {
        openFolderModal('papers');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="papers-back-crumb">Papers (PYQs)</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentPapersFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-papers-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-papers-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload PYQ (PDF)
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-papers-back').addEventListener('click', backToPapersFolders);
    document.getElementById('papers-back-crumb').addEventListener('click', backToPapersFolders);
    if (isStaff) {
      document.getElementById('btn-papers-upload').addEventListener('click', () => {
        openUploadModal('paper', currentPapersFolder.id, currentPapersFolder.name);
      });
    }
  }

  // Render Content
  if (!currentPapersFolder) {
    // Folders Grid View
    content.innerHTML = `<div class="empty-state">Loading papers subject folders...</div>`;
    try {
      const folders = await api.getFolders('papers');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No paper subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item papers-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#0284c7', '#0369a1')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-papers-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-papers-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Folder Click Listeners
      document.querySelectorAll('.papers-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentPapersFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          paperSearchQuery = '';
          renderPapersView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-papers-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('papers', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-papers-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all papers inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list inside folder
    content.innerHTML = `<div class="empty-state">Loading papers...</div>`;
    try {
      const docs = await api.getDocuments('paper', currentPapersFolder.id);

      // Filtering logic
      const getFilteredDocs = () => {
        if (!paperSearchQuery.trim()) return docs;
        const q = paperSearchQuery.toLowerCase();
        return docs.filter(d => {
          const title = d.title || '';
          const year = d.year || '';
          return title.toLowerCase().includes(q) || year.toLowerCase().includes(q);
        });
      };

      const renderDocsList = () => {
        const filtered = getFilteredDocs();

        let searchBarHTML = '';
        if (docs.length > 0) {
          searchBarHTML = `
            <div class="search-input-wrapper" style="max-width: 300px; margin-bottom: 20px;">
              <i data-lucide="search" class="search-input-icon" style="width: 16px; height: 16px;"></i>
              <input
                type="text"
                id="input-paper-search"
                class="form-input search-input"
                placeholder="Search by paper name/year..."
                value="${escapeHTML(paperSearchQuery)}"
                style="padding: 8px 12px 8px 36px; font-size: 14px;"
              />
            </div>
          `;
        }

        let listHTML = '';
        if (docs.length === 0) {
          listHTML = `
            <div class="empty-state">
              <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
              <p>No Previous Year Papers uploaded in this subject folder yet.</p>
              ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PYQ" to post the first PDF.</p>' : ''}
            </div>
          `;
        } else if (filtered.length === 0) {
          listHTML = `
            <div class="empty-state">
              <p>No papers match your search "${escapeHTML(paperSearchQuery)}"</p>
            </div>
          `;
        } else {
          listHTML = `
            <div class="docs-list">
              ${filtered.map(doc => `
                <div class="doc-card" style="position: relative; border-left: 4px solid #0284c7;">
                  <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                    <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                    <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                  </button>
                  <div class="doc-info">
                    <div class="doc-icon-container" style="background-color: #e0f2fe; color: #0284c7;">
                      <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div class="doc-meta">
                      <h5>${escapeHTML(doc.title)}</h5>
                      <div class="doc-meta-details">
                        <span>Academic Year: ${escapeHTML(doc.year)}</span>
                        <span>â€¢</span>
                        <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                        <span>â€¢</span>
                        <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div class="doc-actions">
                    <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </a>
                    <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                    </a>
                    ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                      <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document">
                        <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                      </button>
                    ` : ''}
                    ${canManageDocument(doc) ? `
                      <button class="btn btn-danger btn-sm btn-delete-paper" data-id="${doc.id}" style="padding: 8px 12px;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        content.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <h3 style="color: var(--primary-dark); margin: 0;">PYQs for ${escapeHTML(currentPapersFolder.name)}</h3>
            ${searchBarHTML}
          </div>
          <div id="papers-list-render-mount">
            ${listHTML}
          </div>
        `;

        // Re-attach Search input handler
        const searchInput = document.getElementById('input-paper-search');
        if (searchInput) {
          // Focus at the end of the text
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
          
          searchInput.addEventListener('input', (e) => {
            paperSearchQuery = e.target.value;
            renderDocsList();
          });
        }

        // Re-attach Delete handler
        document.querySelectorAll('.btn-delete-paper').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this paper document?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.deleteDocument(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete paper');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        // Re-attach Like handler
        document.querySelectorAll('.btn-like-doc').forEach(btn => {
          btn.addEventListener('click', (e) => {
            handleLikeToggle(e, renderPapersView);
          });
        });
        refreshIcons();
      };

      renderDocsList();

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load papers documents.</div>`;
    }
  }
  refreshIcons();
}

function backToPapersFolders() {
  currentPapersFolder = null;
  renderPapersView();
}

// 4. RESOURCES VIEW
async function renderResourcesView() {
  localStorage.setItem('currentResourcesSection', currentResourcesSection);
  localStorage.setItem('currentResourcesFolder', JSON.stringify(currentResourcesFolder));
  localStorage.setItem('roadmapFolderStack', JSON.stringify(roadmapFolderStack));
  const breadcrumbs = document.getElementById('resources-breadcrumbs');
  const actions = document.getElementById('resources-header-actions');
  const content = document.getElementById('resources-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  let crumbsHTML = `<span class="breadcrumb-item ${currentResourcesSection === 'root' ? 'breadcrumb-active' : ''}" id="crumb-resources-root">Resources</span>`;
  let actionsHTML = '';

  const isStaffOrEducator = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  if (currentResourcesSection !== 'root') {
    if (currentResourcesSection === 'roadmaps') {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">Roadmaps</span>
      `;
      roadmapFolderStack.forEach((folder, idx) => {
        const isLast = idx === roadmapFolderStack.length - 1;
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-item ${isLast ? 'breadcrumb-active' : ''} roadmap-crumb-item" data-idx="${idx}" style="cursor: pointer;">
            ${escapeHTML(folder.name)}
          </span>
        `;
      });
    } else {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">
          ${currentResourcesSection === 'syllabus' ? 'Syllabus' : ''}
          ${currentResourcesSection.startsWith('lab_manuals') ? 'Lab Manuals' : ''}
          ${currentResourcesSection.startsWith('books') ? 'Books' : ''}
          ${currentResourcesSection === 'calculator' ? 'SGPA & CGPA Calculator' : ''}
        </span>
      `;
      if (currentResourcesFolder) {
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-active">${escapeHTML(currentResourcesFolder.name)}</span>
        `;
      }
    }

    // Header buttons
    actionsHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-resources-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${(isAdmin && (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books')) || (isStaffOrEducator && currentResourcesSection === 'roadmaps' && !currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-add-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Folder
          </button>
        ` : ''}
        ${(isStaff && (currentResourcesSection === 'syllabus' || currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder')) || (isStaffOrEducator && currentResourcesSection === 'roadmaps' && currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload PDF
          </button>
        ` : ''}
      </div>
    `;
  }

  breadcrumbs.innerHTML = crumbsHTML;
  actions.innerHTML = actionsHTML;

  // Crumb clicks
  const crumbRoot = document.getElementById('crumb-resources-root');
  if (crumbRoot) crumbRoot.addEventListener('click', () => { currentResourcesSection = 'root'; currentResourcesFolder = null; roadmapFolderStack = []; renderResourcesView(); });

  const crumbSection = document.getElementById('crumb-resources-section');
  if (crumbSection) crumbSection.addEventListener('click', () => {
    if (currentResourcesSection.endsWith('_folder')) {
      currentResourcesSection = currentResourcesSection.replace('_folder', '');
    }
    currentResourcesFolder = null;
    roadmapFolderStack = [];
    renderResourcesView();
  });

  // Re-attach breadcrumbs stack handlers
  document.querySelectorAll('.roadmap-crumb-item').forEach(crumb => {
    crumb.addEventListener('click', () => {
      const idx = parseInt(crumb.getAttribute('data-idx'));
      roadmapFolderStack = roadmapFolderStack.slice(0, idx + 1);
      currentResourcesFolder = roadmapFolderStack[roadmapFolderStack.length - 1];
      renderResourcesView();
    });
  });

  const backBtn = document.getElementById('btn-resources-back');
  if (backBtn) backBtn.addEventListener('click', handleResourcesBack);

  const addFolderBtn = document.getElementById('btn-resources-add-folder');
  if (addFolderBtn) addFolderBtn.addEventListener('click', () => openFolderModal(currentResourcesSection));

  const uploadBtn = document.getElementById('btn-resources-upload');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      let docType = 'syllabus';
      let folderId = null;
      let folderName = '';
      if (currentResourcesSection === 'lab_manuals_folder') {
        docType = 'lab_manual';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'books_folder') {
        docType = 'book';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'roadmaps') {
        docType = 'roadmap';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      }
      openUploadModal(docType, folderId, folderName);
    });
  }

  // 3. Render content body
  if (currentResourcesSection === 'root') {
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 30px; padding: 10px 0;">
        <div class="card resource-card-trigger" data-section="syllabus" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: var(--primary-accent); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="compass" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Syllabus</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Access official university syllabus PDFs for all departments and semesters.</p>
        </div>

        <div class="card resource-card-trigger" data-section="lab_manuals" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="file-spreadsheet" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Lab Manuals</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Subject-wise practical files, manuals, experiments instructions, and guides.</p>
        </div>

        <div class="card resource-card-trigger" data-section="books" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="book-open" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Books</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Recommended textbooks, references, and digital libraries for engineering.</p>
        </div>

        <div class="card resource-card-trigger" data-section="roadmaps" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fae8ff; color: #a21caf; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="map" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Roadmaps</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Semester-wise maps, study routes, curriculum guides, and plans created by teachers & admins.</p>
        </div>

        <div class="card resource-card-trigger" data-section="calculator" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="calculator" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">GPA Calculator</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Quickly calculate your SGPA and CGPA with an interactive semester grid.</p>
        </div>
      </div>
    `;

    document.querySelectorAll('.resource-card-trigger').forEach(card => {
      card.addEventListener('click', () => {
        currentResourcesSection = card.getAttribute('data-section');
        currentResourcesFolder = null;
        roadmapFolderStack = [];
        renderResourcesView();
      });
    });

  } else if (currentResourcesSection === 'syllabus') {
    // Syllabus Documents View
    content.innerHTML = `<div class="empty-state">Loading syllabus...</div>`;
    try {
      const docs = await api.getDocuments('syllabus');
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No syllabus PDFs uploaded yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add a syllabus.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Syllabus Documents</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>â€¢</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                  <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document"><i data-lucide="folder-sync" style="width:14px;height:14px;"></i></button>
                ` : ''}
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-resource-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-resource-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this syllabus document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading syllabus documents.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books') {
    // Folders Grid View for Lab Manuals or Books
    content.innerHTML = `<div class="empty-state">Loading subject folders...</div>`;
    try {
      const folders = await api.getFolders(currentResourcesSection);
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to start.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      const isLab = currentResourcesSection === 'lab_manuals';
      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item resources-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${isLab ? getFolderIconSvg('#f59e0b', '#d97706') : getFolderIconSvg('#38bdf8', '#0369a1')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-res-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                  <button class="folder-btn folder-btn-danger btn-delete-res-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.resources-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentResourcesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          currentResourcesSection = currentResourcesSection === 'lab_manuals' ? 'lab_manuals_folder' : 'books_folder';
          renderResourcesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-res-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal(currentResourcesSection, btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-res-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading folders.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder') {
    // Documents inside specific Lab Manual or Book subject folder
    content.innerHTML = `<div class="empty-state">Loading files...</div>`;
    const docType = currentResourcesSection === 'lab_manuals_folder' ? 'lab_manual' : 'book';

    try {
      const docs = await api.getDocuments(docType, currentResourcesFolder.id);
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No documents uploaded in this subject yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add files.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">
          Files in ${escapeHTML(currentResourcesFolder.name)} (${docType === 'lab_manual' ? 'Lab Manuals' : 'Books'})
        </h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5>${escapeHTML(doc.title)}</h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>â€¢</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                  <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document"><i data-lucide="folder-sync" style="width:14px;height:14px;"></i></button>
                ` : ''}
                ${canManageDocument(doc) ? `
                  <button class="btn btn-danger btn-sm btn-delete-res-item-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-res-item-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this file?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading documents.</div>`;
    }

  } else if (currentResourcesSection === 'roadmaps') {
    content.innerHTML = `<div class="empty-state">Loading roadmaps...</div>`;
    const parentId = currentResourcesFolder ? currentResourcesFolder.id : 'null';

    try {
      const folders = await api.getFolders('roadmaps', parentId);
      let docs = [];
      if (currentResourcesFolder) {
        docs = await api.getDocuments('roadmap', currentResourcesFolder.id);
      }

      if (folders.length === 0 && docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="map" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No folders or roadmaps here yet.</p>
            ${isStaffOrEducator ? `<p style="font-size: 14px; margin-top: 6px;">Click ${!currentResourcesFolder ? '"Add Folder" or ' : ''}"Upload PDF" to get started.</p>` : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      let foldersHTML = '';
      if (folders.length > 0) {
        foldersHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Folders</h4>
          <div class="folders-grid" style="margin-bottom: 30px;">
            ${folders.map(f => `
              <div class="folder-item roadmap-folder-card" data-id="${f.id}" data-name="${f.name}">
                ${getFolderIconSvg('#a21caf', '#701a75')}
                <span class="folder-name">${escapeHTML(f.name)}</span>
                ${isStaffOrEducator ? `
                  <div class="folder-actions-overlay">
                    <button class="folder-btn btn-rename-roadmap-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                    <button class="folder-btn folder-btn-danger btn-delete-roadmap-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      let docsHTML = '';
      if (docs.length > 0) {
        docsHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Roadmap Files</h4>
          <div class="docs-list">
            ${docs.map(doc => `
              <div class="doc-card" style="position: relative; border-left: 4px solid #a21caf;">
                <div class="doc-info">
                  <div class="doc-icon-container" style="background-color: #fae8ff; color: #a21caf;">
                    <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                  </div>
                  <div class="doc-meta">
                    <h5>${escapeHTML(doc.title)}</h5>
                    <div class="doc-meta-details">
                      <span>Year: ${escapeHTML(doc.year)}</span>
                      <span>â€¢</span>
                      <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                      <span>â€¢</span>
                      <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                  <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                  <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                </button>

                <div class="doc-actions">
                  <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                  <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                  ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                    <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document"><i data-lucide="folder-sync" style="width:14px;height:14px;"></i></button>
                  ` : ''}
                  ${canManageDocument(doc) ? `
                    <button class="btn btn-danger btn-sm btn-delete-roadmap-doc" data-id="${doc.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      content.innerHTML = `
        <div style="padding: 10px 0;">
          ${foldersHTML}
          ${docsHTML}
        </div>
      `;

      // Event listeners
      document.querySelectorAll('.roadmap-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          const folderId = card.getAttribute('data-id');
          const folderName = card.getAttribute('data-name');
          const folder = { id: folderId, name: folderName };
          roadmapFolderStack.push(folder);
          currentResourcesFolder = folder;
          renderResourcesView();
        });
      });

      if (isStaffOrEducator) {
        document.querySelectorAll('.btn-rename-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('roadmaps', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all subfolders and documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-doc').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this roadmap?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.deleteDocument(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete roadmap');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

      // Like handlers for roadmaps
      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load roadmaps: ${escapeHTML(err.message)}</div>`;
    }

  } else if (currentResourcesSection === 'calculator') {
    // SGPA & CGPA CALCULATOR SHEET
    renderGPAThresholdsView(content);
  }

  refreshIcons();
}

function handleResourcesBack() {
  if (currentResourcesSection === 'roadmaps') {
    if (roadmapFolderStack.length > 0) {
      roadmapFolderStack.pop();
      if (roadmapFolderStack.length > 0) {
        currentResourcesFolder = roadmapFolderStack[roadmapFolderStack.length - 1];
      } else {
        currentResourcesFolder = null;
      }
    } else {
      currentResourcesSection = 'root';
      currentResourcesFolder = null;
    }
  } else if (currentResourcesSection === 'lab_manuals_folder') {
    currentResourcesSection = 'lab_manuals';
    currentResourcesFolder = null;
  } else if (currentResourcesSection === 'books_folder') {
    currentResourcesSection = 'books';
    currentResourcesFolder = null;
  } else {
    currentResourcesSection = 'root';
    currentResourcesFolder = null;
  }
  renderResourcesView();
}

// Render GPA Calculator sheets
function renderGPAThresholdsView(mountElement) {
  let calculatedSgpa = null;
  let calculatedCgpa = null;
  let activeTab = 'sgpa'; // 'sgpa' | 'cgpa'

  const computeAndRender = () => {
    mountElement.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div class="calculator-tabs">
          <button class="calc-tab ${activeTab === 'sgpa' ? 'active' : ''}" id="tab-sgpa-trigger">SGPA Calculator</button>
          <button class="calc-tab ${activeTab === 'cgpa' ? 'active' : ''}" id="tab-cgpa-trigger">CGPA Calculator</button>
        </div>

        <!-- SGPA SHEET -->
        <div id="sheet-sgpa" style="display: ${activeTab === 'sgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your course credit hours and letter grade. SGPA is calculated as weighted average of grade points.
          </p>

          <div class="calc-row-header">
            <span>Course Title (Optional)</span>
            <span>Credits (Weight)</span>
            <span>Letter Grade</span>
            <span></span>
          </div>

          <div id="sgpa-rows-container">
            ${sgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input sgpa-course-name"
                  placeholder="e.g. Mathematics I"
                  value="${escapeHTML(row.courseName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  class="form-input sgpa-credits"
                  min="1"
                  max="10"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <select class="form-select sgpa-grade" data-idx="${idx}">
                  ${Object.keys(GRADE_POINTS).map(g => `
                    <option value="${g}" ${row.grade === g ? 'selected' : ''}>${g} (GP: ${GRADE_POINTS[g]})</option>
                  `).join('')}
                </select>
                <button 
                  class="btn btn-danger btn-sm btn-remove-sgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${sgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-sgpa-row" class="btn btn-secondary btn-sm">+ Add Course</button>
            <button id="btn-calc-sgpa" class="btn btn-primary btn-sm">Calculate SGPA</button>
          </div>

          ${calculatedSgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease;">
              <p style="font-weight: 600; font-size: 15px;">YOUR SGPA IS</p>
              <h2 class="result-val">${calculatedSgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Calculation: Sum(Credits * GradePoints) / Sum(Credits)</p>
            </div>
          ` : ''}
        </div>

        <!-- CGPA SHEET -->
        <div id="sheet-cgpa" style="display: ${activeTab === 'cgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your SGPA and total credits earned per semester. CGPA is computed as a credit-weighted average.
          </p>

          <div class="calc-row-header">
            <span>Semester</span>
            <span>SGPA (0.00 - 10.00)</span>
            <span>Credits (Weight)</span>
            <span></span>
          </div>

          <div id="cgpa-rows-container">
            ${cgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input cgpa-sem-name"
                  value="${escapeHTML(row.semesterName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  class="form-input cgpa-sgpa"
                  placeholder="e.g. 8.42"
                  value="${row.sgpa}"
                  data-idx="${idx}"
                  required
                />
                <input
                  type="number"
                  min="1"
                  max="40"
                  class="form-input cgpa-credits"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <button 
                  class="btn btn-danger btn-sm btn-remove-cgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${cgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-cgpa-row" class="btn btn-secondary btn-sm">+ Add Semester</button>
            <button id="btn-calc-cgpa" class="btn btn-primary btn-sm">Calculate CGPA</button>
          </div>

          ${calculatedCgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease; background: linear-gradient(135deg, #15803d 0%, #22c55e 100%)">
              <p style="font-weight: 600; font-size: 15px;">YOUR CGPA IS</p>
              <h2 class="result-val">${calculatedCgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Credit-weighted CGPA calculated across semesters.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    refreshIcons();

    // Event Triggers
    document.getElementById('tab-sgpa-trigger').addEventListener('click', () => { activeTab = 'sgpa'; computeAndRender(); });
    document.getElementById('tab-cgpa-trigger').addEventListener('click', () => { activeTab = 'cgpa'; computeAndRender(); });

    // SGPA triggers
    document.getElementById('btn-add-sgpa-row').addEventListener('click', () => {
      sgpaRows.push({ id: Date.now(), courseName: '', credits: 3, grade: 'A' });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-sgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        sgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    // Save values typed in input fields back to state
    document.querySelectorAll('.sgpa-course-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].courseName = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].credits = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-grade').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.getAttribute('data-idx'));
        sgpaRows[idx].grade = e.target.value;
      });
    });

    document.getElementById('btn-calc-sgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      sgpaRows.forEach(row => {
        const cred = parseFloat(row.credits);
        const pts = GRADE_POINTS[row.grade];
        if (!isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (cred * pts);
        }
      });
      calculatedSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });

    // CGPA triggers
    document.getElementById('btn-add-cgpa-row').addEventListener('click', () => {
      cgpaRows.push({ id: Date.now(), semesterName: `Semester ${cgpaRows.length + 1}`, sgpa: '', credits: 20 });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-cgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        cgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    document.querySelectorAll('.cgpa-sem-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].semesterName = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-sgpa').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].sgpa = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].credits = e.target.value;
      });
    });

    document.getElementById('btn-calc-cgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      cgpaRows.forEach(row => {
        const sg = parseFloat(row.sgpa);
        const cred = parseFloat(row.credits);
        if (!isNaN(sg) && sg >= 0 && sg <= 10 && !isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (sg * cred);
        }
      });
      calculatedCgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });
  };

  computeAndRender();
}

// 5. ADMIN DASHBOARD VIEW
async function renderAdminDashboardView() {
  const roleLabel = document.getElementById('admin-panel-role-label');
  const errorAlert = document.getElementById('admin-error-alert');
  const pendingCount = document.getElementById('pending-users-count');
  const pendingContainer = document.getElementById('pending-users-list-container');
  const allCount = document.getElementById('all-users-count');
  const allContainer = document.getElementById('all-users-list-container');
  const directoryHint = document.getElementById('admin-directory-hint');
  const tabsContainer = document.getElementById('directory-tabs');

  roleLabel.textContent = currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin';
  errorAlert.style.display = 'none';

  if (currentUser.role === 'superadmin') {
    directoryHint.textContent = 'Super Admin view: You have full deletion and admin promotion privileges.';
  } else {
    directoryHint.textContent = 'Admin view: You can manage and delete Student accounts only.';
  }

  pendingContainer.innerHTML = '<div class="empty-state">Loading approvals...</div>';
  allContainer.innerHTML = '<div class="empty-state">Loading users...</div>';

  try {
    const pending = await api.getPendingUsers();
    pendingCount.textContent = pending.length;

    if (pending.length === 0) {
      pendingContainer.innerHTML = `<div class="empty-state" style="padding: 30px;">No registration requests pending approval.</div>`;
    } else {
      pendingContainer.innerHTML = pending.map(u => `
        <div class="user-card">
          <div class="user-info">
            <h5>${escapeHTML(capitalizeName(u.name))}</h5>
            <p>Phone: ${escapeHTML(u.phone)} â€¢ Requested Role: <strong style="text-transform: capitalize; color: var(--primary);">${escapeHTML(u.role)}</strong></p>
            <p style="font-size: 11px; margin-top: 2px;">Registered: ${new Date(u.createdAt).toLocaleString()}</p>
          </div>
          <div class="user-actions">
            <button class="btn btn-primary btn-sm btn-approve-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px; background-color: var(--success); border: none;">
              <i data-lucide="user-check" style="width:14px;height:14px;"></i> Approve
            </button>
            <button class="btn btn-danger btn-sm btn-reject-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
              <i data-lucide="user-x" style="width:14px;height:14px;"></i> Reject
            </button>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.btn-approve-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.approveUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Approval failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-reject-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Reject and delete this registration request?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.rejectUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Rejection failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });
    }

    const all = await api.getAllUsers();
    allCount.textContent = all.length;

    const adminsList = all.filter(u => u.role === 'admin' || u.role === 'superadmin');
    const teachersList = all.filter(u => u.role === 'educator');
    const studentsList = all.filter(u => u.role === 'student');

    const renderTabs = () => {
      tabsContainer.innerHTML = `
        <button class="calc-tab ${activeDirectoryTab === 'admin' ? 'active' : ''}" id="tab-dir-admin">Admin (${adminsList.length})</button>
        <button class="calc-tab ${activeDirectoryTab === 'teacher' ? 'active' : ''}" id="tab-dir-teacher">Teachers (${teachersList.length})</button>
        <button class="calc-tab ${activeDirectoryTab === 'student' ? 'active' : ''}" id="tab-dir-student">Students (${studentsList.length})</button>
      `;

      document.getElementById('tab-dir-admin').addEventListener('click', () => { activeDirectoryTab = 'admin'; directoryVisibleCount = 5; updateDirectoryView(); });
      document.getElementById('tab-dir-teacher').addEventListener('click', () => { activeDirectoryTab = 'teacher'; directoryVisibleCount = 5; updateDirectoryView(); });
      document.getElementById('tab-dir-student').addEventListener('click', () => { activeDirectoryTab = 'student'; directoryVisibleCount = 5; updateDirectoryView(); });
    };

    const updateDirectoryView = () => {
      renderTabs();

      let selectedUsers = [];
      if (activeDirectoryTab === 'admin') selectedUsers = adminsList;
      else if (activeDirectoryTab === 'teacher') selectedUsers = teachersList;
      else if (activeDirectoryTab === 'student') selectedUsers = studentsList;

      if (selectedUsers.length === 0) {
        allContainer.innerHTML = `<div class="empty-state">No users found in this category.</div>`;
        const dirShowMoreContainer = document.getElementById('directory-show-more-container');
        if (dirShowMoreContainer) dirShowMoreContainer.innerHTML = '';
        refreshIcons();
        return;
      }

      const slicedUsers = selectedUsers.slice(0, directoryVisibleCount);

      allContainer.innerHTML = slicedUsers.map(u => {
        const isPrimarySuperAdmin = u.phone === '8218325600';
        const canPromote = currentUser.role === 'superadmin' && u.role === 'admin';
        
        const canDelete = u.id !== currentUser.id && 
                          !isPrimarySuperAdmin && 
                          (currentUser.role === 'superadmin' || (currentUser.role === 'admin' && u.role === 'student'));

        return `
          <div class="user-card" style="padding: 14px 16px;">
            <div class="user-info">
              <h5 style="font-size: 15px; display: flex; align-items: center; gap: 6px;">
                ${escapeHTML(capitalizeName(u.name))}
                ${isPrimarySuperAdmin ? `
                  <span style="font-size: 10px; background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                    Primary Owner
                  </span>
                ` : ''}
              </h5>
              <p style="font-size: 12px;">Phone: ${escapeHTML(u.phone)}</p>
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.role === 'superadmin' ? '#fee2e2' : 'var(--primary-accent)'}; color: ${u.role === 'superadmin' ? '#ef4444' : 'var(--primary-dark)'};">
                  ${u.role === 'superadmin' ? 'Super Admin' : escapeHTML(u.role)}
                </span>
                <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.approved ? '#dcfce7' : '#fee2e2'}; color: ${u.approved ? '#166534' : '#991b1b'};">
                  ${u.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
            <div class="user-actions" style="display: flex; align-items: center;">
              ${u.role === 'educator' && typeof u.points === 'number' ? `
                <span class="user-tag" style="margin: 0 8px 0 0; padding: 4px 10px; font-size: 11px; font-weight: 700; background-color: var(--primary-accent); color: var(--primary-dark);">
                  ${u.points} pts
                </span>
              ` : ''}
              ${u.id !== currentUser.id ? `
                <button class="btn btn-secondary btn-sm btn-message-user" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: var(--primary-accent); color: var(--primary-dark); border-color: var(--primary-accent);" title="Send Notification Message">
                  <i data-lucide="bell" style="width: 12px; height: 12px;"></i> Message
                </button>
                <button class="btn btn-secondary btn-sm btn-admin-reset-password" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #fef08a; color: #854d0e; border-color: #fef08a;" title="Reset user password to 123456">
                  <i data-lucide="key" style="width: 12px; height: 12px;"></i> Reset Password
                </button>
              ` : ''}
              ${canPromote ? `
                <button class="btn btn-secondary btn-sm btn-promote-admin" data-id="${u.id}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd;" title="Promote to Super Admin">
                  <i data-lucide="award" style="width: 12px; height: 12px;"></i> Promote
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}" style="padding: 8px; border-radius: 50%;" title="Delete User">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.btn-promote-admin').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Promote this admin to Super Admin? This action gives them absolute permission.')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
          refreshIcons();
          try {
            const res = await api.promoteUser(btn.getAttribute('data-id'));
            alert(res.message || 'Successfully promoted user to Super Admin!');
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Promotion failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Permanently delete this user account?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
          refreshIcons();
          try {
            await api.deleteUser(btn.getAttribute('data-id'));
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Deletion failed');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-message-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-id');
          const userName = btn.getAttribute('data-name');
          
          const modal = document.getElementById('modal-send-message');
          const userIdInput = document.getElementById('send-message-user-id');
          const nameInput = document.getElementById('send-message-recipient-name');
          const bodyTextarea = document.getElementById('send-message-body');
          const errAlert = document.getElementById('send-message-error-alert');
          
          if (modal && userIdInput && nameInput && bodyTextarea) {
            errAlert.style.display = 'none';
            bodyTextarea.value = '';
            userIdInput.value = userId;
            nameInput.value = userName;
            modal.style.display = 'flex';
            renderMessageTemplates();
          }
        });
      });
      document.querySelectorAll('.btn-admin-reset-password').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userName = btn.getAttribute('data-name');
          const userId = btn.getAttribute('data-id');
          if (!confirm(`Are you sure you want to reset the password for ${userName} to 123456?`)) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
          refreshIcons();
          try {
            const res = await api.adminResetPassword(userId);
            alert(res.message || 'Successfully reset password to 123456!');
          } catch (err) {
            alert(err.message || 'Failed to reset password');
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      // Render Show More button for Directory if needed
      const dirShowMoreContainer = document.getElementById('directory-show-more-container');
      const dirRemaining = selectedUsers.length - directoryVisibleCount;
      if (dirShowMoreContainer) {
        if (dirRemaining > 0) {
          dirShowMoreContainer.innerHTML = `
            <button id="btn-directory-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
              Show More (${dirRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </button>
          `;
          document.getElementById('btn-directory-show-more').addEventListener('click', () => {
            directoryVisibleCount += 10;
            updateDirectoryView();
          });
        } else {
          dirShowMoreContainer.innerHTML = '';
        }
      }

      refreshIcons();
    };

    updateDirectoryView();

    // Fetch and render help requests
    const helpRequestsContainer = document.getElementById('support-requests-list-container');
    const helpRequestsCount = document.getElementById('support-requests-count');

    if (helpRequestsContainer && helpRequestsCount) {
      helpRequestsContainer.innerHTML = '<div class="empty-state">Loading support requests...</div>';

      try {
        const tickets = await api.getHelpRequests();
        helpRequestsCount.textContent = tickets.length;

        if (tickets.length === 0) {
          helpRequestsContainer.innerHTML = '<div class="empty-state">No support requests submitted yet.</div>';
          const supportShowMoreContainer = document.getElementById('support-show-more-container');
          if (supportShowMoreContainer) supportShowMoreContainer.innerHTML = '';
        } else {
          const slicedTickets = tickets.slice(0, helpRequestsVisibleCount);

          helpRequestsContainer.innerHTML = slicedTickets.map(t => {
            const isResolved = t.status === 'resolved';
            const cardClass = isResolved ? 'status-resolved' : 'status-pending';
            const badgeClass = isResolved ? 'status-badge-resolved' : 'status-badge-pending';
            const statusText = isResolved ? 'Resolved' : 'Pending';
            const statusIcon = isResolved ? 'check-circle' : 'clock';
            
            const roleBadge = t.role === 'superadmin' ? 'Super Admin' : (t.role === 'educator' ? 'Educator' : 'Student');
            
            return `
              <div class="ticket-card ${cardClass}">
                <div class="ticket-header">
                  <div class="ticket-user-info">
                    <h5 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHTML(capitalizeName(t.name))}</h5>
                    <div class="ticket-user-meta">
                      <span class="profile-role-badge" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 2px 6px; font-size: 10px; font-weight: 600; text-transform: capitalize;">${roleBadge}</span>
                      <span>â€¢</span>
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(t.phone)}</span>
                      <span>â€¢</span>
                      <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span class="ticket-status-badge ${badgeClass}">
                    <i data-lucide="${statusIcon}" style="width: 14px; height: 14px;"></i> ${statusText}
                  </span>
                </div>
                <div class="ticket-subject" style="font-size: 15px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">Subject: ${escapeHTML(t.subject)}</div>
                <div class="ticket-message" style="font-size: 14px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(t.message)}</div>
                <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px;">
                  <button class="btn btn-secondary btn-sm btn-resolve-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                    ${isResolved ? `
                      <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Mark Pending
                    ` : `
                      <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Mark Resolved
                    `}
                  </button>
                  <button class="btn btn-danger btn-sm btn-delete-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete Request
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Bind resolve handler
          helpRequestsContainer.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Updating...';
              refreshIcons();
              try {
                await api.resolveHelpRequest(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to update request');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                refreshIcons();
              }
            });
          });

          // Bind delete handler
          helpRequestsContainer.querySelectorAll('.btn-delete-ticket').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (!confirm('Are you sure you want to permanently delete this help request?')) return;
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Deleting...';
              refreshIcons();
              try {
                await api.deleteHelpRequest(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to delete request');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                refreshIcons();
              }
            });
          });

          // Render Show More button for Support requests if needed
          const supportShowMoreContainer = document.getElementById('support-show-more-container');
          const supportRemaining = tickets.length - helpRequestsVisibleCount;
          if (supportShowMoreContainer) {
            if (supportRemaining > 0) {
              supportShowMoreContainer.innerHTML = `
                <button id="btn-support-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                  Show More (${supportRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </button>
              `;
              document.getElementById('btn-support-show-more').addEventListener('click', () => {
                helpRequestsVisibleCount += 10;
                renderAdminDashboardView();
              });
            } else {
              supportShowMoreContainer.innerHTML = '';
            }
          }
        }
      } catch (err) {
        console.error('Error fetching help requests:', err);
        helpRequestsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load support requests: ${escapeHTML(err.message)}</div>`;
      }
    }

    // Fetch and render superadmin notification messages list
    const superadminMessagesSection = document.getElementById('superadmin-messages-section');
    const superadminMessagesContainer = document.getElementById('superadmin-messages-list-container');
    const superadminMessagesCount = document.getElementById('superadmin-messages-count');

    if (currentUser.role === 'superadmin' && superadminMessagesSection && superadminMessagesContainer && superadminMessagesCount) {
      superadminMessagesSection.style.display = 'block';
      superadminMessagesContainer.innerHTML = '<div class="empty-state">Loading sent messages...</div>';

      try {
        const notifications = await api.getAllNotifications();
        superadminMessagesCount.textContent = notifications.length;

        if (notifications.length === 0) {
          superadminMessagesContainer.innerHTML = '<div class="empty-state">No notification messages sent yet.</div>';
          const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
          if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
        } else {
          const slicedNotifications = notifications.slice(0, notificationsVisibleCount);

          superadminMessagesContainer.innerHTML = slicedNotifications.map(n => {
            const seenLabelClass = n.read ? 'status-badge-resolved' : 'status-badge-pending';
            const seenText = n.read ? 'seen' : 'unseen';
            const seenIcon = n.read ? 'eye' : 'eye-off';
            
            return `
              <div class="ticket-card" style="border-left: 4px solid ${n.read ? '#10b981' : '#eab308'}; margin-bottom: 12px; padding: 14px 16px;">
                <div class="ticket-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div class="ticket-user-info">
                    <h5 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                      To: ${escapeHTML(capitalizeName(n.recipient.name))} (${escapeHTML(n.recipient.phone)})
                    </h5>
                    <span style="font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span class="ticket-status-badge ${seenLabelClass}" style="text-transform: capitalize; padding: 2px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                    <i data-lucide="${seenIcon}" style="width: 12px; height: 12px;"></i> ${seenText}
                  </span>
                </div>
                <div class="ticket-message" style="font-size: 13px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(n.message)}</div>
                <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 10px;">
                  ${!n.read ? `
                    <button class="btn btn-secondary btn-sm btn-edit-notification" data-id="${n.id}" data-raw="${escapeHTML(n.rawMessage)}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; background-color: #f1f5f9; border-color: #cbd5e1; color: #475569;">
                      <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Edit Message
                    </button>
                  ` : ''}
                  <button class="btn btn-danger btn-sm btn-delete-notification" data-id="${n.id}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Delete
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Bind Edit button click
          superadminMessagesContainer.querySelectorAll('.btn-edit-notification').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const rawMessage = btn.getAttribute('data-raw');
              
              const newMsgBody = prompt('Edit your message body:', rawMessage);
              if (newMsgBody === null) return; // user cancelled
              
              if (!newMsgBody.trim()) {
                alert('Message body cannot be empty');
                return;
              }

              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = 'Saving...';

              try {
                await api.updateNotification(id, newMsgBody.trim());
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to update message');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                refreshIcons();
              }
            });
          });

          // Bind Delete button click
          superadminMessagesContainer.querySelectorAll('.btn-delete-notification').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (!confirm('Are you sure you want to delete this message?')) return;
              
              const originalHTML = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = 'Deleting...';

              try {
                await api.deleteNotification(id);
                await renderAdminDashboardView();
              } catch (err) {
                alert(err.message || 'Failed to delete message');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                refreshIcons();
              }
            });
          });

          // Render Show More button for Sent notifications if needed
          const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
          const messagesRemaining = notifications.length - notificationsVisibleCount;
          if (messagesShowMoreContainer) {
            if (messagesRemaining > 0) {
              messagesShowMoreContainer.innerHTML = `
                <button id="btn-messages-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                  Show More (${messagesRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </button>
              `;
              document.getElementById('btn-messages-show-more').addEventListener('click', () => {
                notificationsVisibleCount += 10;
                renderAdminDashboardView();
              });
            } else {
              messagesShowMoreContainer.innerHTML = '';
            }
          }
        }
      } catch (err) {
        console.error('Error fetching sent notifications:', err);
        superadminMessagesContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load sent notifications: ${escapeHTML(err.message)}</div>`;
      }
    } else if (superadminMessagesSection) {
      superadminMessagesSection.style.display = 'none';
      const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
      if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
    }

    await renderPendingContributions();

    refreshIcons();

  } catch (err) {
    errorAlert.textContent = err.message || 'Failed to load control panel directory';
    errorAlert.style.display = 'block';
  }
}

// --- MODAL UTILITIES ---

function closeAllModals() {
  document.getElementById('modal-folder').style.display = 'none';
  document.getElementById('modal-upload').style.display = 'none';
  if (document.getElementById('modal-edit-document')) document.getElementById('modal-edit-document').style.display = 'none';
  if (document.getElementById('modal-move-document')) document.getElementById('modal-move-document').style.display = 'none';
  if (document.getElementById('modal-send-message')) document.getElementById('modal-send-message').style.display = 'none';
  if (document.getElementById('modal-view-notification')) document.getElementById('modal-view-notification').style.display = 'none';

  // Stop active camera stream if any
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
  const galleryWrapper = document.getElementById('scan-gallery-and-actions');
  if (streamWrapper) streamWrapper.style.display = 'none';
  if (galleryWrapper) galleryWrapper.style.display = 'block';
}

function openFolderModal(sectionType, folderId = '', folderName = '') {
  document.getElementById('modal-folder-id').value = folderId;
  document.getElementById('modal-folder-section-type').value = sectionType;
  document.getElementById('modal-folder-name').value = folderName;
  
  const title = document.getElementById('modal-folder-title');
  if (folderId) {
    title.textContent = 'Rename Subject Folder';
  } else {
    title.textContent = 'Add Subject Folder';
  }

  document.getElementById('modal-folder').style.display = 'flex';
  document.getElementById('modal-folder-name').focus();
}

// Compress image client side using Canvas to Jpeg 0.7
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          dataUrl,
          width,
          height
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderScanPreviewGallery() {
  const gallery = document.getElementById('scan-preview-gallery');
  const container = document.getElementById('scan-preview-container');
  const btnClear = document.getElementById('btn-scan-clear');
  
  if (!gallery) return;
  
  gallery.innerHTML = '';
  
  if (scanImages.length === 0) {
    if (container) container.style.display = 'none';
    if (btnClear) btnClear.style.display = 'none';
    return;
  }
  
  if (container) container.style.display = 'block';
  if (btnClear) btnClear.style.display = 'inline-block';
  
  scanImages.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'scan-thumbnail-item';
    item.style.cssText = 'position: relative; border-radius: var(--radius-sm); border: 1px solid var(--border-color); overflow: hidden; aspect-ratio: 3/4; display: flex; flex-direction: column; background: #000; box-shadow: var(--shadow-sm);';
    
    item.innerHTML = `
      <img src="${img.dataUrl}" class="scan-thumbnail-img" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />
      <div class="scan-thumb-controls" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: space-between; align-items: center; padding: 4px; z-index: 2;">
        <button type="button" class="thumb-control-btn btn-left" style="background: none; border: none; color: #fff; padding: 2px; cursor: pointer; display: flex; align-items: center; opacity: ${idx === 0 ? 0.3 : 1};" ${idx === 0 ? 'disabled' : ''}>
          <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
        </button>
        <span class="thumb-page-num" style="color: #fff; font-size: 10px; font-weight: bold;">P. ${idx + 1}</span>
        <button type="button" class="thumb-control-btn btn-right" style="background: none; border: none; color: #fff; padding: 2px; cursor: pointer; display: flex; align-items: center; opacity: ${idx === scanImages.length - 1 ? 0.3 : 1};" ${idx === scanImages.length - 1 ? 'disabled' : ''}>
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
      <button type="button" class="thumb-edit-btn" style="position: absolute; top: 4px; left: 4px; background: rgba(37, 99, 235, 0.9); border: none; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; padding: 0;">
        <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
      </button>
      <button type="button" class="thumb-delete-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); border: none; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; padding: 0;">
        <i data-lucide="x" style="width: 12px; height: 12px;"></i>
      </button>
    `;
    
    item.querySelector('.btn-left').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx > 0) {
        const temp = scanImages[idx];
        scanImages[idx] = scanImages[idx - 1];
        scanImages[idx - 1] = temp;
        renderScanPreviewGallery();
      }
    });
    
    item.querySelector('.btn-right').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx < scanImages.length - 1) {
        const temp = scanImages[idx];
        scanImages[idx] = scanImages[idx + 1];
        scanImages[idx + 1] = temp;
        renderScanPreviewGallery();
      }
    });

    item.querySelector('.thumb-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      loadEditor(idx);
    });
    
    item.querySelector('.thumb-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      scanImages.splice(idx, 1);
      renderScanPreviewGallery();
    });
    
    gallery.appendChild(item);
  });
  
  if (window.lucide) {
    window.refreshIcons();
  }
}

// --- SCAN IMAGE EDITOR UTILITIES ---

function updateSliderLabels() {
  document.getElementById('val-crop-left').textContent = document.getElementById('range-crop-left').value;
  document.getElementById('val-crop-right').textContent = document.getElementById('range-crop-right').value;
  document.getElementById('val-crop-top').textContent = document.getElementById('range-crop-top').value;
  document.getElementById('val-crop-bottom').textContent = document.getElementById('range-crop-bottom').value;
}

function drawEditorCanvas(applyCrop = false) {
  const canvas = document.getElementById('editor-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const origW = editorImg.width;
  const origH = editorImg.height;
  
  // Crop parameters (fractions of original size)
  const cL = parseFloat(document.getElementById('range-crop-left').value) / 100;
  const cR = parseFloat(document.getElementById('range-crop-right').value) / 100;
  const cT = parseFloat(document.getElementById('range-crop-top').value) / 100;
  const cB = parseFloat(document.getElementById('range-crop-bottom').value) / 100;
  
  // Crop bounds on original image
  const cropX = origW * cL;
  const cropY = origH * cT;
  const cropW = origW * (1 - cL - cR);
  const cropH = origH * (1 - cT - cB);
  
  // Set dimensions based on rotation
  const is90or270 = (editorRotation === 90 || editorRotation === 270);
  const renderW = applyCrop ? cropW : origW;
  const renderH = applyCrop ? cropH : origH;
  
  canvas.width = is90or270 ? renderH : renderW;
  canvas.height = is90or270 ? renderW : renderH;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Translate and rotate around center
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((editorRotation * Math.PI) / 180);
  
  const drawW = applyCrop ? cropW : origW;
  const drawH = applyCrop ? cropH : origH;
  const drawX = applyCrop ? cropX : 0;
  const drawY = applyCrop ? cropY : 0;
  
  ctx.drawImage(
    editorImg,
    drawX, drawY, drawW, drawH,
    -renderW / 2, -renderH / 2, renderW, renderH
  );
  
  ctx.restore();
  
  // Apply image filters (B&W or grayscale)
  if (editorFilter === 'gray' || editorFilter === 'bw') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      if (editorFilter === 'bw') {
        // High-contrast document scanner filter threshold
        gray = (gray > 120) ? 255 : 0;
      }
      
      data[i] = gray;
      data[i+1] = gray;
      data[i+2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  
  // Draw crop guides overlay if not compiling final cropped image
  if (!applyCrop && (cL > 0 || cR > 0 || cT > 0 || cB > 0)) {
    ctx.save();
    
    // Transform coordinates back to current rotation space to draw overlay
    if (editorRotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (editorRotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (editorRotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
    }
    
    // Draw Guidelines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    
    // Darken cropped margins
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    // Top
    ctx.fillRect(0, 0, origW, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropH, origW, origH - cropY - cropH);
    // Left
    ctx.fillRect(0, cropY, cropX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, origW - cropX - cropW, cropH);
    
    ctx.restore();
  }
}

function loadEditor(idx) {
  editingIndex = idx;
  editorRotation = 0;
  editorFilter = 'original';
  
  // Reset crop sliders
  document.getElementById('range-crop-left').value = 0;
  document.getElementById('range-crop-right').value = 0;
  document.getElementById('range-crop-top').value = 0;
  document.getElementById('range-crop-bottom').value = 0;
  updateSliderLabels();
  
  // Show loading indicator or block UI
  editorImg.onload = function() {
    drawEditorCanvas();
    const modal = document.getElementById('modal-image-editor');
    if (modal) modal.style.display = 'flex';
  };
  editorImg.src = scanImages[idx].dataUrl;
}

// Initializing event listeners for the editor
function initEditorEventHandlers() {
  const btnRotate = document.getElementById('btn-editor-rotate');
  const btnFilterBw = document.getElementById('btn-editor-filter-bw');
  const btnFilterGray = document.getElementById('btn-editor-filter-gray');
  const btnReset = document.getElementById('btn-editor-reset');
  const btnSave = document.getElementById('btn-editor-save');
  const btnCancel = document.getElementById('modal-image-editor-cancel');
  const btnClose = document.getElementById('modal-image-editor-close');
  
  const sliders = [
    'range-crop-left',
    'range-crop-right',
    'range-crop-top',
    'range-crop-bottom'
  ];

  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      editorRotation = (editorRotation + 90) % 360;
      drawEditorCanvas();
    });
  }

  if (btnFilterBw) {
    btnFilterBw.addEventListener('click', () => {
      editorFilter = (editorFilter === 'bw') ? 'original' : 'bw';
      drawEditorCanvas();
    });
  }

  if (btnFilterGray) {
    btnFilterGray.addEventListener('click', () => {
      editorFilter = (editorFilter === 'gray') ? 'original' : 'gray';
      drawEditorCanvas();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      editorRotation = 0;
      editorFilter = 'original';
      sliders.forEach(id => {
        document.getElementById(id).value = 0;
      });
      updateSliderLabels();
      drawEditorCanvas();
    });
  }

  sliders.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateSliderLabels();
        drawEditorCanvas();
      });
    }
  });

  const closeEditorModal = () => {
    const modal = document.getElementById('modal-image-editor');
    if (modal) modal.style.display = 'none';
  };

  if (btnCancel) btnCancel.addEventListener('click', closeEditorModal);
  if (btnClose) btnClose.addEventListener('click', closeEditorModal);

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      // Compile canvas output with crop applied
      drawEditorCanvas(true);
      const canvas = document.getElementById('editor-canvas');
      if (canvas && editingIndex !== null) {
        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        scanImages[editingIndex] = {
          dataUrl: finalDataUrl,
          width: canvas.width,
          height: canvas.height
        };
        closeEditorModal();
        renderScanPreviewGallery();
      }
    });
  }
}

function openUploadModal(docType, folderId = null, folderName = '') {
  document.getElementById('upload-error-alert').style.display = 'none';
  document.getElementById('upload-section-type').value = docType;
  document.getElementById('upload-folder-id').value = folderId || '';
  document.getElementById('upload-folder-name').value = folderName;
  
  const titleEl = document.getElementById('modal-upload-title');
  const subjectDisplayGroup = document.getElementById('upload-subject-display-group');
  const subjectDisplayInp = document.getElementById('upload-doc-subject-display');
  const syllabusGroup = document.getElementById('upload-syllabus-subject-group');
  
  // Set upload title heading
  if (docType === 'notes') {
    titleEl.textContent = 'Upload Notes PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'paper') {
    titleEl.textContent = 'Upload Previous Year Paper (PYQ) PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'lab_manual') {
    titleEl.textContent = 'Upload Lab Manual PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'book') {
    titleEl.textContent = 'Upload Book PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'syllabus') {
    titleEl.textContent = 'Upload Syllabus PDF';
    subjectDisplayGroup.style.display = 'none';
    syllabusGroup.style.display = 'block';
    
    // Load Note Folders to populate syllabus subject tag drop down
    const selectEl = document.getElementById('upload-syllabus-subject-select');
    selectEl.innerHTML = '<option value="Syllabus">General Syllabus</option>';
    notesFoldersList.forEach(n => {
      selectEl.innerHTML += `<option value="${escapeHTML(n.name)}">${escapeHTML(n.name)}</option>`;
    });
  }

  // Reset upload source mode and UI tabs
  uploadSourceMode = 'file';
  const tabFileEl = document.getElementById('tab-upload-file');
  const tabLinkEl = document.getElementById('tab-upload-link');
  const tabScanEl = document.getElementById('tab-upload-scan');
  if (tabFileEl) tabFileEl.classList.add('active');
  if (tabLinkEl) tabLinkEl.classList.remove('active');
  if (tabScanEl) tabScanEl.classList.remove('active');
  
  const groupFileEl = document.getElementById('group-upload-file');
  const groupLinkEl = document.getElementById('group-upload-link');
  const groupScanEl = document.getElementById('group-upload-scan');
  if (groupFileEl) groupFileEl.style.display = 'block';
  if (groupLinkEl) groupLinkEl.style.display = 'none';
  if (groupScanEl) groupScanEl.style.display = 'none';
  
  const linkInputEl = document.getElementById('upload-link-input');
  if (linkInputEl) linkInputEl.value = '';

  // Clear file inputs
  document.getElementById('upload-doc-title').value = '';
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-file-label').textContent = 'Click to browse files';
  
  const scanCameraInput = document.getElementById('scan-camera-input');
  const scanGalleryInput = document.getElementById('scan-gallery-input');
  if (scanCameraInput) scanCameraInput.value = '';
  if (scanGalleryInput) scanGalleryInput.value = '';
  scanImages = [];
  renderScanPreviewGallery();
  
  document.getElementById('modal-upload').style.display = 'flex';
}

// --- MY UPLOADS VIEW RENDERER ---
async function renderMyUploadsView() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  container.innerHTML = '<div class="empty-state"><div style="width: 30px; height: 30px; border: 3px solid var(--primary-accent); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>Loading your uploads...</div>';

  try {
    myUploadsDocsList = await api.getMyUploads();

    const uploadsCountEl = document.getElementById('stats-uploads-count');
    const uploadsLikesEl = document.getElementById('stats-uploads-likes');
    
    if (uploadsCountEl) {
      uploadsCountEl.textContent = myUploadsDocsList.length;
    }
    if (uploadsLikesEl) {
      let totalLikes = 0;
      myUploadsDocsList.forEach(doc => {
        totalLikes += doc.likesCount || 0;
      });
      uploadsLikesEl.textContent = totalLikes;
    }

    renderFilteredMyUploads();
  } catch (err) {
    console.error('Error loading my uploads:', err);
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load uploaded documents: ${escapeHTML(err.message)}</div>`;
  }
}

function renderFilteredMyUploads() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  const searchInput = document.getElementById('my-uploads-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = myUploadsDocsList.filter(doc => {
    const title = doc.title || '';
    const subject = doc.subject || '';
    const type = doc.type || '';
    return title.toLowerCase().includes(query) || 
           subject.toLowerCase().includes(query) ||
           type.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${query ? 'No matching documents found.' : 'You have not uploaded any documents yet.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="docs-list">
      ${filtered.map(doc => {
        let displayType = doc.type;
        if (doc.type === 'notes') displayType = 'Note';
        else if (doc.type === 'paper') displayType = 'PYQ/Paper';
        else if (doc.type === 'lab_manual') displayType = 'Lab Manual';
        else if (doc.type === 'book') displayType = 'Book';
        else if (doc.type === 'syllabus') displayType = 'Syllabus';

        return `
          <div class="doc-card">
            <div class="doc-info">
              <div class="doc-icon-container" style="background-color: var(--primary-accent); color: var(--primary-dark);">
                <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
              </div>
              <div class="doc-meta">
                <h5>${escapeHTML(doc.title)} <span class="user-tag" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 11px;">${displayType}</span></h5>
                <div class="doc-meta-details">
                  <span>Subject: ${escapeHTML(doc.subject || 'General')}</span>
                  <span>â€¢</span>
                  <span>Year: ${escapeHTML(doc.year || 'N/A')}</span>
                  <span>â€¢</span>
                  <span>Uploaded: ${new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div class="doc-actions">
              <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
              </a>
              <button class="btn btn-secondary btn-sm btn-edit-uploaded-doc" 
                data-id="${doc.id}" 
                data-title="${escapeHTML(doc.title)}" 
                data-subject="${escapeHTML(doc.subject || '')}" 
                data-year="${escapeHTML(doc.year || '')}"
                style="padding: 8px 12px;">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Edit
              </button>
              ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document">
                  <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
              <button class="btn btn-danger btn-sm btn-delete-uploaded-doc" data-id="${doc.id}" style="padding: 8px 12px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach event handlers to dynamic edit buttons
  container.querySelectorAll('.btn-edit-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const subject = btn.getAttribute('data-subject');
      const year = btn.getAttribute('data-year');
      openEditDocumentModal(id, title, subject, year);
    });
  });

  // Attach event handlers to dynamic delete buttons
  container.querySelectorAll('.btn-delete-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this document permanently?')) return;
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
      refreshIcons();
      try {
        await api.deleteDocument(id);
        await renderMyUploadsView();
      } catch (err) {
        alert(err.message || 'Failed to delete document');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  });

  refreshIcons();
}

function openEditDocumentModal(docId, title, subject, year) {
  document.getElementById('edit-doc-id').value = docId;
  document.getElementById('edit-doc-title').value = title;
  document.getElementById('edit-doc-subject').value = subject;
  
  const yearSelect = document.getElementById('edit-doc-year');
  if (yearSelect) {
    yearSelect.value = year;
  }
  
  document.getElementById('edit-doc-error-alert').style.display = 'none';
  document.getElementById('modal-edit-document').style.display = 'flex';
}

function openMoveDocumentModal(docId, docTitle) {
  document.getElementById('move-doc-id').value = docId;
  document.getElementById('move-doc-section').value = '';
  document.getElementById('move-doc-folder-group').style.display = 'none';
  document.getElementById('move-doc-folder').removeAttribute('required');
  document.getElementById('move-doc-error-alert').style.display = 'none';
  
  const titleEl = document.querySelector('#modal-move-document .modal-title');
  if (titleEl) {
    titleEl.textContent = `Shift Document: ${docTitle}`;
  }
  
  document.getElementById('modal-move-document').style.display = 'flex';
}

// HELP & SUPPORT VIEW
async function renderSupportView() {
  const errorAlert = document.getElementById('support-error-alert');
  const successAlert = document.getElementById('support-success-alert');

  errorAlert.style.display = 'none';
  successAlert.style.display = 'none';

  const nameInput = document.getElementById('support-user-name');
  const phoneInput = document.getElementById('support-user-phone');
  const roleInput = document.getElementById('support-user-role');

  if (currentUser) {
    nameInput.value = capitalizeName(currentUser.name);
    nameInput.disabled = true;
    phoneInput.value = currentUser.phone;
    phoneInput.disabled = true;
    
    let displayRole = currentUser.role;
    if (currentUser.role === 'educator') displayRole = 'Educator (Teacher)';
    else if (currentUser.role === 'superadmin') displayRole = 'Super Admin';
    roleInput.value = displayRole;
    roleInput.disabled = true;
  } else {
    nameInput.value = '';
    nameInput.disabled = false;
    nameInput.placeholder = 'Enter your name';
    nameInput.required = true;
    
    phoneInput.value = '';
    phoneInput.disabled = false;
    phoneInput.placeholder = 'Enter your phone number';
    phoneInput.required = true;
    
    roleInput.value = '';
    roleInput.disabled = false;
    roleInput.placeholder = 'e.g., student / educator';
    roleInput.required = true;
  }

  // Prefill or clear inputs based on reason query parameter
  const params = getHashQueryParams();
  if (params.reason === 'forgot-password') {
    document.getElementById('support-subject').value = 'Forgot Password Reset Request';
    document.getElementById('support-message').value = 'Hello, I forgot my password. Please reset my password to the default 123456. Thank you!';
  } else {
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
  }
  refreshIcons();
}

// --- FILE TOOLS / GENERATORS PAGE LOGIC ---

let indexRows = [];
let collegeLogoBase64 = '';

async function renderGeneratorsView() {
  // Populate student info defaults from currentUser if logged in
  if (currentUser) {
    const fpStudentName = document.getElementById('fp-student-name');
    const fpStudentRoll = document.getElementById('fp-student-roll');
    
    if (fpStudentName && !fpStudentName.value) fpStudentName.value = currentUser.name;
    if (fpStudentRoll && !fpStudentRoll.value) fpStudentRoll.value = currentUser.phone;
  }

  const btnTabFp = document.getElementById('btn-tab-frontpage');
  const btnTabIdx = document.getElementById('btn-tab-indexpage');
  const sectionFp = document.getElementById('form-section-frontpage');
  const sectionIdx = document.getElementById('form-section-indexpage');

  // Set initial tab styling
  if (btnTabFp && btnTabIdx && sectionFp && sectionIdx) {
    btnTabFp.classList.add('active');
    btnTabIdx.classList.remove('active');
    btnTabFp.style.background = 'var(--primary)';
    btnTabFp.style.color = 'var(--white)';
    btnTabIdx.style.background = 'transparent';
    btnTabIdx.style.color = 'var(--text-main)';
    sectionFp.style.display = 'block';
    sectionIdx.style.display = 'none';
  }

  // Tab switching logic
  if (btnTabFp && btnTabIdx && sectionFp && sectionIdx) {
    btnTabFp.onclick = () => {
      btnTabFp.classList.add('active');
      btnTabIdx.classList.remove('active');
      btnTabFp.style.background = 'var(--primary)';
      btnTabFp.style.color = 'var(--white)';
      btnTabIdx.style.background = 'transparent';
      btnTabIdx.style.color = 'var(--text-main)';
      sectionFp.style.display = 'block';
      sectionIdx.style.display = 'none';
      updatePreview();
    };
    btnTabIdx.onclick = () => {
      btnTabIdx.classList.add('active');
      btnTabFp.classList.remove('active');
      btnTabIdx.style.background = 'var(--primary)';
      btnTabIdx.style.color = 'var(--white)';
      btnTabFp.style.background = 'transparent';
      btnTabFp.style.color = 'var(--text-main)';
      sectionFp.style.display = 'none';
      sectionIdx.style.display = 'block';
      updatePreview();
    };
  }

  // Logo upload setup
  const logoInput = document.getElementById('fp-logo-input');
  const btnClearLogo = document.getElementById('btn-clear-fp-logo');
  if (logoInput && btnClearLogo) {
    logoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('Image size exceeds 2MB limit.');
          logoInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          collegeLogoBase64 = event.target.result;
          btnClearLogo.style.display = 'inline-flex';
          updatePreview();
        };
        reader.readAsDataURL(file);
      }
    };

    btnClearLogo.onclick = () => {
      collegeLogoBase64 = '';
      logoInput.value = '';
      btnClearLogo.style.display = 'none';
      updatePreview();
    };

    if (collegeLogoBase64) {
      btnClearLogo.style.display = 'inline-flex';
    } else {
      btnClearLogo.style.display = 'none';
    }
  }

  // Dynamic Index Entries Setup
  const container = document.getElementById('idx-rows-input-container');
  if (container) {
    if (indexRows.length === 0) {
      // Seed default 3 rows
      indexRows = [
        { sno: '1', title: 'Study of Basic Logic Gates', pageNo: '1-4', datePerf: '2026-02-10', remark: 'Good' },
        { sno: '2', title: 'Implementation of Half Adder & Full Adder', pageNo: '5-9', datePerf: '2026-02-24', remark: 'Completed' },
        { sno: '3', title: 'Design of 4-bit Binary Counter', pageNo: '10-15', datePerf: '2026-03-10', remark: 'Done' }
      ];
    }
    renderIndexInputs();
  }

  // Bind change/input listeners for real-time preview updates
  const fpInputs = [
    'fp-college-name', 'fp-department', 'fp-branch', 'fp-subject-name', 
    'fp-title', 'fp-student-name', 'fp-student-roll', 
    'fp-student-sem', 'fp-teacher-name', 'fp-teacher-title', 'fp-session', 'fp-template'
  ];
  fpInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updatePreview;
      el.onchange = updatePreview;
    }
  });

  const idxInputs = ['idx-template'];
  idxInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updatePreview;
      el.onchange = updatePreview;
    }
  });

  // Dynamic Add Row click
  const btnAddRow = document.getElementById('btn-add-idx-row');
  if (btnAddRow) {
    btnAddRow.onclick = () => {
      const nextSno = indexRows.length + 1;
      indexRows.push({ sno: nextSno.toString(), title: '', pageNo: '', datePerf: '', remark: '' });
      renderIndexInputs();
      updatePreview();
    };
  }

  // Generate Frontpage PDF click
  const btnGenFpPdf = document.getElementById('btn-generate-fp-pdf');
  if (btnGenFpPdf) {
    btnGenFpPdf.onclick = downloadFrontPagePDF;
  }

  // Generate Index PDF click
  const btnGenIdxPdf = document.getElementById('btn-generate-idx-pdf');
  if (btnGenIdxPdf) {
    btnGenIdxPdf.onclick = downloadIndexPDF;
  }

  // Initial update
  updatePreview();
  refreshIcons();
}

function renderIndexInputs() {
  const container = document.getElementById('idx-rows-input-container');
  if (!container) return;

  container.innerHTML = indexRows.map((row, idx) => `
    <div class="idx-row-input-group" data-index="${idx}">
      <span style="font-size: 11px; font-weight: bold; text-align: center;">${idx + 1}</span>
      <input type="text" class="form-input row-title" placeholder="Experiment Title" value="${escapeHTML(row.title)}" />
      <input type="text" class="form-input row-page-no" placeholder="Page.no" value="${escapeHTML(row.pageNo)}" />
      <input type="date" class="form-input row-date-perf" value="${row.datePerf}" />
      <input type="text" class="form-input row-remark" placeholder="Remark" value="${escapeHTML(row.remark || '')}" />
      <button type="button" class="btn btn-danger btn-sm btn-delete-idx-row" style="padding: 4px; height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;" title="Delete Row">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    </div>
  `).join('');

  // Wire input listeners inside dynamic rows
  container.querySelectorAll('.idx-row-input-group').forEach(group => {
    const idx = parseInt(group.getAttribute('data-index'));
    const titleInput = group.querySelector('.row-title');
    const pageInput = group.querySelector('.row-page-no');
    const dateInput = group.querySelector('.row-date-perf');
    const remarkInput = group.querySelector('.row-remark');
    const deleteBtn = group.querySelector('.btn-delete-idx-row');

    if (titleInput) {
      titleInput.oninput = (e) => {
        indexRows[idx].title = e.target.value;
        updatePreview();
      };
    }
    if (pageInput) {
      pageInput.oninput = (e) => {
        indexRows[idx].pageNo = e.target.value;
        updatePreview();
      };
    }
    if (dateInput) {
      dateInput.onchange = (e) => {
        indexRows[idx].datePerf = e.target.value;
        updatePreview();
      };
    }
    if (remarkInput) {
      remarkInput.oninput = (e) => {
        indexRows[idx].remark = e.target.value;
        updatePreview();
      };
    }
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        indexRows.splice(idx, 1);
        // Re-index Sno
        indexRows.forEach((r, i) => r.sno = (i + 1).toString());
        renderIndexInputs();
        updatePreview();
      };
    }
  });

  refreshIcons();
}

function updatePreview() {
  const sheet = document.getElementById('a4-preview-sheet');
  if (!sheet) return;

  const btnTabFp = document.getElementById('btn-tab-frontpage');
  const isFp = btnTabFp && btnTabFp.classList.contains('active');

  if (isFp) {
    const college = document.getElementById('fp-college-name').value.toUpperCase();
    const dept = document.getElementById('fp-department').value.toUpperCase();
    const branch = document.getElementById('fp-branch').value;
    const subjName = document.getElementById('fp-subject-name').value.toUpperCase();
    const title = document.getElementById('fp-title').value.toUpperCase();
    const studentName = document.getElementById('fp-student-name').value;
    const studentRoll = document.getElementById('fp-student-roll').value;
    const studentSem = document.getElementById('fp-student-sem').value;
    const teacherName = document.getElementById('fp-teacher-name').value;
    const session = document.getElementById('fp-session').value;
    const template = document.getElementById('fp-template').value;

    let innerHTML = '';

    if (template === 'classic') {
      innerHTML = `
        <div class="preview-classic-border">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 4cqw; font-weight: 800; line-height: 1.2; margin-bottom: 0.8cqw; font-family: 'Times New Roman', serif;">${escapeHTML(college)}</div>
            <div style="font-size: 2.8cqw; font-weight: bold; color: #555; margin-bottom: 2cqw;">${escapeHTML(dept)}</div>
            <div style="display: flex; justify-content: center; margin: 2cqw 0;">
              ${collegeLogoBase64 ? `
                <img src="${collegeLogoBase64}" style="width: 22cqw; height: 22cqw; object-fit: contain;" />
              ` : `
                <svg width="22cqw" height="22cqw" viewBox="0 0 100 100" style="fill: none; stroke: currentColor; stroke-width: 2;">
                  <circle cx="50" cy="50" r="45" stroke="#000" stroke-width="2"/>
                  <circle cx="50" cy="50" r="40" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>
                  <path d="M30 45 L50 30 L70 45 L70 65 L30 65 Z" fill="#f1f5f9" stroke="#000"/>
                  <path d="M50 30 L50 65" stroke="#000"/>
                  <path d="M35 52 L65 52" stroke="#000"/>
                  <text x="50" y="80" font-size="9" font-family="Helvetica" font-weight="bold" text-anchor="middle" fill="#000">BTKIT</text>
                </svg>
              `}
            </div>
          </div>

          <div style="text-align: center; width: 100%; margin: 2cqw 0;">
            <div style="font-size: 3cqw; font-weight: bold; text-decoration: underline; margin-bottom: 1.5cqw; letter-spacing: 0.1cqw;">${escapeHTML(title)}</div>
            <div style="font-size: 2.5cqw; font-weight: normal; margin-bottom: 0.8cqw;">SUBJECT: <strong>${escapeHTML(subjName)}</strong></div>
            <div style="font-size: 2.3cqw; font-weight: normal;">BRANCH: <strong>${escapeHTML(branch)}</strong></div>
          </div>

          <div style="text-align: center; line-height: 1.5; font-size: 2.4cqw; border-top: 1px solid #000; padding-top: 2cqw; width: 100%;">
            <div><strong>SUBMITTED TO:</strong> ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div style="margin-top: 0.5cqw;"><strong>SUBMITTED BY:</strong> ${escapeHTML(studentName || 'Student Name')}</div>
            <div><strong>ROLL NO:</strong> ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div><strong>YEAR/SEMESTER:</strong> ${escapeHTML(studentSem)}</div>
          </div>

          <div style="text-align: center; font-size: 2.3cqw; font-weight: bold; width: 100%;">
            ACADEMIC SESSION: ${escapeHTML(session)}
          </div>
        </div>
      `;
    } else if (template === 'modern') {
      innerHTML = `
        <div class="preview-modern-accent" style="font-family: Arial, Helvetica, sans-serif;">
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: left; flex: 1;">
              <div style="font-size: 4.2cqw; font-weight: 900; color: var(--primary-dark); line-height: 1.1; margin-bottom: 0.6cqw;">${escapeHTML(college)}</div>
              <div style="font-size: 2.5cqw; font-weight: 600; color: var(--primary); text-transform: uppercase; tracking: 0.5px;">${escapeHTML(dept)}</div>
              <div style="width: 12cqw; height: 1cqw; background: var(--primary); margin-top: 2cqw;"></div>
            </div>
            ${collegeLogoBase64 ? `
              <img src="${collegeLogoBase64}" style="width: 18cqw; height: 18cqw; object-fit: contain; margin-left: 2cqw;" />
            ` : ''}
          </div>

          <div style="width: 100%; text-align: left; margin: 4cqw 0;">
            <span style="font-size: 2.2cqw; font-weight: 700; color: #64748b; text-transform: uppercase;">Assignment File</span>
            <div style="font-size: 4.8cqw; font-weight: 900; margin: 1cqw 0 3cqw 0; line-height: 1.2; border-bottom: 2px solid #e2e8f0; padding-bottom: 2cqw;">${escapeHTML(subjName)}</div>
            <div style="font-size: 2.4cqw; color: #475569; display: flex; flex-direction: column; gap: 0.6cqw;">
              <div>Stream: <strong>${escapeHTML(branch)}</strong></div>
              <div>Type: <strong>${escapeHTML(title)}</strong></div>
            </div>
          </div>

          <div style="text-align: center; line-height: 1.5; font-size: 2.3cqw; background: #f8fafc; padding: 2.5cqw; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%;">
            <div><strong>SUBMITTED TO:</strong> ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div style="margin-top: 0.5cqw;"><strong>SUBMITTED BY:</strong> ${escapeHTML(studentName || 'Student Name')}</div>
            <div><strong>ROLL NO:</strong> ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div><strong>YEAR/SEMESTER:</strong> ${escapeHTML(studentSem)}</div>
          </div>

          <div style="display: flex; justify-content: space-between; width: 100%; border-top: 2px solid #e2e8f0; padding-top: 2.5cqw; font-size: 2.2cqw; color: #64748b; font-weight: bold;">
            <span>SESSION: ${escapeHTML(session)}</span>
            <span>BTKIT DWARAHAT</span>
          </div>
        </div>
      `;
    } else if (template === 'tech') {
      innerHTML = `
        <div class="preview-tech-border" style="font-family: 'Courier New', Courier, monospace;">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 3.6cqw; font-weight: bold; letter-spacing: 0.1cqw; margin-bottom: 1cqw;">[ ${escapeHTML(college)} ]</div>
            <div style="font-size: 2.4cqw; color: #333;">// ${escapeHTML(dept)}</div>
            ${collegeLogoBase64 ? `
              <div style="display: flex; justify-content: center; margin-top: 2cqw;">
                <img src="${collegeLogoBase64}" style="width: 16cqw; height: 16cqw; object-fit: contain; filter: grayscale(100%);" />
              </div>
            ` : ''}
          </div>

          <div style="border: 1px dashed #000; width: 100%; padding: 4cqw 2cqw; text-align: center; box-sizing: border-box; background: rgba(0,0,0,0.01); margin: 2cqw 0;">
            <div style="font-size: 4cqw; font-weight: bold; margin-bottom: 2cqw;">&lt; ${escapeHTML(title)} &gt;</div>
            <div style="font-size: 2.8cqw; margin-bottom: 1cqw;">SUBJECT: ${escapeHTML(subjName)}</div>
            <div style="font-size: 2.5cqw;">BRANCH: ${escapeHTML(branch)}</div>
          </div>

          <div style="width: 100%; text-align: center; font-size: 2.3cqw; border-top: 1px dashed #000; padding-top: 3cqw; line-height: 1.5;">
            <div>* SUBMITTED_TO: ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div>* SUBMITTED_BY: ${escapeHTML(studentName || 'Student Name')}</div>
            <div>* ROLL_NO: ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div>* YEAR_SEMESTER: ${escapeHTML(studentSem)}</div>
          </div>

          <div style="text-align: center; font-size: 2.2cqw; font-weight: bold;">
            // SESSION: ${escapeHTML(session)} //
          </div>
        </div>
      `;
    }

    sheet.innerHTML = innerHTML;
  } else {
    // Index Preview (no details displayed, only standard headers, entries table, and teacher signature)
    const template = document.getElementById('idx-template').value;
    const useZebra = template === 'modern';

    sheet.innerHTML = `
      <div style="padding: 4cqw; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Times New Roman', Times, serif;">
        
        <div style="width: 100%;">
          <div style="font-size: 3.5cqw; font-weight: 800; text-align: center; text-decoration: underline; margin-bottom: 4cqw; text-transform: uppercase;">INDEX SHEET</div>
        </div>

        <div style="flex: 1; width: 100%; overflow: hidden; margin-top: 1cqw;">
          <table style="width: 100%; border-collapse: collapse; font-size: 2cqw; text-align: left;">
            <thead>
              <tr style="background: ${useZebra ? 'var(--primary)' : '#e2e8f0'}; color: ${useZebra ? '#fff' : '#000'}; border: 1px solid #000;">
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 8%;">S.No.</th>
                <th style="border: 1px solid #000; padding: 1cqw; width: 42%;">Title</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 12%;">Page.no</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 15%;">Date</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 10%;">Remark</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 13%;">Teacher's Signature</th>
              </tr>
            </thead>
            <tbody>
              ${indexRows.map((row, i) => `
                <tr style="background: ${useZebra && i % 2 === 1 ? '#f8fafc' : '#fff'}; border: 1px solid #000;">
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.sno)}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; font-weight: bold;">${escapeHTML(row.title || 'Experiment Title')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.pageNo)}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.datePerf ? formatDateStr(row.datePerf) : '')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.remark || '')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 12 - indexRows.length) }).map(() => `
                <tr style="border: 1px solid #000; height: 3.5cqw;">
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; width: 100%; font-size: 2.2cqw; margin-top: 3cqw; border-top: 1px dashed #bbb; padding-top: 2cqw;">
          <span>Signature of Teacher</span>
        </div>

      </div>
    `;
  }
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function downloadFrontPagePDF() {
  await ensureJsPDFLoaded();
  const { jsPDF } = window.jspdf;
  const college = document.getElementById('fp-college-name').value.toUpperCase();
  const dept = document.getElementById('fp-department').value.toUpperCase();
  const branch = document.getElementById('fp-branch').value;
  const subjName = document.getElementById('fp-subject-name').value.toUpperCase();
  const title = document.getElementById('fp-title').value.toUpperCase();
  const studentName = document.getElementById('fp-student-name').value;
  const studentRoll = document.getElementById('fp-student-roll').value;
  const studentSem = document.getElementById('fp-student-sem').value;
  const teacherName = document.getElementById('fp-teacher-name').value;
  const session = document.getElementById('fp-session').value;
  const template = document.getElementById('fp-template').value;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  if (template === 'classic') {
    doc.setDrawColor(0);
    doc.setLineWidth(1.2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.4);
    doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    const collegeLines = doc.splitTextToSize(college, pageWidth - 36);
    let currentY = 24;
    collegeLines.forEach(line => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(dept, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0);

    currentY += 12;
    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth / 2 - 18, currentY, 36, 36);
    } else {
      doc.setLineWidth(0.6);
      doc.circle(pageWidth / 2, currentY + 15, 18);
      doc.setLineDash([1, 1], 0);
      doc.circle(pageWidth / 2, currentY + 15, 16);
      doc.setLineDash([], 0);
      
      doc.setLineWidth(0.4);
      doc.line(pageWidth / 2 - 10, currentY + 15, pageWidth / 2 + 10, currentY + 15);
      doc.line(pageWidth / 2, currentY + 5, pageWidth / 2, currentY + 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("BTKIT", pageWidth / 2, currentY + 29, { align: 'center' });
    }

    currentY += 45;
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    const titleWidth = doc.getTextWidth(title);
    doc.line(pageWidth / 2 - titleWidth / 2, currentY + 1, pageWidth / 2 + titleWidth / 2, currentY + 1);

    currentY += 16;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("SUBJECT: " + subjName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.text("COURSE/BRANCH: " + branch, pageWidth / 2, currentY, { align: 'center' });

    currentY = 225;
    doc.line(16, currentY - 5, pageWidth - 16, currentY - 5);
    
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("SUBMITTED TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, currentY, { align: 'center' });
    doc.text("SUBMITTED BY: " + (studentName || 'Student Name'), pageWidth / 2, currentY + 7, { align: 'center' });
    doc.text("ROLL NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, currentY + 14, { align: 'center' });
    doc.text("YEAR/SEMESTER: " + studentSem, pageWidth / 2, currentY + 21, { align: 'center' });

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("ACADEMIC SESSION: " + session, pageWidth / 2, 272, { align: 'center' });

  } else if (template === 'modern') {
    // 1cm border on all sides in primary blue
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.0);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth - 45, 18, 28, 28);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    const wrapWidth = collegeLogoBase64 ? pageWidth - 75 : pageWidth - 40;
    const collegeLines = doc.splitTextToSize(college, wrapWidth);
    let currentY = 30;
    collegeLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 9;
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(dept, 20, currentY);

    currentY += 8;
    doc.setFillColor(37, 99, 235);
    doc.rect(20, currentY, 30, 2, 'F');

    currentY += 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC COURSE WORK FILE", 20, currentY);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    const subjLines = doc.splitTextToSize(subjName, pageWidth - 45);
    subjLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 9;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text("Stream / Branch: " + branch, 20, currentY);
    currentY += 7;
    doc.text("File Description: " + title, 20, currentY);

    currentY = 205;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(pageWidth / 2 - 50, currentY, 100, 42, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("SUBMITTED TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, currentY + 10, { align: 'center' });
    doc.text("SUBMITTED BY: " + (studentName || 'Student Name'), pageWidth / 2, currentY + 18, { align: 'center' });
    doc.text("ROLL NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, currentY + 26, { align: 'center' });
    doc.text("YEAR/SEMESTER: " + studentSem, pageWidth / 2, currentY + 34, { align: 'center' });

    currentY = 270;
    doc.line(20, currentY, pageWidth - 20, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC SESSION: " + session, 20, currentY + 8);
    doc.text("BTKIT DWARAHAT", pageWidth - 20, currentY + 8, { align: 'right' });

  } else if (template === 'tech') {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineDash([2, 2], 0);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    doc.setLineDash([], 0);

    doc.setFont("courier", "bold");
    doc.setFontSize(15);
    doc.text("[ " + college + " ]", pageWidth / 2, 25, { align: 'center' });

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    doc.text("// " + dept, pageWidth / 2, 33, { align: 'center' });

    let currentY = 38;
    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth / 2 - 15, currentY, 30, 30);
      currentY += 35;
    } else {
      currentY += 5;
    }

    doc.rect(16, currentY, pageWidth - 32, 70);
    doc.setLineDash([1, 2], 0);
    doc.line(16, currentY + 20, pageWidth - 16, currentY + 20);
    doc.line(16, currentY + 50, pageWidth - 16, currentY + 50);
    doc.setLineDash([], 0);

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("< " + title + " >", pageWidth / 2, currentY + 12, { align: 'center' });

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    doc.text("SUBJECT: " + subjName, pageWidth / 2, currentY + 35, { align: 'center' });

    doc.text("BRANCH: " + branch, pageWidth / 2, currentY + 60, { align: 'center' });

    let blockY = currentY + 80;
    doc.line(16, blockY, pageWidth - 16, blockY);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("* SUBMITTED_TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, blockY + 10, { align: 'center' });
    doc.text("* SUBMITTED_BY: " + (studentName || 'Student Name'), pageWidth / 2, blockY + 18, { align: 'center' });
    doc.text("* ROLL_NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, blockY + 26, { align: 'center' });
    doc.text("* YEAR_SEMESTER: " + studentSem, pageWidth / 2, blockY + 34, { align: 'center' });

    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("// SESSION: " + session + " //", pageWidth / 2, 265, { align: 'center' });
  }

  const outName = studentName ? studentName : "Student";
  doc.save(outName.replace(/\s+/g, "_") + "_FrontPage.pdf");
}

async function downloadIndexPDF() {
  await ensureJsPDFLoaded();
  const { jsPDF } = window.jspdf;
  const template = document.getElementById('idx-template').value;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("INDEX SHEET", pageWidth / 2, 22, { align: 'center' });
  const titleWidth = doc.getTextWidth("INDEX SHEET");
  doc.line(pageWidth / 2 - titleWidth / 2, 23.5, pageWidth / 2 + titleWidth / 2, 23.5);

  let currentY = 32;
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setLineWidth(0.3);

  currentY += 8;
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = {
    sno: 12,
    title: 83,
    page: 18,
    date: 22,
    remark: 20,
    sig: 25
  };

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  
  if (template === 'modern') {
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, currentY, tableWidth, 8, 'F');
    doc.setTextColor(255);
  } else {
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, currentY, tableWidth, 8, 'F');
    doc.setTextColor(0);
  }

  doc.rect(margin, currentY, tableWidth, 8);
  let colX = margin;
  doc.text("S.No.", colX + colWidths.sno / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.sno;
  doc.text("Title", colX + 4, currentY + 5.5);
  
  colX += colWidths.title;
  doc.text("Page.no", colX + colWidths.page / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.page;
  doc.text("Date", colX + colWidths.date / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.date;
  doc.text("Remark", colX + colWidths.remark / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.remark;
  doc.text("Teacher's Signature", colX + colWidths.sig / 2, currentY + 5.5, { align: 'center' });

  doc.setTextColor(0);
  currentY += 8;

  doc.setFont("times", "normal");
  const rowHeight = 10;
  
  const allRows = [...indexRows];
  const minRows = 15;
  while (allRows.length < minRows) {
    allRows.push({ sno: '', title: '', pageNo: '', datePerf: '', remark: '' });
  }

  allRows.forEach((row, i) => {
    if (currentY + rowHeight > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
      
      if (template === 'modern') {
        doc.setFillColor(37, 99, 235);
        doc.rect(margin, currentY, tableWidth, 8, 'F');
        doc.setTextColor(255);
      } else {
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, currentY, tableWidth, 8, 'F');
        doc.setTextColor(0);
      }
      doc.rect(margin, currentY, tableWidth, 8);
      let tempX = margin;
      doc.text("S.No.", tempX + colWidths.sno / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.sno;
      doc.text("Title", tempX + 4, currentY + 5.5);
      
      tempX += colWidths.title;
      doc.text("Page.no", tempX + colWidths.page / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.page;
      doc.text("Date", tempX + colWidths.date / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.date;
      doc.text("Remark", tempX + colWidths.remark / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.remark;
      doc.text("Teacher's Signature", tempX + colWidths.sig / 2, currentY + 5.5, { align: 'center' });
      
      doc.setTextColor(0);
      currentY += 8;
    }

    if (template === 'modern' && i % 2 === 1 && row.title) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
    }

    doc.rect(margin, currentY, tableWidth, rowHeight);
    
    let drawX = margin;
    doc.text(row.sno, drawX + colWidths.sno / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.sno;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.setFont("times", row.title ? "bold" : "normal");
    const wrappedTitle = doc.splitTextToSize(row.title, colWidths.title - 8);
    doc.text(wrappedTitle, drawX + 4, currentY + 6);
    
    drawX += colWidths.title;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.setFont("times", "normal");
    doc.text(row.pageNo, drawX + colWidths.page / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.page;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    const formattedDate = row.datePerf ? formatDateStr(row.datePerf) : '';
    doc.text(formattedDate, drawX + colWidths.date / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.date;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.text(row.remark || '', drawX + colWidths.remark / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.remark;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);

    currentY += rowHeight;
  });

  currentY += 12;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("SIGNATURE OF TEACHER", pageWidth - margin - 50, currentY);

  doc.save("IndexSheet.pdf");
}

// --- FORM AND DOM INTERACTIVE HANDLERS ---

function initEventHandlers() {
  
  // Mobile Hamburger Toggle
  const btnHamburger = document.getElementById('btn-hamburger');
  const mobMenu = document.getElementById('mobile-nav-menu');
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (btnHamburger && mobMenu && mobOverlay) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      mobMenu.classList.add('open');
      mobOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // PREVENT BACKGROUND SCROLL
    });
    // Close menu when clicking on the overlay
    mobOverlay.addEventListener('click', () => {
      mobMenu.classList.remove('open');
      mobOverlay.classList.remove('open');
      document.body.style.overflow = ''; // RESTORE BACKGROUND SCROLL
    });
    mobMenu.addEventListener('click', (e) => {
      const trigger = e.target.closest('.btn-download-app-trigger');
      if (trigger) {
        e.preventDefault();
        mobMenu.classList.remove('open');
        mobOverlay.classList.remove('open');
        document.body.style.overflow = '';
        
        const modal = document.getElementById('modal-download-app');
        const errAlert = document.getElementById('download-app-error');
        if (modal) {
          if (errAlert) errAlert.style.display = 'none';
          modal.style.display = 'flex';
        }
      } else {
        e.stopPropagation();
      }
    });
  }

  // Hash Routing
  window.addEventListener('hashchange', router);

  // Footer Year
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  // Download App Modal Listeners for Desktop Navbar
  document.addEventListener('click', (e) => {
    // Only capture triggers outside mobile menu (mobile is handled directly above)
    const trigger = e.target.closest('.desktop-nav .btn-download-app-trigger');
    if (trigger) {
      e.preventDefault();
      const modal = document.getElementById('modal-download-app');
      const errAlert = document.getElementById('download-app-error');
      if (modal) {
        if (errAlert) errAlert.style.display = 'none';
        modal.style.display = 'flex';
      }
    }

    // Capture shift/move document button clicks (for admins)
    const moveTrigger = e.target.closest('.btn-move-doc');
    if (moveTrigger) {
      e.preventDefault();
      const id = moveTrigger.getAttribute('data-id');
      const title = moveTrigger.getAttribute('data-title');
      openMoveDocumentModal(id, title);
    }
  });

  const btnDownloadAndroid = document.getElementById('btn-download-android');
  if (btnDownloadAndroid) {
    btnDownloadAndroid.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = '/studyhub.apk';
      link.download = 'studyhub.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      const modal = document.getElementById('modal-download-app');
      if (modal) modal.style.display = 'none';
    });
  }

  const btnDownloadIos = document.getElementById('btn-download-ios');
  const downloadErrAlert = document.getElementById('download-app-error');
  if (btnDownloadIos && downloadErrAlert) {
    btnDownloadIos.addEventListener('click', () => {
      downloadErrAlert.textContent = 'App for iOS is Under development.';
      downloadErrAlert.style.display = 'block';
    });
  }


  const btnCancelDownload = document.getElementById('modal-download-app-cancel');
  if (btnCancelDownload) {
    btnCancelDownload.addEventListener('click', () => {
      const modal = document.getElementById('modal-download-app');
      if (modal) modal.style.display = 'none';
    });
  }

  // Populate dynamic upload academic years
  const uploadYearSel = document.getElementById('upload-doc-year');
  const years = getAcademicYears();
  uploadYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

  // 1. ANNOUNCEMENT POST FORM
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');
  const addAnnText = document.getElementById('text-add-announcement');

  addAnnBtn.addEventListener('click', () => {
    if (annForm.style.display === 'none') {
      annForm.style.display = 'block';
      addAnnText.textContent = 'Cancel';
    } else {
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
    }
  });

  annForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();
    const docUrl = document.getElementById('ann-link').value.trim();
    if (!title || !content) return;

    const submitBtn = annForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      await api.createAnnouncement(title, content, docUrl || null);
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-content').value = '';
      document.getElementById('ann-link').value = '';
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
      await renderHomeView();
    } catch (err) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 2. LOGIN FORM
  const loginForm = document.getElementById('form-login');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const errorAlert = document.getElementById('login-error-alert');
    const btnContent = document.getElementById('login-btn-content');

    errorAlert.style.display = 'none';
    btnContent.innerHTML = 'Logging in...';

    try {
      const res = await api.login(phone, password);
      currentUser = res.user;
      updateNavbar();
      startNotificationPolling();
      navigate('#/');
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to login';
      errorAlert.style.display = 'block';
      if (err.message && err.message.includes('pending')) {
        errorAlert.className = 'alert alert-warning';
      } else {
        errorAlert.className = 'alert alert-danger';
      }
      btnContent.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Login';
      refreshIcons();
    }
  });

  // Password Visibility Toggles
  const btnShowLoginPass = document.getElementById('btn-show-login-password');
  if (btnShowLoginPass) {
    btnShowLoginPass.addEventListener('click', () => {
      const input = document.getElementById('login-password');
      const icon = btnShowLoginPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowSignupPass = document.getElementById('btn-show-signup-password');
  if (btnShowSignupPass) {
    btnShowSignupPass.addEventListener('click', () => {
      const input = document.getElementById('signup-password');
      const icon = btnShowSignupPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  // Reset Password Visibility Toggles
  const btnShowResetOld = document.getElementById('btn-show-reset-old-password');
  if (btnShowResetOld) {
    btnShowResetOld.addEventListener('click', () => {
      const input = document.getElementById('reset-old-password');
      const icon = btnShowResetOld.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowResetNew = document.getElementById('btn-show-reset-new-password');
  if (btnShowResetNew) {
    btnShowResetNew.addEventListener('click', () => {
      const input = document.getElementById('reset-new-password');
      const icon = btnShowResetNew.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowResetConfirm = document.getElementById('btn-show-reset-confirm-password');
  if (btnShowResetConfirm) {
    btnShowResetConfirm.addEventListener('click', () => {
      const input = document.getElementById('reset-confirm-password');
      const icon = btnShowResetConfirm.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  // Reset Password Form Submit
  const resetPasswordForm = document.getElementById('form-reset-password');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('reset-old-password').value;
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;

      const errorAlert = document.getElementById('reset-password-error-alert');
      const successAlert = document.getElementById('reset-password-success-alert');
      const btnContent = document.getElementById('reset-password-btn-content');

      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';
      btnContent.innerHTML = 'Changing Password...';

      if (newPassword.length < 6) {
        errorAlert.textContent = 'New password must be at least 6 characters';
        errorAlert.style.display = 'block';
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
        return;
      }

      if (newPassword !== confirmPassword) {
        errorAlert.textContent = 'New passwords do not match';
        errorAlert.style.display = 'block';
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
        return;
      }

      try {
        const res = await api.resetPassword(oldPassword, newPassword, confirmPassword);
        successAlert.textContent = res.message || 'Password successfully changed!';
        successAlert.style.display = 'block';
        
        // Clear input fields
        document.getElementById('reset-old-password').value = '';
        document.getElementById('reset-new-password').value = '';
        document.getElementById('reset-confirm-password').value = '';
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to reset password';
        errorAlert.style.display = 'block';
      } finally {
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
      }
    });
  }

  // 3. SIGNUP FORM
  const signupForm = document.getElementById('form-signup');
  const roleSelect = document.getElementById('signup-role');
  const roleHint = document.getElementById('signup-role-hint');

  // Dropdown role hint changer
  if (roleSelect && roleHint) {
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'student') {
        roleHint.textContent = 'âœ“ Instant approval. Get immediate access.';
      } else {
        roleHint.textContent = 'âš  Requires Admin manual approval before logging in.';
      }
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = roleSelect ? roleSelect.value : 'student';

    const errorAlert = document.getElementById('signup-error-alert');
    const successAlert = document.getElementById('signup-success-alert');
    const successText = document.getElementById('signup-success-text');
    const btnContent = document.getElementById('signup-btn-content');

    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    btnContent.innerHTML = 'Creating Account...';

    if (phone.length < 10) {
      errorAlert.textContent = 'Phone number must be at least 10 digits';
      errorAlert.style.display = 'block';
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      refreshIcons();
      return;
    }

    try {
      const res = await api.signup(name, phone, password, role);
      if (res.requiresApproval) {
        successText.textContent = res.message;
        successAlert.style.display = 'flex';
        signupForm.style.display = 'none';
      } else {
        currentUser = res.user;
        updateNavbar();
        startNotificationPolling();
        navigate('#/');
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to sign up';
      errorAlert.style.display = 'block';
    } finally {
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      refreshIcons();
    }
  });

  // 4. FOLDER OPERATION MODAL FORM
  const folderForm = document.getElementById('form-folder');
  
  // Close / Cancel modal listeners
  document.getElementById('modal-folder-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-folder-cancel').addEventListener('click', closeAllModals);

  folderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const folderId = document.getElementById('modal-folder-id').value;
    const name = document.getElementById('modal-folder-name').value.trim();
    const sectionType = document.getElementById('modal-folder-section-type').value;

    if (!name) return;

    const submitBtn = folderForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (folderId) {
        // Rename folder
        await api.renameFolder(folderId, name);
      } else {
        // Create new folder
        await api.createFolder(name, sectionType);
      }
      closeAllModals();

      // Reload active view state
      if (sectionType === 'notes') {
        await renderNotesView();
      } else if (sectionType === 'papers') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      alert(err.message || 'Failed to save subject folder');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 5. DOCUMENT UPLOAD MODAL FORM
  const uploadForm = document.getElementById('form-upload');
  const dragBox = document.getElementById('upload-drag-box');
  const fileInput = document.getElementById('upload-file-input');
  const fileLabel = document.getElementById('upload-file-label');

  document.getElementById('modal-upload-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-upload-cancel').addEventListener('click', closeAllModals);

  // File trigger click
  dragBox.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileLabel.textContent = file.name;
    } else {
      fileLabel.textContent = 'Click to browse files';
    }
  });

  // Source Mode tab switcher events
  const tabUploadFile = document.getElementById('tab-upload-file');
  const tabUploadLink = document.getElementById('tab-upload-link');
  const tabUploadScan = document.getElementById('tab-upload-scan');
  const groupUploadFile = document.getElementById('group-upload-file');
  const groupUploadLink = document.getElementById('group-upload-link');
  const groupUploadScan = document.getElementById('group-upload-scan');
  const uploadLinkInput = document.getElementById('upload-link-input');
  const uploadErrorAlert = document.getElementById('upload-error-alert');

  if (tabUploadFile && tabUploadLink && tabUploadScan) {
    tabUploadFile.addEventListener('click', () => {
      uploadSourceMode = 'file';
      tabUploadFile.classList.add('active');
      tabUploadLink.classList.remove('active');
      tabUploadScan.classList.remove('active');
      if (groupUploadFile) groupUploadFile.style.display = 'block';
      if (groupUploadLink) groupUploadLink.style.display = 'none';
      if (groupUploadScan) groupUploadScan.style.display = 'none';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
      const galleryWrapper = document.getElementById('scan-gallery-and-actions');
      if (streamWrapper) streamWrapper.style.display = 'none';
      if (galleryWrapper) galleryWrapper.style.display = 'block';
    });

    tabUploadLink.addEventListener('click', () => {
      uploadSourceMode = 'link';
      tabUploadFile.classList.remove('active');
      tabUploadLink.classList.add('active');
      tabUploadScan.classList.remove('active');
      if (groupUploadFile) groupUploadFile.style.display = 'none';
      if (groupUploadLink) groupUploadLink.style.display = 'block';
      if (groupUploadScan) groupUploadScan.style.display = 'none';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
      const galleryWrapper = document.getElementById('scan-gallery-and-actions');
      if (streamWrapper) streamWrapper.style.display = 'none';
      if (galleryWrapper) galleryWrapper.style.display = 'block';
    });

    tabUploadScan.addEventListener('click', () => {
      uploadSourceMode = 'scan';
      tabUploadFile.classList.remove('active');
      tabUploadLink.classList.remove('active');
      tabUploadScan.classList.add('active');
      if (groupUploadFile) groupUploadFile.style.display = 'none';
      if (groupUploadLink) groupUploadLink.style.display = 'none';
      if (groupUploadScan) groupUploadScan.style.display = 'block';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
    });
  }

  // Scan file input & button events
  const btnScanCamera = document.getElementById('btn-scan-camera');
  const btnScanGallery = document.getElementById('btn-scan-gallery');
  const btnScanClear = document.getElementById('btn-scan-clear');
  const btnScanCapture = document.getElementById('btn-scan-capture');
  const btnScanStop = document.getElementById('btn-scan-stop');
  const scanVideo = document.getElementById('scan-video');
  const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
  const galleryWrapper = document.getElementById('scan-gallery-and-actions');
  const scanGalleryInput = document.getElementById('scan-gallery-input');

  const handleScanFiles = async (files, triggerButton) => {
    if (!files.length) return;
    
    const originalText = triggerButton.innerHTML;
    triggerButton.disabled = true;
    triggerButton.innerHTML = 'Compressing...';
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        scanImages.push(compressed);
      }
      renderScanPreviewGallery();
    } catch (err) {
      console.error(err);
      alert('Error processing one or more photos.');
    } finally {
      triggerButton.disabled = false;
      triggerButton.innerHTML = originalText;
    }
  };

  if (btnScanCamera && streamWrapper && galleryWrapper) {
    btnScanCamera.addEventListener('click', async () => {
      // Insecure Context Fallback or getUserMedia not supported (e.g. HTTP non-localhost IP browsing)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia is not supported or context is insecure. Falling back to native capture dialog.');
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'file';
        fallbackInput.accept = 'image/*';
        fallbackInput.capture = 'environment';
        fallbackInput.addEventListener('change', async (e) => {
          await handleScanFiles(Array.from(e.target.files), btnScanCamera);
        });
        fallbackInput.click();
        return;
      }

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
        });
        if (scanVideo) {
          scanVideo.srcObject = cameraStream;
          scanVideo.play();
        }
        streamWrapper.style.display = 'block';
        galleryWrapper.style.display = 'none';
      } catch (err) {
        console.error('Camera access error:', err);
        // Automatic fallback on permissions failure or hardware lock
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'file';
        fallbackInput.accept = 'image/*';
        fallbackInput.capture = 'environment';
        fallbackInput.addEventListener('change', async (e) => {
          await handleScanFiles(Array.from(e.target.files), btnScanCamera);
        });
        fallbackInput.click();
      }
    });
  }

  if (btnScanStop && streamWrapper && galleryWrapper) {
    btnScanStop.addEventListener('click', () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      streamWrapper.style.display = 'none';
      galleryWrapper.style.display = 'block';
    });
  }

  if (btnScanCapture && scanVideo) {
    btnScanCapture.addEventListener('click', () => {
      if (!cameraStream) return;
      
      const canvas = document.createElement('canvas');
      const width = scanVideo.videoWidth || 1280;
      const height = scanVideo.videoHeight || 960;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(scanVideo, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      scanImages.push({
        dataUrl,
        width,
        height
      });
      
      // Snap flash visual effect
      scanVideo.style.opacity = '0.3';
      setTimeout(() => {
        scanVideo.style.opacity = '1';
      }, 100);
      
      renderScanPreviewGallery();
    });
  }

  if (btnScanGallery && scanGalleryInput) {
    btnScanGallery.addEventListener('click', () => scanGalleryInput.click());
  }

  if (scanGalleryInput) {
    scanGalleryInput.addEventListener('change', async (e) => {
      await handleScanFiles(Array.from(e.target.files), btnScanGallery);
      scanGalleryInput.value = '';
    });
  }

  if (btnScanClear) {
    btnScanClear.addEventListener('click', () => {
      scanImages = [];
      renderScanPreviewGallery();
    });
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorAlert = document.getElementById('upload-error-alert');
    const docType = document.getElementById('upload-section-type').value;
    const folderId = document.getElementById('upload-folder-id').value;
    const title = document.getElementById('upload-doc-title').value.trim();
    const year = document.getElementById('upload-doc-year').value;
    const uploadBtnSubmit = document.getElementById('btn-upload-submit');

    errorAlert.style.display = 'none';

    if (!title) {
      errorAlert.textContent = 'Please enter a document title';
      errorAlert.style.display = 'block';
      return;
    }

    // Determine subject tag
    let subject = document.getElementById('upload-folder-name').value;
    if (docType === 'syllabus') {
      subject = document.getElementById('upload-syllabus-subject-select').value;
    }

    uploadBtnSubmit.disabled = true;
    uploadBtnSubmit.textContent = 'Processing...';

    try {
      if (uploadSourceMode === 'file') {
        const file = fileInput.files[0];
        if (!file) {
          errorAlert.textContent = 'Please select a PDF file to upload';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          errorAlert.textContent = 'Only PDF documents are allowed';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        // Check file size (10 MB = 10485760 bytes)
        const MAX_FILE_SIZE = 10485760;
        if (file.size > MAX_FILE_SIZE) {
          errorAlert.textContent = `File size too large. Got ${file.size}. Maximum is ${MAX_FILE_SIZE}.`;
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('title', title);
        formData.append('type', docType);
        formData.append('folderId', folderId || '');
        formData.append('subject', subject || '');
        formData.append('year', year || '');

        await request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      } else if (uploadSourceMode === 'scan') {
        if (scanImages.length === 0) {
          errorAlert.textContent = 'Please add/capture at least one photo';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        uploadBtnSubmit.textContent = 'Compiling PDF...';

        await ensureJsPDFLoaded();
        const { jsPDF } = window.jspdf;

        const first = scanImages[0];
        const doc = new jsPDF({
          orientation: first.width > first.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [first.width, first.height]
        });
        doc.addImage(first.dataUrl, 'JPEG', 0, 0, first.width, first.height);

        for (let i = 1; i < scanImages.length; i++) {
          const img = scanImages[i];
          doc.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
          doc.addImage(img.dataUrl, 'JPEG', 0, 0, img.width, img.height);
        }

        const pdfBlob = doc.output('blob');

        const MAX_FILE_SIZE = 10485760;
        if (pdfBlob.size > MAX_FILE_SIZE) {
          errorAlert.textContent = `Generated PDF is too large (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed is 10 MB. Please clear and scan fewer/smaller images.`;
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        uploadBtnSubmit.textContent = 'Uploading PDF...';

        const formData = new FormData();
        formData.append('pdf', pdfBlob, title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf');
        formData.append('title', title);
        formData.append('type', docType);
        formData.append('folderId', folderId || '');
        formData.append('subject', subject || '');
        formData.append('year', year || '');

        await request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      } else {
        const fileUrl = uploadLinkInput.value.trim();
        if (!fileUrl) {
          errorAlert.textContent = 'Please enter a valid document URL';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
          errorAlert.textContent = 'URL must start with http:// or https://';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        await request('/documents/upload', {
          method: 'POST',
          body: {
            title,
            type: docType,
            folderId: folderId && folderId !== 'null' ? folderId : null,
            subject: subject || null,
            year: year || null,
            fileUrl,
            fileName: title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf'
          }
        });
      }

      closeAllModals();
      
      // Reload corresponding view
      if (docType === 'notes') {
        await renderNotesView();
      } else if (docType === 'paper') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to process document';
      errorAlert.style.display = 'block';
    } finally {
      uploadBtnSubmit.disabled = false;
      uploadBtnSubmit.textContent = 'Upload';
    }
  });

  // 6. EDIT DOCUMENT MODAL FORM
  const editDocForm = document.getElementById('form-edit-document');
  const editDocYearSel = document.getElementById('edit-doc-year');
  if (editDocYearSel) {
    editDocYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  }

  const closeEditDocModal = () => {
    document.getElementById('modal-edit-document').style.display = 'none';
  };

  const btnCloseEditDoc = document.getElementById('modal-edit-document-close');
  if (btnCloseEditDoc) {
    btnCloseEditDoc.addEventListener('click', closeEditDocModal);
  }
  const btnCancelEditDoc = document.getElementById('modal-edit-document-cancel');
  if (btnCancelEditDoc) {
    btnCancelEditDoc.addEventListener('click', closeEditDocModal);
  }

  if (editDocForm) {
    editDocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('edit-doc-error-alert');
      const docId = document.getElementById('edit-doc-id').value;
      const title = document.getElementById('edit-doc-title').value.trim();
      const subject = document.getElementById('edit-doc-subject').value.trim();
      const year = editDocYearSel.value;
      const saveBtnSubmit = document.getElementById('btn-edit-document-submit');

      errorAlert.style.display = 'none';

      if (!title) {
        errorAlert.textContent = 'Document title is required';
        errorAlert.style.display = 'block';
        return;
      }

      saveBtnSubmit.disabled = true;
      saveBtnSubmit.textContent = 'Saving changes...';

      try {
        await api.updateDocument(docId, title, subject, year);
        closeEditDocModal();
        
        // Refresh active views
        const hash = window.location.hash || '#/';
        if (hash === '#/my-uploads') {
          await renderMyUploadsView();
        } else if (hash === '#/notes') {
          await renderNotesView();
        } else if (hash === '#/papers') {
          await renderPapersView();
        } else if (hash === '#/resources') {
          await renderResourcesView();
        }
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to save changes';
        errorAlert.style.display = 'block';
      } finally {
        saveBtnSubmit.disabled = false;
        saveBtnSubmit.textContent = 'Save Changes';
      }
    });
  }

    // Move Document Modal Handlers (Admin Only)
    const moveDocForm = document.getElementById('form-move-document');
    const closeMoveDocModal = () => {
      document.getElementById('modal-move-document').style.display = 'none';
    };

    const btnCloseMoveDoc = document.getElementById('modal-move-document-close');
    if (btnCloseMoveDoc) {
      btnCloseMoveDoc.addEventListener('click', closeMoveDocModal);
    }
    const btnCancelMoveDoc = document.getElementById('modal-move-document-cancel');
    if (btnCancelMoveDoc) {
      btnCancelMoveDoc.addEventListener('click', closeMoveDocModal);
    }

    // Handle section selection change
    const moveDocSectionSel = document.getElementById('move-doc-section');
    if (moveDocSectionSel) {
      moveDocSectionSel.addEventListener('change', async (e) => {
        const section = e.target.value;
        const folderGroup = document.getElementById('move-doc-folder-group');
        const folderSelect = document.getElementById('move-doc-folder');

        if (!section || section === 'syllabus') {
          folderGroup.style.display = 'none';
          folderSelect.removeAttribute('required');
        } else {
          folderSelect.innerHTML = '<option value="">Loading folders...</option>';
          folderGroup.style.display = 'block';
          folderSelect.setAttribute('required', 'required');

          try {
            const folders = await api.getFolders(section);
            if (folders.length === 0) {
              folderSelect.innerHTML = '<option value="">No folders available in this section</option>';
            } else {
              folderSelect.innerHTML = '<option value="">Select Target Folder</option>' +
                folders.map(f => `<option value="${f.id}">${escapeHTML(f.name)}</option>`).join('');
            }
          } catch (err) {
            console.error('Error loading folders for move:', err);
            folderSelect.innerHTML = '<option value="">Error loading folders</option>';
          }
        }
      });
    }

    if (moveDocForm) {
      moveDocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorAlert = document.getElementById('move-doc-error-alert');
        const docId = document.getElementById('move-doc-id').value;
        const section = document.getElementById('move-doc-section').value;
        const folderId = document.getElementById('move-doc-folder').value;
        const saveBtnSubmit = document.getElementById('btn-move-document-submit');

        errorAlert.style.display = 'none';

        if (!section) {
          errorAlert.textContent = 'Target section is required';
          errorAlert.style.display = 'block';
          return;
        }

        if (section !== 'syllabus' && !folderId) {
          errorAlert.textContent = 'Target folder is required';
          errorAlert.style.display = 'block';
          return;
        }

        // Map section to targetType for API
        let apiType = '';
        if (section === 'notes') apiType = 'notes';
        else if (section === 'papers') apiType = 'paper';
        else if (section === 'lab_manuals') apiType = 'lab_manual';
        else if (section === 'books') apiType = 'book';
        else if (section === 'roadmaps') apiType = 'roadmap';
        else if (section === 'syllabus') apiType = 'syllabus';

        saveBtnSubmit.disabled = true;
        saveBtnSubmit.textContent = 'Shifting document...';

        try {
          await api.moveDocument(docId, apiType, folderId || null);
          closeMoveDocModal();

          // Refresh active views
          const hash = window.location.hash || '#/';
          if (hash === '#/my-uploads') {
            await renderMyUploadsView();
          } else if (hash === '#/notes') {
            await renderNotesView();
          } else if (hash === '#/papers') {
            await renderPapersView();
          } else if (hash === '#/resources') {
            await renderResourcesView();
          }
        } catch (err) {
          errorAlert.textContent = err.message || 'Failed to move document';
          errorAlert.style.display = 'block';
        } finally {
          saveBtnSubmit.disabled = false;
          saveBtnSubmit.textContent = 'Shift Document';
        }
      });
    }

  // SEND MESSAGE MODAL (Admin Only)
  const sendMessageForm = document.getElementById('form-send-message');
  const closeSendMessageModal = () => {
    document.getElementById('modal-send-message').style.display = 'none';
  };

  const btnCloseSendMessage = document.getElementById('modal-send-message-close');
  if (btnCloseSendMessage) {
    btnCloseSendMessage.addEventListener('click', closeSendMessageModal);
  }
  const btnCancelSendMessage = document.getElementById('modal-send-message-cancel');
  if (btnCancelSendMessage) {
    btnCancelSendMessage.addEventListener('click', closeSendMessageModal);
  }

  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('send-message-error-alert');
      const userId = document.getElementById('send-message-user-id').value;
      const message = document.getElementById('send-message-body').value.trim();
      const submitBtn = document.getElementById('btn-send-message-submit');

      errorAlert.style.display = 'none';

      if (!message) {
        errorAlert.textContent = 'Message body is required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      try {
        await api.sendNotification(userId, message);
        closeSendMessageModal();
        alert('Message sent successfully!');
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to send message';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const btnSaveTemplate = document.getElementById('btn-save-as-template');
  if (btnSaveTemplate) {
    btnSaveTemplate.addEventListener('click', () => {
      const textarea = document.getElementById('send-message-body');
      if (!textarea || !textarea.value.trim()) {
        alert('Please write some text in the message body first to save as a template.');
        return;
      }
      const name = prompt('Enter a name for this template:');
      if (name && name.trim()) {
        saveMessageTemplate(name.trim(), textarea.value.trim());
      }
    });
  }

  // 7. MY UPLOADS SEARCH
  const myUploadsSearch = document.getElementById('my-uploads-search');
  if (myUploadsSearch) {
    myUploadsSearch.addEventListener('input', renderFilteredMyUploads);
  }

  // 8. HELP & SUPPORT SUBMISSION
  const supportForm = document.getElementById('form-support');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('support-subject').value.trim();
      const message = document.getElementById('support-message').value.trim();
      const errorAlert = document.getElementById('support-error-alert');
      const successAlert = document.getElementById('support-success-alert');
      const submitBtn = supportForm.querySelector('button[type="submit"]');
      const btnContent = document.getElementById('support-btn-content');

      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';

      if (!subject || !message) {
        errorAlert.textContent = 'Subject and message are required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Submitting...';
      refreshIcons();

      try {
        const name = document.getElementById('support-user-name').value.trim();
        const phone = document.getElementById('support-user-phone').value.trim();
        const role = document.getElementById('support-user-role').value.trim();

        await api.submitHelpRequest(subject, message, name, phone, role);
        successAlert.textContent = 'Your help and support request has been submitted successfully!';
        successAlert.style.display = 'block';
        document.getElementById('support-subject').value = '';
        document.getElementById('support-message').value = '';

        if (!currentUser) {
          document.getElementById('support-user-name').value = '';
          document.getElementById('support-user-phone').value = '';
          document.getElementById('support-user-role').value = '';
        }
        
        // Scroll support container to top to show success alert
        const supportCard = document.querySelector('.support-card');
        if (supportCard) supportCard.scrollTop = 0;
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to submit help request';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }
}

// Helper to escape HTML characters
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to capitalize first letter of each word in a name
function capitalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- NOTIFICATION POLLING SYSTEM ---
let notificationPollInterval = null;
let isNotificationModalActive = false;

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Play double chime: E5 (659Hz) then A5 (880Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.error("Failed to play notification sound:", err);
  }
}

async function checkNotifications() {
  // If not logged in, or already displaying a notification modal, do nothing
  if (!localStorage.getItem('token') || isNotificationModalActive) return;

  try {
    const unread = await api.getUnreadNotifications();
    if (unread && unread.length > 0) {
      // Pick the first unread notification to show
      const notif = unread[0];
      showNotificationModal(notif);
    }
  } catch (err) {
    console.error('Error polling notifications:', err);
  }
}

function showNotificationModal(notif) {
  isNotificationModalActive = true;
  
  // Play the chime
  playNotificationSound();
  
  const modal = document.getElementById('modal-view-notification');
  const contentEl = document.getElementById('notification-message-content');
  
  if (modal && contentEl) {
    contentEl.textContent = notif.message;
    modal.style.display = 'flex';
    refreshIcons(); // trigger icon rendering inside modal
    
    // Bind dismiss handlers
    const closeBtn = document.getElementById('modal-view-notification-close');
    const ackBtn = document.getElementById('btn-notification-acknowledge');
    
    const handleClose = async () => {
      modal.style.display = 'none';
      isNotificationModalActive = false;
      try {
        await api.markNotificationRead(notif.id);
        // check again for any more queued unread notifications
        setTimeout(checkNotifications, 1000);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    };
    
    if (closeBtn) closeBtn.onclick = handleClose;
    if (ackBtn) ackBtn.onclick = handleClose;
  }
}

function startNotificationPolling() {
  if (notificationPollInterval) clearInterval(notificationPollInterval);
  
  // Check immediately
  checkNotifications();
  
  // Poll every 8 seconds
  notificationPollInterval = setInterval(checkNotifications, 8000);
}

function stopNotificationPolling() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
  }
}

// --- MESSAGE TEMPLATES SYSTEM ---
let messageTemplatesList = [];

async function saveMessageTemplate(name, content) {
  try {
    await api.saveMessageTemplate(name, content);
    await renderMessageTemplates();
  } catch (err) {
    alert(err.message || 'Failed to save template');
  }
}

async function renderMessageTemplates() {
  const container = document.getElementById('quick-templates-container');
  if (!container) return;
  
  container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">Loading templates...</span>';

  try {
    messageTemplatesList = await api.getMessageTemplates();
    if (messageTemplatesList.length === 0) {
      container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">No templates saved.</span>';
      return;
    }

    container.innerHTML = messageTemplatesList.map((t, idx) => `
      <button type="button" class="btn btn-secondary btn-sm btn-select-template" data-index="${idx}" style="font-size: 11px; padding: 4px 8px; background-color: #f1f5f9; border-color: #e2e8f0; color: #475569;">
        ${escapeHTML(t.name)}
      </button>
    `).join('');
    
    container.querySelectorAll('.btn-select-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        const target = messageTemplatesList[idx];
        const textarea = document.getElementById('send-message-body');
        if (textarea && target) {
          textarea.value = target.content;
        }
      });
    });
  } catch (err) {
    console.error('Error rendering templates:', err);
    container.innerHTML = '<span style="font-size: 11px; color: var(--danger);">Failed to load templates.</span>';
  }
}

// --- INITIALIZE APPLICATION ---
async function initApp() {
  // Restore view states from localStorage
  try {
    const savedNotesFolder = localStorage.getItem('currentNotesFolder');
    if (savedNotesFolder && savedNotesFolder !== 'null') currentNotesFolder = JSON.parse(savedNotesFolder);
  } catch (e) { console.error('Error restoring currentNotesFolder:', e); }

  try {
    const savedPapersFolder = localStorage.getItem('currentPapersFolder');
    if (savedPapersFolder && savedPapersFolder !== 'null') currentPapersFolder = JSON.parse(savedPapersFolder);
  } catch (e) { console.error('Error restoring currentPapersFolder:', e); }

  try {
    const savedResourcesFolder = localStorage.getItem('currentResourcesFolder');
    if (savedResourcesFolder && savedResourcesFolder !== 'null') currentResourcesFolder = JSON.parse(savedResourcesFolder);
  } catch (e) { console.error('Error restoring currentResourcesFolder:', e); }

  try {
    const savedRoadmapStack = localStorage.getItem('roadmapFolderStack');
    if (savedRoadmapStack) roadmapFolderStack = JSON.parse(savedRoadmapStack);
  } catch (e) { console.error('Error restoring roadmapFolderStack:', e); }

  const savedResourcesSection = localStorage.getItem('currentResourcesSection');
  if (savedResourcesSection) currentResourcesSection = savedResourcesSection;

  const token = localStorage.getItem('token');
  document.getElementById('view-loading').style.display = 'flex';
  const adSpace = document.getElementById('site-ad-space');
  if (adSpace) adSpace.style.display = 'none';

  if (token) {
    try {
      currentUser = await api.getMe();
      localStorage.setItem('user', JSON.stringify(currentUser));
      startNotificationPolling();
    } catch (err) {
      console.error('Session validation failed:', err.message);
      if (err.status === 401 || err.status === 403) {
        api.logout();
        currentUser = null;
      } else {
        // Fallback to cached localStorage user if server is offline or reconnecting
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            currentUser = JSON.parse(userStr);
            startNotificationPolling();
          } catch (e) {
            api.logout();
            currentUser = null;
          }
        } else {
          api.logout();
          currentUser = null;
        }
      }
    }
  }

  // Pre-load note folders in memory for dropdown tagging inside syllabus upload
  try {
    notesFoldersList = await api.getFolders('notes');
  } catch (err) {
    console.error('Failed pre-loading subjects list', err);
  }

  document.getElementById('view-loading').style.display = 'none';
  
  updateNavbar();
  initEventHandlers();

  initSonicEventHandlers();
  initContributionEventHandlers();
  initEditorEventHandlers();
  
  // Initialize UI theme toggle switch
  if (typeof initThemeToggleHandler === 'function') {
    initThemeToggleHandler();
  }
  
  // Run routing trigger
  await router();
}

// Launch app
window.addEventListener('DOMContentLoaded', initApp);

async function handleLikeToggle(e, viewRefreshCallback) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const docId = btn.getAttribute('data-id');
  if (!docId) return;

  btn.disabled = true;
  try {
    await api.toggleLikeDocument(docId);
    await viewRefreshCallback();
  } catch (err) {
    alert(err.message || 'Failed to toggle like');
    btn.disabled = false;
  }
}

async function renderTeacherDashboardView() {
  const statsOwnUploads = document.getElementById('stats-own-uploads');
  const statsOwnLikes = document.getElementById('stats-own-likes');
  const statsTotalTeacherUploads = document.getElementById('stats-total-teacher-uploads');
  const rankingListContainer = document.getElementById('dashboard-ranking-list');

  if (!statsOwnUploads || !statsOwnLikes || !statsTotalTeacherUploads || !rankingListContainer) return;

  statsOwnUploads.textContent = '...';
  statsOwnLikes.textContent = '...';
  statsTotalTeacherUploads.textContent = '...';
  rankingListContainer.innerHTML = '<div class="empty-state">Loading rankings and stats...</div>';

  try {
    const stats = await api.getTeacherStats();
    statsOwnUploads.textContent = stats.ownFilesCount;
    statsOwnLikes.textContent = stats.ownLikesCount;
    statsTotalTeacherUploads.textContent = stats.totalTeacherFiles;

    const ranking = await api.getTeacherRanking();
    if (ranking.length === 0) {
      rankingListContainer.innerHTML = '<div class="empty-state">No educators registered yet.</div>';
      return;
    }

    rankingListContainer.innerHTML = ranking.map((t, index) => {
      const rankNum = index + 1;
      let trophy = '';
      if (rankNum === 1) trophy = '🏆';
      else if (rankNum === 2) trophy = '🥈';
      else if (rankNum === 3) trophy = '🥉';

      const isSelf = currentUser && currentUser.id === t.id;
      const highlightStyle = isSelf ? 'border-left: 4px solid var(--success); background-color: rgba(34, 197, 94, 0.05);' : '';

      return `
        <div class="card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; ${highlightStyle}">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 18px; font-weight: 800; min-width: 70px; display: flex; align-items: center; gap: 4px;">
              #${rankNum} ${trophy}
            </div>
            <div>
              <h4 style="margin: 0; color: var(--primary-dark); font-size: 15px;">
                ${escapeHTML(capitalizeName(t.name))}
                ${isSelf ? '<span class="user-tag" style="background-color: var(--success-accent); color: var(--success); font-size: 10px; padding: 2px 6px;">You</span>' : ''}
              </h4>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">
                ${t.uploads} uploads â€¢ ${t.likes} likes
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="user-tag" style="font-weight: 700; font-size: 13px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 4px 10px;">
              ${t.points} pts
            </span>
          </div>
        </div>
      `;
    }).join('');

    refreshIcons();
  } catch (err) {
    console.error('Error loading teacher stats/ranking:', err);
    rankingListContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load stats/ranking: ${escapeHTML(err.message)}</div>`;
  }
}

async function renderPendingContributions() {
  const pendingDocsCount = document.getElementById('pending-docs-count');
  const pendingDocsContainer = document.getElementById('pending-docs-list-container');
  if (!pendingDocsContainer) return;

  pendingDocsContainer.innerHTML = '<div class="empty-state">Loading pending contributions...</div>';

  try {
    const pendingDocs = await api.getPendingDocuments();
    if (pendingDocsCount) pendingDocsCount.textContent = pendingDocs.length;

    if (pendingDocs.length === 0) {
      pendingDocsContainer.innerHTML = '<div class="empty-state" style="padding: 30px;">No pending contributions to verify.</div>';
    } else {
      pendingDocsContainer.innerHTML = pendingDocs.map(d => {
        const displayType = d.type === 'notes' ? 'Notes' : (d.type === 'paper' ? 'PYQ/Paper' : 'Lab Manual');
        return `
          <div class="doc-card pending-doc-card" style="margin-bottom: 12px;">
            <div class="doc-info">
              <div class="doc-icon-container">
                <i data-lucide="file-text"></i>
              </div>
              <div class="doc-meta">
                <h5 style="font-size: 16px; margin-bottom: 4px; color: var(--primary-dark); font-weight: 700;">${escapeHTML(d.title)}</h5>
                <p style="font-size: 13px; color: var(--text-main); margin-bottom: 4px;">
                  Category: <strong>${escapeHTML(displayType)}</strong> â€¢ Subject: <strong>${escapeHTML(d.subject || 'N/A')}</strong>
                </p>
                <p style="font-size: 12px; color: var(--text-muted);">
                  Contributor: <strong>${escapeHTML(d.contributorName)}</strong> (${escapeHTML(d.contributorPhone)}) â€¢ Year: ${escapeHTML(d.year || 'N/A')}
                </p>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                  Submitted: ${new Date(d.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div class="pending-doc-actions">
              <a href="${escapeHTML(d.fileUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View File
              </a>
              <button class="btn btn-primary btn-sm btn-approve-doc" data-id="${d.id}" style="background-color: var(--success); border: none; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="check" style="width: 14px; height: 14px;"></i> Accept
              </button>
              <button class="btn btn-danger btn-sm btn-reject-doc" data-id="${d.id}" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Bind approve handlers
      pendingDocsContainer.querySelectorAll('.btn-approve-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.getAttribute('data-id');
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.approveDocument(docId);
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Failed to approve resource');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      // Bind reject handlers
      pendingDocsContainer.querySelectorAll('.btn-reject-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.getAttribute('data-id');
          if (!confirm('Are you sure you want to reject and delete this contribution?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.rejectDocument(docId);
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Failed to reject resource');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });
    }
  } catch (err) {
    console.error('Error rendering pending contributions:', err);
    pendingDocsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load contributions: ${escapeHTML(err.message)}</div>`;
  }
}

function initContributionEventHandlers() {
  const floatingBtn = document.getElementById('btn-floating-contribute');
  const contributeModal = document.getElementById('modal-contribute');
  const closeBtn = document.getElementById('modal-contribute-close');
  const cancelBtn = document.getElementById('modal-contribute-cancel');
  const contributeForm = document.getElementById('form-contribute');
  const categorySelect = document.getElementById('contribute-category');
  const subjectSelect = document.getElementById('contribute-subject');
  const yearSelect = document.getElementById('contribute-doc-year');
  const tabFile = document.getElementById('tab-contribute-file');
  const tabLink = document.getElementById('tab-contribute-link');
  const groupFile = document.getElementById('group-contribute-file');
  const groupLink = document.getElementById('group-contribute-link');
  const linkInput = document.getElementById('contribute-link-input');
  const fileInput = document.getElementById('contribute-file-input');
  const dragBox = document.getElementById('contribute-drag-box');
  const fileLabel = document.getElementById('contribute-file-label');
  const errorAlert = document.getElementById('contribute-error-alert');
  const successAlert = document.getElementById('contribute-success-alert');
  const submitBtn = document.getElementById('btn-contribute-submit');

  const closeContribute = () => {
    if (contributeModal) contributeModal.style.display = 'none';
  };

  if (floatingBtn) {
    floatingBtn.addEventListener('click', () => {
      if (contributeModal) contributeModal.style.display = 'flex';
      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';
      if (contributeForm) contributeForm.reset();
      
      // Populate contributor name
      const contributorNameInput = document.getElementById('contribute-user-name');
      if (contributorNameInput && currentUser) {
        contributorNameInput.value = currentUser.name;
      }

      // Populate academic years
      if (yearSelect) {
        const years = getAcademicYears();
        yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      }

      // Reset tab states
      contributeSourceMode = 'file';
      if (tabFile) tabFile.classList.add('active');
      if (tabLink) tabLink.classList.remove('active');
      if (groupFile) groupFile.style.display = 'block';
      if (groupLink) groupLink.style.display = 'none';
      if (fileLabel) fileLabel.textContent = 'Click to browse files';
      if (subjectSelect) {
        subjectSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject Folder</option>';
      }
      refreshIcons();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeContribute);
  if (cancelBtn) cancelBtn.addEventListener('click', closeContribute);

  if (categorySelect && subjectSelect) {
    categorySelect.addEventListener('change', async () => {
      const category = categorySelect.value;
      subjectSelect.disabled = true;
      subjectSelect.innerHTML = '<option value="" disabled selected>Loading subjects...</option>';
      try {
        const folders = await api.getFolders(category);
        if (folders.length === 0) {
          subjectSelect.innerHTML = '<option value="" disabled selected>No subjects available</option>';
        } else {
          subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject Folder</option>' +
            folders.map(f => `<option value="${f.id}">${escapeHTML(f.name)}</option>`).join('');
          subjectSelect.disabled = false;
        }
      } catch (err) {
        subjectSelect.innerHTML = '<option value="" disabled selected>Error loading subjects</option>';
        console.error('Failed to load folders for category:', err);
      }
    });
  }

  let contributeSourceMode = 'file';
  if (tabFile && tabLink) {
    tabFile.addEventListener('click', () => {
      contributeSourceMode = 'file';
      tabFile.classList.add('active');
      tabLink.classList.remove('active');
      if (groupFile) groupFile.style.display = 'block';
      if (groupLink) groupLink.style.display = 'none';
      if (errorAlert) errorAlert.style.display = 'none';
    });
    tabLink.addEventListener('click', () => {
      contributeSourceMode = 'link';
      tabFile.classList.remove('active');
      tabLink.classList.add('active');
      if (groupFile) groupFile.style.display = 'none';
      if (groupLink) groupLink.style.display = 'block';
      if (errorAlert) errorAlert.style.display = 'none';
    });
  }

  if (dragBox && fileInput) {
    dragBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileLabel.textContent = file.name;
      } else {
        fileLabel.textContent = 'Click to browse files';
      }
    });
  }

  if (contributeForm) {
    contributeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      const title = document.getElementById('contribute-doc-title').value.trim();
      const category = categorySelect.value;
      const folderId = subjectSelect.value;
      const year = yearSelect.value;
      
      if (!title || !category || !folderId) {
        if (errorAlert) {
          errorAlert.textContent = 'All fields (Title, Category, Subject) are required.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      let docType = 'notes';
      if (category === 'papers') docType = 'paper';
      else if (category === 'lab_manuals') docType = 'lab_manual';

      const folderOption = subjectSelect.options[subjectSelect.selectedIndex];
      const subject = folderOption ? folderOption.text : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
      }

      try {
        if (contributeSourceMode === 'file') {
          const file = fileInput.files[0];
          if (!file) {
            throw new Error('Please select a PDF file to upload');
          }
          if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error('Only PDF files are allowed');
          }
          if (file.size > 10485760) {
            throw new Error('File size exceeds the 10 MB limit.');
          }

          const formData = new FormData();
          formData.append('pdf', file);
          formData.append('title', title);
          formData.append('type', docType);
          formData.append('folderId', folderId);
          formData.append('subject', subject);
          formData.append('year', year);

          await api.contributeDocument(formData);
        } else {
          const link = linkInput.value.trim();
          if (!link) {
            throw new Error('Please enter a document URL');
          }
          if (!link.startsWith('http://') && !link.startsWith('https://')) {
            throw new Error('Please enter a valid URL starting with http:// or https://');
          }

          const formData = new FormData();
          formData.append('title', title);
          formData.append('type', docType);
          formData.append('folderId', folderId);
          formData.append('subject', subject);
          formData.append('year', year);
          formData.append('fileUrl', link);
          formData.append('fileName', 'Link Resource');

          await api.contributeDocument(formData);
        }

        if (successAlert) {
          successAlert.textContent = 'Thank you! Your resource has been submitted and is pending admin approval.';
          successAlert.style.display = 'block';
        }
        
        contributeForm.reset();
        if (fileLabel) fileLabel.textContent = 'Click to browse files';
        if (subjectSelect) {
          subjectSelect.disabled = true;
          subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject Folder</option>';
        }

        setTimeout(() => {
          closeContribute();
        }, 2500);

      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to submit contribution';
          errorAlert.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload';
        }
      }
    });
  }
}

async function renderMyContributionsView() {
  const container = document.getElementById('view-my-contributions');
  if (!container) return;

  container.innerHTML = `
    <div class="folder-page-header">
      <div class="folder-breadcrumbs">
        <span class="breadcrumb-active" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="award" style="color: var(--primary); width: 22px; height: 22px;"></i> 
          My Contribution Dashboard
        </span>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <p style="color: var(--text-muted); font-size: 15px; margin: 0;">
        Track your contributed files, approval status, and likes received from other students.
      </p>
    </div>

    <!-- Analytics Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px;">
      <div class="card" style="padding: 24px; text-align: center; border-left: 4px solid var(--success);">
        <div style="color: var(--text-muted); font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Accepted Contributions</div>
        <div id="stats-contributions-accepted" style="font-size: 36px; font-weight: 800; color: var(--success);">0</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Files approved by Admin</p>
      </div>
      <div class="card" style="padding: 24px; text-align: center; border-left: 4px solid var(--primary);">
        <div style="color: var(--text-muted); font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Total Likes Received</div>
        <div id="stats-contributions-likes" style="font-size: 36px; font-weight: 800; color: var(--primary-dark);">0</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Likes on your approved resources</p>
      </div>
    </div>

    <!-- Contributed Files list -->
    <div style="border-top: 1px solid var(--border-color); padding-top: 30px;">
      <h3 class="section-title" style="margin-bottom: 16px; font-size: 20px;">
        <i data-lucide="file-text" style="color: var(--primary); width: 22px; height: 22px;"></i>
        Your Contribution Submissions
      </h3>
      <div id="student-contributions-list" class="docs-list">
        <div class="empty-state">Loading your contributions...</div>
      </div>
    </div>
  `;

  refreshIcons();

  const acceptedEl = document.getElementById('stats-contributions-accepted');
  const likesEl = document.getElementById('stats-contributions-likes');
  const listEl = document.getElementById('student-contributions-list');

  try {
    const response = await request('/documents/my-contributions');
    const contributions = response || [];

    const acceptedFiles = contributions.filter(c => c.status === 'approved');
    const totalAccepted = acceptedFiles.length;
    let totalLikes = 0;
    acceptedFiles.forEach(f => {
      totalLikes += f.likesCount || 0;
    });

    if (acceptedEl) acceptedEl.textContent = totalAccepted;
    if (likesEl) likesEl.textContent = totalLikes;

    if (contributions.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="empty-state">You haven\'t contributed any resources yet. Use the "+" button to start contributing!</div>';
    } else {
      if (listEl) {
        listEl.innerHTML = contributions.map(c => {
          const displayType = c.type === 'notes' ? 'Notes' : (c.type === 'paper' ? 'PYQ/Paper' : 'Lab Manual');
          
          let statusBadge = '';
          if (c.status === 'pending') {
            statusBadge = `<span style="font-size: 11px; font-weight: 700; background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 12px; border: 1px solid #fde68a;">Pending Approval</span>`;
          } else {
            statusBadge = `<span style="font-size: 11px; font-weight: 700; background-color: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; border: 1px solid #86efac;">Approved & Live</span>`;
          }

          return `
            <div class="doc-card" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div class="doc-info">
                <div class="doc-icon-container" style="background-color: ${c.status === 'pending' ? '#fffbeb' : '#f0fdf4'}; color: ${c.status === 'pending' ? '#d97706' : '#16a34a'};">
                  <i data-lucide="file-text"></i>
                </div>
                <div class="doc-meta">
                  <h5 style="font-size: 15px; font-weight: 700; color: var(--primary-dark); margin: 0 0 4px 0;">${escapeHTML(c.title)}</h5>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 4px 0;">
                    Category: <strong>${escapeHTML(displayType)}</strong> â€¢ Subject: <strong>${escapeHTML(c.subject || 'N/A')}</strong>
                  </p>
                  <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
                    Submitted: ${new Date(c.createdAt).toLocaleDateString()} â€¢ Likes: ${c.likesCount}
                  </p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                ${statusBadge}
                ${c.status === 'approved' ? `
                  <a href="${escapeHTML(c.fileUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 6px 12px;"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
    refreshIcons();
  } catch (err) {
    console.error('Error fetching student contributions stats:', err);
    if (listEl) listEl.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load contributions details: ${escapeHTML(err.message)}</div>`;
  }
}



/* --- UI STYLE THEME SWITCHER LOGIC (MODERN / CLASSIC) --- */
function initThemeToggleHandler() {
  const toggle = document.getElementById('ui-theme-toggle');
  if (toggle) {
    const activeTheme = localStorage.getItem('studyhub-ui-theme') || 'modern';
    toggle.checked = (activeTheme === 'modern');

    toggle.addEventListener('change', (e) => {
      const isModern = e.target.checked;
      const targetTheme = isModern ? 'modern' : 'old';
      applyTheme(targetTheme, true);
    });
  }
}

function applyTheme(theme, animate = true) {
  const linkId = 'theme-stylesheet';
  let link = document.getElementById(linkId);
  const href = theme === 'modern' ? 'modern.css?v=1.0.5' : 'old.css?v=1.0.5';

  localStorage.setItem('studyhub-ui-theme', theme);

  // Sync checkboxes across elements if multiple exist
  const toggles = document.querySelectorAll('#ui-theme-toggle');
  toggles.forEach(t => {
    t.checked = (theme === 'modern');
  });

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return;
  }

  if (link.getAttribute('href') === href) {
    return; // Already applied
  }

  if (!animate) {
    link.setAttribute('href', href);
    return;
  }

  const overlay = document.getElementById('theme-transition-overlay');
  if (overlay) {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
  }

  setTimeout(() => {
    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = href;
    newLink.onload = () => {
      link.setAttribute('href', href);
      newLink.remove();
      
      // Refresh lucide icons
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      setTimeout(() => {
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
        }
      }, 150);
    };
    newLink.onerror = () => {
      link.setAttribute('href', href);
      newLink.remove();
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
    };
    document.head.appendChild(newLink);
  }, 250); // Wait for overlay to fade in completely
}
