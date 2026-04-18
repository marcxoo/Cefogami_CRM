/**
 * Sidebar Navigation Component
 */
export function renderSidebar(activePage = 'dashboard') {
  const navItems = [
    { id: 'dashboard', icon: '<iconify-icon icon="ci:bar-chart"></iconify-icon>', label: 'Dashboard' },
    { id: 'contacts', icon: '<iconify-icon icon="ci:users"></iconify-icon>', label: 'Contactos' },
    { id: 'messages', icon: '<iconify-icon icon="ci:chat"></iconify-icon>', label: 'Mensajes Rápidos' },
    { id: 'templates', icon: '<iconify-icon icon="ci:list-check"></iconify-icon>', label: 'Plantillas' },
    { id: 'autoresponses', icon: '<iconify-icon icon="ci:terminal"></iconify-icon>', label: 'Auto-Respuestas' },
    { id: 'chatbot', icon: '<iconify-icon icon="ci:flask"></iconify-icon>', label: 'Simulador Chat' },
    { id: 'analytics', icon: '<iconify-icon icon="ci:line-chart"></iconify-icon>', label: 'Analíticas' },
  ];

  const bottomItems = [
    { id: 'settings', icon: '<iconify-icon icon="ci:settings"></iconify-icon>', label: 'Configuración' },
  ];

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon"><iconify-icon icon="ci:store"></iconify-icon></div>
      <div class="sidebar-brand-text">
        <span class="sidebar-brand-name">GastroConnect</span>
        <span class="sidebar-brand-subtitle">WhatsApp CRM</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-title">Menú Principal</div>
      ${navItems.map(item => `
        <a class="sidebar-link ${activePage === item.id ? 'active' : ''}" data-page="${item.id}">
          <span class="sidebar-link-icon">${item.icon}</span>
          <span class="sidebar-link-label">${item.label}</span>
        </a>
      `).join('')}

      <div class="sidebar-section-title" style="margin-top: auto; padding-top: var(--space-lg);">Sistema</div>
      ${bottomItems.map(item => `
        <a class="sidebar-link ${activePage === item.id ? 'active' : ''}" data-page="${item.id}">
          <span class="sidebar-link-icon">${item.icon}</span>
          <span class="sidebar-link-label">${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-footer-avatar"><iconify-icon icon="ci:user"></iconify-icon></div>
      <div class="sidebar-footer-info">
        <div class="sidebar-footer-name">Administrador</div>
        <div class="sidebar-footer-role">Centro Gastronómico</div>
      </div>
    </div>
  `;

  // Add click handlers
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
    });
  });
}
