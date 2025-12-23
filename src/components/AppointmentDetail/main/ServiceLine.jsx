import React from 'react';
import { ChevronDown, CheckCircle, Clock, Pause, Play, Package, User, Calendar } from 'lucide-react';

const LINE_STATUS = {
  pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock, border: 'border-gray-200' },
  approved: { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle, border: 'border-blue-200' },
  in_progress: { label: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Play, border: 'border-indigo-200' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, border: 'border-green-200' },
  hold: { label: 'Hold', color: 'text-amber-600', bg: 'bg-amber-100', icon: Pause, border: 'border-amber-200' },
  declined: { label: 'Declined', color: 'text-red-600', bg: 'bg-red-100', icon: Pause, border: 'border-red-200' },
};

export default function ServiceLine({ line, index, isExpanded, onToggleExpand, onUpdate, servicePackages, technicians = [], appointment }) {
  const status = line.scheduler_status || 'pending';
  const statusConfig = LINE_STATUS[status] || LINE_STATUS.pending;
  const StatusIcon = statusConfig.icon;
  
  const parts = line.parts || [];
  const hasParts = parts.length > 0;
  const blackWidowParts = parts.filter(p => p.is_black_widow);
  const coreParts = parts.filter(p => p.is_core && !p.is_black_widow);
  const warrantyParts = parts.filter(p => p.is_warranty && !p.is_black_widow);
  const receivedParts = parts.filter(p => p.qty_received >= p.qty_needed);
  const flaggedParts = parts.filter(p => p.is_core || p.is_warranty || p.is_black_widow);
  
  const protractorTech = line.protractor_tech_name;
  const schedulerTechId = line.scheduler_tech_id;
  const assignedTech = schedulerTechId ? technicians.find(t => t.id === schedulerTechId) : null;
  const isDifferentTech = schedulerTechId && schedulerTechId !== appointment?.tech_id;
  const isDifferentDate = line.scheduler_date && line.scheduler_date !== appointment?.scheduled_date;

  const handleStatusChange = (newStatus) => {
    if (!onUpdate) return;
    onUpdate({ scheduler_status: newStatus, ...(newStatus === 'completed' && { scheduler_completed_at: new Date().toISOString() }) });
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${statusConfig.border} ${status === 'completed' ? 'opacity-75' : ''}`}>
      <div className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${statusConfig.bg}`} onClick={onToggleExpand}>
        {line.code && <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-mono rounded flex-shrink-0">{line.code}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`font-medium text-sm truncate ${status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{line.title}</div>
            {(isDifferentTech || isDifferentDate) && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded flex items-center gap-1">
                {isDifferentTech && assignedTech && <><User size={10} /> {assignedTech.short_name || assignedTech.name.split(' ')[0]}</>}
                {isDifferentDate && line.scheduler_date && <><Calendar size={10} /> {new Date(line.scheduler_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>}
              </span>
            )}
            {line.is_warranty_labor && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded" title="Warranty Labor Credit">🔺 WARRANTY</span>}
          </div>
          {protractorTech && <div className="text-[10px] text-gray-400 truncate">Protractor: {protractorTech}{line.protractor_completed && <span className="ml-1 text-green-500">✓</span>}</div>}
        </div>
        <div className="text-sm text-gray-500 w-14 text-right flex-shrink-0">{line.labor_hours > 0 ? `${line.labor_hours}h` : '-'}</div>
        <div className="text-sm font-medium text-gray-700 w-20 text-right flex-shrink-0">${(line.line_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        {hasParts && (
          <div className="flex items-center gap-1">
            {blackWidowParts.length > 0 && <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] font-bold rounded" title="Black Widow: Warranty + Core">🕷️ {blackWidowParts.length}</span>}
            {coreParts.length > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded" title="Core Return">⚠️ {coreParts.length}</span>}
            {warrantyParts.length > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded" title="Warranty Part">🔺 {warrantyParts.length}</span>}
            <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${receivedParts.length === parts.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <Package size={12} />{receivedParts.length}/{parts.length}
            </span>
          </div>
        )}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
          <StatusIcon size={12} />{statusConfig.label}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white space-y-4">
          <div className="flex items-center gap-2 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 w-20">Assign to:</span>
            <select value={schedulerTechId || ''} onChange={(e) => { e.stopPropagation(); if (onUpdate) onUpdate({ scheduler_tech_id: e.target.value || null }); }} onClick={(e) => e.stopPropagation()} className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white">
              <option value="">{protractorTech ? `Protractor: ${protractorTech}` : 'Use appointment tech'}</option>
              {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
            </select>
            {schedulerTechId && <button onClick={(e) => { e.stopPropagation(); if (onUpdate) onUpdate({ scheduler_tech_id: null, scheduler_date: null }); }} className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 rounded" title="Clear">×</button>}
          </div>
          
          {schedulerTechId && schedulerTechId !== appointment?.tech_id && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Date:</span>
              <input type="date" value={line.scheduler_date || appointment?.scheduled_date || ''} onChange={(e) => { e.stopPropagation(); if (onUpdate) onUpdate({ scheduler_date: e.target.value || null }); }} onClick={(e) => e.stopPropagation()} className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Status:</span>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(LINE_STATUS).map(([key, config]) => (
                <button key={key} onClick={(e) => { e.stopPropagation(); handleStatusChange(key); }} disabled={!onUpdate} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${status === key ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50'}`}>
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          
          {line.description && <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">{line.description}</div>}
          
          {hasParts && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Package size={12} /> Parts ({receivedParts.length} of {parts.length} received)
                {flaggedParts.length > 0 && <span className="ml-2 text-amber-600">⚠️ {flaggedParts.length} flagged</span>}
              </div>
              <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                {parts.map((part, i) => <PartRow key={part.id || i} part={part} />)}
              </div>
            </div>
          )}
          
          {line.tech_notes && <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2"><strong>Tech Notes:</strong> {line.tech_notes}</div>}
        </div>
      )}
    </div>
  );
}

function PartRow({ part }) {
  const isReceived = part.qty_received >= part.qty_needed;
  let flagBg = '', flagBorder = '', flagIcon = null, flagText = null;
  
  if (part.is_black_widow) { flagBg = 'bg-purple-50'; flagBorder = 'border-l-4 border-purple-500'; flagIcon = '🕷️'; flagText = 'BLACK WIDOW - WARRANTY + CORE'; }
  else if (part.is_warranty) { flagBg = 'bg-red-50'; flagBorder = 'border-l-4 border-red-500'; flagIcon = '🔺'; flagText = 'WARRANTY'; }
  else if (part.is_core) { flagBg = 'bg-amber-50'; flagBorder = 'border-l-4 border-amber-500'; flagIcon = '⚠️'; flagText = `CORE $${part.core_value || 0}`; }
  
  const hasIssue = part.is_duplicate || part.is_extra || part.is_wrong_wo || (part.qty_received > 0 && part.qty_received !== part.qty_needed);
  
  return (
    <div className={`flex flex-col p-2 rounded ${flagBg} ${flagBorder} ${hasIssue ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className={isReceived ? 'text-green-500' : 'text-gray-300'}>{isReceived ? '✓' : '○'}</span>
        <span className="font-mono text-gray-400 w-24 truncate">{part.part_number || '-'}</span>
        <span className="flex-1 text-gray-700 truncate">{part.description}</span>
        <MatchBadges part={part} />
        <span className="text-gray-500">×{part.qty_needed}{part.qty_received > 0 && part.qty_received !== part.qty_needed && <span className={part.qty_received < part.qty_needed ? 'text-amber-600' : 'text-red-600'}> ({part.qty_received} rcvd)</span>}</span>
        <span className="text-gray-700 w-16 text-right font-medium">${(part.line_total || 0).toFixed(2)}</span>
      </div>
      {flagIcon && <div className={`mt-1 text-[10px] font-bold flex items-center gap-1 ${part.is_black_widow ? 'text-purple-700' : part.is_warranty ? 'text-red-700' : 'text-amber-700'}`}>{flagIcon} {flagText}{part.is_black_widow && <span className="font-normal ml-2">Keep box for warranty return!</span>}</div>}
      {hasIssue && <IssuesBanner part={part} />}
    </div>
  );
}

function MatchBadges({ part }) {
  const badges = [];
  if (part.match_status === 'matched') badges.push(<span key="m" className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold" title="Matched">✅</span>);
  if (part.is_duplicate) badges.push(<span key="d" className="px-1 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold" title="DUPLICATE">🛑 DUP</span>);
  if (part.is_extra) badges.push(<span key="e" className="px-1 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold" title="EXTRA">🛑 EXTRA</span>);
  if (part.is_wrong_wo) badges.push(<span key="w" className="px-1 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold" title="WRONG WO">🛑 WRONG</span>);
  if (part.qty_received > 0 && part.qty_received !== part.qty_needed) { const d = part.qty_received - part.qty_needed; badges.push(<span key="q" className={`px-1 py-0.5 rounded text-[10px] font-bold ${d > 0 ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'}`} title="Qty mismatch">🛑 QTY {d > 0 ? `+${d}` : d}</span>); }
  return badges.length ? <div className="flex items-center gap-1">{badges}</div> : null;
}

function IssuesBanner({ part }) {
  const issues = [];
  if (part.is_duplicate) issues.push('Duplicate: Same part on multiple invoices');
  if (part.is_extra) issues.push('Extra: Invoiced but not on WO');
  if (part.is_wrong_wo) issues.push('Wrong WO: Charged to wrong work order');
  if (part.qty_received > part.qty_needed) issues.push(`Overbilled: ${part.qty_received} vs ${part.qty_needed} on WO`);
  if (part.qty_received > 0 && part.qty_received < part.qty_needed) issues.push(`Partial: ${part.qty_received} of ${part.qty_needed}`);
  return issues.length ? <div className="mt-1 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded p-1"><strong>⚠️ Issues:</strong><ul className="list-disc list-inside">{issues.map((i,x) => <li key={x}>{i}</li>)}</ul></div> : null;
}
