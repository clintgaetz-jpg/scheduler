import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  supabaseFetch, 
  getAppointments, 
  getTechCapabilities, 
  getTechTimeOff 
} from '../utils/supabase';

// ============================================
// useAvailability Hook
// Calculates tech availability, capacity, and smart suggestions
// 
// Usage:
//   const { 
//     availability,      // per-tech hours remaining
//     nextAvailable,     // smart suggestions for services
//     loading,
//     refresh,
//     canBook,           // check if booking is possible
//     getWarnings        // get any booking warnings
//   } = useAvailability(services, selectedDate);
// ============================================

export function useAvailability(services = [], selectedDate = null, options = {}) {
  const { daysToLook = 14 } = options;
  
  // Data state
  const [technicians, setTechnicians] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysToLook);
      const endStr = endDate.toISOString().split('T')[0];

      const [techsRes, capsRes, offRes, apptsRes, settingsRes] = await Promise.all([
        supabaseFetch('technicians?is_active=eq.true&order=sort_order'),
        getTechCapabilities(),
        getTechTimeOff(today, endStr),
        getAppointments({ dateFrom: today, dateTo: endStr }),
        supabaseFetch('scheduler_settings')
      ]);

      setTechnicians(techsRes || []);
      setCapabilities(capsRes || []);
      setTimeOff(offRes || []);
      setAppointments(apptsRes || []);
      
      // Convert settings array to object
      const settingsObj = {};
      (settingsRes || []).forEach(s => {
        settingsObj[s.setting_key] = s.setting_value;
      });
      setSettings(settingsObj);
      
    } catch (err) {
      console.error('useAvailability load error:', err);
      setError(err.message);
    }
    
    setLoading(false);
  }, [daysToLook]);

  // Load on mount and when daysToLook changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // Calculate availability for a specific date
  // Returns: { techId: { hoursRemaining, bookedHours, isOff, ... } }
  // ============================================
  const getDateAvailability = useCallback((date) => {
    const result = {};
    
    technicians.forEach(tech => {
      const techAppts = appointments.filter(a => 
        a.tech_id === tech.id && 
        a.scheduled_date === date &&
        a.status !== 'cancelled'
      );
      
      const bookedHours = techAppts.reduce((sum, a) => 
        sum + (parseFloat(a.estimated_hours) || 0), 0
      );
      
      // Check time off
      const off = timeOff.find(t => 
        t.tech_id === tech.id && t.date === date
      );
      
      const isFullDayOff = off?.full_day;
      const isMorningOff = off?.morning_off;
      const isAfternoonOff = off?.afternoon_off;
      
      // Calculate available hours
      let availableHours = parseFloat(tech.hours_per_day) || 8;
      if (isFullDayOff) availableHours = 0;
      else if (isMorningOff) availableHours = availableHours / 2;
      else if (isAfternoonOff) availableHours = availableHours / 2;
      
      const hoursRemaining = Math.max(0, availableHours - bookedHours);
      
      // Count service types booked
      const serviceCounts = {};
      techAppts.forEach(a => {
        const cat = a.service_category || 'general';
        serviceCounts[cat] = (serviceCounts[cat] || 0) + 1;
      });
      
      // Count waiters
      const waiterCount = techAppts.filter(a => 
        a.time_slot === 'waiter' || a.waiting_type === 'waiter'
      ).length;
      
      result[tech.id] = {
        tech,
        bookedHours,
        hoursRemaining,
        availableHours,
        isOff: isFullDayOff,
        isMorningOff,
        isAfternoonOff,
        offReason: off?.reason,
        serviceCounts,
        waiterCount,
        appointments: techAppts
      };
    });
    
    return result;
  }, [technicians, appointments, timeOff]);

  // ============================================
  // Check if a tech can do a service category
  // ============================================
  const canTechDoCategory = useCallback((techId, category) => {
    const cap = capabilities.find(c => 
      c.tech_id === techId && c.category === category
    );
    // If no capability record, assume they CAN do it (no restriction)
    // If record exists, check is_enabled
    return !cap || cap.is_enabled !== false;
  }, [capabilities]);

  // ============================================
  // Get category limits for a tech
  // ============================================
  const getTechCategoryLimits = useCallback((techId, category) => {
    const cap = capabilities.find(c => 
      c.tech_id === techId && c.category === category
    );
    return {
      maxPerDay: cap?.max_per_day ?? null, // null = unlimited
      maxMorning: cap?.max_morning ?? null,
      maxAfternoon: cap?.max_afternoon ?? null
    };
  }, [capabilities]);

  // ============================================
  // Check if booking would exceed limits
  // Returns: { canBook: boolean, warnings: string[] }
  // ============================================
  const checkBookingLimits = useCallback((techId, date, category, timeSlot = 'anytime') => {
    const warnings = [];
    const availability = getDateAvailability(date);
    const techAvail = availability[techId];
    
    if (!techAvail) {
      return { canBook: false, warnings: ['Tech not found'] };
    }
    
    // Check if off
    if (techAvail.isOff) {
      return { canBook: false, warnings: [`${techAvail.tech.name} is off on this date`] };
    }
    
    // Check if can do category
    if (!canTechDoCategory(techId, category)) {
      warnings.push(`${techAvail.tech.name} doesn't typically do ${category} work`);
    }
    
    // Check category limits
    const limits = getTechCategoryLimits(techId, category);
    const currentCount = techAvail.serviceCounts[category] || 0;
    
    if (limits.maxPerDay !== null && currentCount >= limits.maxPerDay) {
      warnings.push(`${techAvail.tech.name} at daily limit for ${category} (${limits.maxPerDay}/day)`);
    }
    
    // Check morning/afternoon limits
    if (timeSlot === 'morning' && limits.maxMorning !== null) {
      // Would need to count morning-specific bookings
      // For now, simplified check
    }
    
    // Check waiter limits
    const shopWaiterLimit = settings.waiter_limits?.max_per_day ?? 2;
    if (timeSlot === 'waiter') {
      // Count all waiters across all techs for this date
      const totalWaiters = Object.values(availability).reduce(
        (sum, t) => sum + t.waiterCount, 0
      );
      if (totalWaiters >= shopWaiterLimit) {
        warnings.push(`Shop at waiter limit for this date (${shopWaiterLimit}/day)`);
      }
    }
    
    return { 
      canBook: true, // Allow override, just warn
      warnings 
    };
  }, [getDateAvailability, canTechDoCategory, getTechCategoryLimits, settings]);

  // ============================================
  // Find techs who can do given services
  // ============================================
  const findCapableTechs = useCallback((serviceCategories) => {
    return technicians.filter(tech => {
      // Tech must be able to do ALL categories
      return serviceCategories.every(cat => canTechDoCategory(tech.id, cat));
    });
  }, [technicians, canTechDoCategory]);

  // ============================================
  // Calculate "Next Available" suggestions
  // Returns array of options:
  // [
  //   { type: 'single', tech, date, timeSlot },
  //   { type: 'split', assignments: [{ tech, date, services }] }
  // ]
  // ============================================
  const nextAvailable = useMemo(() => {
    if (services.length === 0) return [];
    
    const totalHours = services.reduce((sum, s) => 
      sum + (parseFloat(s.hours) || 0), 0
    );
    
    // Get unique categories from services
    const categories = [...new Set(services.map(s => s.category || 'general'))];
    
    const suggestions = [];
    const today = new Date();
    
    // Look through next N days
    for (let i = 0; i < daysToLook && suggestions.length < 5; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayAvailability = getDateAvailability(dateStr);
      
      // Option 1: Single tech can do it all
      for (const tech of technicians) {
        const techAvail = dayAvailability[tech.id];
        if (!techAvail || techAvail.isOff) continue;
        
        // Check if tech can do all categories
        const canDoAll = categories.every(cat => canTechDoCategory(tech.id, cat));
        if (!canDoAll) continue;
        
        // Check if enough hours
        if (techAvail.hoursRemaining >= totalHours) {
          const { warnings } = checkBookingLimits(tech.id, dateStr, categories[0]);
          
          suggestions.push({
            type: 'single',
            tech,
            date: dateStr,
            dateDisplay: formatDateShort(checkDate),
            hoursAvailable: techAvail.hoursRemaining,
            hoursNeeded: totalHours,
            warnings,
            priority: warnings.length === 0 ? 1 : 2
          });
        }
      }
      
      // Option 2: Split between techs (if services have different categories)
      if (categories.length > 1 || suggestions.length === 0) {
        const splitOption = findSplitOption(
          services, 
          dayAvailability, 
          dateStr,
          categories
        );
        if (splitOption) {
          suggestions.push({
            type: 'split',
            date: dateStr,
            dateDisplay: formatDateShort(checkDate),
            assignments: splitOption,
            priority: 3
          });
        }
      }
    }
    
    // Sort by priority, then date
    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.date.localeCompare(b.date);
    }).slice(0, 5);
    
  }, [services, technicians, daysToLook, getDateAvailability, canTechDoCategory, checkBookingLimits]);

  // Helper: Find split booking option
  const findSplitOption = (services, dayAvailability, date, categories) => {
    // Group services by category
    const byCategory = {};
    services.forEach(s => {
      const cat = s.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    });
    
    const assignments = [];
    
    for (const [category, catServices] of Object.entries(byCategory)) {
      const catHours = catServices.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
      
      // Find best tech for this category
      let bestTech = null;
      let bestScore = -1;
      
      for (const tech of technicians) {
        const avail = dayAvailability[tech.id];
        if (!avail || avail.isOff) continue;
        if (!canTechDoCategory(tech.id, category)) continue;
        if (avail.hoursRemaining < catHours) continue;
        
        // Score: prefer techs with exact fit, penalize those at limits
        let score = avail.hoursRemaining;
        const limits = getTechCategoryLimits(tech.id, category);
        if (limits.maxPerDay !== null) {
          const current = avail.serviceCounts[category] || 0;
          if (current >= limits.maxPerDay) continue;
          score -= (current / limits.maxPerDay) * 2; // Penalize near-limit
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestTech = tech;
        }
      }
      
      if (!bestTech) return null; // Can't split this way
      
      assignments.push({
        tech: bestTech,
        category,
        services: catServices,
        hours: catHours
      });
    }
    
    // Only return if we actually split across multiple techs
    const uniqueTechs = new Set(assignments.map(a => a.tech.id));
    if (uniqueTechs.size <= 1) return null;
    
    return assignments;
  };

  // ============================================
  // Computed: availability for selected date
  // ============================================
  const selectedDateAvailability = useMemo(() => {
    if (!selectedDate) return null;
    return getDateAvailability(selectedDate);
  }, [selectedDate, getDateAvailability]);

  return {
    // Data
    technicians,
    capabilities,
    settings,
    loading,
    error,
    
    // Computed
    availability: selectedDateAvailability,
    nextAvailable,
    
    // Methods
    refresh: loadData,
    getDateAvailability,
    canTechDoCategory,
    checkBookingLimits,
    findCapableTechs
  };
}

// ============================================
// Helper: Format date for display
// ============================================
function formatDateShort(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
}

export default useAvailability;
