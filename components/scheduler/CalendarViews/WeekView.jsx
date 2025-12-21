import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Package, AlertCircle, Plus } from 'lucide-react';
import { AppointmentCard, getAppointmentIcons, ServiceIcon } from './AppointmentCard';

// ============================================
// WEEK VIEW
// Grid showing all techs across a week
// ============================================

export default function WeekView({
  appointments,
  technicians,
  servicePackages,
  currentWeekStart,
  onNavigateWeek,
  onSelectDay,
  onSelectAppointment,
  onNewAppointment,
  getTechHours,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [currentWeekStart]);

  // Format day header
  const formatDayHeader = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday
    };
  };

  // Get appointments for a specific tech and date
  const getAppointmentsForCell = (techId, date) => {
    return appointments.filter(a => 
      a.tech_id === techId && 
      a.scheduled_date === date &&
      a.status !== 'cancelled'
    );
  };

  // Calculate utilization color
  const getUtilizationColor = (booked, total) => {
    const pct = total > 0 ? (booked / total) * 100 : 0;
    if (pct >= 100) return 'bg-red-100 text-red-700';
    if (pct >= 80) return 'bg-amber-100 text-amber-700';
    if (pct >= 50) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateWeek(-1)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            Week of {new Date(currentWeekStart + 'T00:00:00').toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          <button
            onClick={() => onNavigateWeek(1)}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            onNavigateWeek(0, monday.toISOString().split('T')[0]);
          }}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          This Week
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Day Headers */}
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="w-24 p-2 border-b border-r border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                Tech
              </th>
              {weekDates.map(date => {
                const { dayName, dayNum, isToday } = formatDayHeader(date);
                return (
                  <th 
                    key={date}
                    className={`p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                    onClick={() => onSelectDay(date)}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                      {dayName}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {dayNum}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Tech Rows */}
          <tbody>
            {technicians.map(tech => (
              <tr key={tech.id}>
                {/* Tech Name Cell */}
                <td className="p-2 border-b border-r border-gray-200 bg-gray-50">
                  <div className="font-medium text-sm text-gray-900">{tech.name}</div>
                  <div className="text-xs text-gray-500">{tech.hours_per_day || 8}h/day</div>
                </td>

                {/* Day Cells */}
                {weekDates.map(date => {
                  const cellAppts = getAppointmentsForCell(tech.id, date);
                  const hours = getTechHours?.(tech.id, date) || { booked: 0, total: tech.hours_per_day || 8 };
                  const cellKey = `${tech.id}-${date}`;
                  const isHovered = hoveredCell === cellKey;

                  return (
                    <td
                      key={date}
                      className="p-1 border-b border-r border-gray-200 align-top min-w-[140px] relative"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Utilization Badge */}
                      <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getUtilizationColor(hours.booked, hours.total)}`}>
                        {hours.booked}/{hours.total}h
                      </div>

                      {/* Appointments */}
                      <div className="space-y-1 mt-5">
                        {cellAppts.slice(0, 3).map(appt => (
                          <MiniAppointmentCard
                            key={appt.id}
                            appointment={appt}
                            servicePackages={servicePackages}
                            onClick={() => onSelectAppointment(appt)}
                          />
                        ))}
                        {cellAppts.length > 3 && (
                          <button
                            onClick={() => onSelectDay(date)}
                            className="w-full text-xs text-gray-500 hover:text-blue-600 py-1"
                          >
                            +{cellAppts.length - 3} more
                          </button>
                        )}
                      </div>

                      {/* Add Button (on hover) */}
                      {isHovered && (
                        <button
                          onClick={() => onNewAppointment(tech.id, date)}
                          className="absolute bottom-1 right-1 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// MINI APPOINTMENT CARD
// Compact card for week view cells
// ============================================
function MiniAppointmentCard({ appointment, servicePackages, onClick }) {
  const icons = useMemo(() => {
    return getAppointmentIcons(appointment.services, servicePackages, 2);
  }, [appointment.services, servicePackages]);

  const hasHold = appointment.is_on_hold || appointment.services?.some(s => s.status === 'hold');
  const hasPartsIssue = appointment.parts_ordered && !appointment.parts_arrived;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-1.5 rounded text-xs transition-colors
        ${hasHold 
          ? 'bg-amber-100 border border-amber-300 hover:bg-amber-200' 
          : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'}
      `}
    >
      {/* Icons */}
      {icons.length > 0 && (
        <div className="flex items-center gap-0.5 mb-0.5">
          {icons.map((icon, i) => (
            <ServiceIcon key={i} icon={icon} size={10} />
          ))}
        </div>
      )}
      
      {/* Customer Name */}
      <div className="font-medium text-gray-900 truncate">
        {appointment.customer_name?.split(',')[0] || 'Unknown'}
      </div>
      
      {/* Hours + Status Icons */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-gray-500">{appointment.estimated_hours || 0}h</span>
        <div className="flex items-center gap-0.5">
          {hasHold && <AlertCircle size={10} className="text-amber-500" />}
          {hasPartsIssue && <Package size={10} className="text-orange-500" />}
        </div>
      </div>
    </button>
  );
}
