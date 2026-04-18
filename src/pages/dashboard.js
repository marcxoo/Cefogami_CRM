import { supabase } from '../supabase.js';
import { timeAgo, formatNumber } from '../utils/helpers.js';

export async function renderDashboard() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="stagger" id="dashboard-content"></div>`;
  const content = document.getElementById('dashboard-content');

  // Fetch data
  const [contactsRes, messagesRes, templatesRes, recentRes] = await Promise.all([
    supabase.from('contacts').select('id, status, created_at', { count: 'exact' }),
    supabase.from('conversations').select('id, created_at', { count: 'exact' }),
    supabase.from('message_templates').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('conversations').select('*, contacts(name, phone)').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalContacts = contactsRes.count || 0;
  const totalMessages = messagesRes.count || 0;
  const activeTemplates = templatesRes.count || 0;
  const contacts = contactsRes.data || [];
  const prospectos = contacts.filter(c => c.status === 'nuevo' || c.status === 'en_seguimiento').length;

  // Today's counts
  const today = new Date().toISOString().split('T')[0];
  const todayMessages = (messagesRes.data || []).filter(m => m.created_at?.startsWith(today)).length;
  const todayContacts = contacts.filter(c => c.created_at?.startsWith(today)).length;

  content.innerHTML = `
    <!-- Stats Grid -->
    <div class="grid-4" style="margin-bottom: var(--space-xl);">
      <div class="stat-card">
        <div class="stat-icon green"><iconify-icon icon="ci:users"></iconify-icon></div>
        <div class="stat-content">
          <div class="stat-label">Total Contactos</div>
          <div class="stat-value">${formatNumber(totalContacts)}</div>
          <div class="stat-change up">+${todayContacts} hoy</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><iconify-icon icon="ci:chat"></iconify-icon></div>
        <div class="stat-content">
          <div class="stat-label">Mensajes Enviados</div>
          <div class="stat-value">${formatNumber(totalMessages)}</div>
          <div class="stat-change up">${todayMessages} hoy</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📋</div>
        <div class="stat-content">
          <div class="stat-label">Plantillas Activas</div>
          <div class="stat-value">${activeTemplates}</div>
          <div class="stat-change up">Listas para usar</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">🎯</div>
        <div class="stat-content">
          <div class="stat-label">Prospectos</div>
          <div class="stat-value">${prospectos}</div>
          <div class="stat-change up">En seguimiento</div>
        </div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid-2">
      <!-- Quick Actions -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title">⚡ Acciones Rápidas</h3>
        </div>
        <div class="quick-actions-grid">
          <button class="quick-action-btn" data-action="new-contact">
            <span class="qa-icon" style="background: rgba(59, 130, 246, 0.12);">👤</span>
            <span class="qa-text">Nuevo Contacto</span>
          </button>
          <button class="quick-action-btn" data-action="send-message">
            <span class="qa-icon" style="background: rgba(37, 211, 102, 0.12);"><iconify-icon icon="ci:chat"></iconify-icon></span>
            <span class="qa-text">Enviar Mensaje</span>
          </button>
          <button class="quick-action-btn" data-action="view-templates">
            <span class="qa-icon" style="background: rgba(139, 92, 246, 0.12);">📋</span>
            <span class="qa-text">Ver Plantillas</span>
          </button>
          <button class="quick-action-btn" data-action="whatsapp-web">
            <span class="qa-icon" style="background: rgba(37, 211, 102, 0.12);">🌐</span>
            <span class="qa-text">WhatsApp Web</span>
          </button>
        </div>
      </div>

      <!-- Status Distribution -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title"><iconify-icon icon="ci:bar-chart"></iconify-icon> Distribución de Contactos</h3>
        </div>
        <div id="status-distribution"></div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card card-glass" style="margin-top: var(--space-lg);">
      <div class="card-header">
        <h3 class="card-title">🕐 Actividad Reciente</h3>
        <button class="btn btn-ghost btn-sm" data-action="view-messages">Ver todo →</button>
      </div>
      <div id="recent-activity"></div>
    </div>
  `;

  // Render status distribution
  renderStatusDistribution(contacts);

  // Render recent activity
  renderRecentActivity(recentRes.data || []);

  // Quick action handlers
  content.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'new-contact') navigate('contacts');
      if (action === 'send-message') navigate('messages');
      if (action === 'view-templates') navigate('templates');
      if (action === 'view-messages') navigate('messages');
      if (action === 'whatsapp-web') window.open('https://web.whatsapp.com', '_blank');
    });
  });
}

function navigate(page) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
}

function renderStatusDistribution(contacts) {
  const container = document.getElementById('status-distribution');
  const statuses = {
    nuevo: { label: 'Nuevos', color: '#3B82F6', count: 0 },
    en_seguimiento: { label: 'En Seguimiento', color: '#F59E0B', count: 0 },
    inscrito: { label: 'Inscritos', color: '#25D366', count: 0 },
    egresado: { label: 'Egresados', color: '#8B5CF6', count: 0 },
    inactivo: { label: 'Inactivos', color: '#EF4444', count: 0 },
  };

  contacts.forEach(c => {
    if (statuses[c.status]) statuses[c.status].count++;
  });

  const total = contacts.length || 1;

  container.innerHTML = `
    <div class="status-bars">
      ${Object.entries(statuses).map(([, s]) => `
        <div class="status-bar-item">
          <div class="status-bar-header">
            <span class="status-bar-label">${s.label}</span>
            <span class="status-bar-value">${s.count}</span>
          </div>
          <div class="status-bar-track">
            <div class="status-bar-fill" style="width: ${(s.count / total * 100)}%; background: ${s.color};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRecentActivity(conversations) {
  const container = document.getElementById('recent-activity');

  if (!conversations.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">Sin actividad reciente</div>
        <div class="empty-state-text">Envía tu primer mensaje para ver la actividad aquí</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="activity-list">
      ${conversations.map(conv => `
        <div class="activity-item">
          <div class="activity-icon"><iconify-icon icon="ci:chat"></iconify-icon></div>
          <div class="activity-info">
            <div class="activity-name">${conv.contacts?.name || 'Contacto'}</div>
            <div class="activity-preview">${(conv.message_sent || '').slice(0, 80)}...</div>
          </div>
          <div class="activity-time">${timeAgo(conv.created_at)}</div>
        </div>
      `).join('')}
    </div>
  `;
}
