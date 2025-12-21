// ============================================
// CONSTANTS
// ============================================

// Job categories with colors and icons
export const CATEGORIES = {
  oil: { name: 'Oil Change', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-300' },
  inspection: { name: 'Inspection', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-300' },
  brakes: { name: 'Brakes', color: '#dc2626', bg: 'bg-red-50', border: 'border-red-300' },
  tires: { name: 'Tires', color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-300' },
  alignment: { name: 'Alignment', color: '#7c3aed', bg: 'bg-purple-50', border: 'border-purple-300' },
  diag: { name: 'Diagnostics', color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-300' },
  ac: { name: 'A/C', color: '#0284c7', bg: 'bg-sky-50', border: 'border-sky-300' },
  maintenance: { name: 'Maintenance', color: '#0891b2', bg: 'bg-cyan-50', border: 'border-cyan-300' },
  general: { name: 'General', color: '#6b7280', bg: 'bg-gray-50', border: 'border-gray-300' },
};

// Rates
export const LABOR_RATE = 160; // $/hr
export const SHOP_SUPPLY_RATE = 0.10; // 10% on labor
export const GST_RATE = 0.05; // 5%

// Minimum booking hours for common services (actual labor might be less, but we block this time)
export const MIN_BOOKING_HOURS = {
  'oil': 1,
  'oil change': 1,
  'lof': 1,
  'lube': 1,
  'inspection': 1,
  'brake inspection': 0.75,
  'tire': 0.75,
  'tire swap': 0.75,
  'alignment': 1,
  'rotation': 0.5,
};

// Get booking hours for a service - respects minimums
export function getBookingHours(pkg) {
  const title = (pkg.title || pkg.name || '').toLowerCase();
  
  // Check for minimum booking hours based on service type
  for (const [key, minHours] of Object.entries(MIN_BOOKING_HOURS)) {
    if (title.includes(key)) {
      const laborHours = parseFloat(pkg.labor_hours) || 0;
      return Math.max(laborHours, minHours);
    }
  }
  
  // Use labor_hours if available
  if (pkg.labor_hours && parseFloat(pkg.labor_hours) > 0) {
    return Math.round(parseFloat(pkg.labor_hours) * 4) / 4; // Round to 0.25
  }
  
  // Estimate from labor_total at labor rate
  if (pkg.labor_total && parseFloat(pkg.labor_total) > 0) {
    return Math.round((parseFloat(pkg.labor_total) / LABOR_RATE) * 4) / 4 || 1;
  }
  
  // Estimate 40% of total as labor
  if (pkg.total && parseFloat(pkg.total) > 0) {
    return Math.round((parseFloat(pkg.total) * 0.4 / LABOR_RATE) * 4) / 4 || 1;
  }
  
  return 1;
}

// Detect job category from service name
export function detectCategory(serviceName) {
  const name = (serviceName || '').toLowerCase();
  
  if (name.includes('oil') || name.includes('lof') || name.includes('lube')) return 'oil';
  if (name.includes('brake')) return 'brakes';
  if (name.includes('tire') || name.includes('tyre')) return 'tires';
  if (name.includes('alignment')) return 'alignment';
  if (name.includes('inspection') || name.includes('safety')) return 'inspection';
  if (name.includes('diag') || name.includes('check engine')) return 'diag';
  if (name.includes('a/c') || name.includes('ac ') || name.includes('air condition')) return 'ac';
  if (name.includes('transmission') || name.includes('coolant') || name.includes('differential')) return 'maintenance';
  
  return 'general';
}
