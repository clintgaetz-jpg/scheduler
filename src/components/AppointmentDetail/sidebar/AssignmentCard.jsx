import React from 'react';
import { User, Calendar, Clock, Timer } from 'lucide-react';

// ============================================
// ASSIGNMENT CARD
// Tech, Date, Time Slot, Hours
// ============================================

export default function AssignmentCard({ appointment, technicians, onUpdate }) {
  
  const currentTech = technicians?.find(t => t.id === appointment.tech_id);

  // Format date for input
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // Handle both ISO and YYYY-MM-DD formats
    return dateStr.split('T')[0];
  };

  return (
    <div className="space-y-3">
      
      {/* Section Header */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Calendar size={12} />
        Assignment
      </h3>
      
      {/* Technician Dropdown */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Technician</label>
        <select
          value={appointment.tech_id || ''}
          onChange={(e) => onUpdate('tech_id', e.target.value || null)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Unassigned</option>
          {technicians?.filter(t => t.is_active).map(tech => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
        
        {/* Tech color indicator */}
        {currentTech && (
          <div 
            className="h-1 rounded-full mt-1"
            style={{ backgroundColor: currentTech.color || '#9ca3af' }}
          />
        )}
      </div>
      
      {/* Date Picker */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Date</label>
        <input
          type="date"
          value={formatDateForInput(appointment.scheduled_date)}
          onChange={(e) => onUpdate('scheduled_date', e.target.value || null)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      
      {/* Time Slot */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Time Slot</label>
        <select
          value={appointment.time_slot || ''}
          onChange={(e) => onUpdate('time_slot', e.target.value || null)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Any time</option>
          <option value="morning">Morning (AM)</option>
          <option value="afternoon">Afternoon (PM)</option>
          <option value="waiter">Waiter</option>
          <option value="dropoff">Drop-off</option>
        </select>
      </div>
      
      {/* Specific Time (optional) */}
      {appointment.scheduled_time && (
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Scheduled Time</label>
          <input
            type="time"
            value={appointment.scheduled_time || ''}
            onChange={(e) => onUpdate('scheduled_time', e.target.value || null)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      )}
      
      {/* Hours */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Estimated Hours</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            min="0"
            value={appointment.estimated_hours || ''}
            onChange={(e) => onUpdate('estimated_hours', parseFloat(e.target.value) || 0)}
            className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <span className="text-sm text-gray-500">hours</span>
        </div>
      </div>
      
      {/* Quick Info Row */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
        {appointment.customer_waiting && (
          <span className="flex items-center gap-1 text-amber-600">
            <Clock size={12} />
            Waiter
          </span>
        )}
        {appointment.needs_loaner && (
          <span className="flex items-center gap-1 text-blue-600">
            🚗 Loaner
          </span>
        )}
        {appointment.ride_requested && (
          <span className="flex items-center gap-1 text-purple-600">
            🚐 Ride
          </span>
        )}
      </div>
      
    </div>
  );
}
