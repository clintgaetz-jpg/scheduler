// ============================================
// SUPABASE CONFIG & HELPERS
// ============================================

export const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// ============================================
// Generic fetch helper
// ============================================
export async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers
    },
    ...options
  });
  return res.json();
}

// ============================================
// RPC call helper (for functions)
// ============================================
export async function supabaseRpc(functionName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  return res.json();
}

// ============================================
// CUSTOMER & HISTORY
// ============================================

// Search contacts by name or phone
export async function searchContacts(term) {
  if (!term || term.length < 2) return [];
  
  const url = `${SUPABASE_URL}/rest/v1/contacts?select=id,file_as,company_name,primary_phone,secondary_phone,email,notes,protractor_contact_id,street,city,state,zip,customer_since,lifetime_visits,lifetime_spent,avg_visit_value,last_visit_date,days_since_visit,prefers_call,prefers_text,prefers_email,do_not_contact,no_marketing,tags&or=(file_as.ilike.*${term}*,primary_phone.ilike.*${term}*,company_name.ilike.*${term}*)&limit=10`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.json();
}

// Get customer's work order history
export async function getCustomerHistory(customerName) {
  const url = `${SUPABASE_URL}/rest/v1/work_order_history?select=vehicle_id,vehicle_vin,vehicle_year,vehicle_make,vehicle_model,vehicle_description,invoice_date,workorder_number,grand_total,labor_total,parts_total,completed_packages,deferred_packages&customer_name=eq.${encodeURIComponent(customerName)}&order=invoice_date.desc&limit=50`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.json();
}

// Get vehicle details (plate, unit, mileage)
export async function getVehicleDetails(vins) {
  if (!vins || vins.length === 0) return [];
  
  const url = `${SUPABASE_URL}/rest/v1/vehicles?select=vin,plate,unit_number,last_mileage,last_seen_at&vin=in.(${vins.map(v => `"${v}"`).join(',')})`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.json();
}

// ============================================
// TECHNICIANS
// ============================================

// Get technicians
export async function getTechnicians() {
  return supabaseFetch('technicians?is_active=eq.true&order=name');
}

