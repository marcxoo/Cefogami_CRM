/**
 * Modal Component
 */
export function openModal({ title, content, footer, size = 'md' }) {
  const overlay = document.getElementById('modal-overlay');
  const maxWidth = size === 'lg' ? '720px' : size === 'sm' ? '400px' : '560px';

  overlay.innerHTML = `
    <div class="modal" style="max-width: ${maxWidth}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  overlay.classList.remove('hidden');

  // Close handlers
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', handleEscape);
}

function handleEscape(e) {
  if (e.key === 'Escape') closeModal();
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  overlay.innerHTML = '';
  document.removeEventListener('keydown', handleEscape);
}
