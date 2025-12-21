import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

// ============================================
// STATUS COLUMN - Right side of scheduler
// Shows On Hold appointments only
// Finished appointments stay on calendar with green color
// ============================================

export function StatusColumn({ 
  appointments = [], 
  selectedDate,
  onSelectAppointment,
  onDragStart,
  onDragEnd,
  onDropToCalendar // Called when dragging from hold back to calendar
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter to only on-hold appointments
  const onHoldAppts = appointments.filter(a => 
    a.is_on_hold && 
    a.status !== 'cancelled' && 
    a.status !== 'deleted'
  );

  // Sort by priority/date
  const sortedHold = [...onHoldAppts].sort((a, b) => {
    // Priority first (if exists)
    if (a.hold_priority !== b.hold_priority) {
      return (b.hold_priority || 0) - (a.hold_priority || 0);
    }
    // Then by date added to hold
    return new Date(b.hold_at || b.created_at) - new Date(a.hold_at || a.created_at);
  });

  // Handle drop INTO hold column
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    // This would trigger the hold modal to ask which lines to put on hold
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.id) {
        // Signal that something was dropped into hold
        // Parent component should show the split/hold modal
        onDropToCalendar?.(data, 'hold');
      }
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  };

  // Hold reason colors
  const holdReasonColors = {
    parts: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '📦' },
    auth: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '💰' },
    customer: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '👤' },
    scheduling: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '📅' },
    other: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '⏸️' }
  };

  const getReasonStyle = (reason) => {
    const key = reason?.toLowerCase() || 'other';
    return holdReasonColors[key] || holdReasonColors.other;
  };

  return (
    <div 
      className={`
        h-full flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden
        transition-colors duration-200
        ${isDragOver ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          <span className="font-semibold text-gray-700">On Hold</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            {sortedHold.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Hold Items */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedHold.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No items on hold</p>
              <p className="text-xs text-gray-300 mt-1">Drag appointments here</p>
            </div>
          ) : (
            sortedHold.map(appt => {
              const reasonStyle = getReasonStyle(appt.hold_reason);
              return (
                <div
                  key={appt.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(appt));
                    onDragStart?.(appt);
                  }}
                  onDragEnd={() => onDragEnd?.()}
                  onClick={() => onSelectAppointment?.(appt)}
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
                        {appt.customer_name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {appt.vehicle_description}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white/50 px-1.5 py-0.5 rounded">
                      {appt.estimated_hours || '?'}h
                    </span>
                  </div>

                  {/* Hold Reason */}
                  {appt.hold_reason && (
                    <div className={`mt-2 flex items-center gap-1.5 text-xs ${reasonStyle.text}`}>
                      <span>{reasonStyle.icon}</span>
                      <span className="truncate">{appt.hold_reason}</span>
                    </div>
                  )}

                  {/* Original Date (if different from today) */}
                  {appt.original_scheduled_date && appt.original_scheduled_date !== selectedDate && (
                    <div className="mt-1 text-[10px] text-gray-400">
                      Originally: {new Date(appt.original_scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}

                  {/* Services on hold */}
                  {appt.services?.filter(s => s.status === 'hold').length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {appt.services.filter(s => s.status === 'hold').length} service(s) waiting
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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
