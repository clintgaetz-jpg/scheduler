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
  return bookAppointmentDirect(data);
}

// Old RPC version (keeping for reference)
export async function bookAppointmentRpc(data) {
  return supabaseRpc('book_appointment', {
    // Customer fields (required)
    p_customer_id: data.customer_id || null,
    p_customer_name: data.customer_name,
    p_customer_phone: data.customer_phone || null,
    
    // Customer fields (optional)
    p_customer_phone_secondary: data.customer_phone_secondary || null,
    p_customer_email: data.customer_email || null,
    p_customer_address: data.customer_address || null,
    p_company_name: data.company_name || null,
    p_protractor_contact_id: data.protractor_contact_id || null,
    
    // Vehicle fields
    p_vehicle_id: data.vehicle_id || null,
    p_vehicle_description: data.vehicle_description || null,
    p_vehicle_vin: data.vehicle_vin || null,
    p_vehicle_plate: data.vehicle_plate || null,
    p_vehicle_mileage: data.vehicle_mileage || null,
    p_unit_number: data.unit_number || null,
    
    // Change tracking
    p_is_new_customer: data.is_new_customer || false,
    p_is_new_vehicle: data.is_new_vehicle || false,
    p_protractor_updates: data.protractor_updates || {},
    
    // Scheduling
    p_scheduled_date: data.scheduled_date || null,
    p_time_slot: data.time_slot || 'anytime',
    p_tech_id: data.tech_id || null,
    p_estimated_hours: data.estimated_hours || 1,
    
    // Services
    p_service_category: data.service_category || 'general',
    p_services: data.services || [],
    p_estimated_total: data.estimated_total || 0,
    
    // Notes
    p_notes: data.notes || null,
    p_customer_request: data.customer_request || null,
    
    // Meta
    p_source: data.source || 'manual',
    p_created_by: data.created_by || null,
    p_booking_group_id: data.booking_group_id || null
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

// ============================================
// PARTS INVOICES
// ============================================

// Get parts invoices for a PO number
export async function getPartsInvoices(poNumber) {
  return supabaseRpc('get_parts_invoices', { p_po_number: poNumber });
}

// Get parts invoices (simple flat list)
export async function getPartsInvoicesSimple(poNumber) {
  return supabaseRpc('get_parts_invoices_simple', { p_po_number: poNumber });
}

// Generate booking group ID
function generateBookingGroupId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK${dateStr}-${random}`;
}

// Book appointment using direct insert (bypasses RPC to support all new fields)
export async function bookAppointmentDirect(data) {
  const bookingGroupId = data.booking_group_id || generateBookingGroupId();
  
  const appointmentData = {
    // Customer fields - CORE
    customer_id: data.customer_id || null,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone || null,
    customer_phone_secondary: data.customer_phone_secondary || null,
    customer_email: data.customer_email || null,
    customer_address: data.customer_address || null,
    company_name: data.company_name || null,
    protractor_contact_id: data.protractor_contact_id || null,
    
    // Customer fields - EXTENDED
    customer_first_name: data.customer_first_name || null,
    customer_last_name: data.customer_last_name || null,
    customer_street: data.customer_street || null,
    customer_city: data.customer_city || null,
    customer_state: data.customer_state || null,
    customer_zip: data.customer_zip || null,
    customer_country: data.customer_country || null,
    
    // Customer stats
    customer_since: data.customer_since || null,
    customer_lifetime_visits: data.customer_lifetime_visits || null,
    customer_lifetime_spent: data.customer_lifetime_spent || null,
    customer_avg_visit_value: data.customer_avg_visit_value || null,
    customer_last_visit_date: data.customer_last_visit_date || null,
    customer_days_since_visit: data.customer_days_since_visit || null,
    customer_is_supplier: data.customer_is_supplier || false,
    
    // Vehicle fields - CORE
    vehicle_id: data.vehicle_id || null,
    vehicle_vin: data.vehicle_vin || null,
    vehicle_plate: data.vehicle_plate || null,
    vehicle_mileage: data.vehicle_mileage || null,
    unit_number: data.unit_number || null,
    
    // Vehicle fields - EXTENDED
    vehicle_year: data.vehicle_year || null,
    vehicle_make: data.vehicle_make || null,
    vehicle_model: data.vehicle_model || null,
    vehicle_submodel: data.vehicle_submodel || null,
    vehicle_engine: data.vehicle_engine || null,
    vehicle_color: data.vehicle_color || null,
    vehicle_description: data.vehicle_description || null,
    vehicle_mileage_estimated: data.vehicle_mileage_estimated || null,
    
    // Change tracking
    is_new_customer: data.is_new_customer || false,
    is_new_vehicle: data.is_new_vehicle || false,
    protractor_updates: data.protractor_updates || {},
    
    // Scheduling
    scheduled_date: data.scheduled_date || null,
    time_slot: data.time_slot || 'anytime',
    tech_id: data.tech_id || null,
    estimated_hours: data.estimated_hours || 1,
    
    // Hold status
    is_on_hold: data.is_on_hold || false,
    hold_reason: data.hold_reason || null,
    hold_notes: data.hold_notes || null,
    hold_at: data.hold_at || null,
    original_scheduled_date: data.original_scheduled_date || null,
    original_tech_id: data.original_tech_id || null,
    
    // Status
    status: data.status || 'scheduled',
    
    // Services
    service_category: data.service_category || 'general',
    services: data.services || [],
    estimated_total: data.estimated_total || 0,
    
    // Notes
    notes: data.notes || null,
    customer_request: data.customer_request || null,
    
    // Meta
    source: data.source || 'manual',
    created_by: data.created_by || null,
    booking_group_id: bookingGroupId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(appointmentData)
  });
  
  const result = await res.json();
  
  // Return in the same format as the RPC function
  if (Array.isArray(result) && result.length > 0) {
    return {
      success: true,
      appointment_id: result[0].id,
      booking_group_id: bookingGroupId,
      appointment: result[0]
    };
  }
  
  return {
    success: false,
    error: result
  };
}


// ============================================
// WORKORDER LINES & PARTS
// ============================================

// Get workorder lines for an appointment (with nested parts)
export async function getWorkorderLines(appointmentId) {
  return supabaseFetch(
    `workorder_lines?appointment_id=eq.&select=*,parts:workorder_parts(*)&order=rank`
  );
}

// Get workorder lines by WO number (with nested parts)
export async function getWorkorderLinesByWO(workorderNumber) {
  return supabaseFetch(
    `workorder_lines?workorder_number=eq.&select=*,parts:workorder_parts(*)&order=rank`
  );
}

// Update a workorder line (scheduler overrides)
export async function updateWorkorderLine(lineId, data) {
  const res = await fetch(`/rest/v1/workorder_lines?id=eq.`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer `,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Move lines to a different appointment (for splitting)
export async function moveLinesToAppointment(lineIds, targetAppointmentId) {
  return supabaseRpc('move_lines_to_appointment', {
    p_line_ids: lineIds,
    p_target_appointment_id: targetAppointmentId
  });
}

// Collapse lines back to parent
export async function collapseLinesToParent(childAppointmentId, parentAppointmentId) {
  return supabaseRpc('collapse_lines_to_parent', {
    p_child_appointment_id: childAppointmentId,
    p_parent_appointment_id: parentAppointmentId
  });
}
