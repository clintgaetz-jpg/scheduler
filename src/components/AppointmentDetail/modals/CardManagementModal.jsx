import React, { useState } from 'react';
import { X, GitBranch, ExternalLink, Trash2 } from 'lucide-react';

// ============================================
// CARD MANAGEMENT MODAL
// Shows all related cards (parent + children) and allows management
// ============================================

export default function CardManagementModal({ 
  appointment,
  relatedAppointments = [], // All appointments in the split group
  technicians = [],
  useWOLines = false, // Use same mode as parent view
  onClose,
  onOpenCard,
  onDeleteCard,
  onRefresh
}) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Group appointments: parent first, then children sorted by split_letter
  // Include the current appointment in the list
  const sortedCards = React.useMemo(() => {
    // Find the root parent (could be the current appointment if it's a parent, or its parent if it's a child)
    const rootParentId = appointment.parent_id || appointment.id;
    const parent = relatedAppointments.find(a => a && a.id === rootParentId && !a.parent_id) 
      || relatedAppointments.find(a => a && !a.parent_id) 
      || (appointment.parent_id ? null : appointment);
    
    // Get all children of the root parent (including current appointment if it's a child)
    const allChildren = relatedAppointments
      .filter(a => a && (a.parent_id === rootParentId || a.parent_id === parent?.id))
      .sort((a, b) => (a.split_letter || '').localeCompare(b.split_letter || ''));
    
    // Include current appointment if it's not already in the list
    const allCards = [];
    if (parent && parent.id !== appointment.id) {
      allCards.push(parent);
    }
    
    // Add children, making sure current appointment is included
    const childIds = new Set(allChildren.map(c => c.id));
    allChildren.forEach(child => {
      if (child.id !== parent?.id) {
        allCards.push(child);
      }
    });
    
    // If current appointment is not in the list, add it
    if (!allCards.some(c => c.id === appointment.id)) {
      allCards.push(appointment);
    }
    
    return allCards.filter(Boolean);
  }, [appointment, relatedAppointments]);
  
  // Calculate totals per card (handles both services and protractor_lines)
  const getCardTotals = (card) => {
    const services = card.services || [];
    const woLines = card.protractor_lines || [];
    // Use the same mode preference as the parent view
    const allLines = useWOLines ? woLines : services;
    
    return allLines.reduce((acc, line) => {
      if (services.length > 0) {
        // Appointment services
        acc.hours += parseFloat(line.hours || 0);
        acc.total += parseFloat(line.total || line.estimated_total || 0);
      } else {
        // WO lines
        acc.hours += parseFloat(line.labor?.tech_hours || line.hours || 0);
        acc.total += parseFloat(line.package_total || line.total || 0);
      }
      acc.count += 1;
      return acc;
    }, { hours: 0, total: 0, count: 0 });
  };
  
  // Get tech name
  const getTechName = (techId) => {
    if (!techId) return 'Unassigned';
    const tech = technicians.find(t => t.id === techId);
    return tech?.name || 'Unknown';
  };
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <GitBranch className="text-purple-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Card Management</h2>
            <span className="text-sm text-gray-500">
              {sortedCards.length} card{sortedCards.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {sortedCards.map((card, index) => {
              const isParent = !card.parent_id;
              const totals = getCardTotals(card);
              const services = card.services || [];
              const woLines = card.protractor_lines || [];
              // Use the same mode preference as the parent view
              const displayLines = useWOLines ? woLines : services;
              const isWOLines = useWOLines;
              
              return (
                <div
                  key={card.id || index}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    card.id === appointment.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {card.customer_name}
                        </h3>
                        {isParent ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                            PARENT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                            {card.split_letter || 'CHILD'}
                          </span>
                        )}
                        {card.id === appointment.id && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Current
                          </span>
                        )}
                      </div>
                      
                      {/* Assignment Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span>
                          <strong>Tech:</strong> {getTechName(card.tech_id)}
                        </span>
                        <span>
                          <strong>Date:</strong> {formatDate(card.scheduled_date)}
                        </span>
                        {card.is_on_hold && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                            On Hold: {card.hold_reason}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onOpenCard(card);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink size={14} />
                        Open
                      </button>
                      {!isParent && onDeleteCard && (
                        <button
                          onClick={() => {
                            if (confirm(`Collapse card ${card.split_letter} back to parent card? The lines will be merged back into the parent.`)) {
                              onDeleteCard(card.id);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1"
                          title="Collapse back to parent"
                        >
                          <GitBranch size={14} />
                          Collapse
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Service Lines */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {isWOLines ? 'Work Order Lines' : 'Service Lines'} ({displayLines.length})
                      </h4>
                      <div className="text-sm text-gray-600">
                        {totals.hours.toFixed(1)}h • ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {displayLines.length === 0 ? (
                        <div className="text-sm text-gray-400 italic py-2">No {isWOLines ? 'work order' : 'service'} lines</div>
                      ) : (
                        displayLines.map((line, idx) => {
                          // Normalize line data for display
                          const lineTitle = isWOLines 
                            ? (line.package_title || line.title || `Line ${idx + 1}`)
                            : (line.title || line.name || `Service ${idx + 1}`);
                          const lineHours = isWOLines
                            ? (line.labor?.tech_hours || line.hours || 0)
                            : (line.hours || 0);
                          const lineTotal = isWOLines
                            ? (line.package_total || line.total || 0)
                            : (line.total || line.estimated_total || 0);
                          const lineStatus = isWOLines
                            ? (line.labor?.completed ? 'done' : (line.status || 'pending'))
                            : (line.status || 'pending');
                          
                          return (
                            <div
                              key={line.id || line.package_id || idx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {lineTitle}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {lineHours}h • ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ml-2 ${
                                lineStatus === 'done'
                                  ? 'bg-green-100 text-green-700'
                                  : lineStatus === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : lineStatus === 'hold'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {lineStatus}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
        
      </div>
    </div>
  );
}

