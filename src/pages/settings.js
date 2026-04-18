import { supabase } from '../supabase.js';
import { showToast } from '../components/toast.js';

export async function renderSettings() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="settings-page"></div>`;
  const page = document.getElementById('settings-page');

  const { data: settings } = await supabase.from('business_settings').select('*').limit(1).single();
  const biz = settings || {};
  const hours = biz.working_hours || {};

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title"><iconify-icon icon="ci:settings"></iconify-icon> Configuración</h2>
        <p class="page-description">Ajustes del sistema y datos del negocio</p>
      </div>
    </div>

    <div class="grid-2">
      <!-- Business Info -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🏢 Datos del Negocio</h3>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre del negocio</label>
          <input type="text" class="form-input" id="set-name" value="${biz.business_name || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Número de WhatsApp Business</label>
          <input type="text" class="form-input" id="set-whatsapp" value="${biz.whatsapp_number || ''}" placeholder="+593XXXXXXXXX" />
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono fijo</label>
          <input type="text" class="form-input" id="set-phone" value="${biz.phone || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="set-email" value="${biz.email || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" id="set-address" value="${biz.address || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Facebook</label>
          <input type="url" class="form-input" id="set-facebook" value="${biz.facebook_url || ''}" />
        </div>
      </div>

      <!-- Working Hours -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🕐 Horarios de Atención</h3>
        </div>
        ${days.map(day => {
          const h = hours[day.key] || { open: '', close: '', active: false };
          return `
            <div class="schedule-row">
              <div class="schedule-day">
                <label class="toggle">
                  <input type="checkbox" ${h.active ? 'checked' : ''} data-day-toggle="${day.key}" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="schedule-label">${day.label}</span>
              </div>
              <div class="schedule-times">
                <input type="time" class="form-input schedule-time" id="open-${day.key}" value="${h.open || '08:00'}" ${!h.active ? 'disabled' : ''} />
                <span class="text-muted">a</span>
                <input type="time" class="form-input schedule-time" id="close-${day.key}" value="${h.close || '18:00'}" ${!h.active ? 'disabled' : ''} />
              </div>
            </div>
          `;
        }).join('')}

        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label">Mensaje de bienvenida por defecto</label>
          <textarea class="form-textarea" id="set-welcome" rows="4">${biz.welcome_message || ''}</textarea>
        </div>
      </div>
    </div>

    <div style="margin-top: var(--space-lg); display: flex; justify-content: flex-end;">
      <button class="btn btn-primary btn-lg" id="btn-save-settings">💾 Guardar Configuración</button>
    </div>
  `;

  // Toggle day
  page.querySelectorAll('[data-day-toggle]').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const day = toggle.dataset.dayToggle;
      document.getElementById(`open-${day}`).disabled = !e.target.checked;
      document.getElementById(`close-${day}`).disabled = !e.target.checked;
    });
  });

  // Save
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const working_hours = {};
    days.forEach(day => {
      working_hours[day.key] = {
        active: page.querySelector(`[data-day-toggle="${day.key}"]`).checked,
        open: document.getElementById(`open-${day.key}`).value,
        close: document.getElementById(`close-${day.key}`).value,
      };
    });

    const data = {
      business_name: document.getElementById('set-name').value,
      whatsapp_number: document.getElementById('set-whatsapp').value,
      phone: document.getElementById('set-phone').value,
      email: document.getElementById('set-email').value,
      address: document.getElementById('set-address').value,
      facebook_url: document.getElementById('set-facebook').value,
      welcome_message: document.getElementById('set-welcome').value,
      working_hours,
      updated_at: new Date().toISOString(),
    };

    if (biz.id) {
      await supabase.from('business_settings').update(data).eq('id', biz.id);
    } else {
      await supabase.from('business_settings').insert(data);
    }

    showToast('Configuración guardada exitosamente', 'success');
  });
}
