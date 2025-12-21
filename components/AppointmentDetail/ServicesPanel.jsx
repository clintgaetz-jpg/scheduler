import React, { useState } from 'react';
import { 
  CheckCircle, Clock, PauseCircle, AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Package, Wrench, Plus, GripVertical, Trash2, Edit2
} from 'lucide-react';
import { ServiceIcon, matchServiceToIcon } from '../scheduler/AppointmentCard';

// ============================================
// SERVICES PANEL
// Line items with status: done, hold, pending
// ============================================

// Status configurations
const LINE_STATUS = {
  pending: { 
    label: 'Pending', 
    color: 'text-gray-500', 
    bg: 'bg-gray-100',
    icon: Clock 
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    icon: Wrench 
  },
  done: { 
    label: 'Done', 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    icon: CheckCircle 
  },
  hold: { 
    label: 'On Hold', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    icon: PauseCircle 
  },
};

const HOLD_REASONS = [
  { value: 'parts', label: 'Waiting for Parts' },
  { value: 'customer_approval', label: 'Awaiting Customer Approval' },
  { value: 'additional_diag', label: 'Additional Diagnostics Needed' },
  { value: 'tech_unavailable', label: 'Technician Unavailable' },
  { value: 'other', label: 'Other' },
];

export default function ServicesPanel({ 
  appointment, 
  servicePackages, 
  onUpdateLine,
  onAuthorize 
}) {
  const [expandedLine, setExpandedLine] = useState(null);
  const [editingLine, setEditingLine] = useState(null);

  const services = appointment.services || [];
  
  // Calculate totals
  const totals = services.reduce((acc, s) => {
    acc.hours += parseFloat(s.hours) || 0;
    acc.estimate += parseFloat(s.estimated_total) || 0;
    acc.doneHours += s.status === 'done' ? (parseFloat(s.hours) || 0) : 0;
    return acc;
  }, { hours: 0, estimate: 0, doneHours: 0 });

  const formatMoney = (amount) => {
    if (!amount) return '$0.00';
    return '$' + parseFloat(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const handleStatusChange = (index, newStatus) => {
    const service = services[index];
    const updates = { status: newStatus };
    
    // If putting on hold, we'll show the hold details UI
    if (newStatus === 'hold') {
      updates.hold_reason = 'parts'; // Default
      updates.hold_at = new Date().toISOString();
    } else if (newStatus !== 'hold') {
      // Clear hold data when moving off hold
      updates.hold_reason = null;
      updates.hold_details = null;
      updates.hold_at = null;
    }
    
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    }
    
    onUpdateLine(index, updates);
  };

  const handleHoldDetailsUpdate = (index, details) => {
    onUpdateLine(index, { hold_details: details });
  };

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Services ({services.length})
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            <Clock size={14} className="inline mr-1" />
            {totals.doneHours > 0 ? (
              <span>
                <span className="text-green-600">{totals.doneHours}h</span>
                <span className="text-gray-400"> / </span>
                <span>{totals.hours}h</span>
              </span>
            ) : (
              <span>{totals.hours}h</span>
            )}
          </span>
          <span className="font-medium text-gray-700">
            <DollarSign size={14} className="inline mr-1" />
            {formatMoney(totals.estimate)}
          </span>
        </div>
      </div>

      {/* Authorize button if not yet authorized */}
      {!appointment.authorized && (
        <button
          onClick={onAuthorize}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <DollarSign size={16} />
          Authorize Work Order
        </button>
      )}

      {/* Service Lines */}
      <div className="space-y-2">
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wrench size={32} className="mx-auto mb-2 opacity-50" />
            <p>No services scheduled</p>
          </div>
        ) : (
          services.map((service, index) => (
            <ServiceLine
              key={index}
              service={service}
              index={index}
              isExpanded={expandedLine === index}
              onToggleExpand={() => setExpandedLine(expandedLine === index ? null : index)}
              onStatusChange={(status) => handleStatusChange(index, status)}
              onHoldDetailsUpdate={(details) => handleHoldDetailsUpdate(index, details)}
              onUpdate={(updates) => onUpdateLine(index, updates)}
              servicePackages={servicePackages}
            />
          ))
        )}
      </div>

      {/* Progress bar */}
      {services.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round((totals.doneHours / totals.hours) * 100) || 0}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(totals.doneHours / totals.hours) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SERVICE LINE COMPONENT