// Update technician
export async function updateTechnician(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/technicians?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// ============================================
// SERVICE CATEGORIES
// ============================================

// Get service categories
export async function getServiceCategories() {
  return supabaseFetch('service_categories?is_active=eq.true&order=sort_order');
}

// ============================================
// TECH CAPABILITIES
// ============================================

// Get all tech capabilities
export async function getTechCapabilities() {
  return supabaseFetch('tech_capabilities?select=*,technicians(name),service_categories(name)');
}

// Get capabilities for a specific tech
export async function getTechCapabilitiesForTech(techId) {
  return supabaseFetch(`tech_capabilities?tech_id=eq.${techId}`);
}

// Upsert tech capability (insert or update)
export async function upsertTechCapability(techId, category, data) {
  // First try to get existing
  const existing = await supabaseFetch(`tech_capabilities?tech_id=eq.${techId}&category=eq.${category}`);
  
  if (existing && existing.length > 0) {
    // Update
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tech_capabilities?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  } else {
    // Insert
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tech_capabilities`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ tech_id: techId, category, ...data })
    });
    return res.json();
  }
}

// Delete tech capability
export async function deleteTechCapability(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tech_capabilities?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.ok;
}

// ============================================
// TECH TIME OFF
// ============================================

// Get tech time off
export async function getTechTimeOff(startDate, endDate) {
  let url = 'tech_time_off?select=*,technicians(name)';
  if (startDate) url += `&date=gte.${startDate}`;
  if (endDate) url += `&date=lte.${endDate}`;
  return supabaseFetch(url + '&order=date');
}

// Add time off
export async function addTechTimeOff(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tech_time_off`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Delete time off
export async function deleteTechTimeOff(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tech_time_off?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.ok;
}

// ============================================
// AVAILABILITY
// ============================================

// Get availability for a service category
export async function getAvailability(category, durationHours = 1, startDate = null, daysToCheck = 14) {
  return supabaseRpc('get_tech_availability', {
    p_category: category,
    p_duration_hours: durationHours,
    p_start_date: startDate || new Date().toISOString().split('T')[0],
    p_days_to_check: daysToCheck
  });
}

// Find next available slots
export async function findNextAvailable(category, durationHours = 1, limit = 5) {
  return supabaseRpc('find_next_available', {
    p_category: category,
    p_duration_hours: durationHours,
    p_limit: limit
  });
}

// ============================================
// APPOINTMENTS
// ============================================

// Get appointments
export async function getAppointments(filters = {}) {
  let url = 'appointments?select=*,technicians(name,color)&status=neq.cancelled&order=scheduled_date,time_slot';
  if (filters.date) {
    url += `&scheduled_date=eq.${filters.date}`;
  }
  if (filters.dateFrom) {
    url += `&scheduled_date=gte.${filters.dateFrom}`;
  }
  if (filters.dateTo) {
    url += `&scheduled_date=lte.${filters.dateTo}`;
  }
  if (filters.techId) {
    url += `&tech_id=eq.${filters.techId}`;
  }
  if (filters.status) {
    url += `&status=eq.${filters.status}`;
  }
  return supabaseFetch(url);
}

// Book appointment using the database function
export async function bookAppointment(data) {
  return supabaseRpc('book_appointment', {
    p_customer_id: data.customer_id || null,
    p_customer_name: data.customer_name,
    p_customer_phone: data.customer_phone || null,
    p_vehicle_id: data.vehicle_id || null,
    p_vehicle_description: data.vehicle_description || null,
    p_vehicle_vin: data.vehicle_vin || null,
    p_scheduled_date: data.scheduled_date,
    p_time_slot: data.time_slot || 'anytime',
    p_tech_id: data.tech_id || null,
    p_estimated_hours: data.estimated_hours || 1,
    p_service_category: data.service_category || 'general',
    p_services: data.services || [],
    p_estimated_total: data.estimated_total || 0,
    p_notes: data.notes || null,
    p_customer_request: data.customer_request || null,
    p_source: data.source || 'manual',
    p_created_by: data.created_by || null,
    p_booking_group_id: data.booking_group_id || null,
    p_protractor_contact_id: data.protractor_contact_id || null
  });
}

// Update appointment (direct table update for simple changes)
export async function updateAppointment(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ ...data, updated_at: new Date().toISOString() })
  });
  return res.json();
}

// Update appointment status (with history tracking)
export async function updateAppointmentStatus(appointmentId, newStatus, changedBy = null, notes = null) {
  return supabaseRpc('update_appointment_status', {
    p_appointment_id: appointmentId,
    p_new_status: newStatus,
    p_changed_by: changedBy,
    p_notes: notes
  });
}

// Delete appointment
export async function deleteAppointment(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.ok;
}

// Search appointments
export async function searchAppointments(searchText, filters = {}) {
  return supabaseRpc('search_appointments', {
    p_search_text: searchText || null,
    p_status: filters.status || null,
    p_tech_id: filters.techId || null,
    p_date_from: filters.dateFrom || null,
    p_date_to: filters.dateTo || null,
    p_include_past: filters.includePast || false,
    p_limit: filters.limit || 50
  });
}

// ============================================
// SERVICE PACKAGES (pre-defined services)
// ============================================

// Get service packages
export async function getServicePackages() {
  return supabaseFetch('service_packages?is_active=eq.true&order=sort_order');
}

// ============================================
// SCHEDULER SETTINGS
// ============================================

// Get scheduler settings
export async function getSchedulerSettings() {
  const data = await supabaseFetch('scheduler_settings');
  const settings = {};
  (data || []).forEach(s => {
    settings[s.setting_key] = s.setting_value;
  });
  return settings;
}

// Update setting
export async function updateSetting(key, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scheduler_settings?setting_key=eq.${key}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ setting_value: value })
  });
  return res.ok;
}

// ============================================
// HOLD QUEUE
// ============================================

// Get hold queue
export async function getHoldQueue() {
  return supabaseFetch('hold_queue?order=priority.desc');
}

// ============================================
// WEBHOOK HELPERS
// ============================================

// Customer lookup by phone (for AI agent)
export async function webhookCustomerLookup(phone) {
  return supabaseRpc('webhook_customer_lookup', { p_phone: phone });
}
