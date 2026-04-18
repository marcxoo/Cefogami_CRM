import { showToast } from '../components/toast.js';

const CHATBOT_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
let chatSessionId = 'simulator-' + Date.now();

export async function renderChatbot(options = {}) {
  const isStandalone = options.standalone || false;
  const container = document.getElementById('page-content');
  
  const titleSection = isStandalone ? '' : `
      <div class="page-title-section">
        <div>
          <h2 class="page-title"><iconify-icon icon="ci:terminal"></iconify-icon> Simulador de Chat</h2>
          <p class="page-description">Prueba cómo responde el chatbot como si fueras un cliente</p>
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary" id="btn-clear-chat"><iconify-icon icon="ci:trash"></iconify-icon> Limpiar Chat</button>
          <div class="chatbot-status" id="bot-status">
            <span class="status-dot"></span>
            <span>Conectando...</span>
          </div>
        </div>
      </div>
  `;

  container.innerHTML = `
    <div class="animate-fade-in" id="chatbot-page">
      ${titleSection}
      
      <div class="chat-simulator ${isStandalone ? 'standalone-simulator' : ''}">
        <!-- Chat Header (WhatsApp style) -->
        <div class="wa-chat-header">
          <div class="wa-chat-avatar">🍳</div>
          <div class="wa-chat-info">
            <div class="wa-chat-name">Centro Gastronómico Milagro</div>
            <div class="wa-chat-subtitle" id="wa-typing"><iconify-icon icon="ci:terminal" style="vertical-align: middle;"></iconify-icon> Bot activo · Escribe como cliente</div>
          </div>
          <div class="wa-chat-actions">
            <span>📞</span>
            <span>📎</span>
            <span>⋮</span>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="wa-messages" id="wa-messages">
          <div class="wa-date-divider"><span>Hoy</span></div>
          
          <!-- Welcome system message -->
          <div class="wa-system-msg">
            <span>🔒 Los mensajes de esta simulación no se envían a WhatsApp real. Es solo una prueba local del chatbot.</span>
          </div>

          <!-- Initial bot message -->
          <div class="wa-msg wa-msg-received animate-fade-in">
            <div class="wa-msg-bubble">
              <div class="wa-msg-text">¡Hola! 👋 Bienvenido/a al Centro de Formación Gastronómico Milagro.\n\nSoy el asistente virtual. Puedes preguntarme por:\n\n📚 *Cursos* disponibles\n💰 *Precios* y planes de pago\n🕐 *Horarios* de clases\n📍 *Ubicación*\n📋 *Requisitos* de inscripción</div>
              <div class="wa-msg-time"><iconify-icon icon="ci:terminal"></iconify-icon>&nbsp;Bot · ${new Date().toLocaleTimeString('es-EC', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="wa-input-area">
          <button class="wa-input-emoji" title="Sugerencias rápidas" id="btn-suggestions">😊</button>
          <input type="text" class="wa-input-field" id="wa-input" placeholder="Escribe un mensaje como cliente..." autocomplete="off" />
          <button class="wa-send-btn" id="wa-send" title="Enviar">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
          </button>
        </div>
      </div>

      <!-- Quick suggestions -->
      <div class="chat-suggestions" id="chat-suggestions">
        <p class="text-sm text-muted" style="margin-bottom: var(--space-sm);">💡 Prueba estos mensajes:</p>
        <div class="suggestions-grid">
          <button class="suggestion-chip" data-msg="Hola, buenas tardes">👋 Hola, buenas tardes</button>
          <button class="suggestion-chip" data-msg="¿Cuáles son los precios de los cursos?">💰 Precios de cursos</button>
          <button class="suggestion-chip" data-msg="¿Qué horarios tienen?">🕐 Horarios</button>
          <button class="suggestion-chip" data-msg="¿Dónde están ubicados?">📍 Ubicación</button>
          <button class="suggestion-chip" data-msg="Quiero inscribirme, ¿qué necesito?">📋 Requisitos</button>
          <button class="suggestion-chip" data-msg="¿Qué cursos tienen disponibles?">📚 Cursos disponibles</button>
          <button class="suggestion-chip" data-msg="¿Cuánto cuesta el curso de pastelería?">🎂 Precio pastelería</button>
          <button class="suggestion-chip" data-msg="Quiero aprender a cocinar">👨‍🍳 Aprender cocina</button>
        </div>
      </div>
    </div>
  `;

  const messagesEl = document.getElementById('wa-messages');
  const inputEl = document.getElementById('wa-input');
  const sendBtn = document.getElementById('wa-send');
  const statusEl = document.getElementById('bot-status');

  // Check bot status
  let aiEnabled = false;
  try {
    const res = await fetch(`${CHATBOT_URL}/api/health`);
    const data = await res.json();
    aiEnabled = data.ai_configured;
    const mode = aiEnabled ? '<iconify-icon icon="ci:bolt" style="vertical-align: sub;"></iconify-icon> IA activa' : '<iconify-icon icon="ci:terminal" style="vertical-align: sub;"></iconify-icon> Modo keywords';
    if (statusEl) statusEl.innerHTML = `<span class="status-dot online"></span><span>${mode} · ${data.auto_responses_loaded} reglas</span>`;
  } catch {
    if (statusEl) statusEl.innerHTML = `<span class="status-dot offline"></span><span>Bot desconectado</span>`;
    showToast('El servidor del chatbot no está corriendo. Ejecuta: npm run chatbot', 'warning');
  }

  // Send message function
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';

    // Add user message (right side - green)
    addMessage(text, 'sent');

    // Show typing indicator
    showTyping();

    try {
      // Call AI chat endpoint
      const res = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: chatSessionId }),
      });
      const data = await res.json();

      // Update session ID
      if (data.sessionId) chatSessionId = data.sessionId;

      // Simulate typing delay (more natural)
      const delay = Math.min(800 + data.response.length * 8, 3000);
      await new Promise(r => setTimeout(r, delay));

      hideTyping();

      // Source label
      let sourceLabel = '<iconify-icon icon="ci:terminal"></iconify-icon> Bot';
      if (data.source === 'ai') sourceLabel = '<iconify-icon icon="ci:bolt"></iconify-icon> IA';
      else if (data.source === 'keyword') sourceLabel = `<iconify-icon icon="ci:terminal"></iconify-icon> Plantilla: ${data.template}`;
      else sourceLabel = '<iconify-icon icon="ci:terminal"></iconify-icon> Respuesta predeterminada';

      addMessage(data.response, 'received', sourceLabel);

      // Show source indicator
      if (data.source === 'ai') {
        addSystemMessage(`<iconify-icon icon="ci:bolt"></iconify-icon> Respuesta generada por Inteligencia Artificial${data.sessionInfo ? ` · ${data.sessionInfo.messageCount} msgs en sesión` : ''}`);
      } else if (data.source === 'keyword') {
        addSystemMessage(`<iconify-icon icon="ci:terminal"></iconify-icon> Coincidió con plantilla: ${data.template}`);
      }

    } catch (err) {
      hideTyping();
      addSystemMessage('<iconify-icon icon="ci:close-md"></iconify-icon> Error: No se pudo conectar con el servidor del chatbot');
    }
  }

  function addMessage(text, type, meta = '') {
    const time = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const formattedText = formatWhatsAppText(text);
    
    const msgEl = document.createElement('div');
    msgEl.className = `wa-msg wa-msg-${type} animate-fade-in`;
    msgEl.innerHTML = `
      <div class="wa-msg-bubble">
        <div class="wa-msg-text">${formattedText}</div>
        <div class="wa-msg-time">${type === 'sent' ? '<iconify-icon icon="ci:user"></iconify-icon> Tú' : meta || '<iconify-icon icon="ci:terminal"></iconify-icon> Bot'} · ${time} ${type === 'sent' ? '✓✓' : ''}</div>
      </div>
    `;
    messagesEl.appendChild(msgEl);
    scrollToBottom();
  }

  function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'wa-system-msg animate-fade-in';
    el.innerHTML = `<span>${text}</span>`;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'wa-msg wa-msg-received wa-typing-msg';
    el.id = 'typing-indicator';
    el.innerHTML = `
      <div class="wa-msg-bubble">
        <div class="wa-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesEl.appendChild(el);
    document.getElementById('wa-typing').innerHTML = '<iconify-icon icon="ci:terminal" style="vertical-align: middle;"></iconify-icon> escribiendo...';
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
    document.getElementById('wa-typing').innerHTML = '<iconify-icon icon="ci:terminal" style="vertical-align: middle;"></iconify-icon> Bot activo · Escribe como cliente';
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function formatWhatsAppText(text) {
    // Basic escapes and formatting
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');

    // Convert URLs to clickable Links (do this BEFORE adding <br>)
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" class="chat-link" style="color: #25D366; text-decoration: underline;">$1</a>');

    // Finally convert newlines to <br>
    return formatted.replace(/\n/g, '<br>');
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Quick suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputEl.value = chip.dataset.msg;
      sendMessage();
    });
  });

  // Clear chat
  const btnClearChat = document.getElementById('btn-clear-chat');
  if (btnClearChat) {
    btnClearChat.addEventListener('click', async () => {
      // Clear AI session
      try {
        await fetch(`${CHATBOT_URL}/api/chat/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: chatSessionId }),
        });
      } catch {}
      chatSessionId = 'simulator-' + Date.now();
      messagesEl.innerHTML = `
        <div class="wa-date-divider"><span>Hoy</span></div>
        <div class="wa-system-msg"><span>🔒 Chat limpiado y sesión reiniciada. Escribe un mensaje para probar el bot.</span></div>
      `;
    });
  }

  // Focus input
  inputEl.focus();
}