// Individual line item with status controls
// ============================================
function ServiceLine({ 
  service, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onStatusChange,
  onHoldDetailsUpdate,
  onUpdate,
  servicePackages 
}) {
  const status = LINE_STATUS[service.status] || LINE_STATUS.pending;
  const StatusIcon = status.icon;
  const serviceIcon = matchServiceToIcon(service.name, servicePackages);

  const formatMoney = (amount) => {
    if (!amount) return '$0.00';
    return '$' + parseFloat(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${status.bg} border-gray-200`}>
      {/* Main Row */}
      <div 
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-black/5 transition-colors"
        onClick={onToggleExpand}
      >
        {/* Drag Handle (for future reordering) */}
        <GripVertical size={14} className="text-gray-300 cursor-grab" />
        
        {/* Service Icon */}
        {serviceIcon ? (
          <ServiceIcon icon={serviceIcon} size={16} />
        ) : (
          <Wrench size={16} className="text-gray-400" />
        )}
        
        {/* Service Name */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm truncate ${service.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {service.name}
          </div>
          {service.part_number && (
            <div className="text-xs text-gray-400 font-mono">
              P/N: {service.part_number}
            </div>
          )}
        </div>
        
        {/* Hours */}
        <div className="text-sm text-gray-500 w-12 text-right">
          {service.hours}h
        </div>
        
        {/* Price */}
        <div className="text-sm font-medium text-gray-700 w-20 text-right">
          {formatMoney(service.estimated_total)}
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color} ${status.bg}`}>
          <StatusIcon size={12} />
          {status.label}
        </div>
        
        {/* Expand Arrow */}
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 bg-white/50 space-y-3">
          {/* Status Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Status:</span>
            <div className="flex gap-1">
              {Object.entries(LINE_STATUS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={(e) => { e.stopPropagation(); onStatusChange(key); }}
                  className={`
                    px-2 py-1 rounded text-xs font-medium transition-colors
                    ${service.status === key 
                      ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current` 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                  `}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Hold Details (only if on hold) */}
          {service.status === 'hold' && (
            <HoldDetailsEditor
              service={service}
              onUpdate={onHoldDetailsUpdate}
            />
          )}
          
          {/* Description */}
          {service.description && (
            <div className="text-sm text-gray-600 bg-gray-100 rounded p-2">
              {service.description}
            </div>
          )}
          
          {/* Depends On (for sequencing) */}
          {service.depends_on && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle size={12} />
              Depends on: {service.depends_on}
            </div>
          )}
          
          {/* Tech Notes */}
          {service.tech_notes && (
            <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">
              Tech: {service.tech_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// HOLD DETAILS EDITOR
// For editing hold reason and details
// ============================================
function HoldDetailsEditor({ service, onUpdate }) {
  const [reason, setReason] = useState(service.hold_reason || 'parts');
  const [details, setDetails] = useState(service.hold_details || {});

  const handleReasonChange = (newReason) => {
    setReason(newReason);
    onUpdate({ ...details, reason: newReason });
  };

  const handleDetailChange = (key, value) => {
    const newDetails = { ...details, [key]: value };
    setDetails(newDetails);
    onUpdate(newDetails);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
      {/* Hold Reason */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-20">Reason:</span>
        <select
          value={reason}
          onChange={(e) => handleReasonChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white"
        >
          {HOLD_REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      
      {/* Parts-specific fields */}
      {reason === 'parts' && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Vendor:</span>
            <input
              type="text"
              value={details.vendor || ''}
              onChange={(e) => handleDetailChange('vendor', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="e.g., NAPA"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">PO #:</span>
            <input
              type="text"
              value={details.po_number || ''}
              onChange={(e) => handleDetailChange('po_number', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="e.g., 59141"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">ETA:</span>
            <input
              type="date"
              value={details.eta || ''}
              onChange={(e) => handleDetailChange('eta', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </>
      )}
      
      {/* Notes */}
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-500 w-20 pt-1">Notes:</span>
        <textarea
          value={details.notes || ''}
          onChange={(e) => handleDetailChange('notes', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Additional hold notes..."
          rows={2}
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 resize-none"
        />
      </div>
    </div>
  );
}
