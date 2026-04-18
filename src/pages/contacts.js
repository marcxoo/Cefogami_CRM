import { supabase } from '../supabase.js';
import { getInitials, stringToColor, statusConfig, formatDate, debounce, escapeHtml } from '../utils/helpers.js';
import { formatPhone, openWhatsApp } from '../utils/whatsapp.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let allContacts = [];
let allCategories = [];
let currentFilter = { search: '', status: '', category: '' };

export async function renderContacts(options = {}) {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="contacts-page"></div>`;
  const page = document.getElementById('contacts-page');

  // Load data
  const [contactsRes, categoriesRes] = await Promise.all([
    supabase.from('contacts').select('*, categories(name, color, icon)').order('created_at', { ascending: false }),
    supabase.from('categories').select('*'),
  ]);

  allContacts = contactsRes.data || [];
  allCategories = categoriesRes.data || [];

  if (options.search) currentFilter.search = options.search;

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title"><iconify-icon icon="ci:users"></iconify-icon> Contactos</h2>
        <p class="page-description">${allContacts.length} contactos registrados</p>
      </div>
      <button class="btn btn-primary" id="btn-new-contact">
        <span>+</span> Nuevo Contacto
      </button>
    </div>

    <div class="filter-bar">
      <input type="text" class="form-input" id="contact-search"
        placeholder="🔍 Buscar por nombre, teléfono..." value="${currentFilter.search || ''}" />
      <select class="form-select" id="filter-status">
        <option value="">Todos los estados</option>
        ${Object.entries(statusConfig).map(([k, v]) => `
          <option value="${k}" ${currentFilter.status === k ? 'selected' : ''}>${v.icon} ${v.label}</option>
        `).join('')}
      </select>
      <select class="form-select" id="filter-category">
        <option value="">Todas las categorías</option>
        ${allCategories.map(c => `
          <option value="${c.id}" ${currentFilter.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>
        `).join('')}
      </select>
    </div>

    <div class="card">
      <div id="contacts-table-container"></div>
    </div>
  `;

  renderContactsTable();

  // Event handlers
  document.getElementById('btn-new-contact').addEventListener('click', () => openContactModal());

  const searchInput = document.getElementById('contact-search');
  searchInput.addEventListener('input', debounce((e) => {
    currentFilter.search = e.target.value;
    renderContactsTable();
  }, 250));

  document.getElementById('filter-status').addEventListener('change', (e) => {
    currentFilter.status = e.target.value;
    renderContactsTable();
  });

  document.getElementById('filter-category').addEventListener('change', (e) => {
    currentFilter.category = e.target.value;
    renderContactsTable();
  });
}

function getFilteredContacts() {
  return allContacts.filter(c => {
    const matchSearch = !currentFilter.search ||
      c.name.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
      c.phone.includes(currentFilter.search);
    const matchStatus = !currentFilter.status || c.status === currentFilter.status;
    const matchCategory = !currentFilter.category || c.category_id === currentFilter.category;
    return matchSearch && matchStatus && matchCategory;
  });
}

function renderContactsTable() {
  const container = document.getElementById('contacts-table-container');
  const filtered = getFilteredContacts();

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><iconify-icon icon="ci:users"></iconify-icon></div>
        <div class="empty-state-title">No se encontraron contactos</div>
        <div class="empty-state-text">Agrega un nuevo contacto o ajusta los filtros de búsqueda</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Contacto</th>
          <th>Teléfono</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Notas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(contact => {
          const color = stringToColor(contact.name);
          const status = statusConfig[contact.status] || statusConfig.nuevo;
          const cat = contact.categories;
          return `
            <tr>
              <td>
                <div class="flex items-center gap-md">
                  <div class="avatar" style="background: ${color}20; color: ${color}">${getInitials(contact.name)}</div>
                  <div>
                    <div style="font-weight: 600;">${escapeHtml(contact.name)}</div>
                    ${contact.email ? `<div class="text-xs text-muted">${escapeHtml(contact.email)}</div>` : ''}
                  </div>
                </div>
              </td>
              <td><span class="text-sm">${formatPhone(contact.phone)}</span></td>
              <td>${cat ? `<span class="badge" style="background: ${cat.color}18; color: ${cat.color};">${cat.icon} ${cat.name}</span>` : '—'}</td>
              <td><span class="badge ${status.badge}">${status.icon} ${status.label}</span></td>
              <td><span class="text-sm text-muted truncate" style="max-width: 180px; display: inline-block;">${escapeHtml(contact.notes || '—')}</span></td>
              <td>
                <div class="flex gap-xs">
                  <button class="btn btn-wa btn-sm" data-wa="${contact.phone}" title="Enviar WhatsApp"><iconify-icon icon="ci:chat"></iconify-icon></button>
                  <button class="btn btn-ghost btn-sm" data-edit="${contact.id}" title="Editar"><iconify-icon icon="ci:edit"></iconify-icon></button>
                  <button class="btn btn-ghost btn-sm" data-delete="${contact.id}" title="Eliminar"><iconify-icon icon="ci:trash"></iconify-icon></button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // Action handlers
  container.querySelectorAll('[data-wa]').forEach(btn => {
    btn.addEventListener('click', () => openWhatsApp(btn.dataset.wa));
  });

  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const contact = allContacts.find(c => c.id === btn.dataset.edit);
      if (contact) openContactModal(contact);
    });
  });

  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteContact(btn.dataset.delete));
  });
}

function openContactModal(contact = null) {
  const isEdit = !!contact;
  openModal({
    title: isEdit ? '<iconify-icon icon="ci:edit" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Editar Contacto' : '<iconify-icon icon="ci:user" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Nuevo Contacto',
    content: `
      <div class="form-group">
        <label class="form-label">Nombre completo *</label>
        <input type="text" class="form-input" id="modal-name" value="${contact?.name || ''}" placeholder="Ej: María García" required />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono (con código de país) *</label>
        <input type="text" class="form-input" id="modal-phone" value="${contact?.phone || ''}" placeholder="Ej: +593987654321" required />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" id="modal-email" value="${contact?.email || ''}" placeholder="Ej: correo@email.com" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Categoría</label>
          <select class="form-select" id="modal-category">
            <option value="">Sin categoría</option>
            ${allCategories.map(c => `
              <option value="${c.id}" ${contact?.category_id === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="modal-status">
            ${Object.entries(statusConfig).map(([k, v]) => `
              <option value="${k}" ${contact?.status === k ? 'selected' : ''}>${v.icon} ${v.label}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="modal-notes" placeholder="Notas internas sobre el contacto...">${contact?.notes || ''}</textarea>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancelar</button>
      <button class="btn btn-primary" id="modal-save">💾 ${isEdit ? 'Guardar Cambios' : 'Crear Contacto'}</button>
    `
  });

  document.getElementById('modal-save').addEventListener('click', async () => {
    const data = {
      name: document.getElementById('modal-name').value.trim(),
      phone: document.getElementById('modal-phone').value.trim(),
      email: document.getElementById('modal-email').value.trim() || null,
      category_id: document.getElementById('modal-category').value || null,
      status: document.getElementById('modal-status').value,
      notes: document.getElementById('modal-notes').value.trim() || null,
    };

    if (!data.name || !data.phone) {
      showToast('Nombre y teléfono son obligatorios', 'warning');
      return;
    }

    try {
      if (isEdit) {
        await supabase.from('contacts').update(data).eq('id', contact.id);
        showToast('Contacto actualizado exitosamente', 'success');
      } else {
        await supabase.from('contacts').insert(data);
        showToast('Contacto creado exitosamente', 'success');
      }
      closeModal();
      renderContacts();
    } catch (err) {
      showToast('Error al guardar el contacto', 'error');
    }
  });
}

async function deleteContact(id) {
  const contact = allContacts.find(c => c.id === id);
  openModal({
    title: '<iconify-icon icon="ci:trash" style="vertical-align: middle; margin-right: 4px;"></iconify-icon> Eliminar Contacto',
    content: `<p>¿Estás seguro de que deseas eliminar a <strong>${contact?.name}</strong>? Esta acción no se puede deshacer.</p>`,
    footer: `
      <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancelar</button>
      <button class="btn btn-danger" id="modal-confirm-delete"><iconify-icon icon="ci:trash" style="font-size: 1.1em;"></iconify-icon> Eliminar</button>
    `
  });

  document.getElementById('modal-confirm-delete').addEventListener('click', async () => {
    await supabase.from('contacts').delete().eq('id', id);
    showToast('Contacto eliminado', 'success');
    closeModal();
    renderContacts();
  });
}
