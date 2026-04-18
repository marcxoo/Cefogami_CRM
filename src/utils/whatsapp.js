/* WhatsApp link utilities */

/**
 * Generate a wa.me link with pre-filled message
 * @param {string} phone - Phone number in international format (without +)
 * @param {string} message - Pre-filled message text
 * @returns {string} WhatsApp URL
 */
export function generateWhatsAppLink(phone, message = '') {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}${message ? '?text=' + encodedMessage : ''}`;
}

/**
 * Replace template variables with actual values
 * @param {string} template - Message template with {variable} placeholders
 * @param {object} values - Object with variable values
 * @returns {string} Processed message
 */
export function processTemplate(template, values = {}) {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  });
  return result;
}

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 */
export function openWhatsApp(phone, message = '') {
  const url = generateWhatsAppLink(phone, message);
  window.open(url, '_blank');
}

/**
 * Check if a message matches auto-response keywords
 * @param {string} message - Incoming message text
 * @param {Array} autoResponses - Array of auto-response rules
 * @returns {object|null} Matching auto-response rule
 */
export function matchAutoResponse(message, autoResponses) {
  const lowerMessage = message.toLowerCase();
  
  const sorted = [...autoResponses]
    .filter(ar => ar.is_active)
    .sort((a, b) => a.priority - b.priority);
  
  for (const rule of sorted) {
    const match = rule.keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (match) return rule;
  }
  
  return null;
}

/**
 * Format phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+593') && clean.length === 13) {
    return `+593 ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return clean;
}
