/**
 * TechColumn
 * 
 * A single technician's column on the scheduler.
 * Shows their name, capacity bar, and appointments.
 * 
 * Supports drag & drop - appointments can be dropped here.
 */

import React, { useState } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { formatHours } from '../../../utils/formatters';

// ============================================
// TECH COLUMN COMPONENT
// ============================================

export function TechColumn({ 
  tech,
  date,
  appointments = [],
  hoursBooked = 0,
  hoursTotal = 8,
  onAppointmentClick,
  onDragStart,
  onDragEnd,
  onDrop,
  isDropTarget = false,
  className = ''
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Calculate utilization
  const hoursAvailable = hoursTotal - hoursBooked;
  const utilizationPct = hoursTotal > 0 ? (hoursBooked / hoursTotal) * 100 : 0;
  
  // Utilization color
  const getUtilizationColor = () => {
    if (utilizationPct > 100) return 'bg-red-500';
    if (utilizationPct > 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Availability badge color
  const getAvailabilityClass = () => {
    if (hoursAvailable < 0) return 'bg-red-100 text-red-700';
    if (hoursAvailable < 2) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  // Drag handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set false if actually leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop?.(data, tech.id, date);
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  };

  return (
    <div 
      className={`
        flex-1 min-w-[220px] max-w-[320px] 
        bg-white rounded-lg shadow-sm border 
        transition-all duration-200 flex flex-col
        ${isDragOver ? 'border-blue-400 bg-blue-50/50 shadow-md' : 'border-gray-200'}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div 
        className="p-3 border-b border-gray-200 rounded-t-lg flex-shrink-0"
        style={{ backgroundColor: tech.color ? `${tech.color}15` : '#f9fafb' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">{tech.name}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${getAvailabilityClass()}`}>
            {hoursBooked.toFixed(1)} / {hoursTotal}h
          </span>
        </div>
        
        {/* Capacity Bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getUtilizationColor()} transition-all duration-300`} 
            style={{ width: `${Math.min(utilizationPct, 100)}%` }} 
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {appointments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No appointments
          </p>
        ) : (
          appointments.map(appt => (
            <AppointmentCard 
              key={appt.id}
              appointment={appt}
              onClick={onAppointmentClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>

      {/* Drop Indicator */}
      {isDragOver && (
        <div className="p-2 border-t border-blue-200">
          <div className="h-16 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50/50">
            <span className="text-blue-500 text-sm font-medium">Drop here</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TechColumn;
