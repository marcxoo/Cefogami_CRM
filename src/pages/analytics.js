import { supabase } from '../supabase.js';
import { statusConfig } from '../utils/helpers.js';

export async function renderAnalytics() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="animate-fade-in" id="analytics-page"></div>`;
  const page = document.getElementById('analytics-page');

  const [contactsRes, conversationsRes, templatesRes] = await Promise.all([
    supabase.from('contacts').select('id, status, category_id, created_at, categories(name)'),
    supabase.from('conversations').select('id, created_at, template_id, message_templates(name, icon, category)'),
    supabase.from('message_templates').select('id, name, icon, use_count, category').order('use_count', { ascending: false }),
  ]);

  const contacts = contactsRes.data || [];
  const conversations = conversationsRes.data || [];
  const templates = templatesRes.data || [];

  // Calculate analytics
  const today = new Date();
  const last7Days = new Date(today - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today - 30 * 24 * 60 * 60 * 1000);

  const conversationsLast7 = conversations.filter(c => new Date(c.created_at) >= last7Days);
  const conversationsLast30 = conversations.filter(c => new Date(c.created_at) >= last30Days);
  const newContactsLast30 = contacts.filter(c => new Date(c.created_at) >= last30Days);

  // Messages per day (last 7 days)
  const dailyMessages = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMessages[key] = 0;
  }
  conversationsLast7.forEach(c => {
    const key = c.created_at.split('T')[0];
    if (dailyMessages[key] !== undefined) dailyMessages[key]++;
  });

  const maxDaily = Math.max(...Object.values(dailyMessages), 1);

  // Category distribution
  const categoryDist = {};
  contacts.forEach(c => {
    const cat = c.categories?.name || 'Sin categoría';
    categoryDist[cat] = (categoryDist[cat] || 0) + 1;
  });

  // Status distribution
  const statusDist = {};
  contacts.forEach(c => {
    statusDist[c.status] = (statusDist[c.status] || 0) + 1;
  });

  // Conversion rate
  const inscritos = contacts.filter(c => c.status === 'inscrito').length;
  const conversionRate = contacts.length ? ((inscritos / contacts.length) * 100).toFixed(1) : 0;

  page.innerHTML = `
    <div class="page-title-section">
      <div>
        <h2 class="page-title"><iconify-icon icon="ci:bar-chart"></iconify-icon> Analíticas</h2>
        <p class="page-description">Estadísticas y métricas del sistema</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid-4 stagger" style="margin-bottom: var(--space-xl);">
      <div class="stat-card">
        <div class="stat-icon green"><iconify-icon icon="ci:chat"></iconify-icon></div>
        <div class="stat-content">
          <div class="stat-label">Mensajes (7 días)</div>
          <div class="stat-value">${conversationsLast7.length}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><iconify-icon icon="ci:users"></iconify-icon></div>
        <div class="stat-content">
          <div class="stat-label">Nuevos Contactos (30 días)</div>
          <div class="stat-value">${newContactsLast30.length}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🎯</div>
        <div class="stat-content">
          <div class="stat-label">Tasa de Conversión</div>
          <div class="stat-value">${conversionRate}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">📋</div>
        <div class="stat-content">
          <div class="stat-label">Total Mensajes</div>
          <div class="stat-value">${conversations.length}</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Messages Chart -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title"><iconify-icon icon="ci:bar-chart"></iconify-icon> Mensajes (Últimos 7 días)</h3>
        </div>
        <div class="chart-container">
          <div class="bar-chart">
            ${Object.entries(dailyMessages).map(([date, count]) => {
              const dayName = new Date(date + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' });
              const height = (count / maxDaily) * 100;
              return `
                <div class="bar-item">
                  <div class="bar-value">${count}</div>
                  <div class="bar-track">
                    <div class="bar-fill" style="height: ${height}%;"></div>
                  </div>
                  <div class="bar-label">${dayName}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Top Templates -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title">🏆 Plantillas Más Usadas</h3>
        </div>
        <div class="top-list">
          ${templates.slice(0, 6).map((t, i) => `
            <div class="top-list-item">
              <span class="top-list-rank">${i + 1}</span>
              <span class="top-list-icon">${t.icon}</span>
              <div class="top-list-info">
                <div class="top-list-name">${t.name}</div>
                <div class="top-list-meta">${t.category}</div>
              </div>
              <span class="badge badge-green">${t.use_count || 0}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: var(--space-lg);">
      <!-- Status Distribution -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title">📋 Estado de Contactos</h3>
        </div>
        <div class="status-list">
          ${Object.entries(statusDist).map(([status, count]) => {
            const config = statusConfig[status] || { label: status, icon: '❓' };
            const pct = ((count / contacts.length) * 100).toFixed(0);
            return `
              <div class="status-list-item">
                <span>${config.icon} ${config.label}</span>
                <div class="status-list-bar">
                  <div class="status-list-fill" style="width: ${pct}%;"></div>
                </div>
                <span class="text-sm" style="font-weight: 700; min-width: 40px; text-align: right;">${count} (${pct}%)</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Category Distribution -->
      <div class="card card-glass">
        <div class="card-header">
          <h3 class="card-title"><iconify-icon icon="ci:tag"></iconify-icon> Contactos por Categoría</h3>
        </div>
        <div class="status-list">
          ${Object.entries(categoryDist).map(([cat, count]) => {
            const pct = ((count / contacts.length) * 100).toFixed(0);
            return `
              <div class="status-list-item">
                <span>${cat}</span>
                <div class="status-list-bar">
                  <div class="status-list-fill" style="width: ${pct}%; background: var(--info);"></div>
                </div>
                <span class="text-sm" style="font-weight: 700; min-width: 40px; text-align: right;">${count} (${pct}%)</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
