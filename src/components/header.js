/**
 * Header Component
 */

const pageTitles = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  contacts: { title: 'Contactos', subtitle: 'Gestión de clientes y prospectos' },
  messages: { title: 'Mensajes Rápidos', subtitle: 'Enviar mensajes por WhatsApp' },
  templates: { title: 'Plantillas', subtitle: 'Plantillas de mensajes automatizados' },
  autoresponses: { title: 'Auto-Respuestas', subtitle: 'Reglas de respuesta automática' },
  chatbot: { title: 'Simulador de Chat', subtitle: 'Prueba el chatbot como si fueras un cliente' },
  analytics: { title: 'Analíticas', subtitle: 'Estadísticas y reportes' },
  settings: { title: 'Configuración', subtitle: 'Ajustes del sistema' },
};

export function renderHeader(activePage = 'dashboard') {
  const { title, subtitle } = pageTitles[activePage] || pageTitles.dashboard;
  const header = document.getElementById('app-header');

  header.innerHTML = `
    <div class="header-left">
      <div>
        <h1 class="header-title">${title}</h1>
        <p class="header-subtitle">${subtitle}</p>
      </div>
    </div>
    <div class="header-right">
      <div class="header-search">
        <span class="header-search-icon">🔍</span>
        <input type="text" id="global-search" placeholder="Buscar contactos, plantillas..." />
      </div>
      <button class="header-btn" id="btn-whatsapp-web" title="Abrir WhatsApp Web">
        💬
      </button>
      <button class="header-btn" id="btn-notifications" title="Notificaciones">
        🔔
      </button>
    </div>
  `;

  // WhatsApp Web button
  document.getElementById('btn-whatsapp-web').addEventListener('click', () => {
    window.open('https://web.whatsapp.com', '_blank');
  });

  // Global search
  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { page: 'contacts', search: searchInput.value.trim() }
      }));
    }
  });
}
