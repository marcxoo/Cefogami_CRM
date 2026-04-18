import { supabase } from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, mapEmojiToIconify } from '../utils/helpers.js';

export async function renderAutoResponses() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="ar-page"></div>`;
  const page = document.getElementById('ar-page');

  const [arRes, templatesRes] = await Promise.all([
    supabase.from('auto_responses').select('*, message_templates(name, icon, category)').order('priority'),
    supabase.from('message_templates').select('id, name, icon, category').eq('is_active', true),
  ]);

  const autoResponses = arRes.data || [];
  const templates = templatesRes.data || [];

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title"><iconify-icon icon="ci:terminal"></iconify-icon> Auto-Respuestas</h2>
        <p class="page-description">Configura respuestas automáticas basadas en palabras clave</p>
      </div>
      <button class="btn btn-primary" id="btn-new-ar">+ Nueva Regla</button>
    </div>

    <div class="card" style="margin-bottom: var(--space-lg);">
      <div class="card-header">
        <h3 class="card-title"><iconify-icon icon="ci:bulb" style="vertical-align: sub;"></iconify-icon> ¿Cómo funciona?</h3>
      </div>
      <p class="text-sm text-muted">Cuando un cliente te escribe por WhatsApp, puedes revisar el mensaje aquí y el sistema te sugerirá la plantilla apropiada basándose en las palabras clave configuradas. Así puedes responder con un solo clic.</p>
    </div>

    <!-- Auto-response tester -->
    <div class="card card-accent" style="margin-bottom: var(--space-lg);">
      <div class="card-header">
        <h3 class="card-title"><iconify-icon icon="ci:flask" style="vertical-align: sub;"></iconify-icon> Probar Auto-Respuesta</h3>
      </div>
      <div class="flex gap-md items-center">
        <input type="text" class="form-input" id="ar-test-input" placeholder="Escribe un mensaje de prueba... ej: '¿Cuáles son los precios?'" style="flex: 1;" />
        <button class="btn btn-secondary" id="ar-test-btn">Probar</button>
      </div>
      <div id="ar-test-result" style="margin-top: var(--space-md);"></div>
    </div>

    <!-- Rules list -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><iconify-icon icon="ci:list-check" style="vertical-align: sub;"></iconify-icon> Reglas Configuradas</h3>
        <span class="badge badge-blue">${autoResponses.length} reglas</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Prioridad</th>
            <th>Palabras Clave</th>
            <th>Plantilla Asociada</th>
            <th>Coincidencias</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${autoResponses.map(ar => `
            <tr>
              <td><span class="badge badge-blue">#${ar.priority}</span></td>
              <td>
                <div class="flex gap-xs" style="flex-wrap: wrap;">
                  ${(ar.keywords || []).map(k => `<span class="chip">${escapeHtml(k)}</span>`).join('')}
                </div>
              </td>
              <td>
                ${ar.message_templates ? `
                  <span class="badge badge-green">${mapEmojiToIconify(ar.message_templates.icon)} ${ar.message_templates.name}</span>
                ` : '<span class="text-muted">—</span>'}
              </td>
              <td><span class="text-sm">${ar.match_count || 0}</span></td>
              <td>
                <label class="toggle">
                  <input type="checkbox" ${ar.is_active ? 'checked' : ''} data-toggle-ar="${ar.id}" />
                  <span class="toggle-slider"></span>
                </label>
              </td>
              <td>
                <div class="flex gap-xs">
                  <button class="btn btn-ghost btn-sm" data-edit-ar="${ar.id}"><iconify-icon icon="ci:edit"></iconify-icon></button>
                  <button class="btn btn-ghost btn-sm" data-delete-ar="${ar.id}"><iconify-icon icon="ci:trash"></iconify-icon></button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Test auto-response
  document.getElementById('ar-test-btn').addEventListener('click', () => {
    const input = document.getElementById('ar-test-input').value.toLowerCase();
    const result = document.getElementById('ar-test-result');

    if (!input) { result.innerHTML = ''; return; }

    const match = autoResponses.find(ar =>
      ar.is_active && ar.keywords.some(k => input.includes(k.toLowerCase()))
    );

    if (match) {
      result.innerHTML = `
        <div class="badge badge-green" style="padding: 8px 16px; font-size: 0.8125rem;">
          <iconify-icon icon="ci:check" style="color:var(--success); vertical-align: middle;"></iconify-icon> Coincidencia: ${mapEmojiToIconify(match.message_templates?.icon)} ${match.message_templates?.name || 'Plantilla'}
        </div>
      `;
    } else {
      result.innerHTML = `<div class="badge badge-yellow" style="padding: 8px 16px; font-size: 0.8125rem;"><iconify-icon icon="ci:warning" style="vertical-align: middle;"></iconify-icon> Sin coincidencias</div>`;
    }
  });

  // Toggle
  page.querySelectorAll('[data-toggle-ar]').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      await supabase.from('auto_responses').update({ is_active: e.target.checked }).eq('id', toggle.dataset.toggleAr);
      showToast(e.target.checked ? 'Regla activada' : 'Regla desactivada', 'success');
    });
  });

  // New rule
  document.getElementById('btn-new-ar').addEventListener('click', () => openARModal(null, templates));

  // Edit
  page.querySelectorAll('[data-edit-ar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ar = autoResponses.find(a => a.id === btn.dataset.editAr);
      if (ar) openARModal(ar, templates);
    });
  });

  // Delete
  page.querySelectorAll('[data-delete-ar]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta regla?')) {
        await supabase.from('auto_responses').delete().eq('id', btn.dataset.deleteAr);
        showToast('Regla eliminada', 'success');
        renderAutoResponses();
      }
    });
  });
}

