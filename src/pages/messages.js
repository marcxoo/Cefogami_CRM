import { supabase } from '../supabase.js';
import { getInitials, stringToColor, escapeHtml, mapEmojiToIconify } from '../utils/helpers.js';
import { openWhatsApp, processTemplate, formatPhone } from '../utils/whatsapp.js';
import { showToast } from '../components/toast.js';

export async function renderMessages() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="messages-page"></div>`;
  const page = document.getElementById('messages-page');

  const [contactsRes, templatesRes, conversationsRes] = await Promise.all([
    supabase.from('contacts').select('*, categories(name, color, icon)').order('name'),
    supabase.from('message_templates').select('*').eq('is_active', true).order('category'),
    supabase.from('conversations').select('*, contacts(name, phone)').order('created_at', { ascending: false }).limit(20),
  ]);

  const contacts = contactsRes.data || [];
  const templates = templatesRes.data || [];
  const conversations = conversationsRes.data || [];

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title"><iconify-icon icon="ci:chat"></iconify-icon> Mensajes Rápidos</h2>
        <p class="page-description">Envía mensajes por WhatsApp con plantillas pre-configuradas</p>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1.2fr;">
      <!-- Send Message Panel -->
      <div class="card card-accent">
        <div class="card-header">
          <h3 class="card-title"><iconify-icon icon="ci:send" style="vertical-align: sub;"></iconify-icon> Enviar Mensaje</h3>
        </div>

        <div class="form-group">
          <label class="form-label">Seleccionar Contacto</label>
          <select class="form-select" id="msg-contact">
            <option value="">— Elige un contacto —</option>
            ${contacts.map(c => `<option value="${c.phone}" data-name="${c.name}" data-id="${c.id}">${c.name} (${formatPhone(c.phone)})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">O escribe un número directo</label>
          <input type="text" class="form-input" id="msg-phone" placeholder="+593 9XX XXX XXXX" />
        </div>

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">Elegir Plantilla</label>
          <div class="template-quick-list" id="template-list">
            ${templates.map(t => `
              <button class="template-chip" data-template="${t.id}" data-content="${encodeURIComponent(t.content)}" data-vars='${JSON.stringify(t.variables || [])}'>
                ${mapEmojiToIconify(t.icon)} ${t.name}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mensaje</label>
          <textarea class="form-textarea" id="msg-content" rows="6" placeholder="Escribe o selecciona una plantilla..."></textarea>
        </div>

        <div class="flex gap-sm">
          <button class="btn btn-wa btn-lg w-full" id="btn-send-wa">
            <iconify-icon icon="ci:chat" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Enviar por WhatsApp
          </button>
        </div>
      </div>

      <!-- History -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><iconify-icon icon="ci:file-document" style="vertical-align: sub;"></iconify-icon> Historial de Mensajes</h3>
          <span class="badge badge-blue">${conversations.length} mensajes</span>
        </div>

        <div id="message-history">
          ${conversations.length ? conversations.map(conv => `
            <div class="msg-history-item">
              <div class="msg-history-avatar" style="background: ${stringToColor(conv.contacts?.name || '')}20; color: ${stringToColor(conv.contacts?.name || '')}">
                ${getInitials(conv.contacts?.name || 'D')}
              </div>
              <div class="msg-history-content">
                <div class="msg-history-name">${escapeHtml(conv.contacts?.name || 'Desconocido')}</div>
                <div class="msg-history-text">${escapeHtml((conv.message_sent || '').slice(0, 100))}...</div>
                <div class="msg-history-time">${new Date(conv.created_at).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button class="btn btn-ghost btn-sm" data-resend="${conv.contacts?.phone}" data-msg="${encodeURIComponent(conv.message_sent || '')}" title="Reenviar"><iconify-icon icon="ci:redo"></iconify-icon></button>
            </div>
          `).join('') : `
            <div class="empty-state">
              <div class="empty-state-icon"><iconify-icon icon="ci:chat"></iconify-icon></div>
              <div class="empty-state-title">Sin mensajes aún</div>
              <div class="empty-state-text">Envía tu primer mensaje para ver el historial aquí</div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Template selection
  page.querySelectorAll('.template-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      page.querySelectorAll('.template-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      let content = decodeURIComponent(chip.dataset.content);
      const contactSelect = document.getElementById('msg-contact');
      const selectedOption = contactSelect.options[contactSelect.selectedIndex];
      const contactName = selectedOption?.dataset?.name || '';

      content = processTemplate(content, { nombre: contactName });
      document.getElementById('msg-content').value = content;
    });
  });

  // Contact select updates name in template
  document.getElementById('msg-contact').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    document.getElementById('msg-phone').value = e.target.value;
  });

  // Send button
  document.getElementById('btn-send-wa').addEventListener('click', async () => {
    const contactSelect = document.getElementById('msg-contact');
    const phone = document.getElementById('msg-phone').value || contactSelect.value;
    const message = document.getElementById('msg-content').value;

    if (!phone) {
      showToast('Selecciona un contacto o escribe un número', 'warning');
      return;
    }
    if (!message) {
      showToast('Escribe un mensaje para enviar', 'warning');
      return;
    }

    // Log conversation
    const selectedOption = contactSelect.options[contactSelect.selectedIndex];
    const contactId = selectedOption?.dataset?.id;

    if (contactId) {
      await supabase.from('conversations').insert({
        contact_id: contactId,
        message_sent: message,
        direction: 'outgoing',
        channel: 'whatsapp',
      });

      await supabase.from('contacts').update({ last_contact_at: new Date().toISOString() }).eq('id', contactId);
    }

    openWhatsApp(phone, message);
    showToast('WhatsApp abierto con el mensaje pre-llenado', 'success');
  });

  // Resend handlers
  page.querySelectorAll('[data-resend]').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.dataset.resend;
      const msg = decodeURIComponent(btn.dataset.msg);
      if (phone && msg) openWhatsApp(phone, msg);
    });
  });
}
