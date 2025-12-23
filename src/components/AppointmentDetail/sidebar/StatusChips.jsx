import React from 'react';
import { Car, FileText, CheckCircle, Package, Clock, AlertTriangle } from 'lucide-react';

// ============================================
// STATUS CHIPS
// Clean visual indicators for job status
// Replaces the LED indicators
// ============================================

export default function StatusChips({ appointment }) {
  
  // Determine parts status
  const getPartsStatus = () => {
    if (!appointment.parts_needed && !appointment.parts_ordered) {
      return { status: 'none', label: 'No parts needed', color: 'gray' };
    }
    if (appointment.parts_arrived) {
      return { status: 'arrived', label: 'Parts here', color: 'green' };
    }
    if (appointment.parts_ordered) {
      return { status: 'ordered', label: 'Parts ordered', color: 'amber' };
    }
    if (appointment.parts_needed) {
      return { status: 'needed', label: 'Parts needed', color: 'red' };
    }
    return { status: 'none', label: 'No parts', color: 'gray' };
  };

  const partsInfo = getPartsStatus();

  // Count invoices
  const invoiceCount = appointment.supplier_invoices?.length || 0;

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Status
      </h3>
      
      {/* Status List */}
      <div className="space-y-2">
        
        {/* Vehicle Here */}
        <StatusRow
          icon={Car}
          label="Vehicle"
          active={appointment.vehicle_here}
          activeText="Here"
          inactiveText="Not here"
          activeColor="green"
        />
        
        {/* Work Order Created */}
        <StatusRow
          icon={FileText}
          label="Work Order"
          active={appointment.workorder_created || !!appointment.workorder_number}
          activeText={appointment.workorder_number ? `#${appointment.workorder_number}` : 'Created'}
          inactiveText="Not created"
          activeColor="blue"
        />
        
        {/* Authorized */}
        <StatusRow
          icon={CheckCircle}
          label="Authorized"
          active={appointment.authorized}
          activeText={appointment.authorized_amount 
            ? `$${appointment.authorized_amount.toLocaleString()}` 
            : 'Yes'
          }
          inactiveText="Pending"
          activeColor="green"
        />
        
        {/* Parts Status */}
        <StatusRow
          icon={Package}
          label="Parts"
          active={partsInfo.status !== 'none'}
          activeText={partsInfo.label}
          inactiveText="No parts"
          activeColor={partsInfo.color}
          isWarning={partsInfo.status === 'needed'}
        />
        
        {/* On Hold */}
        {appointment.is_on_hold && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle size={16} className="text-amber-600" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-amber-800">On Hold</div>
              {appointment.hold_reason && (
                <div className="text-xs text-amber-600 truncate">
                  {appointment.hold_reason}
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
      
      {/* Timestamps */}
      <div className="pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-400">
        {appointment.arrived_at && (
          <div className="flex items-center gap-2">
            <Clock size={10} />
            <span>Arrived: {formatTime(appointment.arrived_at)}</span>
          </div>
        )}
        {appointment.authorized_at && (
          <div className="flex items-center gap-2">
            <Clock size={10} />
            <span>Authorized: {formatTime(appointment.authorized_at)}</span>
          </div>
        )}
        {appointment.parts_arrived_at && (
          <div className="flex items-center gap-2">
            <Clock size={10} />
            <span>Parts arrived: {formatTime(appointment.parts_arrived_at)}</span>
          </div>
        )}
      </div>
      
    </div>
  );
}

// ─────────────────────────────────────────
// STATUS ROW COMPONENT
// ─────────────────────────────────────────
function StatusRow({ icon: Icon, label, active, activeText, inactiveText, activeColor, isWarning }) {
  
  const colors = {
    green: {
      dot: 'bg-green-500',
      text: 'text-green-700',
      bg: 'bg-green-50',
    },
    blue: {
      dot: 'bg-blue-500',
      text: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    amber: {
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50',
    },
    gray: {
      dot: 'bg-gray-300',
      text: 'text-gray-500',
      bg: 'bg-gray-50',
    },
  };

  const color = active ? colors[activeColor] || colors.green : colors.gray;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${active ? color.bg : ''}`}>
      {/* Status Dot */}
      <div className={`w-2 h-2 rounded-full ${color.dot}`} />
      
      {/* Icon */}
      <Icon size={14} className={active ? color.text : 'text-gray-400'} />
      
      {/* Label & Value */}
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-medium ${active ? color.text : 'text-gray-400'}`}>
          {active ? activeText : inactiveText}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// HELPER: Format timestamp
// ─────────────────────────────────────────
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
