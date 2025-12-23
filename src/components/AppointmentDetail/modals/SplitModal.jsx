import React, { useState, useMemo } from 'react';
import { X, Scissors, User, Calendar, Pause, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================
// SPLIT MODAL
// Split service lines across different techs, dates, or hold
// ============================================

export default function SplitModal({ 
  appointment, 
  technicians = [], 
  useWOLines = false,
  onClose, 
  onSplit 
}) {
  // Get the appropriate lines based on view mode
  const appointmentServices = appointment?.services || [];
  const woLines = appointment?.protractor_lines || [];
  const activeLines = useWOLines ? woLines : appointmentServices;
  const isWOLines = useWOLines && woLines.length > 0;
  
  // Normalize lines for display (handle different structures)
  const normalizedLines = activeLines.map((line, index) => {
    if (isWOLines) {
      // WO line structure
      return {
        id: line.package_id || line.id || index,
        title: line.package_title || line.title || 'Unknown',
        hours: line.labor?.tech_hours || line.hours || 0,
        total: line.package_total || line.total || 0,
        status: line.labor?.completed ? 'done' : (line.status || 'pending'),
        _original: line, // Keep reference to original
        _isWOLine: true
      };
    } else {
      // Appointment service structure
      return {
        id: line.id || index,
        title: line.title || line.name || 'Unknown',
        hours: line.hours || 0,
        total: line.total || line.estimated_total || 0,
        status: line.status || 'pending',
        _original: line, // Keep reference to original
        _isWOLine: false
      };
    }
  });
  
  const services = normalizedLines; // Use normalized for consistency
  
  // State for split assignments
  const [selectedLines, setSelectedLines] = useState(new Set());
  const [splitType, setSplitType] = useState('tech'); // 'tech' | 'date' | 'both' | 'hold'
  const [splitTech, setSplitTech] = useState('');
  const [splitDate, setSplitDate] = useState('');
  const [holdReason, setHoldReason] = useState('parts');
  
  // Get active technicians
  const activeTechs = technicians.filter(t => t.is_active !== false);
  
  // Format date for input
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };
  
  // Toggle line selection - use index as key for consistency
  const toggleLine = (index) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  // Select all / deselect all (only selectable lines, not done ones)
  const toggleAll = () => {
    const selectableIndices = services
      .map((s, i) => ({ line: s, index: i }))
      .filter(({ line }) => line.status !== 'done')
      .map(({ index }) => index);
    
    const allSelectableSelected = selectableIndices.every(idx => selectedLines.has(idx));
    
    if (allSelectableSelected) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(selectableIndices));
    }
  };
  
  // Validation
  const canSplit = useMemo(() => {
    if (selectedLines.size === 0) return false;
    if (selectedLines.size === services.length) return false; // Must keep at least one line
    
    if (splitType === 'tech' && !splitTech) return false;
    if (splitType === 'date' && !splitDate) return false;
    if (splitType === 'both' && (!splitTech || !splitDate)) return false;
    if (splitType === 'hold' && !holdReason) return false;
    
    return true;
  }, [selectedLines, services.length, splitType, splitTech, splitDate, holdReason]);
  
  // Handle split - creates child appointment
  const handleSplit = () => {
    if (!canSplit) return;
    
    const selectedIndices = Array.from(selectedLines).sort((a, b) => a - b);
    // Get original lines (not normalized) for the split
    const splitLines = selectedIndices.map(idx => services[idx]._original || services[idx]);
    
    // Calculate totals for split lines
    const splitTotals = splitLines.reduce((acc, line) => {
      if (isWOLines) {
        acc.hours += parseFloat(line.labor?.tech_hours || line.hours || 0);
        acc.total += parseFloat(line.package_total || line.total || 0);
      } else {
        acc.hours += parseFloat(line.hours || 0);
        acc.total += parseFloat(line.total || line.estimated_total || 0);
      }
      return acc;
    }, { hours: 0, total: 0 });
    
    const splitData = {
      lineIndices: selectedIndices,
      splitLines: splitLines,
      splitType: splitType,
      splitTech: splitTech,
      splitDate: splitDate,
      holdReason: holdReason,
      totals: splitTotals,
      isWOLines: isWOLines // Flag to indicate which type of lines we're splitting
    };
    
    onSplit(appointment, splitData);
    onClose();
  };
  
  // Calculate totals for selected lines
  const selectedTotals = useMemo(() => {
    return Array.from(selectedLines).reduce((acc, index) => {
      const line = services[index];
      if (line) {
        acc.hours += parseFloat(line.hours || 0);
        acc.total += parseFloat(line.total || 0);
        acc.count += 1;
      }
      return acc;
    }, { hours: 0, total: 0, count: 0 });
  }, [selectedLines, services]);
  
  // Get remaining totals (lines staying with appointment)
  const remainingTotals = useMemo(() => {
    const remaining = services.filter((s, i) => !selectedLines.has(i));
    return remaining.reduce((acc, service) => {
      acc.hours += parseFloat(service.hours || 0);
      acc.total += parseFloat(service.total || 0);
      acc.count += 1;
      return acc;
    }, { hours: 0, total: 0, count: 0 });
  }, [selectedLines, services]);
  
  if (services.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="mx-auto mb-3 text-gray-300" size={32} />
            <p>No services to split</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Scissors className="text-purple-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">
              Split Job {isWOLines && <span className="text-sm text-gray-500 font-normal">(WO Lines)</span>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Select service lines to split. At least one line must remain with the original appointment.
            </p>
          </div>
          
          {/* Line Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {isWOLines ? 'Work Order Lines' : 'Service Lines'}
              </h3>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedLines.size === services.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {services.map((service, index) => {
                const isSelected = selectedLines.has(index);
                const isDone = service.status === 'done';
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'bg-purple-50 border-purple-300' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    } ${isDone ? 'opacity-60' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleLine(index)}
                      disabled={isDone}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {service.title || `Service ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.hours || 0}h • ${(service.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      isDone
                        ? 'bg-green-100 text-green-700' 
                        : service.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : service.status === 'hold'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {service.status || 'pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Split Options */}
          {selectedLines.size > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900">Split Assignment</h3>
              
              {/* Split Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSplitType('tech')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    splitType === 'tech'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User size={16} className="mx-auto mb-1" />
                  <div className="text-xs">Different Tech</div>
                </button>
                <button
                  onClick={() => setSplitType('date')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    splitType === 'date'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar size={16} className="mx-auto mb-1" />
                  <div className="text-xs">Different Date</div>
                </button>
                <button
                  onClick={() => setSplitType('both')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    splitType === 'both'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User size={16} className="mx-auto mb-1" />
                  <Calendar size={16} className="mx-auto mb-1" />
                  <div className="text-xs">Tech & Date</div>
                </button>
                <button
                  onClick={() => setSplitType('hold')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    splitType === 'hold'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Pause size={16} className="mx-auto mb-1" />
                  <div className="text-xs">Send to Hold</div>
                </button>
              </div>
              
              {/* Tech Selection */}
              {(splitType === 'tech' || splitType === 'both') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Assign to Technician</label>
                  <select
                    value={splitTech}
                    onChange={(e) => setSplitTech(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    <option value="">Select technician...</option>
                    {activeTechs.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Date Selection */}
              {(splitType === 'date' || splitType === 'both') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Schedule for Date</label>
                  <input
                    type="date"
                    value={splitDate}
                    onChange={(e) => setSplitDate(e.target.value)}
                    min={formatDateForInput(new Date().toISOString())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              )}
              
              {/* Hold Reason */}
              {splitType === 'hold' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Hold Reason</label>
                  <select
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    <option value="parts">Waiting for Parts</option>
                    <option value="customer">Waiting for Customer</option>
                    <option value="authorization">Waiting for Authorization</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
          )}
          
          {/* Preview Summary */}
          {selectedLines.size > 0 && canSplit && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Split Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Staying with Appointment</div>
                  <div className="font-medium text-gray-900">
                    {remainingTotals.count} line{remainingTotals.count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-600">
                    {remainingTotals.hours.toFixed(1)}h • ${remainingTotals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">
                    {splitType === 'tech' && 'Assigned to Different Tech'}
                    {splitType === 'date' && 'Scheduled for Different Date'}
                    {splitType === 'hold' && 'Going to Hold'}
                  </div>
                  <div className="font-medium text-purple-700">
                    {selectedTotals.count} line{selectedTotals.count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedTotals.hours.toFixed(1)}h • ${selectedTotals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {splitType === 'tech' && splitTech && (
                    <div className="text-xs text-purple-600 mt-1">
                      → {activeTechs.find(t => t.id === splitTech)?.name}
                    </div>
                  )}
                  {splitType === 'date' && splitDate && (
                    <div className="text-xs text-purple-600 mt-1">
                      → {new Date(splitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedLines.size > 0 && (
              <span>
                {selectedLines.size} of {services.length} line{services.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSplit}
              disabled={!canSplit}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                canSplit
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Scissors size={16} />
              Create Split
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
