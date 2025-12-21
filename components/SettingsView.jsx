import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Package, Clock, Calendar, FileText, Settings,
  Plus, Edit3, Trash2, Save, X, Check, AlertCircle, GripVertical,
  ChevronDown, ChevronUp
} from 'lucide-react';

// Custom Grid3X3 icon (not in older lucide-react)
const Grid3X3 = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <rect x="10" y="3" width="5" height="5" rx="1" />
    <rect x="17" y="3" width="5" height="5" rx="1" />
    <rect x="3" y="10" width="5" height="5" rx="1" />
    <rect x="10" y="10" width="5" height="5" rx="1" />
    <rect x="17" y="10" width="5" height="5" rx="1" />
    <rect x="3" y="17" width="5" height="5" rx="1" />
    <rect x="10" y="17" width="5" height="5" rx="1" />
    <rect x="17" y="17" width="5" height="5" rx="1" />
  </svg>
);

// ============================================
// SERVICE ICONS - For trackable packages
// ============================================
const SERVICE_ICONS = {
  oil: { label: 'Oil Change', color: 'text-amber-600', bg: 'bg-amber-100' },
  diag: { label: 'Diagnosis', color: 'text-blue-600', bg: 'bg-blue-100' },
  alignment: { label: 'Alignment', color: 'text-purple-600', bg: 'bg-purple-100' },
  tires: { label: 'Tires', color: 'text-gray-700', bg: 'bg-gray-200' },
  brakes: { label: 'Brakes', color: 'text-red-600', bg: 'bg-red-100' },
  inspection: { label: 'Inspection', color: 'text-green-600', bg: 'bg-green-100' },
  maintenance: { label: 'Maintenance', color: 'text-teal-600', bg: 'bg-teal-100' },
  ac: { label: 'A/C', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  electrical: { label: 'Electrical', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  suspension: { label: 'Suspension', color: 'text-orange-600', bg: 'bg-orange-100' },
  engine: { label: 'Engine', color: 'text-rose-600', bg: 'bg-rose-100' },
  transmission: { label: 'Transmission', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  exhaust: { label: 'Exhaust', color: 'text-stone-600', bg: 'bg-stone-200' },
  steering: { label: 'Steering', color: 'text-violet-600', bg: 'bg-violet-100' },
  cooling: { label: 'Cooling', color: 'text-sky-600', bg: 'bg-sky-100' },
  fuel: { label: 'Fuel System', color: 'text-lime-600', bg: 'bg-lime-100' },
  waiter: { label: 'Waiter', color: 'text-pink-600', bg: 'bg-pink-100' },
  dropoff: { label: 'Drop Off', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

function ServiceIcon({ icon, size = 20, showLabel = false }) {
  const config = SERVICE_ICONS[icon] || { label: icon, color: 'text-gray-600', bg: 'bg-gray-100' };
  
  const iconPaths = {
    oil: <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>,
    diag: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
    alignment: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="2"/></>,
    tires: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    brakes: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>,
    inspection: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    maintenance: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    ac: <><path d="M12 2v10M12 18v4M4.93 10.93l1.41 1.41M17.66 11.66l1.41 1.41M2 18h2M20 18h2M6 18a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4"/></>,
    electrical: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
    suspension: <><path d="M12 2v6M12 16v6"/><ellipse cx="12" cy="12" rx="8" ry="4"/></>,
    engine: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></>,
    transmission: <><circle cx="12" cy="12" r="3"/><path d="M12 2v7M12 15v7"/><path d="M5.6 5.6l5 5M13.4 13.4l5 5M2 12h7M15 12h7M5.6 18.4l5-5M13.4 10.6l5-5"/></>,
    exhaust: <><path d="M18 8c2 0 3 1.5 3 3s-1 3-3 3"/><path d="M3 11h12"/><path d="M3 8c-1 0-1.5.5-1.5 1.5S2 11 3 11M3 14c-1 0-1.5-.5-1.5-1.5S2 11 3 11"/></>,
    steering: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 8v-6M12 22v-6M8 12H2M22 12h-6"/></>,
    cooling: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    fuel: <><path d="M3 22V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/><path d="M17 10h1a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2"/><path d="M7 10h6"/><path d="M7 14h6"/><path d="M21 6l-1.5-1.5"/></>,
    waiter: <><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 14 0v2"/><path d="M17 16l4 4"/></>,
    dropoff: <><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 3v5"/><path d="M8 3l4 5 4-5"/></>,
  };
  
  return (
    <span className={`inline-flex items-center gap-1 ${config.bg} ${config.color} rounded-full px-2 py-1`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {iconPaths[icon] || <circle cx="12" cy="12" r="10"/>}
      </svg>
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
}

// ============================================
// SETTINGS VIEW - Complete Settings Management
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// API helper
const api = {
  async fetch(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = new URLSearchParams();
    if (options.select) params.append('select', options.select);
    if (options.order) params.append('order', options.order);
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append(key, value);
      });
    }
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    return res.json();
  },
  
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
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
  },
  
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
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
  },
  
  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    return res.ok;
  }
};

// Color options for techs
const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// ============================================
// MAIN SETTINGS VIEW
// ============================================
export function SettingsView({ onRefresh }) {
  const [activeTab, setActiveTab] = useState('technicians');
  
  const tabs = [
    { id: 'technicians', label: 'Technicians', icon: Users },
    { id: 'advisors', label: 'Advisors', icon: Briefcase },
    { id: 'packages', label: 'Service Packages', icon: Package },
    { id: 'capabilities', label: 'Tech Capabilities', icon: Grid3X3 },
    { id: 'hours', label: 'Shop Hours', icon: Clock },
    { id: 'holidays', label: 'Holidays & Closures', icon: Calendar },
    { id: 'timeoff', label: 'Time Off', icon: Calendar },
    { id: 'notes', label: 'Day Notes', icon: FileText },
    { id: 'defaults', label: 'Defaults', icon: Settings },
  ];

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-56 bg-gray-50 border-r border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'technicians' && <TechniciansTab onRefresh={onRefresh} />}
        {activeTab === 'advisors' && <AdvisorsTab onRefresh={onRefresh} />}
        {activeTab === 'packages' && <PackagesTab onRefresh={onRefresh} />}
        {activeTab === 'capabilities' && <CapabilitiesTab />}
        {activeTab === 'hours' && <ShopHoursTab />}
        {activeTab === 'holidays' && <HolidaysTab />}
        {activeTab === 'timeoff' && <TimeOffTab />}
        {activeTab === 'notes' && <DayNotesTab />}
        {activeTab === 'defaults' && <DefaultsTab />}
      </div>
    </div>
  );
}

