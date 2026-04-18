/**
 * Format a date relative to now
 */
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

/**
 * Format date nicely
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Generate a color from a string (for avatars)
 */
export function stringToColor(str) {
  const colors = [
    '#25D366', '#3B82F6', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#14B8A6', '#6366F1',
    '#F97316', '#06B6D4', '#84CC16', '#E11D48'
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Status display configuration
 */
export const statusConfig = {
  nuevo: { label: 'Nuevo', badge: 'badge-blue', icon: '<iconify-icon icon="ci:plus" style="vertical-align: sub;"></iconify-icon>' },
  en_seguimiento: { label: 'En Seguimiento', badge: 'badge-yellow', icon: '<iconify-icon icon="ci:list-check" style="vertical-align: sub;"></iconify-icon>' },
  inscrito: { label: 'Inscrito', badge: 'badge-green', icon: '<iconify-icon icon="ci:check-all" style="vertical-align: sub;"></iconify-icon>' },
  egresado: { label: 'Egresado', badge: 'badge-purple', icon: '<iconify-icon icon="ci:book-open" style="vertical-align: sub;"></iconify-icon>' },
  inactivo: { label: 'Inactivo', badge: 'badge-red', icon: '<iconify-icon icon="ci:pause-circle-outline" style="vertical-align: sub;"></iconify-icon>' }
};

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Simple number formatter
 */
export function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

/**
 * Map standard emojis to Iconify Coolicon equivalents
 */
export function mapEmojiToIconify(emoji) {
  const map = {
    '🎯': '<iconify-icon icon="ci:target" style="vertical-align: sub;"></iconify-icon>',
    '👨‍🍳': '<iconify-icon icon="ci:user" style="vertical-align: sub;"></iconify-icon>',
    '🎓': '<iconify-icon icon="ci:book-open" style="vertical-align: sub;"></iconify-icon>',
    '💡': '<iconify-icon icon="ci:bulb" style="vertical-align: sub;"></iconify-icon>',
    '🏢': '<iconify-icon icon="ci:building" style="vertical-align: sub;"></iconify-icon>',
    '👋': '<iconify-icon icon="ci:user-voice" style="vertical-align: sub;"></iconify-icon>',
    '🕐': '<iconify-icon icon="ci:clock" style="vertical-align: sub;"></iconify-icon>',
    '💰': '<iconify-icon icon="ci:credit-card" style="vertical-align: sub;"></iconify-icon>',
    '📚': '<iconify-icon icon="ci:book-open" style="vertical-align: sub;"></iconify-icon>',
    '📍': '<iconify-icon icon="ci:location" style="vertical-align: sub;"></iconify-icon>',
    '📋': '<iconify-icon icon="ci:list-check" style="vertical-align: sub;"></iconify-icon>',
    '🔄': '<iconify-icon icon="ci:redo" style="vertical-align: sub;"></iconify-icon>',
    '🎉': '<iconify-icon icon="ci:gift" style="vertical-align: sub;"></iconify-icon>',
    '👤': '<iconify-icon icon="ci:user" style="vertical-align: sub;"></iconify-icon>',
    '💬': '<iconify-icon icon="ci:chat" style="vertical-align: sub;"></iconify-icon>',
    '📝': '<iconify-icon icon="ci:edit" style="vertical-align: sub;"></iconify-icon>'
  };
  return map[emoji] || emoji;
}
