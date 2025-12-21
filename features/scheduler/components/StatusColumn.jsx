/**
 * StatusColumn
 * 
 * The right-side column showing appointments on hold.
 * Supports drag & drop - drag in to put on hold, drag out to schedule.
 */

import React, { useState } from 'react';
import { Clock, GripVertical } from 'lucide-react';
import { HOLD_REASONS } from '../../../utils/constants';
import { formatHours, formatDateShort } from '../../../utils/formatters';

// ============================================
// HOLD ITEM CARD
// ============================================

function HoldItemCard({ 
  appointment, 
  onClick, 
  onDragStart, 
  onDragEnd 
}) {
  const reasonKey = appointment.hold_reason?.toLowerCase() || 'other';
  const reasonStyle = HOLD_REASONS[reasonKey] || HOLD_REASONS.other;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify(appointment));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(appointment);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(appointment)}
      className={`
        p-2.5 rounded-lg border cursor-pointer transition-all
        hover:shadow-md hover:-translate-y-0.5
        ${reasonStyle.bg} ${reasonStyle.border}
      `}
    >
      {/* Drag Handle + Customer */}
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {appointment.customer_name}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {appointment.vehicle_description}
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white/50 px-1.5 py-0.5 rounded">
          {formatHours(appointment.estimated_hours)}
        </span>
      </div>

      {/* Hold Reason */}
      {appointment.hold_reason && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs ${reasonStyle.text}`}>
          <span>{reasonStyle.icon}</span>
          <span className="truncate">{appointment.hold_reason}</span>
        </div>
      )}

      {/* Original Date (if different) */}
      {appointment.original_scheduled_date && (
        <div className="mt-1 text-[10px] text-gray-400">
          Was: {formatDateShort(appointment.original_scheduled_date)}
          {appointment.original_tech_name && ` • ${appointment.original_tech_name}`}
        </div>
      )}

      {/* Services on hold count */}
      {appointment.services?.filter(s => s.status === 'hold').length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {appointment.services.filter(s => s.status === 'hold').length} service(s) waiting
        </div>
      )}
    </div>
  );
}

// ============================================
// STATUS COLUMN COMPONENT
// ============================================

export function StatusColumn({ 
  appointments = [],
  onAppointmentClick,
  onDragStart,
  onDragEnd,
  onDropToHold,
  className = ''
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter to only on-hold appointments
  const holdAppointments = appointments.filter(a => 
    a.is_on_hold && 
    a.status !== 'cancelled' && 
    a.status !== 'deleted'
  );

  // Sort by priority then date
  const sortedHold = [...holdAppointments].sort((a, b) => {
    if (a.hold_priority !== b.hold_priority) {
      return (b.hold_priority || 0) - (a.hold_priority || 0);
    }
    return new Date(b.hold_at || b.created_at) - new Date(a.hold_at || a.created_at);
  });

  // Drag handlers for dropping INTO hold
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.id) {
        onDropToHold?.(data);
      }
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  };

  return (
    <div 
      className={`
        h-full flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden
        transition-colors duration-200
        ${isDragOver ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200'}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          <span className="font-semibold text-gray-700">On Hold</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            {sortedHold.length}
          </span>
        </div>
      </div>

      {/* Hold Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedHold.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No items on hold</p>
            <p className="text-xs text-gray-300 mt-1">Drag appointments here</p>
          </div>
        ) : (
          sortedHold.map(appt => (
            <HoldItemCard
              key={appt.id}
              appointment={appt}
              onClick={onAppointmentClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-amber-100/50 border-2 border-dashed border-amber-400 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-amber-700 font-medium">Drop to put on Hold</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusColumn;