// ============================================
// TECHNICIANS TAB
// ============================================
function TechniciansTab({ onRefresh }) {
  const [technicians, setTechnicians] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setLoading(true);
    const data = await api.fetch('technicians', { order: 'sort_order' });
    setTechnicians(data || []);
    setLoading(false);
  };

  const handleSave = async (tech) => {
    if (tech.id) {
      await api.update('technicians', tech.id, tech);
    } else {
      await api.insert('technicians', { ...tech, sort_order: technicians.length });
    }
    loadTechnicians();
    setEditing(null);
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this technician?')) return;
    await api.update('technicians', id, { is_active: false });
    loadTechnicians();
    if (onRefresh) onRefresh();
  };

  const handleReactivate = async (id) => {
    await api.update('technicians', id, { is_active: true });
    loadTechnicians();
    if (onRefresh) onRefresh();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const activeTechs = technicians.filter(t => t.is_active);
  const inactiveTechs = technicians.filter(t => !t.is_active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Technicians</h3>
          <p className="text-sm text-gray-500">Manage your shop technicians</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', color: COLORS[0], hours_per_day: 8, is_active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Technician
        </button>
      </div>

      {/* Active Technicians */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours/Day</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeTechs.map(tech => (
              <tr key={tech.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{tech.name}</div>
                  {tech.short_name && <div className="text-xs text-gray-500">{tech.short_name}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tech.color }} />
                </td>
                <td className="px-4 py-3 text-gray-600">{tech.hours_per_day}h</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tech.employment_type || 'full-time'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(tech)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tech.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {activeTechs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No active technicians
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inactive Technicians */}
      {inactiveTechs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Inactive Technicians</h4>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2">
            {inactiveTechs.map(tech => (
              <div key={tech.id} className="flex items-center justify-between">
                <span className="text-gray-500">{tech.name}</span>
                <button
                  onClick={() => handleReactivate(tech.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <TechnicianModal
          technician={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ============================================
// TECHNICIAN EDIT MODAL
// ============================================
function TechnicianModal({ technician, onSave, onClose }) {
  const [form, setForm] = useState(technician);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-lg">{form.id ? 'Edit' : 'Add'} Technician</h3>
            <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
              <input
                type="text"
                value={form.short_name || ''}
                onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="For tight spaces"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                <input
                  type="number"
                  value={form.hours_per_day || 8}
                  onChange={(e) => setForm({ ...form, hours_per_day: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                  max="12"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.employment_type || 'full-time'}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="apprentice">Apprentice</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// ADVISORS TAB
// ============================================
function AdvisorsTab({ onRefresh }) {
  const [advisors, setAdvisors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvisors();
  }, []);

  const loadAdvisors = async () => {
    setLoading(true);
    const data = await api.fetch('advisors', { order: 'sort_order' });
    setAdvisors(data || []);
    setLoading(false);
  };

  const handleSave = async (advisor) => {
    if (advisor.id) {
      await api.update('advisors', advisor.id, advisor);
    } else {
      await api.insert('advisors', { ...advisor, sort_order: advisors.length });
    }
    loadAdvisors();
    setEditing(null);
    if (onRefresh) onRefresh();
  };

  const handleToggleActive = async (id, currentActive) => {
    await api.update('advisors', id, { is_active: !currentActive });
    loadAdvisors();
    if (onRefresh) onRefresh();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Service Advisors</h3>
          <p className="text-sm text-gray-500">Manage your service advisors</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', is_active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Advisor
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {advisors.map(advisor => (
              <tr key={advisor.id} className={`hover:bg-gray-50 ${!advisor.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{advisor.name}</div>
                  {advisor.short_name && <div className="text-xs text-gray-500">{advisor.short_name}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{advisor.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{advisor.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    advisor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {advisor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(advisor)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(advisor.id, advisor.is_active)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded ml-1"
                    title={advisor.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {advisor.is_active ? <X size={16} /> : <Check size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {advisors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No advisors yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <AdvisorModal
          advisor={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ============================================
// ADVISOR EDIT MODAL
// ============================================
function AdvisorModal({ advisor, onSave, onClose }) {
  const [form, setForm] = useState(advisor);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-lg">{form.id ? 'Edit' : 'Add'} Advisor</h3>
            <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
              <input
                type="text"
                value={form.short_name || ''}
                onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// SERVICE PACKAGES TAB
// ============================================
function PackagesTab({ onRefresh }) {
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    const data = await api.fetch('service_packages', { order: 'sort_order' });
    setPackages(data || []);
    setLoading(false);
  };

  const handleSave = async (pkg) => {
    if (pkg.id) {
      await api.update('service_packages', pkg.id, pkg);
    } else {
      await api.insert('service_packages', { ...pkg, sort_order: packages.length });
    }
    loadPackages();
    setEditing(null);
    if (onRefresh) onRefresh();
  };

  const handleToggleActive = async (id, currentActive) => {
    await api.update('service_packages', id, { is_active: !currentActive });
    loadPackages();
    if (onRefresh) onRefresh();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const categories = ['oil', 'brakes', 'tires', 'diag', 'alignment', 'inspection', 'maintenance', 'ac', 'electrical', 'suspension', 'cooling', 'transmission', 'steering', 'fuel', 'exhaust', 'engine', 'general'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Service Packages</h3>
          <p className="text-sm text-gray-500">Quick-add service items for booking. Trackable packages show icons and respect limits.</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', category: 'general', base_hours: 1, base_price: 0, is_active: true, is_trackable: false })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Package
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Icon</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Limit/Day</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {packages.map(pkg => (
              <tr key={pkg.id} className={`hover:bg-gray-50 ${!pkg.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  {pkg.is_trackable && pkg.icon ? (
                    <ServiceIcon icon={pkg.icon} size={20} />
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{pkg.name}</div>
                  {pkg.protractor_package_ids && pkg.protractor_package_ids.length > 0 && (
                    <div className="text-xs text-gray-400">Codes: {pkg.protractor_package_ids.filter(c => !c.includes('-')).slice(0,3).join(', ')}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                    {pkg.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{pkg.base_hours}h</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="font-medium">${pkg.base_price?.toFixed(0) || '0'}</span>
                  {pkg.is_estimate !== false && (
                    <span className="ml-1 text-xs text-amber-600" title="Estimate based on historical average">~</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {pkg.shop_max_per_day ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {pkg.shop_max_per_day}/day
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {pkg.is_trackable && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Track</span>
                    )}
                    {pkg.add_to_capabilities && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Cap</span>
                    )}
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {pkg.is_active ? 'On' : 'Off'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(pkg)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(pkg.id, pkg.is_active)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded ml-1"
                  >
                    {pkg.is_active ? <X size={16} /> : <Check size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <PackageModal
          pkg={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ============================================
// PACKAGE EDIT MODAL - Enhanced
// ============================================
function PackageModal({ pkg, categories, onSave, onClose }) {
  const [form, setForm] = useState(pkg);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [patternsText, setPatternsText] = useState(
    (pkg.name_match_patterns || []).join('\n')
  );
  const [protractorIdsText, setProtractorIdsText] = useState(
    (pkg.protractor_package_ids || []).join('\n')
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert text areas back to arrays
    const patterns = patternsText.split('\n').map(s => s.trim()).filter(Boolean);
    const protractorIds = protractorIdsText.split('\n').map(s => s.trim()).filter(Boolean);
    onSave({
      ...form,
      name_match_patterns: patterns.length > 0 ? patterns : null,
      protractor_package_ids: protractorIds.length > 0 ? protractorIds : null,
    });
  };

  const iconOptions = Object.keys(SERVICE_ICONS);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto py-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-lg">{form.id ? 'Edit' : 'Add'} Service Package</h3>
            <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., Oil Change, Drivability Diagnosis"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category || 'general'}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Hours</label>
                <input
                  type="number"
                  value={form.base_hours || 1}
                  onChange={(e) => setForm({ ...form, base_hours: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.base_price || 0}
                  onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) })}
                  className="w-32 border rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_estimate !== false}
                    onChange={(e) => setForm({ ...form, is_estimate: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Estimate</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">Estimates show ~ in UI. Uncheck for fixed-price services.</p>
            </div>

            {/* Tracking & Icon */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_trackable || false}
                    onChange={(e) => setForm({ ...form, is_trackable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Trackable</span>
                </label>
                <span className="text-xs text-gray-500">Show icon on calendar, track limits</span>
              </div>

              {form.is_trackable && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map(iconKey => (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setForm({ ...form, icon: iconKey })}
                          className={`p-1 rounded-lg border-2 transition-all ${
                            form.icon === iconKey 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          title={SERVICE_ICONS[iconKey].label}
                        >
                          <ServiceIcon icon={iconKey} size={18} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Max/Day</label>
                    <input
                      type="number"
                      value={form.shop_max_per_day || ''}
                      onChange={(e) => setForm({ ...form, shop_max_per_day: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-32 border rounded-lg px-3 py-2"
                      placeholder="No limit"
                      min="1"
                    />
                    <span className="text-xs text-gray-500 ml-2">Leave blank for no limit</span>
                  </div>
                </>
              )}
            </div>

            {/* Capabilities */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.add_to_capabilities || false}
                  onChange={(e) => setForm({ ...form, add_to_capabilities: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Add to Tech Capabilities</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Manage which techs can do this, with per-tech limits</p>
            </div>

            {/* Advanced Matching */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Advanced Matching
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name Match Patterns
                    </label>
                    <textarea
                      value={patternsText}
                      onChange={(e) => setPatternsText(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                      rows={3}
                      placeholder="Oil Change&#10;Lube Oil&#10;Engine Oil Service"
                    />
                    <p className="text-xs text-gray-500 mt-1">One per line. Matches if work order service starts with or contains this text.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Protractor Package IDs
                    </label>
                    <textarea
                      value={protractorIdsText}
                      onChange={(e) => setProtractorIdsText(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                      rows={2}
                      placeholder="PKG001&#10;PKG002"
                    />
                    <p className="text-xs text-gray-500 mt-1">One per line. Exact match from Protractor data (check raw payload).</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// TECH CAPABILITIES TAB (Grid View with Limits)
// ============================================
function CapabilitiesTab() {
  const [technicians, setTechnicians] = useState([]);
  const [packages, setPackages] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null); // {techId, pkgId}
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [techsData, pkgsData, capsData] = await Promise.all([
      api.fetch('technicians', { order: 'sort_order', filters: { is_active: 'eq.true' } }),
      api.fetch('service_packages', { order: 'category,sort_order' }),
      api.fetch('tech_capabilities')
    ]);
    setTechnicians(techsData || []);
    setPackages(pkgsData || []);
    setCapabilities(capsData || []);
    setLoading(false);
  };

  // Check if tech has capability for a package (by package_id) or category (fallback)
  const getCapability = (techId, pkg) => {
    // First try to match by package_id
    let cap = capabilities.find(c => c.tech_id === techId && c.package_id === pkg.id);
    // Fallback to category match for backwards compatibility
    if (!cap) {
      cap = capabilities.find(c => c.tech_id === techId && c.category === pkg.category && !c.package_id);
    }
    return cap;
  };

  const toggleCapability = async (techId, pkg) => {
    const existing = getCapability(techId, pkg);
    if (existing) {
      await api.delete('tech_capabilities', existing.id);
    } else {
      await api.insert('tech_capabilities', { 
        tech_id: techId, 
        package_id: pkg.id,
        category: pkg.category,
        skill_level: 'journeyman' 
      });
    }
    loadData();
  };

  // Set max per day for a tech capability
  const setMaxPerDay = async (techId, pkg, maxValue) => {
    const existing = getCapability(techId, pkg);
    if (existing) {
      await api.update('tech_capabilities', existing.id, { 
        max_per_day: maxValue || null 
      });
    } else {
      // Create capability with limit
      await api.insert('tech_capabilities', { 
        tech_id: techId, 
        package_id: pkg.id,
        category: pkg.category,
        skill_level: 'journeyman',
        max_per_day: maxValue || null
      });
    }
    setEditingCell(null);
    loadData();
  };

  // Set all techs for a package
  const setAllTechs = async (pkg, enabled) => {
    for (const tech of technicians) {
      const existing = getCapability(tech.id, pkg);
      if (enabled && !existing) {
        await api.insert('tech_capabilities', { 
          tech_id: tech.id, 
          package_id: pkg.id,
          category: pkg.category,
          skill_level: 'journeyman' 
        });
      } else if (!enabled && existing) {
        await api.delete('tech_capabilities', existing.id);
      }
    }
    loadData();
  };

  const startEdit = (techId, pkgId, currentMax) => {
    setEditingCell({ techId, pkgId });
    setEditValue(currentMax?.toString() || '');
  };

  const handleEditKeyDown = (e, techId, pkg) => {
    if (e.key === 'Enter') {
      setMaxPerDay(techId, pkg, editValue ? parseInt(editValue) : null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  // Show packages that have add_to_capabilities=true, grouped by category
  const capabilityPackages = packages.filter(p => p.add_to_capabilities || p.show_in_capabilities);
  
  // Also include any packages that have existing capabilities (don't lose data)
  const packageIdsWithCaps = [...new Set(capabilities.filter(c => c.package_id).map(c => c.package_id))];
  const additionalPackages = packages.filter(p => packageIdsWithCaps.includes(p.id) && !capabilityPackages.includes(p));
  const allPackages = [...capabilityPackages, ...additionalPackages];
  
  // Group by category for display
  const byCategory = allPackages.reduce((acc, pkg) => {
    const cat = pkg.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pkg);
    return acc;
  }, {});

  // Also show old category-based capabilities that don't have package_id
  const legacyCategories = [...new Set(capabilities.filter(c => !c.package_id && c.category).map(c => c.category))];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Tech Capabilities</h3>
        <p className="text-sm text-gray-500">
          Configure what each technician can work on. Click a checkmark to set per-tech daily limits.
        </p>
      </div>

      {Object.keys(byCategory).length === 0 && legacyCategories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-amber-500" />
          <p className="text-amber-800 font-medium">No capabilities configured</p>
          <p className="text-amber-600 text-sm mt-1">
            Go to Service Packages and check "Add to Tech Capabilities" on packages you want to manage here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Package-based capabilities */}
          {Object.entries(byCategory).map(([category, pkgs]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-700 capitalize">{category}</span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 uppercase w-16">Shop</th>
                    {technicians.map(tech => (
                      <th key={tech.id} className="text-center px-2 py-2 text-xs font-medium text-gray-500 uppercase w-16">
                        {tech.short_name || tech.name.split(' ')[0]}
                      </th>
                    ))}
                    <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 uppercase w-14">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pkgs.map(pkg => {
                    const allEnabled = technicians.every(tech => getCapability(tech.id, pkg));
                    return (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {pkg.icon && <ServiceIcon icon={pkg.icon} size={16} />}
                            <span className="text-sm text-gray-900">{pkg.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-xs text-gray-500">
                            {pkg.shop_max_per_day || '∞'}
                          </span>
                        </td>
                        {technicians.map(tech => {
                          const cap = getCapability(tech.id, pkg);
                          const isEditing = editingCell?.techId === tech.id && editingCell?.pkgId === pkg.id;
                          
                          return (
                            <td key={tech.id} className="px-2 py-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => handleEditKeyDown(e, tech.id, pkg)}
                                  onBlur={() => setMaxPerDay(tech.id, pkg, editValue ? parseInt(editValue) : null)}
                                  className="w-12 text-center border rounded px-1 py-0.5 text-sm"
                                  placeholder="∞"
                                  autoFocus
                                  min="1"
                                />
                              ) : cap ? (
                                <button
                                  onClick={() => startEdit(tech.id, pkg.id, cap.max_per_day)}
                                  className="w-10 h-7 rounded flex items-center justify-center transition-colors mx-auto bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium"
                                  title="Click to set max/day, right-click to remove"
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    toggleCapability(tech.id, pkg);
                                  }}
                                >
                                  {cap.max_per_day || '✓'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleCapability(tech.id, pkg)}
                                  className="w-10 h-7 rounded flex items-center justify-center transition-colors mx-auto bg-gray-100 text-gray-400 hover:bg-gray-200"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => setAllTechs(pkg, !allEnabled)}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-colors mx-auto ${
                              allEnabled ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                            }`}
                            title={allEnabled ? 'Remove all' : 'Add all'}
                          >
                            {allEnabled ? <Check size={14} /> : <Plus size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>✓ = Can do (no limit)</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">4</span>
            <span>= Max per day</span>
            <span>Click number to edit • Right-click to remove</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SHOP HOURS TAB
// ============================================
function ShopHoursTab() {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    setLoading(true);
    const data = await api.fetch('shop_hours', { order: 'day_of_week' });
    if (data && data.length > 0) {
      setHours(data);
    } else {
      // Initialize with defaults
      setHours(DAYS.map((_, i) => ({
        day_of_week: i,
        open_time: i === 0 ? null : '08:00',
        close_time: i === 0 ? null : '17:30',
        is_closed: i === 0
      })));
    }
    setLoading(false);
  };

  const handleChange = (dayIndex, field, value) => {
    setHours(hours.map(h => 
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const h of hours) {
      if (h.id) {
        await api.update('shop_hours', h.id, h);
      } else {
        await api.insert('shop_hours', h);
      }
    }
    setSaving(false);
    loadHours();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Shop Hours</h3>
          <p className="text-sm text-gray-500">Set your regular operating hours</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Open</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Close</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hours.map((h, idx) => (
              <tr key={h.day_of_week} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{DAYS[h.day_of_week]}</td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={h.open_time || ''}
                    onChange={(e) => handleChange(h.day_of_week, 'open_time', e.target.value)}
                    disabled={h.is_closed}
                    className="border rounded px-2 py-1 text-sm disabled:bg-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={h.close_time || ''}
                    onChange={(e) => handleChange(h.day_of_week, 'close_time', e.target.value)}
                    disabled={h.is_closed}
                    className="border rounded px-2 py-1 text-sm disabled:bg-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) => handleChange(h.day_of_week, 'is_closed', e.target.checked)}
                    className="rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// HOLIDAYS TAB
// ============================================
function HolidaysTab() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ holiday_date: '', name: '', is_closed: true });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    const data = await api.fetch('holidays', { order: 'holiday_date' });
    setHolidays(data || []);
    setLoading(false);
  };

  const handleToggleClosed = async (id, currentClosed) => {
    await api.update('holidays', id, { is_closed: !currentClosed });
    loadHolidays();
  };

  const handleAdd = async () => {
    if (!newHoliday.holiday_date || !newHoliday.name) return;
    await api.insert('holidays', newHoliday);
    setNewHoliday({ holiday_date: '', name: '', is_closed: true });
    setShowAdd(false);
    loadHolidays();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    await api.delete('holidays', id);
    loadHolidays();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  // Group by year
  const byYear = holidays.reduce((acc, h) => {
    const year = h.holiday_date.substring(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(h);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Holidays & Closures</h3>
          <p className="text-sm text-gray-500">Alberta stat holidays are preloaded. Toggle shop closed status.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Date
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newHoliday.holiday_date}
                onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Holiday name"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newHoliday.is_closed}
                onChange={(e) => setNewHoliday({ ...newHoliday, is_closed: e.target.checked })}
              />
              <span className="text-sm">Shop Closed</span>
            </div>
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Holidays by year */}
      {Object.entries(byYear).map(([year, yearHolidays]) => (
        <div key={year} className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{year}</h4>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {yearHolidays.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 w-32 text-gray-600">
                      {new Date(h.holiday_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900">{h.name}</span>
                      {h.is_stat && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">STAT</span>}
                    </td>
                    <td className="px-4 py-2 w-32">
                      <button
                        onClick={() => handleToggleClosed(h.id, h.is_closed)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.is_closed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {h.is_closed ? 'Closed' : 'Open'}
                      </button>
                    </td>
                    <td className="px-4 py-2 w-16 text-right">
                      {!h.is_stat && (
                        <button onClick={() => handleDelete(h.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TIME OFF TAB
// ============================================
function TimeOffTab() {
  const [technicians, setTechnicians] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ tech_id: '', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [techsData, timeOffData] = await Promise.all([
      api.fetch('technicians', { order: 'sort_order', filters: { is_active: 'eq.true' } }),
      api.fetch('tech_time_off', { order: 'start_date.desc' })
    ]);
    setTechnicians(techsData || []);
    setTimeOff(timeOffData || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newEntry.tech_id || !newEntry.start_date || !newEntry.end_date) return;
    await api.insert('tech_time_off', newEntry);
    setNewEntry({ tech_id: '', start_date: '', end_date: '', reason: '' });
    setShowAdd(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this time off entry?')) return;
    await api.delete('tech_time_off', id);
    loadData();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const getTechName = (id) => technicians.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Tech Time Off</h3>
          <p className="text-sm text-gray-500">Track vacations, sick days, and school schedules</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Time Off
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
              <select
                value={newEntry.tech_id}
                onChange={(e) => setNewEntry({ ...newEntry, tech_id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={newEntry.start_date}
                onChange={(e) => setNewEntry({ ...newEntry, start_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={newEntry.end_date}
                onChange={(e) => setNewEntry({ ...newEntry, end_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={newEntry.reason}
                onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Vacation, school, etc."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Time off list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Technician</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {timeOff.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{getTechName(entry.tech_id)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(entry.start_date + 'T00:00:00').toLocaleDateString()} - {new Date(entry.end_date + 'T00:00:00').toLocaleDateString()}
                  {entry.start_time && ` (${entry.start_time} - ${entry.end_time})`}
                </td>
                <td className="px-4 py-3 text-gray-600">{entry.reason || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {timeOff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No time off scheduled
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// DAY NOTES TAB
// ============================================
function DayNotesTab() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ note_date: '', note: '', show_in_morning_view: true });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    const data = await api.fetch('day_notes', { order: 'note_date.desc' });
    setNotes(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newNote.note_date || !newNote.note) return;
    await api.insert('day_notes', newNote);
    setNewNote({ note_date: '', note: '', show_in_morning_view: true });
    setShowAdd(false);
    loadNotes();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    await api.delete('day_notes', id);
    loadNotes();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Day Notes</h3>
          <p className="text-sm text-gray-500">Reminders and notes for specific days</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Note
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newNote.note_date}
                onChange={(e) => setNewNote({ ...newNote, note_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="text"
                value={newNote.note}
                onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Remember to..."
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newNote.show_in_morning_view}
                onChange={(e) => setNewNote({ ...newNote, show_in_morning_view: e.target.checked })}
                className="rounded"
              />
              Show in Morning View
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-24">
                {new Date(n.note_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-900">{n.note}</span>
              {n.show_in_morning_view && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Morning</span>
              )}
            </div>
            <button onClick={() => handleDelete(n.id)} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-400">No notes yet</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// DEFAULTS TAB
// ============================================
function DefaultsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await api.fetch('scheduler_settings');
    const settingsObj = {};
    (data || []).forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    setSettings(settingsObj);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      // Upsert each setting
      const existing = await api.fetch('scheduler_settings', { filters: { setting_key: `eq.${key}` } });
      if (existing && existing.length > 0) {
        await api.update('scheduler_settings', existing[0].id, { setting_value: value });
      } else {
        await api.insert('scheduler_settings', { setting_key: key, setting_value: value });
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Default Settings</h3>
          <p className="text-sm text-gray-500">Configure scheduler behavior</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Appointment Hours</label>
            <input
              type="number"
              value={settings.default_appointment_hours || 1}
              onChange={(e) => setSettings({ ...settings, default_appointment_hours: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              min="0.5"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Buffer %</label>
            <input
              type="number"
              value={settings.estimate_buffer_percent || 15}
              onChange={(e) => setSettings({ ...settings, estimate_buffer_percent: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Waiters Per Day (Shop)</label>
            <input
              type="number"
              value={settings.max_waiters_per_day || 4}
              onChange={(e) => setSettings({ ...settings, max_waiters_per_day: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Morning View Start Time</label>
            <input
              type="time"
              value={settings.morning_view_start || '07:30'}
              onChange={(e) => setSettings({ ...settings, morning_view_start: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showWeekends"
            checked={settings.show_weekends === 'true'}
            onChange={(e) => setSettings({ ...settings, show_weekends: e.target.checked ? 'true' : 'false' })}
            className="rounded"
          />
          <label htmlFor="showWeekends" className="text-sm text-gray-700">Show weekends in calendar</label>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
