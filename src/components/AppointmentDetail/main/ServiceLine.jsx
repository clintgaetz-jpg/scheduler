import React from 'react';
import { 
  ChevronDown, Wrench, CheckCircle, Clock, Pause, Play,
  Package, AlertTriangle, User, GripVertical
} from 'lucide-react';

const LINE_STATUS = {
  pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock, border: 'border-gray-200' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100', icon: Play, border: 'border-blue-200' },
  done: { label: 'Done', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, border: 'border-green-200' },
  hold: { label: 'Hold', color: 'text-amber-600', bg: 'bg-amber-100', icon: Pause, border: 'border-amber-200' },
};


export default function ServiceLine({ line, index, isWOLine, isExpanded, onToggleExpand, onUpdate, servicePackages, technicians = [], appointment, relatedAppointments = [], onManageCards, isChildCard = false }) {
  const normalizedLine = isWOLine ? {
    id: line.package_id || line.id,
    title: line.package_title,
    description: line.package_description,
    hours: line.labor?.tech_hours || 0,
    total: line.package_total || 0,
    status: line.labor?.completed ? 'done' : (line.status || 'pending'),
    tech_id: line.tech_id || line.labor?.tech_id || null,
    scheduled_date: line.scheduled_date || null,
    technician: line.labor?.technician,
    chapter: line.chapter,
    parts: line.parts || [],
    code: line.package_code,
    parts_status: line.parts_status || 'none',
    parts_watch_po: line.parts_watch_po || null,
  } : {
    id: line.id,
    title: line.title,
    description: line.description,
    hours: line.hours || 0,
    total: line.total || 0,
    status: line.status || 'pending',
    tech_id: line.tech_id || null,
    scheduled_date: line.scheduled_date || null,
    technician: line.technician,
    chapter: line.chapter || 'Service',
    parts: line.parts || [],
    code: line.code,
    parts_status: line.parts_status || 'none',
    parts_watch_po: line.parts_watch_po || null,
  };
  
  // Get assigned tech info
  const assignedTech = normalizedLine.tech_id 
    ? technicians.find(t => t.id === normalizedLine.tech_id)
    : null;
  
  // For WO lines: Get Protractor assignment
  const protractorTech = isWOLine && line.labor?.tech_id 
    ? technicians.find(t => t.id === line.labor.tech_id)
    : null;
  const protractorTechName = isWOLine && line.labor?.technician 
    ? line.labor.technician
    : (protractorTech?.name || null);
  
  // Check if assigned to different tech than appointment
  const isDifferentTech = normalizedLine.tech_id && normalizedLine.tech_id !== appointment?.tech_id;
  
  // Check if assigned to different date than appointment
  const isDifferentDate = normalizedLine.scheduled_date && normalizedLine.scheduled_date !== appointment?.scheduled_date;
  
  // For WO lines: Check if assignment differs from Protractor
  const isMismatchWithProtractor = isWOLine && protractorTech && normalizedLine.tech_id && normalizedLine.tech_id !== line.labor?.tech_id;
  
  // Check if this line is on a child card
  const onChildCard = line._onChildCard;
  const isOnChildCard = !!onChildCard;
  
  // Format date for child card display
  const formatChildCardDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const statusConfig = LINE_STATUS[normalizedLine.status] || LINE_STATUS.pending;
  const StatusIcon = statusConfig.icon;
  const hasParts = normalizedLine.parts.length > 0;
  const arrivedParts = normalizedLine.parts.filter(p => p.arrived).length;

  const handleStatusChange = (newStatus) => {
    onUpdate({ 
      status: newStatus,
      ...(newStatus === 'done' && { completed_at: new Date().toISOString() }),
      ...(newStatus === 'hold' && { hold_at: new Date().toISOString() }),
    });
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isOnChildCard ? 'border-purple-400 bg-purple-50' : statusConfig.border} ${normalizedLine.status === 'done' ? 'opacity-75' : ''}`}>
      <div 
        className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isOnChildCard ? 'bg-purple-50' : statusConfig.bg}`}
        onClick={onToggleExpand}
      >
        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
        <span className="text-sm flex-shrink-0">🔧</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`font-medium text-sm truncate ${normalizedLine.status === 'done' ? 'line-through text-gray-400' : isOnChildCard ? 'text-purple-900' : 'text-gray-800'}`}>
              {normalizedLine.title}
            </div>
            {/* Show child card info */}
            {isOnChildCard && (
              <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-semibold rounded flex items-center gap-1">
                On Child Card {onChildCard.workorderNumber || onChildCard.id} {onChildCard.splitLetter} - {onChildCard.techName} - {formatChildCardDate(onChildCard.date)}
                {onManageCards && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageCards();
                    }}
                    className="ml-1 px-1 py-0.5 bg-purple-600 text-white text-[9px] rounded hover:bg-purple-700"
                    title="Manage Cards"
                  >
                    Manage
                  </button>
                )}
              </span>
            )}
            {/* Show badge if assigned to different tech/date (and not on child card) */}
            {!isOnChildCard && (isDifferentTech || isDifferentDate) && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">
                {isDifferentTech && assignedTech ? assignedTech.short_name || assignedTech.name : ''}
                {isDifferentDate && normalizedLine.scheduled_date ? ` ${new Date(normalizedLine.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500 w-14 text-right flex-shrink-0">
          {normalizedLine.hours > 0 ? `${normalizedLine.hours}h` : '-'}
        </div>
        <div className="text-sm font-medium text-gray-700 w-20 text-right flex-shrink-0">
          ${normalizedLine.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
        </div>
        {hasParts && (
          <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${arrivedParts === normalizedLine.parts.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <Package size={12} />
            {arrivedParts}/{normalizedLine.parts.length}
          </div>
        )}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white space-y-4">
          {/* Assignment Section - Hide for child cards */}
          {onUpdate && !isChildCard && (
            <div className="space-y-2 py-2 border-b border-gray-100">
              {/* Assignment Display - Show both Protractor and Scheduler assignments */}
              <div className="space-y-1.5">
                {/* Protractor Assignment (for WO lines) */}
                {isWOLine && protractorTechName && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Protractor:</span>
                    <span className="text-xs text-gray-700 font-medium flex-1">
                      {protractorTechName}
                    </span>
                  </div>
                )}
                
                {/* Scheduler Assignment */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Scheduler:</span>
                  <span className={`text-xs font-medium flex-1 ${
                    isMismatchWithProtractor ? 'text-amber-700' : 'text-gray-700'
                  }`}>
                    {assignedTech ? assignedTech.name : (appointment?.tech_id ? technicians.find(t => t.id === appointment.tech_id)?.name || 'Unassigned' : 'Unassigned')}
                  </span>
                  {isMismatchWithProtractor && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded flex items-center gap-0.5">
                      <AlertTriangle size={10} className="text-amber-700" />
                      Mismatch
                    </span>
                  )}
                </div>
              </div>
              
              {/* Assignment Control */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Assign:</span>
                <select
                  value={normalizedLine.tech_id || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdate({ tech_id: e.target.value || null });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-1 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white ${
                    isMismatchWithProtractor ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Use appointment tech</option>
                  {technicians && technicians.length > 0 && technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                {normalizedLine.tech_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ tech_id: null, scheduled_date: null });
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 rounded transition-colors"
                    title="Clear"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Mismatch Warning */}
              {isMismatchWithProtractor && (
                <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  ⚠ This line is assigned to <strong>{assignedTech?.name || 'Unknown'}</strong> in scheduler, but <strong>{protractorTechName}</strong> in Protractor. This mismatch will need to be resolved.
                </div>
              )}
            </div>
          )}
          
          {/* Date Assignment (if different tech) - Hide for child cards */}
          {!isChildCard && normalizedLine.tech_id && normalizedLine.tech_id !== appointment?.tech_id && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Date:</span>
              <input
                type="date"
                value={normalizedLine.scheduled_date || appointment?.scheduled_date || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdate({ scheduled_date: e.target.value || null });
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}
          
          {/* Status Section */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Status:</span>
            {isWOLine ? (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                  {normalizedLine.status === 'done' && (
                    <span className="ml-1 text-[10px]">(from Protractor)</span>
                  )}
                </span>
                {normalizedLine.status === 'done' && normalizedLine.labor?.completed && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Completed in Protractor
                  </span>
                )}
                {normalizedLine.status !== 'done' && (
                  <span className="text-xs text-gray-400 italic">
                    Status updates must be made in Protractor
                  </span>
                )}
              </div>
            ) : (
              <div className="flex gap-1">
                {/* For child cards, only allow marking done */}
                {isChildCard ? (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (normalizedLine.status !== 'done') {
                        handleStatusChange('done');
                      }
                    }}
                    disabled={normalizedLine.status === 'done'}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      normalizedLine.status === 'done' 
                        ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    Mark Done
                  </button>
                ) : (
                  Object.entries(LINE_STATUS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(key); }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${normalizedLine.status === key ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {config.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Parts Status */}
          {normalizedLine.parts_status && normalizedLine.parts_status !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Parts:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                normalizedLine.parts_status === 'here' ? 'bg-green-100 text-green-700' :
                normalizedLine.parts_status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                normalizedLine.parts_status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {normalizedLine.parts_status}
                {normalizedLine.parts_watch_po && ` (PO: ${normalizedLine.parts_watch_po})`}
              </span>
            </div>
          )}
          {normalizedLine.description && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">{normalizedLine.description}</div>
          )}
          {hasParts && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Package size={12} /> Parts ({arrivedParts} of {normalizedLine.parts.length} arrived)
              </div>
              <div className="bg-gray-50 rounded p-2 space-y-1">
                {normalizedLine.parts.map((part, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={part.arrived ? 'text-green-500' : 'text-gray-300'}>{part.arrived ? '✓' : '○'}</span>
                    <span className="font-mono text-gray-400 w-24 truncate">{part.part_number || '-'}</span>
                    <span className="flex-1 text-gray-700 truncate">{part.description}</span>
                    <span className="text-gray-500">×{part.quantity}</span>
                    <span className="text-gray-700 w-16 text-right">${(part.total || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

