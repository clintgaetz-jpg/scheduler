import { useState, useCallback } from 'react';
import { useCustomerLookup } from '../../../hooks/useCustomerLookup';
import { useQuote } from '../../../hooks/useQuote';
import { bookAppointment, updateAppointment } from '../../../utils/supabase';

// ============================================
// useBookingState Hook
// Centralized state management for booking modal
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// Date helpers
const isWeekend = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
};

const getNextWeekday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getInitialDate = (selectedDate) => {
  const date = selectedDate || new Date().toISOString().split('T')[0];
  return isWeekend(date) ? getNextWeekday(date) : date;
};

export function useBookingState({ editingAppointment, selectedDate, settings }) {
  // Customer lookup
  const {
    searchTerm,
    searchResults,
    searching,
    customer,
    loading: customerLoading,
    search,
    selectCustomer: selectCustomerFromLookup,
    clearCustomer: clearCustomerFromLookup
  } = useCustomerLookup();

  // Quote management
  const {
    services,
    totals,
    addService: addServiceToQuote,
    removeService,
    clearServices,
    reorderServices
  } = useQuote(settings);

  // Vehicle state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState(null);
  const [vehicleHistoryLoading, setVehicleHistoryLoading] = useState(false);
  const [vehicleSort, setVehicleSort] = useState('most_overdue'); // most_overdue | last_visit | alphabetical

  // Scheduling state
  const [scheduling, setScheduling] = useState({
    date: getInitialDate(selectedDate),
    timeSlot: 'anytime',
    techId: null,
    notes: '',
    saveToHold: false,
    holdReason: 'scheduling'
  });

  // Save state
  const [saving, setSaving] = useState(false);

  // Get vehicles from customer, sorted
  const vehicles = customer?.vehicles || [];
  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (vehicleSort) {
      case 'most_overdue':
        // Overdue first, then due_soon, then recent
        const statusOrder = { overdue: 0, due_soon: 1, recent: 2 };
        const aOrder = statusOrder[a.service_status] ?? 2;
        const bOrder = statusOrder[b.service_status] ?? 2;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (b.days_since_service || 0) - (a.days_since_service || 0);
      case 'last_visit':
        return (b.days_since_service || 9999) - (a.days_since_service || 9999);
      case 'alphabetical':
        return `${a.year} ${a.make} ${a.model}`.localeCompare(`${b.year} ${b.make} ${b.model}`);
      default:
        return 0;
    }
  });

  // Split into active (visited in last 3 years) and inactive
  const activeVehicles = sortedVehicles.filter(v => (v.days_since_service || 0) < 1095);
  const inactiveVehicles = sortedVehicles.filter(v => (v.days_since_service || 0) >= 1095);

  // Select customer
  const selectCustomer = useCallback(async (customerData) => {
    await selectCustomerFromLookup(customerData);
    setSelectedVehicle(null);
    setVehicleHistory(null);
    clearServices();
  }, [selectCustomerFromLookup, clearServices]);

  // Clear customer
  const clearCustomer = useCallback(() => {
    clearCustomerFromLookup();
    setSelectedVehicle(null);
    setVehicleHistory(null);
    clearServices();
  }, [clearCustomerFromLookup, clearServices]);

  // Select vehicle
  const selectVehicle = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleHistory(null);
    // Auto-load history when vehicle selected
    if (vehicle && !vehicle.isNew && vehicle.vin) {
      loadVehicleHistory(vehicle.vin);
    }
  }, []);

  // Add new vehicle
  const addNewVehicle = useCallback(() => {
    setSelectedVehicle({ isNew: true, year: '', make: '', model: '', plate: '', vin: '' });
    setVehicleHistory(null);
  }, []);

  // Update new vehicle data
  const updateNewVehicleData = useCallback((data) => {
    setSelectedVehicle(prev => ({ ...prev, ...data }));
  }, []);

  // Load full vehicle history
  const loadVehicleHistory = useCallback(async (vin) => {
    if (!vin) return;
    setVehicleHistoryLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_vehicle_full_history`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_vin: vin })
      });
      const data = await res.json();
      setVehicleHistory(data);
    } catch (err) {
      console.error('Failed to load vehicle history:', err);
    }
    setVehicleHistoryLoading(false);
  }, []);

  // Add service to quote
  const addService = useCallback((pkg, source = 'package', sourceWO = null) => {
    addServiceToQuote(pkg, pkg.price || pkg.total || pkg.base_price, pkg.hours || pkg.labor_hours || pkg.base_hours, source, sourceWO);
  }, [addServiceToQuote]);

  // Add custom line
  const addCustomLine = useCallback((description, hours, priceOverride = null) => {
    const laborRate = settings.labor_rate || 160;
    const suppliesPercent = settings.supplies_percent || 10;
    const basePrice = hours * laborRate;
    const price = priceOverride ?? (basePrice * (1 + suppliesPercent / 100));
    
    addServiceToQuote({
      id: `custom-${Date.now()}`,
      name: description,
      isCustom: true
    }, price, hours, 'custom', null);
  }, [addServiceToQuote, settings]);

  // Update scheduling
  const updateScheduling = useCallback((updates) => {
    setScheduling(prev => {
      const next = { ...prev, ...updates };
      // Auto-fix weekend dates
      if (updates.date && isWeekend(updates.date)) {
        next.date = getNextWeekday(updates.date);
      }
      // Clear hold if tech selected
      if (updates.techId && prev.saveToHold) {
        next.saveToHold = false;
      }
      return next;
    });
  }, []);

  // Validation
  const canBook = customer && (
    scheduling.saveToHold || 
    (scheduling.techId && scheduling.date && !isWeekend(scheduling.date))
  );

  const validationMessage = !customer 
    ? 'Select a customer'
    : scheduling.saveToHold 
      ? null
      : !scheduling.techId 
        ? 'Select a technician or save to Hold'
        : !scheduling.date 
          ? 'Select a date'
          : isWeekend(scheduling.date) 
            ? 'Cannot book on weekends'
            : null;

  // Reset state
  const reset = useCallback((newSelectedDate) => {
    clearCustomer();
    setScheduling({
      date: getInitialDate(newSelectedDate),
      timeSlot: 'anytime',
      techId: null,
      notes: '',
      saveToHold: false,
      holdReason: 'scheduling'
    });
  }, [clearCustomer]);

  // Save appointment
  const save = useCallback(async () => {
    if (!canBook) {
      return { success: false, error: validationMessage };
    }

    setSaving(true);

    try {
      // Build notes with hold reason if applicable
      let notes = scheduling.notes;
      if (scheduling.saveToHold && scheduling.holdReason) {
        notes = `[HOLD: ${scheduling.holdReason}] ${notes}`.trim();
      }

      // Parse customer name
      const nameParts = (customer.file_as || '').split(',').map(s => s.trim());
      const lastName = nameParts[0] || '';
      const firstName = nameParts[1] || '';

      const apptData = {
        // Customer - Core
        customer_id: customer.id,
        customer_name: customer.file_as,
        customer_phone: customer.primary_phone,
        customer_phone_secondary: customer.secondary_phone || null,
        customer_email: customer.email || null,
        company_name: customer.company_name || null,
        protractor_contact_id: customer.protractor_contact_id,
        
        // Customer - Extended
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_street: customer.street || null,
        customer_city: customer.city || null,
        customer_state: customer.state || null,
        customer_zip: customer.zip || null,
        customer_country: customer.country || 'Canada',
        customer_address: [customer.street, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') || null,
        
        // Customer stats
        customer_since: customer.customer_since || null,
        customer_lifetime_visits: customer.lifetime_visits || null,
        customer_lifetime_spent: customer.lifetime_spent || null,
        customer_avg_visit_value: customer.avg_visit_value || null,
        customer_last_visit_date: customer.last_visit_date || null,
        customer_days_since_visit: customer.days_since_visit || null,
        customer_is_supplier: customer.is_supplier || false,
        
        // Customer preferences
        prefers_call: customer.prefers_call ?? true,
        prefers_text: customer.prefers_text ?? false,
        prefers_email: customer.prefers_email ?? false,
        
        // Vehicle - Core
        vehicle_id: selectedVehicle?.vehicle_id || selectedVehicle?.id || null,
        vehicle_vin: selectedVehicle?.vin || null,
        vehicle_plate: selectedVehicle?.plate || null,
        vehicle_mileage: selectedVehicle?.last_mileage ? parseInt(selectedVehicle.last_mileage) : null,
        unit_number: selectedVehicle?.unit_number || null,
        
        // Vehicle - Extended
        vehicle_year: selectedVehicle?.year ? String(selectedVehicle.year) : null,
        vehicle_make: selectedVehicle?.make || null,
        vehicle_model: selectedVehicle?.model || null,
        vehicle_submodel: selectedVehicle?.submodel || null,
        vehicle_engine: selectedVehicle?.engine || null,
        vehicle_color: selectedVehicle?.color || null,
        vehicle_description: selectedVehicle 
          ? `${selectedVehicle.year || ''} ${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim()
          : null,
        vehicle_production_date: selectedVehicle?.production_date || null,
        vehicle_notes: selectedVehicle?.vehicle_notes || null,
        
        // Vehicle service status
        vehicle_service_status: selectedVehicle?.service_status || null,
        vehicle_days_since_service: selectedVehicle?.days_since_service || null,
        vehicle_last_service_date: selectedVehicle?.last_service_date || null,
        vehicle_mileage_estimated: selectedVehicle?.estimated_current_mileage || null,
        vehicle_km_since_service: selectedVehicle?.km_since_service || null,
        vehicle_service_due_reason: selectedVehicle?.service_due_reason || null,
        
        // Flags
        is_new_customer: customer.isNew || false,
        is_new_vehicle: selectedVehicle?.isNew || false,
        
        // Scheduling
        scheduled_date: scheduling.saveToHold ? null : scheduling.date,
        time_slot: scheduling.timeSlot,
        tech_id: scheduling.saveToHold ? null : scheduling.techId,
        estimated_hours: totals.hours || 1,
        
        // Hold status
        is_on_hold: scheduling.saveToHold,
        hold_reason: scheduling.saveToHold ? scheduling.holdReason : null,
        hold_notes: scheduling.saveToHold ? `Saved without tech/date: ${scheduling.holdReason}` : null,
        hold_at: scheduling.saveToHold ? new Date().toISOString() : null,
        status: 'scheduled',
        
        // Services
        services: services,
        estimated_total: totals.total,
        
        // Notes
        notes: notes.trim(),
        source: 'manual'
      };

      let result;
      if (editingAppointment) {
        result = await updateAppointment(editingAppointment.id, apptData);
      } else {
        result = await bookAppointment(apptData);
      }

      setSaving(false);
      return { success: true, data: result };

    } catch (err) {
      console.error('Failed to save appointment:', err);
      setSaving(false);
      return { success: false, error: err.message };
    }
  }, [canBook, validationMessage, customer, selectedVehicle, scheduling, services, totals, editingAppointment]);

  return {
    // Customer
    customer,
    customerLoading,
    searchTerm,
    searchResults,
    searching,
    search,
    selectCustomer,
    clearCustomer,
    
    // Vehicles
    vehicles: activeVehicles,
    inactiveVehicles,
    selectedVehicle,
    selectVehicle,
    addNewVehicle,
    updateNewVehicleData,
    vehicleSort,
    setVehicleSort,
    
    // Vehicle history
    vehicleHistory,
    vehicleHistoryLoading,
    loadVehicleHistory,
    
    // Quote
    services,
    totals,
    addService,
    addCustomLine,
    removeService,
    reorderServices,
    clearServices,
    
    // Scheduling
    scheduling,
    updateScheduling,
    
    // Save
    canBook,
    validationMessage,
    saving,
    save,
    reset
  };
}

export default useBookingState;
