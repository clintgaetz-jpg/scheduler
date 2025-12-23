import React from 'react';
import { X, Phone, ExternalLink, GitBranch, User, CheckCircle, Pause, Car, ChevronDown } from 'lucide-react';

// ============================================
// HEADER
// Customer | Vehicle | WO# | Status | Close
// ============================================

export default function Header({ 
  appointment, 
  tech, 
  technicians = [],
  isDirty, 
  hasChildren,
  onClose,
  onUpdate,
  onStatusChange
}) {
  
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

  // Determine header accent color based on status
  const getStatusColor = () => {
    if (appointment.status === 'completed') return 'border-green-500';
    if (appointment.is_on_hold) return 'border-amber-500';
    if (appointment.vehicle_here) return 'border-blue-500';
    return 'border-gray-300';
  };

  return (
    <header className={`border-b-2 ${getStatusColor()} bg-white`}>
      <div className="px-4 py-3 flex items-start justify-between gap-4">
        
        {/* ─────────────────────────────────────────
            LEFT: Customer + Vehicle
        ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex gap-8">
          
          {/* Customer Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {appointment.customer_name}
              </h1>
              
              {/* Parent/Child indicator */}
              {appointment.parent_id && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                  {appointment.split_letter || 'CHILD'}
                </span>
              )}
              {hasChildren && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
                  <GitBranch size={12} />
                  Has splits
                </span>
              )}
              
              {/* Unsaved indicator */}
              {isDirty && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                  Unsaved
                </span>
              )}
            </div>
            
            {/* Company name if different */}
            {appointment.company_name && appointment.company_name !== appointment.customer_name && (
              <div className="text-sm text-gray-500 mt-0.5">
                {appointment.company_name}
              </div>
            )}
            
            {/* Phone - clickable */}
            {appointment.customer_phone && (
              <a 
                href={`tel:${appointment.customer_phone}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                <Phone size={14} />
                {formatPhone(appointment.customer_phone)}
              </a>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">
              {appointment.vehicle_description || 
               `${appointment.vehicle_year || ''} ${appointment.vehicle_make || ''} ${appointment.vehicle_model || ''}`.trim() ||
               'No vehicle'
              }
            </div>
            
            {appointment.vehicle_vin && (
              <div className="text-xs text-gray-400 font-mono mt-0.5">
                {appointment.vehicle_vin}
              </div>
            )}
            
            {/* Additional vehicle details */}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {appointment.vehicle_plate && (
                <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 font-medium text-xs">
                  {appointment.vehicle_plate}
                </span>
              )}
              {appointment.vehicle_mileage && (
                <span>{parseInt(appointment.vehicle_mileage).toLocaleString()} km</span>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
            RIGHT: WO# + Status + Close
        ───────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          
          {/* Work Order Info */}
          <div className="text-right">
            {appointment.workorder_number ? (
              <>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Work Order</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    #{appointment.workorder_number}
                  </span>
                  {/* Link to Protractor - future */}
                  {/* <button className="text-gray-400 hover:text-blue-600">
                    <ExternalLink size={14} />
                  </button> */}
                </div>
                {appointment.workorder_status && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {appointment.workorder_status}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No W/O assigned
              </div>
            )}
          </div>

          {/* Quick Status Pills */}
          <div className="flex flex-col gap-1">
            <StatusPill 
              active={appointment.vehicle_here} 
              label="Here" 
              activeColor="bg-green-100 text-green-700"
            />
            <StatusPill 
              active={appointment.workorder_created} 
              label="WO" 
              activeColor="bg-blue-100 text-blue-700"
            />
            <StatusPill 
              active={appointment.authorized} 
              label="Auth" 
              activeColor="bg-green-100 text-green-700"
            />
            <StatusPill 
              active={appointment.parts_arrived} 
              label="Parts" 
              activeColor="bg-green-100 text-green-700"
            />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
      </div>

      {/* ─────────────────────────────────────────
          SUB-HEADER: Assignment Info + Actions
      ───────────────────────────────────────── */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Left: Assignment Info */}
          <div className="flex items-center gap-6 text-sm">
            {/* Tech Assignment Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Tech:</span>
              <select
                value={appointment.tech_id || ''}
                onChange={(e) => onUpdate?.('tech_id', e.target.value || null)}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                style={{ 
                  backgroundColor: tech?.color ? `${tech.color}15` : 'white',
                  color: tech?.color || '#374151'
                }}
              >
                <option value="">Unassigned</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
        
        {/* Date */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Date:</span>
          <span className="font-medium">
            {appointment.scheduled_date 
              ? new Date(appointment.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'Not scheduled'
            }
          </span>
        </div>
        
        {/* Time Slot */}
        {appointment.time_slot && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Slot:</span>
            <span className="font-medium capitalize">{appointment.time_slot}</span>
          </div>
        )}
        
        {/* Hours */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Hours:</span>
          <span className="font-medium">{appointment.estimated_hours || 0}h</span>
        </div>

            {/* Total */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Est:</span>
              <span className="font-medium">
                ${(appointment.estimated_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Mark Arrived */}
            <button
              onClick={() => onStatusChange?.(appointment.id, { 
                vehicle_here: !appointment.vehicle_here,
                arrived_at: !appointment.vehicle_here ? new Date().toISOString() : null
              })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                appointment.vehicle_here
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <Car size={14} />
              {appointment.vehicle_here ? 'Arrived' : 'Mark Arrived'}
            </button>

            {/* Put on Hold */}
            <button
              onClick={() => onStatusChange?.(appointment.id, { 
                is_on_hold: !appointment.is_on_hold,
                hold_at: !appointment.is_on_hold ? new Date().toISOString() : null
              })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                appointment.is_on_hold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Pause size={14} />
              {appointment.is_on_hold ? 'On Hold' : 'Hold'}
            </button>

            {/* Mark Complete */}
            <button
              onClick={() => onStatusChange?.(appointment.id, { 
                status: 'completed',
                completed_at: new Date().toISOString()
              })}
              disabled={appointment.status === 'completed'}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                appointment.status === 'completed'
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <CheckCircle size={14} />
              {appointment.status === 'completed' ? 'Complete' : 'Complete'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────
// STATUS PILL COMPONENT
// ─────────────────────────────────────────
function StatusPill({ active, label, activeColor }) {
  return (
    <div 
      className={`
        px-2 py-0.5 rounded text-xs font-medium text-center min-w-[50px]
        ${active ? activeColor : 'bg-gray-100 text-gray-400'}
      `}
    >
      {label}
    </div>
  );
}
