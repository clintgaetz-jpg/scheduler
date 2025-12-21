/**
 * Constants
 * 
 * All configuration constants in one place.
 * Colors, categories, status mappings, etc.
 * 
 * Import what you need:
 *   import { SERVICE_CATEGORIES, CARD_STATUS } from '@/utils/constants';
 */

// ============================================
// BRAND COLORS (NAPA AutoPro)
// ============================================

export const BRAND = {
  yellow: '#FFC836',      // NAPA Yellow
  blue: '#0A0094',        // NAPA Blue
  darkCharcoal: '#1a1a2e', // Header background
};

// ============================================
// SERVICE CATEGORIES
// ============================================

export const SERVICE_CATEGORIES = {
  oil: { 
    name: 'Oil Change', 
    color: '#d97706', 
    bg: 'bg-amber-50', 
    border: 'border-amber-300',
    icon: 'droplet'
  },
  diag: { 
    name: 'Diagnostics', 
    color: '#ea580c', 
    bg: 'bg-orange-50', 
    border: 'border-orange-300',
    icon: 'zap'
  },
  brakes: { 
    name: 'Brakes', 
    color: '#dc2626', 
    bg: 'bg-red-50', 
    border: 'border-red-300',
    icon: 'gauge'
  },
  tires: { 
    name: 'Tires', 
    color: '#6366f1', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-300',
    icon: 'circle'
  },
  alignment: { 
    name: 'Alignment', 
    color: '#7c3aed', 
    bg: 'bg-purple-50', 
    border: 'border-purple-300',
    icon: 'move'
  },
  inspection: { 
    name: 'Inspection', 
    color: '#16a34a', 
    bg: 'bg-green-50', 
    border: 'border-green-300',
    icon: 'clipboard-check'
  },
  ac: { 
    name: 'A/C', 
    color: '#0284c7', 
    bg: 'bg-sky-50', 
    border: 'border-sky-300',
    icon: 'thermometer'
  },
  electrical: { 
    name: 'Electrical', 
    color: '#eab308', 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-300',
    icon: 'zap'
  },
  suspension: { 
    name: 'Suspension', 
    color: '#84cc16', 
    bg: 'bg-lime-50', 
    border: 'border-lime-300',
    icon: 'git-branch'
  },
  engine: { 
    name: 'Engine', 
    color: '#78716c', 
    bg: 'bg-stone-50', 
    border: 'border-stone-300',
    icon: 'settings'
  },
  transmission: { 
    name: 'Transmission', 
    color: '#a855f7', 
    bg: 'bg-purple-50', 
    border: 'border-purple-300',
    icon: 'settings'
  },
  maintenance: { 
    name: 'Maintenance', 
    color: '#0891b2', 
    bg: 'bg-cyan-50', 
    border: 'border-cyan-300',
    icon: 'wrench'
  },
  general: { 
    name: 'General', 
    color: '#6b7280', 
    bg: 'bg-gray-50', 
    border: 'border-gray-300',
    icon: 'wrench'
  },
};

// ============================================
// APPOINTMENT CARD STATUS (Background colors)
// ============================================

export const CARD_STATUS = {
  scheduled: {
    name: 'Scheduled',
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-700',
    description: 'Booked, vehicle not here yet'
  },
  on_site: {
    name: 'On Site',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    description: 'Vehicle has arrived'
  },
  in_progress: {
    name: 'In Progress',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    description: 'Being worked on'
  },
  done: {
    name: 'Done',
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800',
    description: 'All work complete'
  },
  on_hold: {
    name: 'On Hold',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    description: 'Waiting for something'
  }
};

// ============================================
// LED STATUS COLORS
// ============================================

export const LED_COLORS = {
  off: {
    bg: 'bg-gray-300',
    glow: '',
    color: '#9ca3af'
  },
  green: {
    bg: 'bg-emerald-500',
    glow: 'shadow-emerald-500/50',
    color: '#10b981'
  },
  yellow: {
    bg: 'bg-amber-400',
    glow: 'shadow-amber-400/50',
    color: '#fbbf24'
  },
  red: {
    bg: 'bg-red-500',
    glow: 'shadow-red-500/50',
    color: '#ef4444'
  },
  blue: {
    bg: 'bg-blue-500',
    glow: 'shadow-blue-500/50',
    color: '#3b82f6'
  },
  orange: {
    bg: 'bg-orange-500',
    glow: 'shadow-orange-500/50',
    color: '#f97316'
  }
};

// ============================================
// HOLD REASONS
// ============================================

export const HOLD_REASONS = {
  parts: { 
    label: 'Waiting for Parts', 
    color: 'orange',
    icon: '📦',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700'
  },
  auth: { 
    label: 'Needs Authorization', 
    color: 'yellow',
    icon: '💰',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700'
  },
  customer: { 
    label: 'Customer Decision', 
    color: 'purple',
    icon: '👤',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700'
  },
  scheduling: { 
    label: 'Scheduling', 
    color: 'blue',
    icon: '📅',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700'
  },
  other: { 
    label: 'Other', 
    color: 'gray',
    icon: '⏸️',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700'
  }
};

// ============================================
// PARTS STATUS
// ============================================

export const PARTS_STATUS = {
  none: { label: 'No Parts Needed', led: 'off' },
  needed: { label: 'Parts Needed', led: 'red' },
  ordered: { label: 'Parts Ordered', led: 'yellow' },
  partial: { label: 'Some Parts Here', led: 'orange' },
  arrived: { label: 'All Parts Here', led: 'green' }
};

// ============================================
// APPOINTMENT STATUS
// ============================================

export const APPOINTMENT_STATUS = {
  request: { label: 'Request', color: 'purple' },
  scheduled: { label: 'Scheduled', color: 'blue' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  deleted: { label: 'Deleted', color: 'red' },
  no_show: { label: 'No Show', color: 'red' }
};

// ============================================
// SERVICE LINE STATUS (for split/hold)
// ============================================

export const LINE_STATUS = {
  pending: { label: 'Pending', color: 'gray' },
  scheduled: { label: 'Scheduled', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'blue' },
  hold: { label: 'On Hold', color: 'amber' },
  done: { label: 'Done', color: 'green' }
};

// ============================================
// TIMING PREFERENCES (for quick requests)
// ============================================

export const TIMING_PREFERENCES = {
  asap: { label: 'ASAP', priority: 1 },
  today: { label: 'Today', priority: 2 },
  this_week: { label: 'This Week', priority: 3 },
  next_week: { label: 'Next Week', priority: 4 },
  flexible: { label: 'Flexible', priority: 5 }
};

// ============================================
// SHOP DEFAULTS
// ============================================

export const SHOP_DEFAULTS = {
  hoursPerDay: 8,
  laborRate: 160,
  shopSupplyRate: 0.10, // 10% on labor
  taxRate: 0.05, // 5% GST
  startTime: '08:00',
  endTime: '17:00',
  waiterSlots: ['08:00', '13:00'],
  maxWaitersPerSlot: 2,
};
