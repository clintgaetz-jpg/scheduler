/**
 * Date Helpers
 * 
 * All date calculation functions.
 * Import what you need:
 *   import { getWeekDates, isWeekend } from '@/utils/dateHelpers';
 */

// ============================================
// WEEK CALCULATIONS
// ============================================

/**
 * Get array of weekday dates (Mon-Fri) for the week containing the given date
 */
export function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setDate(diff));
  
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get the Friday of the week containing the given date
 */
export function getWeekEnd(date) {
  const monday = getWeekStart(date);
  const d = new Date(monday);
  d.setDate(d.getDate() + 4);
  return d.toISOString().split('T')[0];
}

// ============================================
// WEEKEND CHECKS
// ============================================

/**
 * Check if a date string is a weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date string is a weekday (Mon-Fri)
 */
export function isWeekday(dateStr) {
  return !isWeekend(dateStr);
}

// ============================================
// DATE COMPARISONS
// ============================================

/**
 * Check if two date strings are the same day
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.split('T')[0] === date2.split('T')[0];
}

/**
 * Check if date is today
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr.split('T')[0] === today;
}

/**
 * Check if date is in the past
 */
export function isPast(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr.split('T')[0] < today;
}

/**
 * Check if date is in the future
 */
export function isFuture(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr.split('T')[0] > today;
}

// ============================================
// DATE NAVIGATION
// ============================================

/**
 * Get the next weekday (skips weekends)
 */
export function nextWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  while (isWeekend(d.toISOString().split('T')[0])) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Get the previous weekday (skips weekends)
 */
export function prevWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  while (isWeekend(d.toISOString().split('T')[0])) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Add days to a date
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Add weeks to a date
 */
export function addWeeks(dateStr, weeks) {
  return addDays(dateStr, weeks * 7);
}

// ============================================
// DATE INFO
// ============================================

/**
 * Get day of week (0 = Sunday, 1 = Monday, etc.)
 */
export function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay();
}

/**
 * Get day name (Monday, Tuesday, etc.)
 */
export function getDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get short day name (Mon, Tue, etc.)
 */
export function getDayNameShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// ============================================
// TODAY HELPERS
// ============================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get today, but if it's a weekend, get next Monday
 */
export function getTodayOrNextWeekday() {
  const today = getToday();
  if (isWeekend(today)) {
    return nextWeekday(today);
  }
  return today;
}

// ============================================
// RANGE HELPERS
// ============================================

/**
 * Get array of dates between start and end (inclusive)
 */
export function getDateRange(startStr, endStr) {
  const dates = [];
  let current = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get array of weekdays between start and end (inclusive)
 */
export function getWeekdayRange(startStr, endStr) {
  return getDateRange(startStr, endStr).filter(isWeekday);
}
