import React, { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Phone, Mail, FileText, MapPin,
  Clock, Package, CheckCircle, Calendar, User, AlertCircle,
  Download, ExternalLink, RefreshCw
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

function StatusButtonLED({ label, status, onClick, pulse = false }) {
  const colors = LED_COLORS[status] || LED_COLORS.off;
  const isOn = status !== 'off';
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Status button clicked:', label);
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

const formatMoney = (amount) => {
  if (!amount) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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

  // Direct DB save - doesn't close modal
  const saveToDb = async (updates) => {
    if (!editedAppointment?.id) return;
    console.log('Saving to DB:', updates);
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
      else console.log('Saved successfully');
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  // Status button handlers - use ACTUAL column names
  const cycleWOStatus = async () => {
    // Cycle: neither → workorder_created → authorized → neither
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
    // This column doesn't exist yet - just update local state for now
    const newValue = !editedAppointment.deferred_reviewed;
    setEditedAppointment(prev => ({ ...prev, deferred_reviewed: newValue }));
    setIsDirty(true);
    // Skip DB save until column is added
    console.log('deferred_reviewed column not in DB yet');
  };

  const cyclePartsStatus = async () => {
    // Cycle: none → ordered → received → none
    // Uses: parts_ordered, parts_received (actual columns)
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

  const getWODisplay = () => {
    if (editedAppointment?.authorized) return { label: 'Authorized', led: 'green' };
    if (editedAppointment?.workorder_created) return { label: 'W/O Made', led: 'yellow' };
    return { label: 'No W/O', led: 'red' };
  };

  const getOnSiteDisplay = () => editedAppointment?.vehicle_here ? { label: 'On Site', led: 'green' } : { label: 'Not Here', led: 'red' };
  const getDeferredDisplay = () => editedAppointment?.deferred_reviewed ? { label: 'Reviewed', led: 'green' } : { label: 'Not Reviewed', led: 'red' };

  const getPartsDisplay = () => {
    // Uses actual columns: parts_ordered, parts_received
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
    console.log('Fetching parts for WO:', editedAppointment.workorder_number);
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
      console.log('Parts result:', data);
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

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex p-4 gap-4">
            {/* Customer */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900 truncate">{editedAppointment.customer_name}</h2>
                {editedAppointment.is_on_hold && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full shrink-0">ON HOLD</span>}
              </div>
              <div className="space-y-0.5 text-sm text-gray-600">
                <div className="flex items-center gap-1"><Phone size={12} /> {editedAppointment.customer_phone || '—'}</div>
                {editedAppointment.customer_phone2 && <div className="flex items-center gap-1"><Phone size={12} /> {editedAppointment.customer_phone2}</div>}
                <div className="flex items-center gap-1"><Mail size={12} /> {editedAppointment.customer_email || '—'}</div>
                <div className="flex items-center gap-1"><MapPin size={12} /> {editedAppointment.customer_address || '—'}</div>
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900 mb-1 truncate">{editedAppointment.vehicle_description}</div>
              <div className="space-y-0.5 text-sm text-gray-600">
                <div className="font-mono text-xs">{editedAppointment.vehicle_vin || '—'}</div>
                <div>{[editedAppointment.vehicle_color, editedAppointment.vehicle_plate, editedAppointment.vehicle_engine].filter(Boolean).join(', ') || '—'}</div>
              </div>
            </div>

            {/* WO# + Status Buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center min-w-[140px]">
                <div className="text-xs text-gray-400 uppercase">Work Order</div>
                <div className="text-2xl font-bold font-mono">{editedAppointment.workorder_number || '—'}</div>
              </div>
              <StatusButtonLED label={woDisplay.label} status={woDisplay.led} onClick={cycleWOStatus} />
              <StatusButtonLED label={onSiteDisplay.label} status={onSiteDisplay.led} onClick={toggleOnSite} />
              <StatusButtonLED label={defDisplay.label} status={defDisplay.led} onClick={toggleDeferred} />
              <StatusButtonLED label={partsDisplay.label} status={partsDisplay.led} onClick={cyclePartsStatus} pulse={partsDisplay.pulse} />
            </div>

            <button type="button" onClick={onClose} className="self-start p-2 hover:bg-gray-100 rounded-lg shrink-0"><X size={20} /></button>
          </div>

          {/* Meta row */}
          <div className="px-4 pb-2 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            {tech && <span className="flex items-center gap-1"><User size={14} /> {tech.name}</span>}
            <span className="flex items-center gap-1"><Calendar size={14} /> {editedAppointment.scheduled_date}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {totalHours}h</span>
            {isDirty && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Unsaved</span>}
            
            <div className="ml-auto flex items-center gap-2">
              <input 
                type="text" 
                value={editedAppointment.workorder_number || ''} 
                onChange={(e) => updateField('workorder_number', e.target.value)}
                onBlur={saveWONumber}
                placeholder="Enter WO #" 
                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleImport(); }}
                disabled={importing || !editedAppointment.workorder_number} 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1"
              >
                <Download size={14} />{importing ? '...' : 'Import'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="h-[350px] overflow-y-auto p-4">
          {activeTab === 'services' && (
            <div>{services.length === 0 ? <p className="text-gray-500 text-center py-8">No services added</p> : (
              <div className="space-y-2">{services.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div><div className="font-medium text-gray-900">{s.name}</div><div className="text-sm text-gray-500">{s.hours}h • {formatMoney(s.price)}</div></div>
                  {s.status === 'done' && <CheckCircle size={18} className="text-green-500" />}
                </div>
              ))}</div>
            )}</div>
          )}

          {activeTab === 'original' && (
            <div className="space-y-4">
              <div><label className="block text-xs text-gray-500 mb-1">Original Booking Notes</label>
                <textarea value={editedAppointment.original_notes || editedAppointment.notes || ''} onChange={(e) => updateField('original_notes', e.target.value)} className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="Original booking notes..." />
              </div>
            </div>
          )}

          {activeTab === 'imported' && (
            <div>{editedAppointment.imported_data ? (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">{JSON.stringify(editedAppointment.imported_data, null, 2)}</pre>
            ) : (
              <div className="text-center py-8"><p className="text-gray-500 mb-4">No data imported yet</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleImport(); }} disabled={!editedAppointment.workorder_number} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300">Import from Protractor</button>
              </div>
            )}</div>
          )}

          {activeTab === 'parts' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    fetchPartsInvoices(); 
                  }} 
                  disabled={loadingParts || !editedAppointment.workorder_number} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                >
                  <RefreshCw size={16} className={loadingParts ? 'animate-spin' : ''} />{loadingParts ? 'Loading...' : 'Fetch Invoices'}
                </button>
                <span className="text-sm text-gray-500">PO# {editedAppointment.workorder_number || '—'} • {partsInvoices.length} invoice{partsInvoices.length !== 1 ? 's' : ''}</span>
              </div>
              {partsInvoices.length === 0 ? <p className="text-gray-500 text-center py-8">No parts invoices</p> : (
                <div className="space-y-2">{partsInvoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div><div className="font-medium text-gray-900">#{inv.invoice_number}</div><div className="text-sm text-gray-500">{inv.vendor} • {inv.invoice_date}</div></div>
                    <div className="flex items-center gap-3"><span className="font-medium">{formatMoney(inv.total)}</span>
                      {inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><ExternalLink size={18} /></a>}
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <textarea value={editedAppointment.notes || ''} onChange={(e) => updateField('notes', e.target.value)} placeholder="Internal notes..." className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); toggleOnSite(); }} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Mark Arrived</button>
            <button type="button" className="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">No Show</button>
            <button type="button" className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">Complete</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) { onDelete?.(editedAppointment.id); onClose(); }}} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-1"><Trash2 size={16} /> Delete</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleMainSave(); }} disabled={!isDirty} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Save size={16} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
