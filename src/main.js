/* ═══════════════════════════════════════════════════════
   GastroConnect CRM - Main Entry Point
   Centro De Formación Gastronómico Milagro
   ═══════════════════════════════════════════════════════ */

// Styles
import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/messages.css';
import './styles/templates.css';
import './styles/analytics.css';
import './styles/settings.css';
import './styles/chatbot.css';

// Components
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';

// Pages
import { renderDashboard } from './pages/dashboard.js';
import { renderContacts } from './pages/contacts.js';
import { renderMessages } from './pages/messages.js';
import { renderTemplates } from './pages/templates.js';
import { renderAutoResponses } from './pages/autoresponses.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderSettings } from './pages/settings.js';
import { renderChatbot } from './pages/chatbot.js';

// Supabase
import { initializeDatabase } from './supabase.js';

// ── Router ───────────────────────────────────────────
const pages = {
  dashboard: renderDashboard,
  contacts: renderContacts,
  messages: renderMessages,
  templates: renderTemplates,
  autoresponses: renderAutoResponses,
  chatbot: renderChatbot,
  'chatbot-standalone': (options) => renderChatbot({ ...options, standalone: true }),
  analytics: renderAnalytics,
  settings: renderSettings,
};

let currentPage = 'dashboard';

async function navigateTo(page, options = {}) {
  if (!pages[page]) page = 'dashboard';
  currentPage = page;

  const isStandalone = page === 'chatbot-standalone';

  // Toggle layout visibility
  document.getElementById('sidebar').style.display = isStandalone ? 'none' : '';
  document.getElementById('app-header').style.display = isStandalone ? 'none' : '';
  
  if (isStandalone) {
    document.getElementById('main-content').classList.add('standalone-mode');
    document.body.classList.add('standalone-body');
  } else {
    document.getElementById('main-content').classList.remove('standalone-mode');
    document.body.classList.remove('standalone-body');
    renderSidebar(page);
    renderHeader(page);
  }

  // Show loading
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 300px;">
      <div style="text-align: center;">
        <div style="font-size: 2rem; animation: spin 1s linear infinite; display: inline-block;">⏳</div>
        <p style="color: var(--text-tertiary); margin-top: var(--space-md); font-size: 0.875rem;">Cargando...</p>
      </div>
    </div>
  `;

  // Render page
  try {
    await pages[page](options);
  } catch (err) {
    console.error(`Error rendering ${page}:`, err);
    content.innerHTML = `
      <div class="empty-state" style="padding-top: 80px;">
        <div class="empty-state-icon"><iconify-icon icon="ci:warning"></iconify-icon></div>
        <div class="empty-state-title">Error al cargar la página</div>
        <div class="empty-state-text">${err.message || 'Verifica que las tablas de Supabase estén creadas correctamente.'}</div>
        <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="location.reload()">🔄 Reintentar</button>
      </div>
    `;
  }

  // Update URL hash
  window.location.hash = page;
}

// ── Navigation Event ─────────────────────────────────
window.addEventListener('navigate', (e) => {
  const { page, ...options } = e.detail;
  navigateTo(page, options);
});

// ── Hash-based routing ───────────────────────────────
window.addEventListener('hashchange', () => {
  const page = window.location.hash.slice(1) || 'dashboard';
  if (page !== currentPage) navigateTo(page);
});

// ── Initialize ───────────────────────────────────────
async function init() {
  console.log('🍳 GastroConnect CRM - Initializing...');

  // Check DB
  const dbReady = await initializeDatabase();

  if (!dbReady) {
    const content = document.getElementById('page-content');
    renderSidebar('dashboard');
    renderHeader('dashboard');
    content.innerHTML = `
      <div class="empty-state" style="padding-top: 60px;">
        <div class="empty-state-icon"><iconify-icon icon="ci:folder"></iconify-icon></div>
        <div class="empty-state-title">Configuración de Base de Datos Necesaria</div>
        <div class="empty-state-text" style="max-width: 600px;">
          Las tablas de Supabase no han sido creadas aún. Por favor, ejecuta el script SQL de migración en el 
          <a href="https://supabase.com/dashboard" target="_blank">Dashboard de Supabase</a> → SQL Editor.
          <br><br>
          El script SQL se encuentra en el archivo <code>supabase-migration.sql</code> del proyecto.
        </div>
        <button class="btn btn-primary btn-lg" style="margin-top: var(--space-lg);" onclick="location.reload()">
          🔄 Verificar de nuevo
        </button>
      </div>
    `;
    return;
  }

  // Navigate to initial page
  const initialPage = window.location.hash.slice(1) || 'dashboard';
  navigateTo(initialPage);

  console.log('✅ GastroConnect CRM - Ready!');
}

// Start
init();
