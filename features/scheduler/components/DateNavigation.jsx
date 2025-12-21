/**
 * DateNavigation
 * 
 * Week navigation bar with date buttons and Today link.
 * Shows Mon-Fri only (no weekends).
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { isToday, getTodayOrNextWeekday } from '../../../utils/dateHelpers';

// ============================================
// DATE NAVIGATION COMPONENT
// ============================================

export function DateNavigation({ 
  weekDates = [],
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  className = ''
}) {
  const handleTodayClick = () => {
    // If today is weekend, go to next Monday
    const targetDate = getTodayOrNextWeekday();
    onSelectDate(targetDate);
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Previous Week */}
        <button 
          onClick={onPrevWeek} 
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        
        {/* Date Buttons */}
        <div className="flex gap-1">
          {weekDates.map(date => {
            const isSelected = date === selectedDate;
            const isTodayDate = isToday(date);
            
            return (
              <button 
                key={date} 
                onClick={() => onSelectDate(date)} 
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isSelected 
                    ? 'bg-blue-600 text-white' 
                    : isTodayDate
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {formatDate(date)}
              </button>
            );
          })}
        </div>
        
        {/* Next Week */}
        <button 
          onClick={onNextWeek} 
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Next week"
        >
          <ChevronRight size={18} />
        </button>
        
        {/* Today Button */}
        <button 
          onClick={handleTodayClick} 
          className="ml-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}

export default DateNavigation;
