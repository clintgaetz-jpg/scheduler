import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Package, Clock } from 'lucide-react';

// ============================================
// MONTH VIEW
// Calendar grid showing appointment counts
// ============================================

export default function MonthView({
  appointments,
  technicians,
  currentMonth, // Date object or ISO string
  onNavigateMonth,
  onSelectDay,
  getTechHours,
}) {
  // Parse current month
  const monthDate = useMemo(() => {
    return typeof currentMonth === 'string' 
      ? new Date(currentMonth + 'T00:00:00') 
      : currentMonth;
  }, [currentMonth]);

  // Get all days in the month (including padding days)
  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Generate 6 weeks (42 days)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    
    return days;
  }, [monthDate]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    appointments.forEach(appt => {
      if (appt.status === 'cancelled') return;
      const date = appt.scheduled_date;
      if (!grouped[date]) {
        grouped[date] = {
          total: 0,
          totalHours: 0,
          onHold: 0,
          waitingParts: 0,
          noWO: 0,
        };
      }
      grouped[date].total++;
      grouped[date].totalHours += parseFloat(appt.estimated_hours) || 0;
      if (appt.is_on_hold) grouped[date].onHold++;
      if (appt.parts_ordered && !appt.parts_arrived) grouped[date].waitingParts++;
      if (!appt.workorder_created) grouped[date].noWO++;
    });
    return grouped;
  }, [appointments]);

  // Calculate shop capacity for a day
  const getDayCapacity = (dateStr) => {
    let totalCapacity = 0;
    technicians.forEach(tech => {
      const hours = getTechHours?.(tech.id, dateStr);
      totalCapacity += hours?.total || tech.hours_per_day || 8;
    });
    return totalCapacity;
  };

  // Get color based on utilization
  const getUtilizationColor = (hours, capacity) => {
    if (capacity === 0) return '';
    const pct = (hours / capacity) * 100;
    if (pct >= 100) return 'bg-red-100';
    if (pct >= 80) return 'bg-amber-50';
    if (pct >= 50) return 'bg-green-50';
    return '';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateMonth(-1)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 w-48 text-center">
            {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => onNavigateMonth(1)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => onNavigateMonth(0, new Date())}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div 
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                day === 'Sat' || day === 'Sun' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((day, idx) => {
            const dayData = appointmentsByDate[day.date] || { total: 0, totalHours: 0 };
            const capacity = getDayCapacity(day.date);
            const utilizationColor = getUtilizationColor(dayData.totalHours, capacity);

            return (
              <button
                key={idx}
                onClick={() => day.isCurrentMonth && !day.isWeekend && onSelectDay(day.date)}
                disabled={!day.isCurrentMonth || day.isWeekend}
                className={`
                  min-h-[80px] p-1 rounded-lg border transition-colors text-left
                  ${day.isCurrentMonth 
                    ? day.isWeekend 
                      ? 'bg-gray-50 border-gray-100 cursor-not-allowed' 
                      : `border-gray-200 hover:border-blue-400 cursor-pointer ${utilizationColor}`
                    : 'bg-gray-50 border-transparent cursor-not-allowed opacity-50'}
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                `}
              >
                {/* Day Number */}
                <div className={`text-sm font-medium mb-1 ${
                  day.isToday 
                    ? 'text-blue-600' 
                    : day.isCurrentMonth 
                      ? day.isWeekend ? 'text-gray-400' : 'text-gray-900'
                      : 'text-gray-300'
                }`}>
                  {day.dayNum}
                </div>

                {/* Stats (only for work days in current month) */}
                {day.isCurrentMonth && !day.isWeekend && dayData.total > 0 && (
                  <div className="space-y-0.5">
                    {/* Appointment Count */}
                    <div className="text-xs font-medium text-gray-700">
                      {dayData.total} appt{dayData.total !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Hours */}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {dayData.totalHours}h / {capacity}h
                    </div>

                    {/* Issue indicators */}
                    <div className="flex items-center gap-1 mt-1">
                      {dayData.onHold > 0 && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                          <AlertCircle size={8} className="mr-0.5" />
                          {dayData.onHold}
                        </span>
                      )}
                      {dayData.waitingParts > 0 && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px]">
                          <Package size={8} className="mr-0.5" />
                          {dayData.waitingParts}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
          50-79%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></div>
          80-99%
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
          100%+
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle size={10} className="text-amber-500" />
          On Hold
        </span>
        <span className="flex items-center gap-1">
          <Package size={10} className="text-orange-500" />
          Waiting Parts
        </span>
      </div>
    </div>
  );
}