function openARModal(ar = null, templates = []) {
  const isEdit = !!ar;
  openModal({
    title: isEdit ? '<iconify-icon icon="ci:edit" style="vertical-align: middle;"></iconify-icon> Editar Regla' : '<iconify-icon icon="ci:terminal" style="vertical-align: middle;"></iconify-icon> Nueva Regla',
    content: `
      <div class="form-group">
        <label class="form-label">Palabras clave (separadas por coma) *</label>
        <input type="text" class="form-input" id="ar-keywords" value="${(ar?.keywords || []).join(', ')}" placeholder="precio, costo, cuánto, valor" />
        <div class="text-xs text-muted" style="margin-top: 4px;">Si el mensaje contiene alguna de estas palabras, se activará esta regla</div>
      </div>
      <div class="form-group">
        <label class="form-label">Plantilla asociada *</label>
        <select class="form-select" id="ar-template">
          <option value="">— Seleccionar plantilla —</option>
          ${templates.map(t => `<option value="${t.id}" ${ar?.template_id === t.id ? 'selected' : ''}>${t.name} (${t.category})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Prioridad (menor = más prioritario)</label>
        <input type="number" class="form-input" id="ar-priority" value="${ar?.priority || 0}" min="0" />
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancelar</button>
      <button class="btn btn-primary" id="ar-save"><iconify-icon icon="ci:save" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> ${isEdit ? 'Guardar' : 'Crear'}</button>
    `
  });

  document.getElementById('ar-save').addEventListener('click', async () => {
    const data = {
      keywords: document.getElementById('ar-keywords').value.split(',').map(k => k.trim()).filter(Boolean),
      template_id: document.getElementById('ar-template').value || null,
      priority: parseInt(document.getElementById('ar-priority').value) || 0,
    };

    if (!data.keywords.length) {
      showToast('Agrega al menos una palabra clave', 'warning');
      return;
    }

    if (isEdit) {
      await supabase.from('auto_responses').update(data).eq('id', ar.id);
    } else {
      await supabase.from('auto_responses').insert(data);
    }

    showToast(isEdit ? 'Regla actualizada' : 'Regla creada', 'success');
    closeModal();
    renderAutoResponses();
  });
}
