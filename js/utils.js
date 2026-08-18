/**
 * BuilderMate - Utility Helper Functions
 */

// Format Currency with custom symbol and Indian/International numbering
export function formatCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0;
  // Format with commas
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
  return `${symbol} ${formatted}`;
}

// Format numbers with clean decimals
export function formatNumber(num) {
  const n = Number(num) || 0;
  return n.toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
}

// Format date into human readable string: "17 Aug 2026"
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Format date for <input type="date"> (YYYY-MM-DD)
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate unique identifier
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// Clean and format phone numbers
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

// Generate direct WhatsApp link
export function getWhatsAppLink(phone, message = '') {
  let cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '#';
  // Remove leading plus or 00 for wa.me if needed, or format
  cleaned = cleaned.replace(/^\+/, '');
  // If Indian 10-digit number without country code, prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleaned}${message ? `?text=${encodedMsg}` : ''}`;
}

// Generate direct Tel link
export function getTelLink(phone) {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned ? `tel:${cleaned}` : '#';
}

// Show Toast Notification
export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-up`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Open Modal
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

// Close Modal
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  // Check if any other modals are open
  const openModals = document.querySelectorAll('.modal-overlay.active');
  if (openModals.length === 0) {
    document.body.classList.remove('modal-open');
  }
}

// Download JSON file
export function downloadJson(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `BuilderMate_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Predefined construction material categories with standard units
export const PRESET_MATERIALS = [
  { name: 'Bricks', unit: 'Numbers', icon: '🧱' },
  { name: 'Steel (TMT)', unit: 'Kg', icon: '🔩' },
  { name: 'Cement Bags', unit: 'Bags', icon: '📦' },
  { name: 'Aggregates (Gravel)', unit: 'Ton', icon: '🪨' },
  { name: 'River Sand / M-Sand', unit: 'CFT', icon: '⏳' },
  { name: 'Paint', unit: 'Tins', icon: '🎨' },
  { name: 'Floor Tiles', unit: 'Boxes', icon: '⬜' },
  { name: 'Plumbing & Pipes', unit: 'Units', icon: '🔧' },
  { name: 'Electrical Wiring', unit: 'Coils', icon: '⚡' },
  { name: 'Wood / Timber', unit: 'CFT', icon: '🪵' }
];

// Predefined labour roles
export const LABOUR_ROLES = [
  'Head Mason (Mistri)',
  'Mason',
  'Steel Fixer / Barbender',
  'Carpenter / Shuttering',
  'Painter',
  'Electrician',
  'Plumber',
  'Tile Layer',
  'Helper / Labour',
  'Site Supervisor',
  'Contractor / Sub-Contractor'
];
