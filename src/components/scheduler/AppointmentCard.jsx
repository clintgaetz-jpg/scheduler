import React, { useMemo } from 'react';
import { Clock, Wrench, AlertCircle } from 'lucide-react';

// ============================================
// CONFIGURABLE STATUS COLORS
// These can be customized per shop preference
// ============================================
export const CARD_STATUS_COLORS = {
  scheduled: {
    name: 'Scheduled',
    bg: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-700',
    description: 'Booked, vehicle not here yet'
  },
  on_site: {
    name: 'On Site',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    description: 'Vehicle has arrived'
  },
  in_progress: {
    name: 'In Progress',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    description: 'Being worked on'
  },
  done: {
    name: 'Done',
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800',
    description: 'All work complete'
  },
  on_hold: {
    name: 'On Hold',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    description: 'Waiting for something'
  }
};

// ============================================
// SERVICE TYPE COLORS (for left border)
// ============================================
export const SERVICE_TYPE_COLORS = {
  oil: { color: '#d97706', name: 'Oil Change' },
  diag: { color: '#ea580c', name: 'Diagnostics' },
  brakes: { color: '#dc2626', name: 'Brakes' },
  tires: { color: '#6366f1', name: 'Tires' },
  alignment: { color: '#7c3aed', name: 'Alignment' },
  inspection: { color: '#16a34a', name: 'Inspection' },
  ac: { color: '#0284c7', name: 'A/C' },
  maintenance: { color: '#0891b2', name: 'Maintenance' },
  electrical: { color: '#eab308', name: 'Electrical' },
  suspension: { color: '#84cc16', name: 'Suspension' },
  engine: { color: '#78716c', name: 'Engine' },
  transmission: { color: '#a855f7', name: 'Transmission' },
  general: { color: '#6b7280', name: 'General' }
};

// ============================================
// MINI LED COMPONENT
// Clean, subtle status indicators
// ============================================
function MiniLED({ status, label, pulse = false }) {
  const colors = {
    off: 'bg-gray-300',
    green: 'bg-emerald-500 shadow-emerald-500/50',
    yellow: 'bg-amber-400 shadow-amber-400/50',
    red: 'bg-red-500 shadow-red-500/50',
    blue: 'bg-blue-500 shadow-blue-500/50'
  };

  return (
    <div className="flex items-center gap-1" title={label}>
      <div 
        className={`
          w-2 h-2 rounded-full 
          ${colors[status] || colors.off}
          ${status !== 'off' ? 'shadow-sm' : ''}
          ${pulse ? 'animate-pulse' : ''}
        `}
      />
    </div>
  );
}

// ============================================
// LED STATUS STRIP
// Compact row of status LEDs for card
// ============================================
function LEDStatusStrip({ appointment }) {
  const getWOStatus = () => {
    if (appointment.authorized) return 'green';
    if (appointment.workorder_created) return 'yellow';
    return 'off';
  };

  const getPartsStatus = () => {
    const ps = appointment.parts_status;
    if (ps === 'arrived') return 'green';
    if (ps === 'partial') return 'yellow';
    if (ps === 'ordered') return 'yellow';
    if (ps === 'needed') return 'red';
    return 'off';
  };

  const getVehicleStatus = () => {
    if (appointment.vehicle_here) return 'green';
    return 'off';
  };

  const getDeferredStatus = () => {
    if (appointment.deferred_reviewed) return 'green';
    if (appointment.has_deferred) return 'yellow';
    return 'off';
  };

  return (
    <div className="flex items-center gap-1.5">
      <MiniLED status={getWOStatus()} label={appointment.authorized ? 'Authorized' : appointment.workorder_created ? 'WO Created' : 'No WO'} />
      <MiniLED status={getVehicleStatus()} label={appointment.vehicle_here ? 'Vehicle Here' : 'Not Here'} />
      <MiniLED status={getPartsStatus()} label={`Parts: ${appointment.parts_status || 'none'}`} pulse={appointment.parts_status === 'needed'} />
      <MiniLED status={getDeferredStatus()} label={appointment.deferred_reviewed ? 'Deferred Reviewed' : 'Deferred Not Reviewed'} />
    </div>
  );
}

// ============================================
// APPOINTMENT CARD COMPONENT
// ============================================
export function AppointmentCard({ 
  appointment, 
  onEdit, 
  onDragStart, 
  onDragEnd,
  isAppointmentMode = true, // false = Job mode (Protractor data)
  compact = false 
}) {
  // Determine card status for background color
  const getCardStatus = () => {
    if (appointment.status === 'completed' || appointment.all_lines_done) return 'done';
    if (appointment.is_on_hold) return 'on_hold';
    if (appointment.in_progress) return 'in_progress';
    if (appointment.vehicle_here) return 'on_site';
    return 'scheduled';
  };

  const cardStatus = getCardStatus();
  const statusStyle = CARD_STATUS_COLORS[cardStatus];
  
  // Get service type color for left border
  const serviceType = appointment.job_type || appointment.primary_service_type || 'general';
  const typeColor = SERVICE_TYPE_COLORS[serviceType]?.color || SERVICE_TYPE_COLORS.general.color;

  // Format hours display
  const hours = parseFloat(appointment.estimated_hours) || 0;
  const hoursDisplay = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);

  return (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(appointment));
        onDragStart?.(appointment);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onEdit?.(appointment)}
      className={`
        relative rounded-lg border-l-4 cursor-pointer 
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${statusStyle.bg} ${statusStyle.border} border
        ${isAppointmentMode ? 'border-dashed' : 'border-solid'}
      `}
      style={{ borderLeftColor: typeColor }}
    >
      {/* Main Content */}
      <div className="p-2.5">
        {/* Top Row: Customer + Hours */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm truncate ${statusStyle.text}`}>
              {appointment.customer_name || 'Unknown Customer'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {appointment.vehicle_description || 'No vehicle'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`
              text-xs font-bold px-1.5 py-0.5 rounded
              ${cardStatus === 'done' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'}
            `}>
              {hoursDisplay}h
            </span>
          </div>
        </div>

        {/* Services Preview */}
        {!compact && appointment.services?.length > 0 && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-1">
            {appointment.services.slice(0, 2).map(s => s.name || s.title).join(', ')}
            {appointment.services.length > 2 && ` +${appointment.services.length - 2}`}
          </div>
        )}

        {/* Bottom Row: LEDs + Mode Indicator */}
        <div className="flex items-center justify-between">
          <LEDStatusStrip appointment={appointment} />
          
          {/* Mode indicator */}
          <div className="flex items-center gap-1">
            {appointment.workorder_number && (
              <span className="text-[10px] text-gray-400 font-mono">
                #{appointment.workorder_number}
              </span>
            )}
            {!isAppointmentMode && (
              <Wrench size={10} className="text-blue-500" title="Job Mode - Protractor Data" />
            )}
          </div>
        </div>

        {/* Hold Reason Badge */}
        {appointment.is_on_hold && appointment.hold_reason && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
            <Clock size={10} />
            <span className="truncate">{appointment.hold_reason}</span>
          </div>
        )}
      </div>

      {/* Done Overlay */}
      {cardStatus === 'done' && (
        <div className="absolute inset-0 bg-green-500/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

export default AppointmentCard;
