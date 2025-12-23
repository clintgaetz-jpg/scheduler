import React, { useState } from 'react';
import { 
  Plus, Wrench, Clock, DollarSign, ChevronDown, ChevronUp,
  CheckCircle, Pause, AlertCircle, Package, ToggleLeft, ToggleRight
} from 'lucide-react';
import ServiceLine from './ServiceLine';

// ============================================
// SERVICE LINES
// Main content area - displays all service lines
// Supports switching between Appointment and WO lines
// ============================================

export default function ServiceLines({ 
  appointment, 
  servicePackages, 
  onUpdateLine,
  onAddService 
}) {
  const [useWOLines, setUseWOLines] = useState(appointment.is_job_mode || false);
  const [expandedLines, setExpandedLines] = useState(new Set());

  // Get the appropriate lines based on source
  const appointmentLines = appointment.services || [];
  const woLines = appointment.protractor_lines || [];
  
  const activeLines = useWOLines ? woLines : appointmentLines;
  const hasWOLines = woLines.length > 0;
  const hasAppointmentLines = appointmentLines.length > 0;

  // Calculate totals
  const totals = activeLines.reduce((acc, line) => {
    // Handle different structures between appointment lines and WO lines
    const hours = parseFloat(line.hours || line.labor?.tech_hours || 0);
    const total = parseFloat(line.total || line.package_total || 0);
    const status = line.status || (line.labor?.completed ? 'done' : 'pending');
    
    acc.hours += hours;
    acc.total += total;
    if (status === 'done') acc.doneCount++;
    if (status === 'hold') acc.holdCount++;
    acc.lineCount++;
    return acc;
  }, { hours: 0, total: 0, doneCount: 0, holdCount: 0, lineCount: 0 });

  // Toggle line expansion
  const toggleExpand = (lineId) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      
      {/* ─────────────────────────────────────────
          HEADER: Source Toggle + Add Button
      ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        
        {/* Line Source Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Service Lines</span>
          
          {hasWOLines && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUseWOLines(false)}
                className={`
                  px-3 py-1 rounded-md text-xs font-medium transition-all
                  ${!useWOLines 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                Appointment
              </button>
              <button
                onClick={() => setUseWOLines(true)}
                className={`
                  px-3 py-1 rounded-md text-xs font-medium transition-all
                  ${useWOLines 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                Work Order
                {/* New lines indicator */}
                {appointment.protractor_synced_at && 
                 (!appointment.wo_lines_reviewed_at || 
                  new Date(appointment.protractor_synced_at) > new Date(appointment.wo_lines_reviewed_at)) && (
                  <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Add Service Button */}
        <button
          onClick={onAddService}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Service
        </button>
        
      </div>

      {/* Source indicator */}
      {useWOLines && (
        <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg">
          📋 Showing lines from Protractor Work Order #{appointment.workorder_number}
        </div>
      )}

      {/* ─────────────────────────────────────────
          SERVICE LINES LIST
      ───────────────────────────────────────── */}
      <div className="space-y-2">
        {activeLines.length === 0 ? (
          <EmptyState 
            useWOLines={useWOLines} 
            hasWO={!!appointment.workorder_number}
            onAddService={onAddService}
          />
        ) : (
          activeLines.map((line, index) => (
            <ServiceLine
              key={line.id || line.package_id || index}
              line={line}
              index={index}
              isWOLine={useWOLines}
              isExpanded={expandedLines.has(line.id || line.package_id || index)}
              onToggleExpand={() => toggleExpand(line.id || line.package_id || index)}
              onUpdate={(updates) => onUpdateLine(index, updates)}
              servicePackages={servicePackages}
            />
          ))
        )}
      </div>

      {/* ─────────────────────────────────────────
          TOTALS ROW
      ───────────────────────────────────────── */}
      {activeLines.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          
          {/* Line Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {totals.lineCount} service{totals.lineCount !== 1 ? 's' : ''}
            </span>
            {totals.doneCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} />
                {totals.doneCount} done
              </span>
            )}
            {totals.holdCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Pause size={14} />
                {totals.holdCount} on hold
              </span>
            )}
          </div>
          
          {/* Totals */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock size={16} />
              <span className="font-medium">{totals.hours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-900">
              <DollarSign size={16} />
              <span className="font-bold text-lg">
                {totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────
function EmptyState({ useWOLines, hasWO, onAddService }) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <Wrench size={40} className="mx-auto mb-3 text-gray-300" />
      
      {useWOLines ? (
        <>
          <h4 className="font-medium text-gray-700 mb-1">No Work Order Lines</h4>
          <p className="text-sm text-gray-500 mb-4">
            {hasWO 
              ? 'Work order data will sync when packages are added in Protractor'
              : 'Assign a work order number to see Protractor lines'
            }
          </p>
        </>
      ) : (
        <>
          <h4 className="font-medium text-gray-700 mb-1">No Services Scheduled</h4>
          <p className="text-sm text-gray-500 mb-4">
            Add services to build the estimate
          </p>
          <button
            onClick={onAddService}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Service
          </button>
        </>
      )}
    </div>
  );
}
