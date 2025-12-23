import React, { useState, useEffect } from 'react';
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
  technicians = [],
  onUpdateLine,
  onUpdateWOLine,
  onAddService,
  onPreferenceChange,
  relatedAppointments = [], // For showing which lines are on child cards
  onManageCards // Callback to open card management
}) {
  // Reset toggle state when appointment changes
  const [useWOLines, setUseWOLines] = useState(() => {
    // Check for saved preference first
    if (appointment?.prefer_wo_lines !== undefined) {
      return appointment.prefer_wo_lines;
    }
    // Default to WO lines if they exist, otherwise appointment lines
    const hasWOLines = (appointment?.protractor_lines || []).length > 0;
    return hasWOLines && (appointment?.is_job_mode || false);
  });
  const [expandedLines, setExpandedLines] = useState(new Set());
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  
  // Reset state when appointment changes
  useEffect(() => {
    // Check for saved preference first
    if (appointment?.prefer_wo_lines !== undefined) {
      setUseWOLines(appointment.prefer_wo_lines);
    } else {
      const hasWOLines = (appointment?.protractor_lines || []).length > 0;
      setUseWOLines(hasWOLines && (appointment?.is_job_mode || false));
    }
    setExpandedLines(new Set());
  }, [appointment?.id, appointment?.prefer_wo_lines]);
  
  // Handle switching line sources with confirmation
  const handleSwitchRequest = (toWOLines) => {
    if (toWOLines === useWOLines) return;
    
    // Check if there are unsaved changes (simplified - could check isDirty)
    const hasAppointmentLines = (appointment?.services || []).length > 0;
    const hasWOLines = (appointment?.protractor_lines || []).length > 0;
    
    if (hasAppointmentLines && hasWOLines) {
      // Show confirmation
      setPendingSwitch(toWOLines);
      setShowSwitchConfirm(true);
    } else {
      // No conflict, switch immediately
      setUseWOLines(toWOLines);
      // Save preference to appointment
      if (onPreferenceChange) {
        onPreferenceChange('prefer_wo_lines', toWOLines);
      }
    }
  };
  
  const confirmSwitch = () => {
    const newValue = pendingSwitch;
    setUseWOLines(newValue);
    setShowSwitchConfirm(false);
    setPendingSwitch(null);
    // Save preference to appointment
    if (onPreferenceChange) {
      onPreferenceChange('prefer_wo_lines', newValue);
    }
  };
  
  const cancelSwitch = () => {
    setShowSwitchConfirm(false);
    setPendingSwitch(null);
  };

  // Get the appropriate lines based on source
  const appointmentLines = appointment?.services || [];
  const woLines = appointment?.protractor_lines || [];
  
  // Check if viewing parent or child card
  const isParent = appointment && !appointment.parent_id;
  const isChild = appointment && appointment.parent_id;
  
  // Get child cards only if viewing parent
  const childCards = isParent ? (relatedAppointments || []).filter(a => a && a.parent_id === appointment.id) : [];
  
  // Current card's lines - these should be ONLY the lines that belong to THIS card
  // The split logic now properly removes lines from parent and adds them to child
  const currentCardLines = useWOLines ? woLines : appointmentLines;
  
  // Organize lines into sections
  let parentNotDoneLines, childCardSections, allCompletedLines;
  
  if (isChild) {
    // ═══════════════════════════════════════════════════════════════
    // CHILD CARD: Simple view - just show all lines assigned to this child
    // ═══════════════════════════════════════════════════════════════
    parentNotDoneLines = currentCardLines;
    childCardSections = [];
    allCompletedLines = [];
  } else {
    // ═══════════════════════════════════════════════════════════════
    // PARENT CARD: Show parent's own lines + child card sections
    // ═══════════════════════════════════════════════════════════════
    
    // Parent's not-done lines (these are only lines that belong to parent)
    parentNotDoneLines = currentCardLines.filter(line => {
      const status = line.status || (line.labor?.completed ? 'done' : 'pending');
      return status !== 'done';
    });
    
    // Child card sections - show lines from each child under a header
    childCardSections = childCards.map(child => {
      const childLinesArray = useWOLines ? (child.protractor_lines || []) : (child.services || []);
      return {
        child,
        lines: childLinesArray.map(line => ({
          ...line,
          _onChildCard: {
            id: child.id,
            splitLetter: child.split_letter,
            techId: child.tech_id,
            techName: technicians.find(t => t.id === child.tech_id)?.name || 'Unassigned',
            date: child.scheduled_date,
            workorderNumber: child.workorder_number
          }
        }))
      };
    }).filter(section => section.lines.length > 0);
    
    // Parent's completed lines
    allCompletedLines = currentCardLines.filter(line => {
      const status = line.status || (line.labor?.completed ? 'done' : 'pending');
      return status === 'done';
    });
  }
  
  const hasWOLines = Array.isArray(woLines) && woLines.length > 0;
  const hasAppointmentLines = Array.isArray(appointmentLines) && appointmentLines.length > 0;

  // Calculate totals from all lines (parent + children)
  const allLinesForTotals = [
    ...parentNotDoneLines,
    ...childCardSections.flatMap(s => s.lines),
    ...allCompletedLines
  ];
  
  const totals = allLinesForTotals.reduce((acc, line) => {
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

  // Calculate completion percentage
  const completionPercent = totals.lineCount > 0 
    ? Math.round((totals.doneCount / totals.lineCount) * 100) 
    : 0;
  
  // Check if all lines are done
  const allLinesDone = totals.lineCount > 0 && totals.doneCount === totals.lineCount;

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
          
          {/* Always show toggle - it will be disabled if no WO lines */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleSwitchRequest(false)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
                  ${!useWOLines 
                    ? 'bg-white text-gray-900 shadow-sm font-semibold' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span>Appointment</span>
                {hasAppointmentLines && (
                  <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-semibold">
                    {appointmentLines.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => hasWOLines ? handleSwitchRequest(true) : null}
                disabled={!hasWOLines}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
                  ${useWOLines 
                    ? 'bg-white text-gray-900 shadow-sm font-semibold' 
                    : hasWOLines
                    ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <span>Work Order</span>
                {hasWOLines && (
                  <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-semibold">
                    {woLines.length}
                  </span>
                )}
                {/* New lines indicator */}
                {appointment?.protractor_synced_at && 
                 (!appointment?.wo_lines_reviewed_at || 
                  new Date(appointment.protractor_synced_at) > new Date(appointment.wo_lines_reviewed_at)) && (
                  <span className="ml-0.5 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" title="New lines synced from Protractor" />
                )}
              </button>
            </div>
        </div>
        
        {/* Add Service Button - only show for appointment lines */}
        {!useWOLines && (
          <button
            onClick={onAddService}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Service
          </button>
        )}
        
      </div>

      {/* Source indicator */}
      {useWOLines ? (
        <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex items-center gap-2">
          <span>📋</span>
          <span>
            Showing lines from Protractor Work Order <strong>#{appointment.workorder_number}</strong>
            {appointment.protractor_synced_at && (
              <span className="text-gray-500 ml-2">
                (Synced: {new Date(appointment.protractor_synced_at).toLocaleDateString()})
              </span>
            )}
          </span>
        </div>
      ) : (
        hasAppointmentLines && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
            Showing appointment service lines (created during booking)
          </div>
        )
      )}

      {/* ─────────────────────────────────────────
          SERVICE LINES LIST - ORGANIZED BY SECTION
      ───────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Show empty state only if no lines at all */}
        {parentNotDoneLines.length === 0 && childCardSections.length === 0 && allCompletedLines.length === 0 ? (
          <EmptyState 
            useWOLines={useWOLines} 
            hasWO={!!appointment.workorder_number}
            onAddService={onAddService}
          />
        ) : (
          <>
            {/* Section 1: Parent Card - Not Done Lines */}
            {isParent && parentNotDoneLines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <span className="text-sm font-semibold text-blue-900">Parent Card</span>
                  <span className="text-xs text-blue-600">
                    ({technicians.find(t => t.id === appointment.tech_id)?.name || 'Unassigned'})
                  </span>
                </div>
                {parentNotDoneLines.map((line, index) => {
                  const lineIndex = currentCardLines.findIndex(l => 
                    (l.id && l.id === line.id) || 
                    (l.package_id && l.package_id === line.package_id) ||
                    (l === line)
                  );
                  return (
                    <ServiceLine
                      key={line.id || line.package_id || `parent-${index}`}
                      line={line}
                      index={lineIndex >= 0 ? lineIndex : index}
                      isWOLine={useWOLines}
                      isExpanded={expandedLines.has(line.id || line.package_id || `parent-${index}`)}
                      onToggleExpand={() => toggleExpand(line.id || line.package_id || `parent-${index}`)}
                      onUpdate={useWOLines ? (updates) => onUpdateWOLine(lineIndex >= 0 ? lineIndex : index, updates) : (updates) => onUpdateLine(lineIndex >= 0 ? lineIndex : index, updates)}
                      servicePackages={servicePackages}
                      technicians={technicians}
                      appointment={appointment}
                      relatedAppointments={relatedAppointments}
                      onManageCards={onManageCards}
                    />
                  );
                })}
              </div>
            )}

            {/* Child Card: Simple view - just show all assigned lines */}
            {isChild && parentNotDoneLines.length > 0 && (
              <div className="space-y-2">
                {parentNotDoneLines.map((line, index) => {
                  const lineIndex = currentCardLines.findIndex(l => 
                    (l.id && l.id === line.id) || 
                    (l.package_id && l.package_id === line.package_id) ||
                    (l === line)
                  );
                  return (
                    <ServiceLine
                      key={line.id || line.package_id || `child-${index}`}
                      line={line}
                      index={lineIndex >= 0 ? lineIndex : index}
                      isWOLine={useWOLines}
                      isExpanded={expandedLines.has(line.id || line.package_id || `child-${index}`)}
                      onToggleExpand={() => toggleExpand(line.id || line.package_id || `child-${index}`)}
                      onUpdate={useWOLines ? (updates) => onUpdateWOLine(lineIndex >= 0 ? lineIndex : index, updates) : (updates) => onUpdateLine(lineIndex >= 0 ? lineIndex : index, updates)} // Allow marking done
                      servicePackages={servicePackages}
                      technicians={technicians}
                      appointment={appointment}
                      relatedAppointments={relatedAppointments}
                      onManageCards={null} // No manage cards on child
                      isChildCard={true} // Flag to simplify UI
                    />
                  );
                })}
              </div>
            )}
            
            {isChild && parentNotDoneLines.length === 0 && (
              <div className="text-sm text-gray-500 py-4 text-center">
                No lines assigned to this card
              </div>
            )}

            {/* Section 2: Child Cards - Simple header with lines */}
            {childCardSections.map((section, sectionIdx) => {
              return (
                <div key={`child-${section.child.id}`} className="space-y-2">
                  <div className="px-2 py-1.5 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <span className="text-sm font-semibold text-purple-900">
                      On Child Card {section.child.split_letter || '?'} - {section.child.techName || 'Unassigned'}
                      {section.child.date && ` - ${new Date(section.child.date).toLocaleDateString()}`}
                    </span>
                  </div>
                  {/* All lines from this child (simple list) */}
                  {section.lines.map((line, lineIdx) => (
                    <ServiceLine
                      key={line.id || line.package_id || `child-${section.child.id}-${lineIdx}`}
                      line={line}
                      index={lineIdx}
                      isWOLine={useWOLines}
                      isExpanded={expandedLines.has(line.id || line.package_id || `child-${section.child.id}-${lineIdx}`)}
                      onToggleExpand={() => toggleExpand(line.id || line.package_id || `child-${section.child.id}-${lineIdx}`)}
                      onUpdate={null} // Child card lines are read-only from parent view
                      servicePackages={servicePackages}
                      technicians={technicians}
                      appointment={appointment}
                      relatedAppointments={relatedAppointments}
                      onManageCards={onManageCards}
                    />
                  ))}
                </div>
              );
            })}

            {/* Section 3: Completed Work (all cards) */}
            {allCompletedLines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-green-50 border-l-4 border-green-500 rounded">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-900">Completed Work</span>
                  <span className="text-xs text-green-600">({allCompletedLines.length} line{allCompletedLines.length !== 1 ? 's' : ''})</span>
                </div>
                {allCompletedLines.map((line, index) => {
                  const isFromChild = line._onChildCard;
                  const lineIndex = isFromChild ? -1 : currentCardLines.findIndex(l => 
                    (l.id && l.id === line.id) || 
                    (l.package_id && l.package_id === line.package_id) ||
                    (l === line)
                  );
                  return (
                    <ServiceLine
                      key={line.id || line.package_id || `completed-${index}`}
                      line={line}
                      index={lineIndex >= 0 ? lineIndex : index}
                      isWOLine={useWOLines}
                      isExpanded={expandedLines.has(line.id || line.package_id || `completed-${index}`)}
                      onToggleExpand={() => toggleExpand(line.id || line.package_id || `completed-${index}`)}
                      onUpdate={null} // Completed lines are read-only
                      servicePackages={servicePackages}
                      technicians={technicians}
                      appointment={appointment}
                      relatedAppointments={relatedAppointments}
                      onManageCards={onManageCards}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────
          TOTALS ROW
      ───────────────────────────────────────── */}
      {allLinesForTotals.length > 0 && (
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
            {/* Completion Status */}
            {allLinesDone && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                ALL COMPLETE
              </span>
            )}
            {!allLinesDone && totals.lineCount > 0 && (
              <span className="text-xs text-gray-500">
                {completionPercent}% complete
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

      {/* Switch Confirmation Dialog */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Switch Line Source?</h3>
            <p className="text-sm text-gray-600 mb-4">
              You're switching from <strong>{pendingSwitch ? 'Appointment' : 'Work Order'}</strong> lines to <strong>{pendingSwitch ? 'Work Order' : 'Appointment'}</strong> lines.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch
              </button>
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
