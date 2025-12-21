/**
 * SchedulerHeader
 * 
 * The action bar at the top of the scheduler.
 * Contains: No WO, No Auth, Parts dropdown, Requests, Deleted, Search, New Appointment
 */

import React, { useState } from 'react';
import { 
  FileText, DollarSign, Package, Bell, Trash2, 
  Search, Plus, UserPlus, ChevronDown 
} from 'lucide-react';
import { BRAND } from '../../../utils/constants';

// ============================================
// PARTS DROPDOWN
// ============================================

function PartsDropdown({ counts, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const totalPending = (counts.partsNeeded || 0) + (counts.partsOrdered || 0);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
        <Package size={14} /> 
        <span className="hidden sm:inline">Parts</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          counts.partsNeeded > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {totalPending}
        </span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 z-50">
          <button 
            onClick={() => { onSelect('parts_needed'); setIsOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
          >
            <span>🔴 Needs Parts</span>
            <span className="text-red-600 font-medium">{counts.partsNeeded || 0}</span>
          </button>
          <button 
            onClick={() => { onSelect('parts_ordered'); setIsOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
          >
            <span>🟡 Ordered/Partial</span>
            <span className="text-yellow-600 font-medium">{counts.partsOrdered || 0}</span>
          </button>
          <button 
            onClick={() => { onSelect('parts_arrived'); setIsOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between"
          >
            <span>🟢 Parts Here</span>
            <span className="text-green-600 font-medium">{counts.partsArrived || 0}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// SCHEDULER HEADER COMPONENT
// ============================================

export function SchedulerHeader({
  counts = {},
  occasionalTechs = [],
  visibleOccasionalTechs = {},
  onToggleOccasionalTech,
  onOpenList,
  onOpenRequests,
  onOpenSearch,
  onNewAppointment,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Buttons */}
      <div className="flex items-center gap-1 text-sm">
        {/* No WO */}
        <button 
          onClick={() => onOpenList('no_wo', 'No Work Order')}
          className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <FileText size={14} /> 
          <span className="hidden sm:inline">No WO</span>
          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
            {counts.noWo || 0}
          </span>
        </button>
        
        {/* No Auth */}
        <button 
          onClick={() => onOpenList('needs_auth', 'Needs Authorization')}
          className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <DollarSign size={14} /> 
          <span className="hidden sm:inline">No Auth</span>
          <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
            {counts.noAuth || 0}
          </span>
        </button>
        
        {/* Parts Dropdown */}
        <PartsDropdown counts={counts} onSelect={(filter) => onOpenList(filter, 'Parts')} />

        {/* Requests */}
        <button 
          onClick={onOpenRequests}
          className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors relative"
        >
          <Bell size={14} />
          <span className="hidden sm:inline">Requests</span>
          {(counts.requests || 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {counts.requests}
            </span>
          )}
        </button>

        {/* Deleted (only show if there are deleted items) */}
        {(counts.deleted || 0) > 0 && (
          <button 
            onClick={() => onOpenList('deleted', 'Deleted Appointments')}
            className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="View deleted appointments"
          >
            <Trash2 size={14} />
            <span className="text-xs">{counts.deleted}</span>
          </button>
        )}
      </div>

      {/* Occasional Tech Toggles */}
      {occasionalTechs.length > 0 && (
        <div className="border-l border-gray-200 pl-2 ml-1 flex items-center gap-1">
          {occasionalTechs.map(tech => (
            <button
              key={tech.id}
              onClick={() => onToggleOccasionalTech(tech.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                visibleOccasionalTechs[tech.id] 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={`${visibleOccasionalTechs[tech.id] ? 'Hide' : 'Show'} ${tech.name}'s column`}
            >
              <UserPlus size={12} className="inline mr-1" />
              {tech.name?.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        title="Search appointments"
      >
        <Search size={18} />
      </button>

      {/* New Appointment */}
      <button 
        onClick={onNewAppointment}
        className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        style={{ backgroundColor: BRAND.blue }}
      >
        <Plus size={16} /> New
      </button>
    </div>
  );
}

export default SchedulerHeader;
