import React, { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Phone, Mail, FileText, MapPin, Car, Gauge, Building2,
  Clock, Package, CheckCircle, Calendar, User, AlertCircle, Tag,
  Download, ExternalLink, RefreshCw, MessageSquare, PhoneCall, AtSign
} from 'lucide-react';

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

const LED_COLORS = {
  off: { base: '#2a2a2a', glow: 'transparent' },
  green: { base: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)' },
  lightgreen: { base: '#86efac', glow: 'rgba(134, 239, 172, 0.6)' },
  yellow: { base: '#eab308', glow: 'rgba(234, 179, 8, 0.8)' },
  orange: { base: '#f97316', glow: 'rgba(249, 115, 22, 0.8)' },
  red: { base: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' },
};

// ============================================
// HELPER COMPONENTS
// ============================================

function StatusButtonLED({ label, status, onClick, pulse = false }) {
  const colors = LED_COLORS[status] || LED_COLORS.off;
  const isOn = status !== 'off';
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.();
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-left min-w-[140px]"
    >
      <div style={{ padding: '2px', background: 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)', borderRadius: '2px' }}>
        <div
          className={`w-2 h-4 rounded-sm transition-all ${pulse ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: colors.base,
            boxShadow: isOn ? `0 0 6px 2px ${colors.glow}, inset 0 0 4px ${colors.glow}` : 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false, className = '' }) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-1.5 text-sm ${className}`}>
      {Icon && <Icon size={12} className="text-gray-400 shrink-0" />}
      {label && <span className="text-gray-500">{label}:</span>}
      <span className={`text-gray-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function ContactPreferences({ prefers_call, prefers_text, prefers_email, do_not_contact }) {
  if (do_not_contact) {
    return <span className="text-xs text-red-600 font-medium">⛔ DO NOT CONTACT</span>;
  }
  const prefs = [];
  if (prefers_call) prefs.push('📞');
  if (prefers_text) prefs.push('💬');
  if (prefers_email) prefs.push('📧');
  if (prefs.length === 0) return null;
  return <span className="text-xs text-gray-500" title="Contact preferences">{prefs.join(' ')}</span>;
}

function VinDisplay({ vin }) {
  if (!vin || vin.length < 17) return <span className="font-mono text-xs text-gray-400">{vin || '—'}</span>;
  
  // VIN breakdown: positions 8 (engine) and 10 (year) are highlighted
  // Last 8 = serial number, shown larger
  return (
    <div className="font-mono text-xs">
      <span className="text-gray-400">{vin.slice(0, 7)}</span>
      <span className="text-blue-600 font-bold" title="Engine Code">{vin.slice(7, 8)}</span>
      <span className="text-gray-400">{vin.slice(8, 9)}</span>
      <span className="text-blue-600 font-bold" title="Model Year">{vin.slice(9, 10)}</span>
      <span className="text-gray-400">{vin.slice(10, 11)}</span>
      <span className="font-bold text-sm text-gray-800" title="Serial Number">{vin.slice(-6)}</span>
    </div>
  );
}

function ServiceStatusBadge({ status, days_since, km_since }) {
  const config = {
    recent: { bg: 'bg-green-100', text: 'text-green-700', label: 'RECENT' },
    due_soon: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'DUE SOON' },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'OVERDUE' },
  };
  const c = config[status] || config.recent;
  
  return (
    <div className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
      {days_since && <span className="ml-1 opacity-75">({days_since}d)</span>}
    </div>
  );
}

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '—';
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '—';
  return parseInt(num).toLocaleString();
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AppointmentDetailModal({
  isOpen, onClose, appointment, technicians = [], onSave, onDelete, onImportFromProtractor
}) {
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [importing, setImporting] = useState(false);
  const [partsInvoices, setPartsInvoices] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (appointment) {
      setEditedAppointment({ ...appointment });
      setIsDirty(false);
      setActiveTab('services');
    }
  }, [appointment]);

  const updateField = (field, value) => {
    setEditedAppointment(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Direct DB save
  const saveToDb = async (updates) => {
    if (!editedAppointment?.id) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${editedAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) console.error('Save error:', res.status);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  // Status handlers
  const cycleWOStatus = async () => {
    const hasWO = editedAppointment.workorder_created;
    const hasAuth = editedAppointment.authorized;
    
    let updates;
    if (!hasWO && !hasAuth) {
      updates = { workorder_created: true, authorized: false };
    } else if (hasWO && !hasAuth) {
      updates = { workorder_created: true, authorized: true };
    } else {
      updates = { workorder_created: false, authorized: false };
    }
    
    setEditedAppointment(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    await saveToDb(updates);
  };

  const toggleOnSite = async () => {
    const newValue = !editedAppointment.vehicle_here;
    setEditedAppointment(prev => ({ ...prev, vehicle_here: newValue }));
    setIsDirty(true);
    await saveToDb({ vehicle_here: newValue });
  };

  const toggleDeferred = async () => {
    const newValue = !editedAppointment.deferred_reviewed;
    setEditedAppointment(prev => ({ ...prev, deferred_reviewed: newValue }));
    setIsDirty(true);
    await saveToDb({ deferred_reviewed: newValue });
  };

  const cyclePartsStatus = async () => {
    const ordered = editedAppointment.parts_ordered;
    const received = editedAppointment.parts_received;
    
    let updates;
    if (!ordered && !received) {
      updates = { parts_ordered: true, parts_received: false };
    } else if (ordered && !received) {
      updates = { parts_ordered: true, parts_received: true };
    } else {
      updates = { parts_ordered: false, parts_received: false };
    }
    
    setEditedAppointment(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    await saveToDb(updates);
  };

  const saveWONumber = async () => {
    if (!editedAppointment.workorder_number) return;
    await saveToDb({ workorder_number: editedAppointment.workorder_number });
    setIsDirty(false);
  };

  // Status display helpers
  const getWODisplay = () => {
    if (editedAppointment?.authorized) return { label: 'Authorized', led: 'green' };
    if (editedAppointment?.workorder_created) return { label: 'W/O Made', led: 'yellow' };
    return { label: 'No W/O', led: 'red' };
  };

  const getOnSiteDisplay = () => editedAppointment?.vehicle_here 
    ? { label: 'On Site', led: 'green' } 
    : { label: 'Not Here', led: 'red' };
  
  const getDeferredDisplay = () => editedAppointment?.deferred_reviewed 
    ? { label: 'Reviewed', led: 'green' } 
    : { label: 'Not Reviewed', led: 'red' };

  const getPartsDisplay = () => {
    if (editedAppointment?.parts_received) return { label: 'Parts Here', led: 'green' };
    if (editedAppointment?.parts_ordered) return { label: 'Ordered', led: 'orange' };
    return { label: 'No Parts', led: 'off' };
  };

  const handleImport = async () => {
    if (!editedAppointment.workorder_number) { alert('Enter WO # first'); return; }
    setImporting(true);
    try {
      if (onImportFromProtractor) await onImportFromProtractor(editedAppointment.workorder_number, editedAppointment.id);
    } catch (err) { console.error('Import failed:', err); }
    setImporting(false);
  };

  const fetchPartsInvoices = async () => {
    if (!editedAppointment.workorder_number) return;
    setLoadingParts(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_parts_invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ p_po_number: editedAppointment.workorder_number })
      });
      const data = await res.json();
      setPartsInvoices(data || []);
    } catch (err) { 
      console.error('Failed to fetch invoices:', err); 
    }
    setLoadingParts(false);
  };

  const handleMainSave = async () => {
    if (onSave) await onSave(editedAppointment);
    setIsDirty(false);
  };

  if (!isOpen || !editedAppointment) return null;

  const tech = technicians.find(t => t.id === editedAppointment.tech_id);
  const services = editedAppointment.services || [];
  const totalHours = services.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0) || editedAppointment.estimated_hours || 0;
  
  const woDisplay = getWODisplay();
  const onSiteDisplay = getOnSiteDisplay();
  const defDisplay = getDeferredDisplay();
  const partsDisplay = getPartsDisplay();

  // Shorthand for appointment data
  const appt = editedAppointment;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex p-4 gap-4">
            
            {/* CUSTOMER SECTION */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-900 truncate">{appt.customer_name}</h2>
                {appt.company_name && appt.company_name !== appt.customer_name && (
                  <span className="text-sm text-gray-500">({appt.company_name})</span>
                )}
                {appt.is_on_hold && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full shrink-0">ON HOLD</span>
                )}
              </div>
              
              {/* Contact Info */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-3">
                  <InfoRow icon={Phone} value={appt.customer_phone} />
                  {appt.customer_phone_secondary && (
                    <InfoRow icon={Phone} value={appt.customer_phone_secondary} className="text-gray-500" />
                  )}
                </div>
                <InfoRow icon={Mail} value={appt.customer_email} />
                <div className="flex items-start gap-1.5">
                  <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-700 break-words text-sm leading-tight">
                    {appt.customer_address || '—'}
                  </span>
                </div>
              </div>

              {/* Customer Stats & Preferences */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {appt.customer_since && (
                  <span title="Customer since">Since {appt.customer_since}</span>
                )}
                {appt.lifetime_visits && (
                  <span title="Total visits">{appt.lifetime_visits} visits</span>
                )}
                {appt.lifetime_spent && (
                  <span title="Lifetime spent">{formatMoney(appt.lifetime_spent)} lifetime</span>
                )}
                <ContactPreferences 
                  prefers_call={appt.prefers_call}
                  prefers_text={appt.prefers_text}
                  prefers_email={appt.prefers_email}
                  do_not_contact={appt.do_not_contact}
                />
                {appt.is_supplier && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Supplier</span>
                )}
              </div>

              {/* Customer Notes */}
              {appt.customer_notes && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 line-clamp-2">
                  📝 {appt.customer_notes}
                </div>
              )}
            </div>

            {/* VEHICLE SECTION */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Car size={16} className="text-gray-500" />
                <span className="text-base font-semibold text-gray-900 truncate">
                  {appt.vehicle_description || 'No vehicle'}
                </span>
                {appt.vehicle_service_status && (
                  <ServiceStatusBadge 
                    status={appt.vehicle_service_status} 
                    days_since={appt.vehicle_days_since_service}
                  />
                )}
              </div>
              
              {/* VIN Display */}
              <div className="mb-2">
                <VinDisplay vin={appt.vehicle_vin} />
              </div>

              {/* Vehicle Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {/* Left column */}
                <div className="space-y-1">
                  {appt.vehicle_plate && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-xs">Plate:</span>
                      <span className="font-mono font-semibold text-gray-800">{appt.vehicle_plate}</span>
                    </div>
                  )}
                  {appt.vehicle_color && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-xs">Color:</span>
                      <span className="text-gray-700">{appt.vehicle_color}</span>
                    </div>
                  )}
                  {appt.vehicle_engine && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-xs">Engine:</span>
                      <span className="text-gray-700 text-xs">{appt.vehicle_engine}</span>
                    </div>
                  )}
                </div>
                
                {/* Right column */}
                <div className="space-y-1">
                  {appt.vehicle_unit_number && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-xs">Unit:</span>
                      <span className="font-semibold text-gray-800">{appt.vehicle_unit_number}</span>
                    </div>
                  )}
                  {appt.vehicle_mileage && (
                    <div className="flex items-center gap-1.5">
                      <Gauge size={12} className="text-gray-400" />
                      <span className="text-gray-700">{formatNumber(appt.vehicle_mileage)} km</span>
                      {appt.vehicle_mileage_estimated && appt.vehicle_mileage_estimated !== appt.vehicle_mileage && (
                        <span className="text-xs text-gray-400" title="Estimated current">
                          → {formatNumber(appt.vehicle_mileage_estimated)}
                        </span>
                      )}
                    </div>
                  )}
                  {appt.vehicle_submodel && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-xs">Trim:</span>
                      <span className="text-gray-700">{appt.vehicle_submodel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Notes */}
              {appt.vehicle_notes && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 line-clamp-2">
                  🚗 {appt.vehicle_notes}
                </div>
              )}
            </div>

            {/* WO# + Status Buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[140px]">
                <div className="text-xs text-gray-400 uppercase">Work Order</div>
                <div className="text-2xl font-bold font-mono">{appt.workorder_number || '—'}</div>
              </div>
              <StatusButtonLED label={woDisplay.label} status={woDisplay.led} onClick={cycleWOStatus} />
              <StatusButtonLED label={onSiteDisplay.label} status={onSiteDisplay.led} onClick={toggleOnSite} />
              <StatusButtonLED label={defDisplay.label} status={defDisplay.led} onClick={toggleDeferred} />
              <StatusButtonLED label={partsDisplay.label} status={partsDisplay.led} onClick={cyclePartsStatus} />
            </div>

            <button type="button" onClick={onClose} className="self-start p-2 hover:bg-gray-100 rounded-lg shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Meta row */}
          <div className="px-4 pb-2 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            {tech && <span className="flex items-center gap-1"><User size={14} /> {tech.name}</span>}
            <span className="flex items-center gap-1"><Calendar size={14} /> {appt.scheduled_date}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {totalHours}h</span>
            {appt.time_slot && appt.time_slot !== 'anytime' && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{appt.time_slot}</span>
            )}
            {isDirty && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Unsaved</span>}
            
            <div className="ml-auto flex items-center gap-2">
              <input 
                type="text" 
                value={appt.workorder_number || ''} 
                onChange={(e) => updateField('workorder_number', e.target.value)}
                onBlur={saveWONumber}
                placeholder="Enter WO #" 
                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleImport(); }}
                disabled={importing || !appt.workorder_number} 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Download size={14} />{importing ? '...' : 'Import'}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* TABS */}
        {/* ============================================ */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4">
          {[
            { id: 'services', label: 'Services', icon: FileText },
            { id: 'original', label: 'Original', icon: Clock },
            { id: 'imported', label: 'Imported', icon: Download },
            { id: 'parts', label: 'Parts', icon: Package },
            { id: 'notes', label: 'Notes', icon: AlertCircle },
          ].map(tab => (
            <button 
              type="button"
              key={tab.id} 
              onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* CONTENT */}
        {/* ============================================ */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'services' && (
            <div>
              {services.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No services added</p>
              ) : (
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <div className="font-medium text-gray-900">{s.name || s.title}</div>
                        <div className="text-sm text-gray-500">
                          {s.hours}h • {formatMoney(s.price || s.total)}
                          {s.labor_hours && <span className="ml-2 text-xs">({s.labor_hours}h labor)</span>}
                        </div>
                      </div>
                      {s.status === 'done' && <CheckCircle size={18} className="text-green-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'original' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Original Booking Notes</label>
                <textarea 
                  value={appt.original_notes || appt.notes || ''} 
                  onChange={(e) => updateField('original_notes', e.target.value)} 
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" 
                  placeholder="Original booking notes..." 
                />
              </div>
              {appt.customer_request && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Customer Request</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                    {appt.customer_request}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'imported' && (
            <div>
              {appt.imported_data ? (
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(appt.imported_data, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No data imported yet</p>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!appt.workorder_number}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:bg-gray-300"
                  >
                    Import from Protractor
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'parts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Parts Invoices</h3>
                <button
                  type="button"
                  onClick={fetchPartsInvoices}
                  disabled={loadingParts || !appt.workorder_number}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingParts ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              {partsInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No parts invoices found</p>
              ) : (
                <div className="space-y-2">
                  {partsInvoices.map((inv, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{inv.supplier_name}</div>
                          <div className="text-sm text-gray-500">#{inv.invoice_number} • {inv.invoice_date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatMoney(inv.total)}</div>
                          {inv.pdf_url && (
                            <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" 
                               className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink size={10} /> PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Internal Notes</label>
                <textarea 
                  value={appt.notes || ''} 
                  onChange={(e) => updateField('notes', e.target.value)} 
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" 
                  placeholder="Internal notes..." 
                />
              </div>
              {appt.hold_reason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs text-amber-600 font-medium mb-1">Hold Reason</div>
                  <div className="text-sm text-amber-800">{appt.hold_reason}</div>
                  {appt.hold_notes && <div className="text-sm text-amber-700 mt-1">{appt.hold_notes}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* FOOTER */}
        {/* ============================================ */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => { if (window.confirm('Delete this appointment?')) onDelete(appt.id); }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMainSave}
              disabled={!isDirty}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
