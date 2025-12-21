/**
 * Supabase Service
 * 
 * ALL database calls go through this file.
 * This is the single source of truth for API access.
 * 
 * Usage:
 *   import { supabase } from '@/services/supabase';
 *   const techs = await supabase.technicians.getAll();
 */

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// ============================================
// BASE FETCH HELPERS
// ============================================

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchTable(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  
  if (options.select) params.append('select', options.select);
  if (options.order) params.append('order', options.order);
  if (options.limit) params.append('limit', options.limit);
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      params.append(key, value);
    });
  }
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  // Handle error responses
  if (data?.message) {
    console.error(`Supabase error fetching ${table}:`, data.message);
    return [];
  }
  
  return Array.isArray(data) ? data : [];
}

async function insertRow(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function updateRow(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function deleteRow(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers
  });
  return res.ok;
}

async function rpc(fn, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  return res.json();
}

// ============================================
// DOMAIN-SPECIFIC APIs
// ============================================

export const supabase = {
  // --- TECHNICIANS ---
  technicians: {
    getAll: () => fetchTable('technicians', { order: 'sort_order' }),
    getActive: () => fetchTable('technicians', { 
      order: 'sort_order', 
      filters: { is_active: 'eq.true' } 
    }),
    update: (id, data) => updateRow('technicians', id, data),
  },

  // --- APPOINTMENTS ---
  appointments: {
    getAll: () => fetchTable('appointments', { 
      order: 'scheduled_date.desc',
      filters: { status: 'neq.deleted' }
    }),
    
    getByDate: (date) => fetchTable('appointments', {
      order: 'created_at',
      filters: { 
        scheduled_date: `eq.${date}`,
        status: 'neq.deleted'
      }
    }),
    
    getByTech: (techId, date) => fetchTable('appointments', {
      filters: {
        tech_id: `eq.${techId}`,
        scheduled_date: `eq.${date}`,
        status: 'neq.deleted'
      }
    }),
    
    getOnHold: () => fetchTable('appointments', {
      filters: {
        is_on_hold: 'eq.true',
        status: 'neq.deleted'
      }
    }),
    
    getDeleted: () => fetchTable('appointments', {
      filters: { status: 'eq.deleted' },
      order: 'deleted_at.desc'
    }),
    
    getRequests: () => fetchTable('appointments', {
      filters: { status: 'eq.request' },
      order: 'created_at.desc'
    }),
    
    getById: async (id) => {
      const results = await fetchTable('appointments', {
        filters: { id: `eq.${id}` }
      });
      return results[0] || null;
    },
    
    create: (data) => insertRow('appointments', data),
    update: (id, data) => updateRow('appointments', id, data),
    
    // Soft delete - never hard delete
    delete: (id) => updateRow('appointments', id, { 
      status: 'deleted', 
      deleted_at: new Date().toISOString() 
    }),
    
    // Restore from soft delete
    restore: (id) => updateRow('appointments', id, { 
      status: 'scheduled', 
      deleted_at: null 
    }),
    
    // Quick status updates
    setHold: (id, reason, notes = null) => updateRow('appointments', id, {
      is_on_hold: true,
      hold_reason: reason,
      hold_notes: notes,
      hold_at: new Date().toISOString()
    }),
    
    clearHold: (id) => updateRow('appointments', id, {
      is_on_hold: false,
      hold_reason: null,
      hold_notes: null,
      hold_at: null
    }),
    
    markComplete: (id) => updateRow('appointments', id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      all_lines_done: true
    }),
    
    markNoShow: (id) => updateRow('appointments', id, {
      status: 'no_show'
    }),
  },

  // --- SERVICE PACKAGES ---
  packages: {
    getAll: () => fetchTable('service_packages', { order: 'sort_order' }),
    getActive: () => fetchTable('service_packages', { 
      order: 'sort_order',
      filters: { is_active: 'eq.true' }
    }),
    update: (id, data) => updateRow('service_packages', id, data),
    create: (data) => insertRow('service_packages', data),
  },

  // --- SERVICE CATEGORIES ---
  categories: {
    getAll: () => fetchTable('service_categories', { order: 'sort_order' }),
    update: (id, data) => updateRow('service_categories', id, data),
  },

  // --- CONTACTS (Customers) ---
  contacts: {
    search: (term) => fetchTable('contacts', {
      filters: { file_as: `ilike.*${term}*` },
      limit: 20
    }),
    getById: async (id) => {
      const results = await fetchTable('contacts', {
        filters: { id: `eq.${id}` }
      });
      return results[0] || null;
    },
    getByPhone: (phone) => {
      const normalized = phone.replace(/[^0-9]/g, '').slice(-10);
      return fetchTable('customer_phones_v3', {
        select: 'customer_id,phone_norm,contacts(*)',
        filters: { phone_norm: `eq.${normalized}` }
      });
    },
  },

  // --- VEHICLES ---
  vehicles: {
    getByVin: async (vin) => {
      const results = await fetchTable('vehicles', {
        filters: { vin: `eq.${vin}` }
      });
      return results[0] || null;
    },
    getByCustomer: (customerId) => fetchTable('work_order_history', {
      select: 'vehicle_vin,vehicle_year,vehicle_make,vehicle_model,vehicle_description',
      filters: { customer_id: `eq.${customerId}` },
      order: 'invoice_date.desc'
    }),
  },

  // --- WORK ORDER HISTORY ---
  history: {
    getByCustomer: (customerName) => fetchTable('work_order_history', {
      filters: { customer_name: `eq.${customerName}` },
      order: 'invoice_date.desc',
      limit: 50
    }),
    getByVehicle: (vin) => fetchTable('work_order_history', {
      filters: { vehicle_vin: `eq.${vin}` },
      order: 'invoice_date.desc'
    }),
  },

  // --- OPEN WORKORDERS (from Protractor) ---
  openWorkorders: {
    getByNumber: async (woNumber) => {
      const results = await fetchTable('open_workorders', {
        filters: { workorder_number: `eq.${woNumber}` }
      });
      return results[0] || null;
    },
    getAll: () => fetchTable('open_workorders', { order: 'promised_date' }),
  },

  // --- SETTINGS ---
  settings: {
    getAll: async () => {
      const rows = await fetchTable('scheduler_settings');
      const obj = {};
      rows.forEach(s => { obj[s.setting_key] = s.setting_value; });
      return obj;
    },
    update: (key, value) => updateRow('scheduler_settings', key, { setting_value: value }),
  },

  // --- ALERTS ---
  alerts: {
    getUnread: () => fetchTable('alerts', {
      filters: { is_read: 'eq.false' },
      order: 'created_at.desc'
    }),
    markRead: (id) => updateRow('alerts', id, { 
      is_read: true, 
      read_at: new Date().toISOString() 
    }),
    create: (data) => insertRow('alerts', data),
  },

  // --- RAW ACCESS (for edge cases) ---
  raw: {
    fetch: fetchTable,
    insert: insertRow,
    update: updateRow,
    delete: deleteRow,
    rpc,
  }
};

export default supabase;
