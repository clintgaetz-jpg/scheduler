import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Mail, MapPin, Car, ChevronDown, ChevronUp, Check, RefreshCw, 
  Copy, ExternalLink, User, Palette, Settings, Package, AlertTriangle,
  Circle, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { getAvailableWorkorders, searchAvailableWorkorders, updateAppointment } from '../../utils/supabase';

// ============================================
// VIN FORMATTER
// Makes 8th, 10th, and last 8 digits bold/larger
// ============================================
function FormattedVIN({ vin }) {
  if (!vin || vin.length < 17) {
    return <span className="font-mono text-xs text-gray-400">{vin || '—'}</span>;
  }

  const chars = vin.split('');
  
  return (
    <span className="font-mono text-xs tracking-wide">
      {chars.map((char, i) => {
        const isBold = i === 7 || i >= 9;
        return (
          <span 
            key={i} 
            className={isBold ? 'font-bold text-sm text-gray-900' : 'text-gray-400'}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

// ============================================
// WO CONFIRMATION DIALOG
// ============================================
function WOConfirmDialog({ appointment, selectedWO, onConfirm, onCancel }) {
  if (!selectedWO) return null;

  const apptCustomer = appointment?.customer_name || 'Unknown';
  const apptPhone = appointment?.customer_phone || '';
  const apptVehicle = appointment?.vehicle_description || 
    `${appointment?.vehicle_year || ''} ${appointment?.vehicle_make || ''} ${appointment?.vehicle_model || ''}`.trim() || 
    'No vehicle';
  const apptVIN = appointment?.vehicle_vin || '';
  const apptPlate = appointment?.vehicle_plate || '';
  
  const woCustomer = selectedWO.customer_name || 'Unknown';
  const woCompany = selectedWO.company_name;
  const woVehicle = selectedWO.vehicle_description || 'No vehicle';
  const woVIN = selectedWO.vehicle_vin || '';

  // Check if they match (loose comparison)
  const customerMatch = apptCustomer.toLowerCase().includes(woCustomer.toLowerCase().split(',')[0]) ||
                        woCustomer.toLowerCase().includes(apptCustomer.toLowerCase().split(',')[0]);
  const vehicleMatch = apptVehicle.toLowerCase().includes(woVehicle.toLowerCase().split(' ').slice(0,2).join(' ')) ||
                       woVehicle.toLowerCase().includes(apptVehicle.toLowerCase().split(' ').slice(0,2).join(' '));
  const vinMatch = apptVIN && woVIN && apptVIN.slice(-8) === woVIN.slice(-8);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
          <h3 className="font-bold">Assign Work Order #{selectedWO.workorder_number}?</h3>
          {selectedWO.package_total > 0 && (
            <span className="text-blue-100 text-sm">${parseFloat(selectedWO.package_total).toLocaleString()}</span>
          )}
        </div>
        
        {/* Customer Comparison */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Customer</span>
            {customerMatch ? (
              <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Match</span>
            ) : (
              <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Verify</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
              <div className="text-[10px] text-gray-400 uppercase mb-1">Appointment</div>
              <div className="font-medium text-gray-900 text-sm truncate">{apptCustomer}</div>
              {apptPhone && <div className="text-xs text-gray-500">{apptPhone}</div>}
            </div>
            <div className={`p-2 rounded border-2 ${customerMatch ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Work Order</div>
              <div className="font-medium text-gray-900 text-sm truncate">{woCustomer}</div>
              {woCompany && woCompany !== woCustomer && (
                <div className="text-xs text-gray-500 truncate">{woCompany}</div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Match Indicator */}
        <div className="flex justify-center -my-2 relative z-10">
          {(customerMatch || vehicleMatch || vinMatch) ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shadow-lg">
              <Check size={24} strokeWidth={3} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white shadow-lg">
              <X size={24} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Vehicle Comparison */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Vehicle</span>
            {vehicleMatch || vinMatch ? (
              <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {vinMatch ? 'VIN Match' : 'Match'}
              </span>
            ) : (
              <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Verify</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded border border-gray-200">
              <div className="text-[10px] text-gray-400 uppercase mb-1">Appointment</div>
              <div className="font-medium text-gray-900 text-sm truncate">{apptVehicle}</div>
              {apptPlate && <div className="text-xs text-blue-600 font-medium">{apptPlate}</div>}
              {apptVIN && <div className="text-[10px] text-gray-400 font-mono">...{apptVIN.slice(-8)}</div>}
            </div>
            <div className={`p-2 rounded border-2 ${vehicleMatch || vinMatch ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="text-[10px] text-gray-400 uppercase mb-1">Work Order</div>
              <div className="font-medium text-gray-900 text-sm truncate">{woVehicle}</div>
              {woVIN && <div className="text-[10px] text-gray-400 font-mono">...{woVIN.slice(-8)}</div>}
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="px-4 pb-3">
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            💡 Customer info may have been updated since booking. Verify this is the correct work order.
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Yes, Assign WO
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// WO REMOVAL CONFIRMATION DIALOG
// ============================================
function WORemoveDialog({ woNumber, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-amber-500 text-white">
          <h3 className="font-bold">Remove Work Order #{woNumber}?</h3>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700">
            This will revert back to the basic appointment view:
          </p>
          
          <ul className="text-sm space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span><strong>Work Order lines</strong> will be cleared</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span><strong>Parts invoices</strong> will be detached</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span><strong>Advisor notes</strong> will no longer display</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Appointment lines</strong> will still be available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span><strong>Customer & vehicle info</strong> stays the same</span>
            </li>
          </ul>
          
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-xs">
            The work order still exists in Protractor - you can re-link it anytime.
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Yes, Remove WO
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// WO DROPDOWN SELECTOR - Locks when assigned
// ============================================
function WODropdown({ value, onChange, onUpdate, appointment }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingWO, setPendingWO] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [localCleared, setLocalCleared] = useState(false);  // Track if we just cleared

  // Reset localCleared when value changes from outside
  useEffect(() => {
    if (value) {
      setLocalCleared(false);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && workorders.length === 0) {
      loadWorkorders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (search.length >= 2) {
      searchWorkorders(search);
    } else if (search.length === 0 && isOpen) {
      loadWorkorders();
    }
  }, [search]);

  const loadWorkorders = async () => {
    setLoading(true);
    try {
      const data = await getAvailableWorkorders(30);
      setWorkorders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load workorders:', err);
      setWorkorders([]);
    }
    setLoading(false);
  };

  const searchWorkorders = async (term) => {
    setLoading(true);
    try {
      const data = await searchAvailableWorkorders(term);
      setWorkorders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to search workorders:', err);
      setWorkorders([]);
    }
    setLoading(false);
  };

  const handleSelect = (wo) => {
    setPendingWO(wo);
    setIsOpen(false);
    setSearch('');
  };

  const handleConfirmWO = async () => {
    if (!pendingWO || !appointment?.id) return;
    setSaving(true);
    try {
      await updateAppointment(appointment.id, { 
        workorder_number: pendingWO.workorder_number,
        workorder_created: true
      });
      onUpdate?.('workorder_number', pendingWO.workorder_number);
      onUpdate?.('workorder_created', true);
      onChange?.(pendingWO.workorder_number);
    } catch (err) {
      console.error('Failed to assign WO:', err);
    }
    setSaving(false);
    setPendingWO(null);
  };

  const handleClearWO = async () => {
    if (!appointment?.id) {
      console.error('No appointment ID to clear WO');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Clearing WO for appointment:', appointment.id);
      
      // Update database - use empty arrays for JSONB fields
      const result = await updateAppointment(appointment.id, { 
        workorder_number: null,
        workorder_created: false,
        protractor_lines: [],
        supplier_invoices: []
      });
      
      console.log('Database update result:', result);
      
      // Check for errors in result
      if (result?.error) {
        throw new Error(result.error.message || 'Database update failed');
      }
      
      // Set local cleared state immediately for UI feedback
      setLocalCleared(true);
      
      // Update local state - call all updates
      if (onUpdate) {
        onUpdate('workorder_number', null);
        onUpdate('workorder_created', false);
        onUpdate('protractor_lines', []);
        onUpdate('supplier_invoices', []);
      }
      
      // Also call onChange to notify parent
      if (onChange) {
        onChange(null);
      }
      
      console.log('WO cleared successfully');
    } catch (err) {
      console.error('Failed to clear WO:', err);
      alert('Failed to remove work order. Please try again.');
      setLocalCleared(false);
    }
    
    setSaving(false);
    setShowRemoveConfirm(false);
  };

  // ═══════════════════════════════════════════
  // LOCKED STATE - WO is assigned (and not just cleared)
  // ═══════════════════════════════════════════
  if (value && !localCleared) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-lg font-bold text-blue-900">#{value}</span>
            <button
              onClick={() => setShowRemoveConfirm(true)}
              disabled={saving}
              className="p-0.5 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove Work Order"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          </div>
        </div>
        
        {/* Remove Confirmation Dialog */}
        {showRemoveConfirm && (
          <WORemoveDialog
            woNumber={value}
            onConfirm={handleClearWO}
            onCancel={() => setShowRemoveConfirm(false)}
          />
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════
  // UNLOCKED STATE - Select a WO
  // ═══════════════════════════════════════════
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <span>Select W/O</span>
        <ChevronDown size={14} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search WO # or name..."
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <div className="p-3 text-center text-gray-400 text-sm">Loading...</div>
              )}
              {!loading && workorders.length === 0 && (
                <div className="p-3 text-center text-gray-400 text-sm">No workorders found</div>
              )}
              {!loading && workorders.map((wo) => (
                <button
                  key={wo.workorder_number}
                  onClick={() => handleSelect(wo)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">#{wo.workorder_number}</span>
                    <div className="flex items-center gap-2">
                      {wo.line_count > 0 && (
                        <span className="text-[10px] bg-gray-100 px-1 rounded">{wo.line_count} lines</span>
                      )}
                      <span className="text-xs text-gray-400">{wo.status}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {wo.customer_name}
                    {wo.company_name && wo.company_name !== wo.customer_name && (
                      <span className="text-gray-400"> • {wo.company_name}</span>
                    )}
                  </div>
                  {wo.vehicle_description && (
                    <div className="text-xs text-gray-400 truncate">{wo.vehicle_description}</div>
                  )}
                  {wo.package_total > 0 && (
                    <div className="text-xs text-green-600 font-medium">${parseFloat(wo.package_total).toLocaleString()}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {pendingWO && (
        <WOConfirmDialog
          appointment={appointment}
          selectedWO={pendingWO}
          onConfirm={handleConfirmWO}
          onCancel={() => setPendingWO(null)}
        />
      )}
    </div>
  );
}

// ============================================
// STATUS TOGGLE BUTTON - Single line with LED
// ============================================
function StatusToggle({ label, active, activeLabel, inactiveLabel, color = 'green', onClick, disabled = false }) {
  const isOn = active;
  
  // LED colors
  const ledColors = {
    green: isOn ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50',
    red: isOn ? 'bg-red-500 shadow-red-500/50' : 'bg-gray-300',
    yellow: isOn ? 'bg-amber-400 shadow-amber-400/50' : 'bg-gray-300',
    blue: isOn ? 'bg-blue-500 shadow-blue-500/50' : 'bg-gray-300',
    purple: isOn ? 'bg-purple-500 shadow-purple-500/50' : 'bg-gray-300',
  };

  // Background colors
  const bgColors = {
    green: isOn ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-700',
    red: isOn ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500',
    yellow: isOn ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500',
    blue: isOn ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-500',
    purple: isOn ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
        transition-all hover:shadow-md active:scale-95
        ${bgColors[color] || bgColors.green}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${ledColors[color]}`} />
      <span>{label}</span>
      <span className="font-normal opacity-75">{isOn ? activeLabel : inactiveLabel}</span>
    </button>
  );
}

// Parts status cycles through multiple states
function PartsStatusToggle({ status, label, onClick }) {
  const statusConfig = {
    none: { led: 'bg-gray-300', bg: 'bg-gray-50 border-gray-200 text-gray-500', text: 'No Parts' },
    needed: { led: 'bg-red-500 shadow-red-500/50', bg: 'bg-red-50 border-red-300 text-red-700', text: 'Needed' },
    ordered: { led: 'bg-amber-400 shadow-amber-400/50', bg: 'bg-amber-50 border-amber-300 text-amber-800', text: 'Ordered' },
    partial: { led: 'bg-purple-500 shadow-purple-500/50', bg: 'bg-purple-50 border-purple-300 text-purple-800', text: 'Partial' },
    arrived: { led: 'bg-emerald-500 shadow-emerald-500/50', bg: 'bg-green-50 border-green-300 text-green-800', text: 'All Here' },
    all_here: { led: 'bg-emerald-500 shadow-emerald-500/50', bg: 'bg-green-50 border-green-300 text-green-800', text: 'All Here' },
    some_here: { led: 'bg-purple-500 shadow-purple-500/50', bg: 'bg-purple-50 border-purple-300 text-purple-800', text: 'Partial' },
  };

  const config = statusConfig[status] || statusConfig.none;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
        transition-all hover:shadow-md active:scale-95 cursor-pointer
        ${config.bg}
      `}
    >
      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${config.led}`} />
      <span>{label}</span>
      <span className="font-normal opacity-75">{config.text}</span>
    </button>
  );
}

// ============================================
// HEADER - Expanded with Sub-header Status Bar
// ============================================
export default function Header({ 
  appointment, 
  tech, 
  technicians = [],
  isDirty, 
  hasChildren,
  onClose,
  onUpdate,
  onStatusChange,
  relatedAppointments = []
}) {
  const [copied, setCopied] = useState(null);
  const [showMoreCustomer, setShowMoreCustomer] = useState(false);
  const [showMoreVehicle, setShowMoreVehicle] = useState(false);
  
  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  // Determine header accent color
  const getStatusColor = () => {
    if (!appointment) return 'border-gray-300';
    if (appointment.status === 'completed') return 'border-green-500';
    if (appointment.is_on_hold) return 'border-amber-500';
    if (appointment.vehicle_here) return 'border-blue-500';
    return 'border-gray-300';
  };

  if (!appointment) return null;

  const vehicleDesc = appointment.vehicle_description || 
    `${appointment.vehicle_year || ''} ${appointment.vehicle_make || ''} ${appointment.vehicle_model || ''}`.trim() ||
    'No vehicle';

  // Check if we have "more" customer info
  const hasMoreCustomerInfo = appointment.customer_phone_secondary || appointment.customer_email || appointment.customer_address;
  const hasMoreVehicleInfo = appointment.vehicle_engine || appointment.vehicle_color || appointment.vehicle_submodel;
  
  return (
    <header className={`border-b-2 ${getStatusColor()} bg-white`}>
      {/* ═══════════════════════════════════════════
          TOP ROW - Customer | Vehicle | WO
      ═══════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-start gap-4">
        
        {/* CUSTOMER INFO */}
        <div className="flex-1 min-w-0 max-w-[320px]">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 truncate">
                {appointment?.customer_name || 'Unknown Customer'}
              </h1>
            {/* Parent/Child badges */}
              {appointment?.parent_id && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded flex-shrink-0">
                  {appointment.split_letter || 'CHILD'}
                </span>
              )}
              {hasChildren && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded flex-shrink-0">
                PARENT
                </span>
              )}
            </div>
            
          {/* Primary phone */}
          <div className="flex items-center gap-3 text-sm">
            {appointment?.customer_phone && (
              <a 
                href={`tel:${appointment.customer_phone}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Phone size={12} />
                {formatPhone(appointment.customer_phone)}
              </a>
            )}
            
            {/* More info toggle */}
            {hasMoreCustomerInfo && (
              <button
                onClick={() => setShowMoreCustomer(!showMoreCustomer)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                {showMoreCustomer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                More
              </button>
            )}
          </div>

          {/* Expanded customer info */}
          {showMoreCustomer && (
            <div className="mt-2 pl-5 space-y-1 text-xs text-gray-600 border-l-2 border-gray-200">
              {appointment.customer_phone_secondary && (
                <a href={`tel:${appointment.customer_phone_secondary}`} className="flex items-center gap-1.5 hover:text-blue-600">
                  <Phone size={11} />
                  {formatPhone(appointment.customer_phone_secondary)} <span className="text-gray-400">(alt)</span>
                </a>
              )}
              {appointment.customer_email && (
                <a href={`mailto:${appointment.customer_email}`} className="flex items-center gap-1.5 hover:text-blue-600 truncate">
                  <Mail size={11} />
                  {appointment.customer_email}
                </a>
              )}
              {appointment.customer_address && (
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                  <span>{appointment.customer_address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-14 bg-gray-200 flex-shrink-0 self-center" />

        {/* VEHICLE INFO */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Car size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 truncate">{vehicleDesc}</span>
            
            {/* Plate badge */}
            {appointment.vehicle_plate && (
              <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 font-medium text-xs flex-shrink-0">
                {appointment.vehicle_plate}
              </span>
            )}
            
            {/* More vehicle toggle */}
            {hasMoreVehicleInfo && (
              <button
                onClick={() => setShowMoreVehicle(!showMoreVehicle)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                {showMoreVehicle ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                More
              </button>
            )}
          </div>
          
          {/* VIN + Mileage row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <FormattedVIN vin={appointment.vehicle_vin} />
              {appointment.vehicle_vin && (
                <button
                  onClick={() => copyToClipboard(appointment.vehicle_vin, 'vin')}
                  className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
                  title="Copy VIN"
                >
                  {copied === 'vin' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              )}
            </div>
            {appointment.vehicle_mileage && (
              <span className="text-xs text-gray-500">
                {parseInt(appointment.vehicle_mileage).toLocaleString()} km
              </span>
            )}
          </div>
          
          {/* Expanded vehicle info */}
          {showMoreVehicle && (
            <div className="mt-2 pl-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 border-l-2 border-gray-200">
              {appointment.vehicle_submodel && (
                <span className="flex items-center gap-1">
                  <Settings size={11} />
                  {appointment.vehicle_submodel}
                    </span>
              )}
              {appointment.vehicle_engine && (
                <span className="flex items-center gap-1">
                  <Settings size={11} />
                  {appointment.vehicle_engine}
                </span>
              )}
              {appointment.vehicle_color && (
                <span className="flex items-center gap-1">
                  <Palette size={11} />
                  {appointment.vehicle_color}
                </span>
              )}
            </div>
          )}
          </div>

        {/* Divider */}
        <div className="w-px h-14 bg-gray-200 flex-shrink-0 self-center" />

        {/* WORK ORDER */}
        <div className="flex-shrink-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Work Order</div>
          {appointment?.parent_id ? (
            <span className="text-lg font-bold text-gray-900">
              #{appointment.workorder_number || '—'}
            </span>
          ) : (
            <WODropdown
              value={appointment.workorder_number}
              onChange={(val) => onUpdate?.('workorder_number', val)}
              onUpdate={onUpdate}
              appointment={appointment}
            />
          )}
          </div>

        {/* Unsaved + Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDirty && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              Unsaved
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SUB-HEADER - Status Toggle Buttons
      ═══════════════════════════════════════════ */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
        
        {/* Vehicle Here Toggle */}
        <StatusToggle
          label="Vehicle"
          active={appointment.vehicle_here}
          activeLabel="Here"
          inactiveLabel="Not Here"
          color="green"
          onClick={() => {
            const newValue = !appointment.vehicle_here;
            onUpdate?.('vehicle_here', newValue);
            if (newValue) onUpdate?.('arrived_at', new Date().toISOString());
            onStatusChange?.(appointment.id, { 
              vehicle_here: newValue,
              arrived_at: newValue ? new Date().toISOString() : null
            });
          }}
        />

        {/* Authorization Toggle */}
        <StatusToggle
          label="Auth"
          active={appointment.authorized}
          activeLabel="Authorized"
          inactiveLabel="Not Auth"
          color="green"
          onClick={() => {
            const newValue = !appointment.authorized;
            onUpdate?.('authorized', newValue);
            onStatusChange?.(appointment.id, { authorized: newValue });
          }}
        />

        {/* Parts Status - cycles through states */}
        <PartsStatusToggle
          status={appointment.parts_status || 'none'}
          label="Parts"
          onClick={() => {
            // Cycle: none → needed → ordered → partial → arrived → none
            const current = appointment.parts_status;
            let next = 'none';
            if (!current || current === 'none') next = 'needed';
            else if (current === 'needed') next = 'ordered';
            else if (current === 'ordered') next = 'partial';
            else if (current === 'partial') next = 'arrived';
            else next = 'none';
            
            onUpdate?.('parts_status', next);
            onStatusChange?.(appointment.id, { parts_status: next });
          }}
        />

        {/* Hold Toggle */}
        <StatusToggle
          label="Hold"
          active={appointment.is_on_hold}
          activeLabel="On Hold"
          inactiveLabel="Not Held"
          color="yellow"
          onClick={() => {
            const newValue = !appointment.is_on_hold;
            onUpdate?.('is_on_hold', newValue);
            if (newValue) onUpdate?.('hold_at', new Date().toISOString());
            onStatusChange?.(appointment.id, { 
              is_on_hold: newValue,
              hold_at: newValue ? new Date().toISOString() : null
            });
          }}
        />
        
      </div>
    </header>
  );
}
