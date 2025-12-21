import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, AlertTriangle, 
  ChevronRight, Zap, Users, Check 
} from 'lucide-react';
import { useAvailability } from '../../hooks/useAvailability';
import NextAvailable from './NextAvailable';
import BookingOptions from './BookingOptions';

// ============================================
// SchedulingPanel Component
// Smart scheduling with availability awareness
// 
// Props:
//   services        - array from useQuote
//   technicians     - tech list (passed from parent or loaded)
//   value           - { date, timeSlot, techId, options }
//   onChange        - callback when any value changes
//   settings        - scheduler settings
// ============================================

export function SchedulingPanel({ 
  services = [],
  technicians: techsProp = [],
  value = {},
  onChange,
  settings = {},
  compact = false  // Compact mode for smaller spaces
}) {
  // Use availability hook
  const {
    technicians: techsFromHook,
    availability,
    nextAvailable,
    loading,
    getDateAvailability,
    checkBookingLimits,
    canTechDoCategory
  } = useAvailability(services, value.date);

  // Use techs from prop or hook
  const technicians = techsProp.length > 0 ? techsProp : techsFromHook;

  // Local state for expanded sections
  const [showAllTechs, setShowAllTechs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Handle value changes
  const handleChange = (field, val) => {
    onChange?.({ ...value, [field]: val });
  };

  // Handle next available selection
  const handleSelectSuggestion = (suggestion) => {
    if (suggestion.type === 'single') {
      onChange?.({
        ...value,
        date: suggestion.date,
        techId: suggestion.tech.id,
        timeSlot: value.timeSlot || 'anytime'
      });
    } else if (suggestion.type === 'split') {
      // For split, set date and flag that it's a split booking
      onChange?.({
        ...value,
        date: suggestion.date,
        techId: null, // Will be assigned per-service
        isSplit: true,
        splitAssignments: suggestion.assignments
      });
    }
  };

  // Get warnings for current selection
  const currentWarnings = [];
  if (value.date && value.techId) {
    const category = services[0]?.category || 'general';
    const { warnings } = checkBookingLimits(value.techId, value.date, category, value.timeSlot);
    currentWarnings.push(...warnings);
  }

  // Get availability for selected date
  const dateAvail = value.date ? getDateAvailability(value.date) : null;

  // Filter techs who can do the work
  const categories = [...new Set(services.map(s => s.category || 'general'))];
  const capableTechs = technicians.filter(tech => 
    categories.every(cat => canTechDoCategory(tech.id, cat))
  );
  const incapableTechs = technicians.filter(tech => 
    !categories.every(cat => canTechDoCategory(tech.id, cat))
  );

  if (compact) {
    return (
      <CompactSchedulingPanel
        value={value}
        onChange={onChange}
        technicians={technicians}
        nextAvailable={nextAvailable}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-4">
      
      {/* ============================================
          Next Available Suggestions
          ============================================ */}
      {services.length > 0 && (
        <NextAvailable
          suggestions={nextAvailable}
          loading={loading}
          onSelect={handleSelectSuggestion}
          selectedDate={value.date}
          selectedTechId={value.techId}
        />
      )}

      {/* ============================================
          Date Selection
          ============================================ */}
      <div>
        <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Calendar size={12} /> Date
        </label>
        <input
          type="date"
          value={value.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* ============================================
          Time Slot Selection
          ============================================ */}
      <div>
        <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Clock size={12} /> Time Preference
        </label>
        <div className="grid grid-cols-4 gap-1">
          {[
            { value: 'anytime', label: 'Anytime' },
            { value: 'morning', label: 'AM' },
            { value: 'afternoon', label: 'PM' },
            { value: 'waiter', label: 'Waiter' }
          ].map(slot => (
            <button
              key={slot.value}
              onClick={() => handleChange('timeSlot', slot.value)}
              className={`
                px-2 py-1.5 text-xs rounded-lg border transition-colors
                ${value.timeSlot === slot.value 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }
              `}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================
          Technician Selection with Availability
          ============================================ */}
      <div>
        <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <User size={12} /> Technician
        </label>
        
        {/* Auto-assign option */}
        <button
          onClick={() => handleChange('techId', null)}
          className={`
            w-full mb-2 px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between
            ${!value.techId 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <Zap size={14} />
            Auto-assign best available
          </span>
          {!value.techId && <Check size={14} />}
        </button>

        {/* Capable techs */}
        <div className="space-y-1">
          {capableTechs.map(tech => {
            const techAvail = dateAvail?.[tech.id];
            const isOff = techAvail?.isOff;
            const hours = techAvail?.hoursRemaining ?? tech.hours_per_day ?? 8;
            const isSelected = value.techId === tech.id;
            
            return (
              <TechOption
                key={tech.id}
                tech={tech}
                isSelected={isSelected}
                isOff={isOff}
                hoursRemaining={hours}
                offReason={techAvail?.offReason}
                onClick={() => handleChange('techId', tech.id)}
              />
            );
          })}
        </div>

        {/* Show incapable techs (collapsed by default) */}
        {incapableTechs.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowAllTechs(!showAllTechs)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <ChevronRight 
                size={12} 
                className={`transition-transform ${showAllTechs ? 'rotate-90' : ''}`}
              />
              {showAllTechs ? 'Hide' : 'Show'} other techs ({incapableTechs.length})
            </button>
            
            {showAllTechs && (
              <div className="mt-1 space-y-1">
                {incapableTechs.map(tech => {
                  const techAvail = dateAvail?.[tech.id];
                  const isOff = techAvail?.isOff;
                  const hours = techAvail?.hoursRemaining ?? tech.hours_per_day ?? 8;
                  const isSelected = value.techId === tech.id;
                  
                  return (
                    <TechOption
                      key={tech.id}
                      tech={tech}
                      isSelected={isSelected}
                      isOff={isOff}
                      hoursRemaining={hours}
                      offReason={techAvail?.offReason}
                      warning="Doesn't typically do this work"
                      onClick={() => handleChange('techId', tech.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================
          Warnings
          ============================================ */}
      {currentWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              {currentWarnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          Booking Options (waiter, loaner, ride, etc.)
          ============================================ */}
      <BookingOptions
        value={value.options || {}}
        onChange={(opts) => handleChange('options', opts)}
        timeSlot={value.timeSlot}
        settings={settings}
      />

    </div>
  );
}

// ============================================
// TechOption - Single tech selection button
// ============================================
function TechOption({ 
  tech, 
  isSelected, 
  isOff, 
  hoursRemaining, 
  offReason,
  warning,
  onClick 
}) {
  // Capacity indicator color
  const getCapacityColor = (hours) => {
    if (hours >= 6) return 'bg-green-500';
    if (hours >= 3) return 'bg-yellow-500';
    if (hours > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <button
      onClick={onClick}
      disabled={isOff}
      className={`
        w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between
        transition-colors
        ${isSelected 
          ? 'bg-blue-50 border-blue-300 text-blue-700' 
          : isOff
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}
    >
      <span className="flex items-center gap-2">
        {/* Color dot */}
        <span 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: tech.color || '#6B7280' }}
        />
        <span>{tech.name}</span>
        {warning && (
          <span className="text-xs text-amber-600">⚠</span>
        )}
      </span>
      
      <span className="flex items-center gap-2">
        {isOff ? (
          <span className="text-xs text-gray-400">
            {offReason || 'Off'}
          </span>
        ) : (
          <>
            {/* Capacity bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getCapacityColor(hoursRemaining)}`}
                style={{ width: `${Math.min(100, (hoursRemaining / 8) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">
              {hoursRemaining.toFixed(1)}h
            </span>
          </>
        )}
        {isSelected && <Check size={14} className="text-blue-600" />}
      </span>
    </button>
  );
}

// ============================================
// CompactSchedulingPanel - Minimal version
// ============================================
function CompactSchedulingPanel({ value, onChange, technicians, nextAvailable, loading }) {
  const handleChange = (field, val) => {
    onChange?.({ ...value, [field]: val });
  };

  return (
    <div className="space-y-3">
      {/* Quick suggestion if available */}
      {nextAvailable.length > 0 && !value.date && (
        <button
          onClick={() => {
            const best = nextAvailable[0];
            if (best.type === 'single') {
              onChange?.({
                ...value,
                date: best.date,
                techId: best.tech.id
              });
            }
          }}
          className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-left flex items-center justify-between hover:bg-green-100"
        >
          <span className="flex items-center gap-2">
            <Zap size={14} />
            Next: {nextAvailable[0].dateDisplay} with {nextAvailable[0].tech?.name}
          </span>
          <ChevronRight size={14} />
        </button>
      )}

      {/* Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={value.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Time</label>
          <select
            value={value.timeSlot || 'anytime'}
            onChange={(e) => handleChange('timeSlot', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="anytime">Anytime</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="waiter">Waiter</option>
          </select>
        </div>
      </div>

      {/* Tech */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Technician</label>
        <select
          value={value.techId || ''}
          onChange={(e) => handleChange('techId', e.target.value || null)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Auto-assign</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SchedulingPanel;
