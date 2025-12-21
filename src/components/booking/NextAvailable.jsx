import React from 'react';
import { Zap, Users, Check, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

// ============================================
// NextAvailable Component
// Shows smart booking suggestions
// 
// Props:
//   suggestions   - array from useAvailability.nextAvailable
//   loading       - boolean
//   onSelect      - callback when suggestion selected
//   selectedDate  - currently selected date
//   selectedTechId - currently selected tech
// ============================================

export function NextAvailable({ 
  suggestions = [], 
  loading = false,
  onSelect,
  selectedDate,
  selectedTechId
}) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show if no suggestions
  }

  // Check if current selection matches a suggestion
  const isSelected = (suggestion) => {
    if (suggestion.type === 'single') {
      return suggestion.date === selectedDate && suggestion.tech.id === selectedTechId;
    }
    return suggestion.date === selectedDate;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={14} className="text-blue-600" />
        <span className="text-xs font-medium text-blue-800">Smart Suggestions</span>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, idx) => (
          <SuggestionCard
            key={idx}
            suggestion={suggestion}
            isSelected={isSelected(suggestion)}
            onSelect={() => onSelect?.(suggestion)}
            isPrimary={idx === 0}
          />
        ))}
      </div>

      {suggestions.length > 3 && (
        <div className="mt-2 text-xs text-blue-600">
          +{suggestions.length - 3} more options available
        </div>
      )}
    </div>
  );
}

// ============================================
// SuggestionCard - Single suggestion display
// ============================================
function SuggestionCard({ suggestion, isSelected, onSelect, isPrimary }) {
  const hasWarnings = suggestion.warnings?.length > 0;

  if (suggestion.type === 'single') {
    return (
      <button
        onClick={onSelect}
        className={`
          w-full px-3 py-2 rounded-lg text-left text-sm transition-all
          flex items-center justify-between
          ${isSelected 
            ? 'bg-blue-600 text-white shadow-md' 
            : isPrimary
              ? 'bg-white border-2 border-blue-300 hover:border-blue-400 shadow-sm'
              : 'bg-white border border-gray-200 hover:border-blue-300'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {/* Tech color dot */}
          <span 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: suggestion.tech.color || '#6B7280' }}
          />
          
          <div>
            <div className="font-medium">
              {suggestion.dateDisplay}
              <span className={isSelected ? 'text-blue-100' : 'text-gray-500'}>
                {' '}with{' '}
              </span>
              {suggestion.tech.name}
            </div>
            <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
              {suggestion.hoursAvailable.toFixed(1)}h available
              {hasWarnings && (
                <span className="ml-2 text-amber-500">
                  <AlertTriangle size={10} className="inline" /> {suggestion.warnings.length} warning
                </span>
              )}
            </div>
          </div>
        </div>

        {isSelected ? (
          <Check size={16} />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>
    );
  }

  // Split booking suggestion
  if (suggestion.type === 'split') {
    return (
      <button
        onClick={onSelect}
        className={`
          w-full px-3 py-2 rounded-lg text-left text-sm transition-all
          ${isSelected 
            ? 'bg-purple-600 text-white shadow-md' 
            : 'bg-white border border-purple-200 hover:border-purple-300'
          }
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <Users size={14} className={isSelected ? 'text-purple-200' : 'text-purple-600'} />
          <span className="font-medium">
            Split: {suggestion.dateDisplay}
          </span>
          {isSelected && <Check size={14} className="ml-auto" />}
        </div>
        
        <div className={`text-xs space-y-0.5 ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
          {suggestion.assignments.map((assignment, i) => (
            <div key={i} className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: assignment.tech.color || '#6B7280' }}
              />
              <span>
                {assignment.tech.name}: {assignment.category} ({assignment.hours}h)
              </span>
            </div>
          ))}
        </div>
      </button>
    );
  }

  return null;
}

export default NextAvailable;
