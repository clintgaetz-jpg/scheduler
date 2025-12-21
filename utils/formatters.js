/**
 * Formatters
 * 
 * All formatting functions in one place.
 * Import what you need:
 *   import { formatMoney, formatDate } from '@/utils/formatters';
 */

// ============================================
// MONEY
// ============================================

export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

export function formatMoneyShort(amount) {
  if (!amount) return '$0';
  const num = parseFloat(amount);
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'k';
  }
  return '$' + Math.round(num);
}

// ============================================
// DATES
// ============================================

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateISO(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(dateStr);
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

// ============================================
// HOURS
// ============================================

export function formatHours(hours) {
  if (!hours && hours !== 0) return '0h';
  const num = parseFloat(hours);
  if (num % 1 === 0) return `${num}h`;
  return `${num.toFixed(1)}h`;
}

export function formatHoursDecimal(hours) {
  if (!hours) return '0.0';
  return parseFloat(hours).toFixed(1);
}

// ============================================
// PHONE
// ============================================

export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

// ============================================
// TEXT
// ============================================

export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str) {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
}

// ============================================
// VEHICLE
// ============================================

export function formatVehicle(year, make, model) {
  const parts = [year, make, model].filter(Boolean);
  return parts.join(' ') || 'Unknown Vehicle';
}

export function formatVehicleShort(year, make, model) {
  if (!year && !make && !model) return 'Unknown';
  const makeShort = make?.split(' ')[0] || '';
  return `${year || ''} ${makeShort} ${model || ''}`.trim();
}
