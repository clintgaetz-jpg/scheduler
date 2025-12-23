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


export default function ServiceLine({ line, index, isWOLine, isExpanded, onToggleExpand, onUpdate, servicePackages }) {
  const normalizedLine = isWOLine ? {
    title: line.package_title,
    description: line.package_description,
    hours: line.labor?.tech_hours || 0,
    total: line.package_total || 0,
    status: line.labor?.completed ? 'done' : (line.status || 'pending'),
    technician: line.labor?.technician,
    chapter: line.chapter,
    parts: line.parts || [],
    code: line.package_code,
  } : {
    title: line.title,
    description: line.description,
    hours: line.hours || 0,
    total: line.total || 0,
    status: line.status || 'pending',
    technician: line.technician,
    chapter: line.chapter || 'Service',
    parts: line.parts || [],
    code: line.code,
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
    <div className={`border rounded-lg overflow-hidden transition-all ${statusConfig.border} ${normalizedLine.status === 'done' ? 'opacity-75' : ''}`}>
      <div 
        className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${statusConfig.bg}`}
        onClick={onToggleExpand}
      >
        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
        <span className="text-sm flex-shrink-0">🔧</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm truncate ${normalizedLine.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {normalizedLine.title}
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
        <div className="border-t border-gray-200 p-3 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Status:</span>
            <div className="flex gap-1">
              {Object.entries(LINE_STATUS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(key); }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${normalizedLine.status === key ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
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

