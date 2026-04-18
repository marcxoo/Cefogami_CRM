import { supabase } from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, mapEmojiToIconify } from '../utils/helpers.js';

export async function renderTemplates() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="templates-page"></div>`;
  const page = document.getElementById('templates-page');

  const { data: templates } = await supabase.from('message_templates').select('*').order('category');
  const allTemplates = templates || [];

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title">📋 Plantillas de Mensajes</h2>
        <p class="page-description">Mensajes pre-configurados para respuestas rápidas</p>
      </div>
      <button class="btn btn-primary" id="btn-new-template">+ Nueva Plantilla</button>
    </div>

    <div class="grid-3 stagger" id="templates-grid">
      ${allTemplates.map(tpl => `
        <div class="card template-card ${tpl.is_active ? '' : 'template-inactive'}">
          <div class="card-header">
            <div class="flex items-center gap-sm">
              <span style="font-size: 1.5rem;">${mapEmojiToIconify(tpl.icon)}</span>
              <div>
                <h3 class="card-title">${escapeHtml(tpl.name)}</h3>
                <span class="badge badge-blue">${tpl.category}</span>
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" ${tpl.is_active ? 'checked' : ''} data-toggle="${tpl.id}" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="template-preview">${escapeHtml(tpl.content).replace(/\n/g, '<br>')}</div>
          ${tpl.variables && tpl.variables.length ? `
            <div class="template-vars">
              ${tpl.variables.map(v => `<span class="chip">📎 {${v}}</span>`).join(' ')}
            </div>
          ` : ''}
          <div class="template-actions">
            <span class="text-xs text-muted">Usado ${tpl.use_count || 0} veces</span>
            <div class="flex gap-xs">
              <button class="btn btn-ghost btn-sm" data-edit="${tpl.id}"><iconify-icon icon="ci:edit" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Editar</button>
              <button class="btn btn-ghost btn-sm" data-delete="${tpl.id}"><iconify-icon icon="ci:trash"></iconify-icon></button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Toggle active state
  page.querySelectorAll('[data-toggle]').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      await supabase.from('message_templates').update({ is_active: e.target.checked }).eq('id', toggle.dataset.toggle);
      showToast(e.target.checked ? 'Plantilla activada' : 'Plantilla desactivada', 'success');
    });
  });

  // New template
  document.getElementById('btn-new-template').addEventListener('click', () => openTemplateModal());

  // Edit template
  page.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tpl = allTemplates.find(t => t.id === btn.dataset.edit);
      if (tpl) openTemplateModal(tpl);
    });
  });

  // Delete template
  page.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta plantilla?')) {
        await supabase.from('message_templates').delete().eq('id', btn.dataset.delete);
        showToast('Plantilla eliminada', 'success');
        renderTemplates();
      }
    });
  });
}

function openTemplateModal(tpl = null) {
  const isEdit = !!tpl;
  openModal({
    title: isEdit ? '<iconify-icon icon="ci:edit" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Editar Plantilla' : '<iconify-icon icon="ci:list-check" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Nueva Plantilla',
    size: 'lg',
    content: `
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input type="text" class="form-input" id="tpl-name" value="${tpl?.name || ''}" placeholder="Ej: Horarios de clases" />
        </div>
        <div class="form-group">
          <label class="form-label">Categoría *</label>
          <select class="form-select" id="tpl-category">
            ${['bienvenida','horarios','precios','cursos','ubicacion','inscripcion','seguimiento','agradecimiento','otro'].map(c => `
              <option value="${c}" ${tpl?.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Ícono</label>
          <input type="text" class="form-input" id="tpl-icon" value="${tpl?.icon || '💬'}" placeholder="Emoji o nombre de icono (ej: ci:chat)" />
        </div>
        <div class="form-group">
          <label class="form-label">Variables (separadas por coma)</label>
          <input type="text" class="form-input" id="tpl-vars" value="${(tpl?.variables || []).join(', ')}" placeholder="nombre, curso" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Contenido del mensaje *</label>
        <textarea class="form-textarea" id="tpl-content" rows="10" placeholder="Escribe el mensaje. Usa {nombre} para variables dinámicas...">${tpl?.content || ''}</textarea>
        <div class="text-xs text-muted" style="margin-top: 4px;">Usa *texto* para negritas en WhatsApp. Variables: {nombre}, {curso}, etc.</div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancelar</button>
      <button class="btn btn-primary" id="tpl-save"><iconify-icon icon="ci:save" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> ${isEdit ? 'Guardar' : 'Crear'}</button>
    `
  });

  document.getElementById('tpl-save').addEventListener('click', async () => {
    const data = {
      name: document.getElementById('tpl-name').value.trim(),
      category: document.getElementById('tpl-category').value,
      icon: document.getElementById('tpl-icon').value || '💬',
      variables: document.getElementById('tpl-vars').value.split(',').map(v => v.trim()).filter(Boolean),
      content: document.getElementById('tpl-content').value.trim(),
    };

    if (!data.name || !data.content) {
      showToast('Nombre y contenido son obligatorios', 'warning');
      return;
    }

    if (isEdit) {
      await supabase.from('message_templates').update(data).eq('id', tpl.id);
    } else {
      await supabase.from('message_templates').insert(data);
    }

    showToast(isEdit ? 'Plantilla actualizada' : 'Plantilla creada', 'success');
    closeModal();
    renderTemplates();
  });
}
